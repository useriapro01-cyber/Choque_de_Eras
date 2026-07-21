// Regressão da PWA: valida que o build emitiu manifest + service worker + ícones
// e que o index.html os referencia e registra o SW. Roda contra o dist gerado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(ROOT, 'dist');
const ler = f => fs.readFileSync(path.join(dist, f), 'utf8');

test('index.html referencia manifest, ícones e registra o service worker', () => {
  const html = ler('index.html');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<meta name="theme-color" content="#08150E">/);
  assert.match(html, /rel="apple-touch-icon" href="icons\/apple-touch-icon-180\.png"/);
  assert.match(html, /navigator\.serviceWorker\.register\("sw\.js"\)/);
});

test('choque-de-eras.html (compat.) é idêntico ao index.html', () => {
  assert.equal(ler('choque-de-eras.html'), ler('index.html'));
});

test('manifest é válido e instalável (name, start_url, standalone, ícones 192/512 + maskable)', () => {
  const m = JSON.parse(ler('manifest.webmanifest'));
  assert.ok(m.name && m.short_name, 'name/short_name presentes');
  assert.equal(m.display, 'standalone');
  assert.ok(m.start_url, 'start_url presente');
  const sizes = m.icons.map(i => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'), 'ícones 192 e 512');
  assert.ok(m.icons.some(i => (i.purpose || '').includes('maskable')), 'ícone maskable presente');
  for (const i of m.icons)
    assert.ok(fs.existsSync(path.join(dist, i.src)), `ícone existe: ${i.src}`);
});

test('service worker foi carimbado com versão e faz precache do shell', () => {
  const sw = ler('sw.js');
  assert.doesNotMatch(sw, /@VERSION@/, 'marcador de versão substituído');
  assert.match(sw, /const VERSION = '[0-9a-f]{10}'/, 'versão carimbada no SW');
  assert.match(sw, /'\.\/index\.html'/, 'index.html no precache');
  assert.match(sw, /addEventListener\('fetch'/, 'handler de fetch presente');
});

test('ícones são PNGs válidos nas dimensões esperadas', () => {
  const esperado = {
    'icons/icon-192.png': 192, 'icons/icon-512.png': 512,
    'icons/icon-maskable-512.png': 512, 'icons/apple-touch-icon-180.png': 180,
  };
  for (const [rel, size] of Object.entries(esperado)) {
    const b = fs.readFileSync(path.join(dist, rel));
    assert.equal(b.slice(0, 8).toString('hex'), '89504e470d0a1a0a', `${rel}: assinatura PNG`);
    assert.equal(b.readUInt32BE(16), size, `${rel}: largura ${size}`);
    assert.equal(b.readUInt32BE(20), size, `${rel}: altura ${size}`);
  }
  assert.ok(fs.existsSync(path.join(dist, 'icons/icon.svg')), 'icon.svg enviado');
});
