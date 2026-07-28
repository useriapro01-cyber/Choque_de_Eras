// ============================================================================
// validacao-campos.test.mjs — limites de campo NÃO mudos (TDMV-5 Fase D-campos)
// ============================================================================
// O usuário travou no campo de e-mail: bateu num limite e o campo parou de
// aceitar digitação SEM avisar (a mesma família de falha muda que caçamos a
// semana toda). Estes testes cobrem: e-mail de 254 chars aceito; 255 rejeitado
// COM mensagem; formato inválido rejeitado COM mensagem; tudo em PT e ES; e o
// wiring do input (maxlength=254 + aviso vivo) no bundle.
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carregarMotor } from './harness/carregar-motor.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// e-mail VÁLIDO com exatamente n caracteres: local + '@' + dominio + '.com'
function emailComTamanho(n) {
  const fixo = '@e.com';            // 6 chars
  const local = 'a'.repeat(n - fixo.length);
  const e = local + fixo;
  assert.equal(e.length, n);
  return e;
}

// ---------------------------------------------------------------------------
// 1) validarEmail (pura): 254 aceito, 255 rejeitado, formato inválido rejeitado
// ---------------------------------------------------------------------------
test('validarEmail: 254 chars aceito (RFC 5321)', () => {
  const api = carregarMotor();
  assert.equal(api.validarEmail(emailComTamanho(254)), null, '254 é válido');
});

test('validarEmail: 255 chars rejeitado com chave de mensagem', () => {
  const api = carregarMotor();
  assert.equal(api.validarEmail(emailComTamanho(255)), 'vinc_email_longo', '255 → erro de tamanho');
});

test('validarEmail: formato inválido rejeitado com chave de mensagem', () => {
  const api = carregarMotor();
  assert.equal(api.validarEmail('naoehemail'), 'vinc_email_inv');
  assert.equal(api.validarEmail('a@b'), 'vinc_email_inv', 'sem TLD');
  assert.equal(api.validarEmail('a b@c.com'), 'vinc_email_inv', 'com espaço');
});

test('validarEmail: e-mail normal aceito', () => {
  const api = carregarMotor();
  assert.equal(api.validarEmail('torcedor@choquedeeras.com.br'), null);
});

// ---------------------------------------------------------------------------
// 2) Mensagens existem e são visíveis em PT e ES (não caem no fallback = chave)
// ---------------------------------------------------------------------------
test('mensagens de e-mail definidas em PT e ES', () => {
  const api = carregarMotor();
  for (const lang of ['pt', 'es']) {
    api.S.lang = lang;
    for (const k of ['vinc_email_longo', 'vinc_email_inv', 'vinc_apelido_longo', 'vinc_apelido_inv']) {
      const msg = api.t(k);
      assert.ok(msg && msg !== k, `${k} deve ter texto em ${lang} (não a própria chave)`);
    }
  }
});

test('render da tela de vínculo mostra a mensagem de erro (PT e ES)', () => {
  for (const lang of ['pt', 'es']) {
    const api = carregarMotor();
    api.ativarRender();
    api.S.lang = lang;
    api.S.screen = 'vincular';
    api.S.vinc = { passo: 'dados', email: '', apelido: 'x', conflito: false, msg: api.t('vinc_email_longo') };
    api.render();
    const html = api.htmlApp();
    assert.ok(html.includes(api.t('vinc_email_longo')), `mensagem visível na tela (${lang})`);
  }
});

// ---------------------------------------------------------------------------
// 3) Prefill do apelido nunca nasce ACIMA do limite (limite mudo do prefill)
// ---------------------------------------------------------------------------
test('irVincular: apelido prefilado é truncado em 20 (nome de time longo não trava o campo)', () => {
  const api = carregarMotor();
  api.S.profile.nick = '';
  api.S.profile.clubeNome = 'Clube Atlético Nome Muito Comprido'; // > 20
  api.irVincular();
  assert.ok(api.S.vinc.apelido.length <= 20, 'prefill não passa de 20 (senão o campo trava mudo)');
});

// ---------------------------------------------------------------------------
// 4) Wiring no bundle: input com maxlength=254 + aviso vivo (não silencioso)
// ---------------------------------------------------------------------------
test('bundle: input de e-mail tem maxlength=254 e aviso vivo (oninput)', () => {
  const dist = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const m = dist.match(/<input id="vEmail"[^>]*>/);
  assert.ok(m, 'input de e-mail presente no bundle');
  assert.match(m[0], /maxlength="254"/, 'teto de 254 no input');
  assert.match(m[0], /oninput="avisoLimite\(this,'vEmailAviso',254,'vinc_email_longo'\)"/, 'aviso vivo ao bater o limite');
  assert.match(dist, /id="vEmailAviso"/, 'elemento de aviso presente');
});

// ---------------------------------------------------------------------------
// 5) nick padronizado em 20 (home == vínculo == banco); caminho inverso preservado
// ---------------------------------------------------------------------------
test('bundle: input de nick tem maxlength=20 (alinhado com vínculo e banco) + aviso vivo', () => {
  const dist = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const m = dist.match(/<input type="text" id="nick"[^>]*>/);
  assert.ok(m, 'input de nick presente');
  assert.match(m[0], /maxlength="20"/, 'nick agora 20 (era 16)');
  assert.doesNotMatch(m[0], /maxlength="16"/, 'nada de 16 sobrando');
  assert.match(m[0], /oninput="avisoLimite\(this,'nickAviso',20,'vinc_apelido_longo'\)"/, 'aviso vivo no nick');
});

test('inverso: nick salvo de 20 chars sobrevive ao reload e é EXIBIDO inteiro, sem truncar', async () => {
  const store = new Map();
  const nick20 = 'A'.repeat(20);
  const s1 = carregarMotor({ store });
  s1.S.profile.nick = nick20; s1.saveProfile();            // perfil salvo com 20 chars

  const s2 = carregarMotor({ store });                     // "reload"
  await s2.loadProfile();
  assert.equal(s2.S.profile.nick, nick20, 'nick de 20 sobreviveu sem truncar no load');

  s2.ativarRender(); s2.S.lang = 'pt'; s2.S.storageOk = true; s2.S.screen = 'home'; s2.render();
  const html = s2.htmlApp();
  assert.ok(html.includes(nick20), 'label da home exibe o nick de 20 inteiro');
  // e aceita sem reclamar: o botão do Desafio do Dia fica HABILITADO (nick presente)
  const btn = html.match(/<button[^>]*startDaily\(\)[^>]*>/);
  assert.ok(btn && !/disabled/.test(btn[0]), 'Desafio do Dia habilitado com nick de 20');
});

test('bundle: nome do time (setup) tem aviso vivo ao bater 26 (não é mais mudo)', () => {
  const dist = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const m = dist.match(/<input type="text" id="nomeTime"[^>]*>/);
  assert.ok(m, 'input de nome do time presente');
  assert.match(m[0], /oninput="avisoLimite\(this,'nomeTimeAviso',26,'setup_nome_longo'\)"/, 'aviso vivo no nome do time');
  for (const lang of ['pt', 'es']) {
    const api = carregarMotor(); api.S.lang = lang;
    assert.ok(api.t('setup_nome_longo') !== 'setup_nome_longo', `mensagem em ${lang}`);
  }
});
