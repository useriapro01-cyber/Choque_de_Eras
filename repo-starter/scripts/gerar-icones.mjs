// Gera os PNGs da PWA a partir dos SVGs-fonte (src/pwa/icons/*.svg).
// One-off de autoria: requer devDependency `@resvg/resvg-js` (npm i -D @resvg/resvg-js).
// Os PNGs resultantes são COMMITADOS; o build não depende deste script nem da lib.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pwa', 'icons');

const alvos = [
  { svg: 'icon.svg', png: 'icon-192.png', size: 192 },
  { svg: 'icon.svg', png: 'icon-512.png', size: 512 },
  { svg: 'icon-maskable.svg', png: 'icon-maskable-512.png', size: 512 },
  { svg: 'icon.svg', png: 'apple-touch-icon-180.png', size: 180 },
];

for (const { svg, png, size } of alvos) {
  const src = fs.readFileSync(path.join(DIR, svg), 'utf8');
  const resvg = new Resvg(src, { fitTo: { mode: 'width', value: size } });
  const buf = resvg.render().asPng();
  fs.writeFileSync(path.join(DIR, png), buf);
  console.log(`✓ ${png} (${size}px, ${(buf.length / 1024).toFixed(1)} KB)`);
}
