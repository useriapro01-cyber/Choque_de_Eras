// ============================================================================
// storage.test.mjs — o bug do storage local que passou batido (TDMV-5 Fase D-fix)
// ============================================================================
// O motor usava um storage GLOBAL do ambiente de artifact que nunca existiu no
// navegador; o harness fornecia um shim, então os testes passavam e a produção
// ficava inerte (perfil não persistia → botão do Desafio do Dia sempre travado).
// Estes testes fecham a lacuna: localStorage REAL (jsdom), persistência através
// de "reload", storageOk honesto, e um guard-rail anti-recaída.
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { carregarMotor } from './harness/carregar-motor.mjs';
import { stGet, stSet, stDel, stList, storageDisponivel } from '../src/storage.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// localStorage REAL do jsdom no globalThis (o que src/storage.js consome).
// async + await: restaurar no finally só DEPOIS que o corpo async terminar.
async function comLocalStorageReal(fn) {
  const dom = new JSDOM('', { url: 'https://choquedeeras.com.br/' });
  const anterior = globalThis.localStorage;
  globalThis.localStorage = dom.window.localStorage;
  try { return await fn(dom); } finally { globalThis.localStorage = anterior; }
}

// ---------------------------------------------------------------------------
// 1) Round-trip com localStorage REAL (jsdom), não stub
// ---------------------------------------------------------------------------
test('storage: round-trip stSet -> stGet -> stDel com localStorage real (jsdom)', async () => {
  await comLocalStorageReal(async () => {
    assert.equal(await stGet('choque:perfil', false), null, 'ausente = null');
    assert.equal(await stSet('choque:perfil', { nick: 'NEYMAR', jogos: 3 }, false), true);
    assert.deepEqual(await stGet('choque:perfil', false), { nick: 'NEYMAR', jogos: 3 }, 'lê parseado');
    assert.equal(await stDel('choque:perfil', false), true);
    assert.equal(await stGet('choque:perfil', false), null, 'apagado = null');
  });
});

test('storage: flag shared é só PREFIXO de chave (mesma chave, buckets distintos)', async () => {
  await comLocalStorageReal(async () => {
    await stSet('k', 'LOCAL', false);
    await stSet('k', 'SHARED', true);
    assert.equal(await stGet('k', false), 'LOCAL', 'bucket local isolado');
    assert.equal(await stGet('k', true), 'SHARED', 'bucket shared isolado');
    assert.deepEqual(await stList(false), ['k']);
    assert.deepEqual(await stList(true), ['k']);
  });
});

// ---------------------------------------------------------------------------
// 2) storageOk é probe REAL (escreve/lê/apaga), não typeof
// ---------------------------------------------------------------------------
test('storage: storageDisponivel() === true com localStorage funcional', async () => {
  await comLocalStorageReal(() => {
    assert.equal(storageDisponivel(), true);
  });
});

test('storage: storageDisponivel() === false quando localStorage lança (aba privada/quota)', () => {
  const anterior = globalThis.localStorage;
  globalThis.localStorage = { setItem() { throw new DOMException('QuotaExceededError'); },
    getItem() { return null; }, removeItem() {} };
  try {
    assert.equal(storageDisponivel(), false, 'falha honesta, não estoura');
  } finally { globalThis.localStorage = anterior; }
});

// ---------------------------------------------------------------------------
// 3) Guard-rail: a dependência de artifact não pode reaparecer
// ---------------------------------------------------------------------------
test('guard-rail: "window.storage" não existe em src/ nem no bundle gerado', () => {
  const alvos = [
    ...fs.readdirSync(path.join(ROOT, 'src')).filter(f => /\.(js|html)$/.test(f)).map(f => path.join('src', f)),
    path.join('dist', 'index.html'),
  ];
  const reincidentes = alvos.filter(rel => fs.readFileSync(path.join(ROOT, rel), 'utf8').includes('window.storage'));
  assert.deepEqual(reincidentes, [], 'window.storage reapareceu — dependência de artifact de volta');
});

// ---------------------------------------------------------------------------
// 4) O teste que faltava: nick persiste através de "reload" -> botão HABILITADO
// ---------------------------------------------------------------------------
function botaoQueChama(html, fn) {
  const re = new RegExp(`<button[^>]*${fn.replace(/[()]/g, '\\$&')}[^>]*>`);
  const m = html.match(re);
  return m ? m[0] : null;
}
function botaoComTexto(html, texto) {
  const re = new RegExp(`<button[^>]*>[^<]*${texto}[^<]*</button>`);
  const m = html.match(re);
  return m ? m[0] : null;
}

test('reload: nick persistido reabilita o botão do Desafio do Dia', async () => {
  const store = new Map();                       // backing store compartilhado entre "cargas"
  const s1 = carregarMotor({ store });
  s1.S.profile.nick = 'NEYMAR'; s1.saveProfile();  // jogador assina e recarrega

  const s2 = carregarMotor({ store });           // "reload": novo bundle, mesmo storage
  await s2.loadProfile();
  assert.equal(s2.S.profile.nick, 'NEYMAR', 'nick sobreviveu ao reload');

  s2.ativarRender(); s2.S.screen = 'home'; s2.render();
  const btn = botaoQueChama(s2.htmlApp(), 'startDaily()');
  assert.ok(btn, 'botão do Desafio do Dia presente');
  assert.ok(!/disabled/.test(btn), 'com nick persistido, botão HABILITADO');
});

// ---------------------------------------------------------------------------
// 5) storageOk controla o banner; sem storage, Campanha Livre segue jogável
// ---------------------------------------------------------------------------
test('banner: storageOk true -> sem aviso de armazenamento', () => {
  const api = carregarMotor();
  api.ativarRender(); api.S.screen = 'home'; api.S.lang = 'pt';
  api.S.profile.nick = 'X'; api.S.storageOk = true; api.render();
  assert.ok(!/armazenamento/i.test(api.htmlApp()), 'sem banner quando storage disponível');
});

test('degradação: storageOk false -> banner presente e Campanha Livre jogável (sem tela branca)', () => {
  const api = carregarMotor();
  api.ativarRender(); api.S.screen = 'home'; api.S.lang = 'pt';
  api.S.profile.nick = 'X'; api.S.storageOk = false; api.render();
  assert.ok(/armazenamento/i.test(api.htmlApp()), 'banner presente quando storage indisponível');

  // Campanha Livre continua funcionando mesmo sem storage
  api.startCampaign('livre', null, null, { modo: 'cont', nome: 'X' });
  assert.ok(api.S.camp && api.S.camp.mode === 'livre', 'campanha livre criada');
  api.render();
  assert.ok(api.htmlApp().length > 100, 'tela renderiza (sem tela branca)');
});

// ---------------------------------------------------------------------------
// 6) Duelo travado enquanto DUELO_HABILITADO for false
// ---------------------------------------------------------------------------
test('duelo: botão desabilitado enquanto não há backend de salas (TDMV-6)', () => {
  const api = carregarMotor();
  api.ativarRender(); api.S.screen = 'home'; api.S.lang = 'pt';
  api.S.profile.nick = 'X'; api.render();
  const btn = botaoComTexto(api.htmlApp(), 'Duelo entre amigos');
  assert.ok(btn, 'botão de Duelo presente na home');
  assert.ok(/disabled/.test(btn), 'Duelo desabilitado enquanto DUELO_HABILITADO=false');
});
