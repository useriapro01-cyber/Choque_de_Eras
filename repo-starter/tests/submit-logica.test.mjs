// Lógica PURA do submit-daily v3 (PR2). Valida e-mail/apelido, a decisão de
// sobrescrita (worse_than_ranked) e o token. Roda em Node; o mesmo módulo roda
// no Deno (wrapper index.ts). Se um destes quebrar, o Edge Function herda o bug.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarEmail, validarApelido, decidirGravacao, ipValido,
  gerarToken, hashToken, EMAIL_MAX,
} from '../src/submit-logica.js';

test('validarEmail: tamanho antes do formato', () => {
  assert.equal(validarEmail('a@b.co'), null);
  assert.equal(validarEmail('semarroba'), 'email_invalido');
  assert.equal(validarEmail('a@bcom'), 'email_invalido');
  assert.equal(validarEmail('x'.repeat(EMAIL_MAX - 5) + '@b.co'), null);          // == 254: no limite, ok
  assert.equal(validarEmail('x'.repeat(EMAIL_MAX) + '@b.co'), 'email_longo');      // 259 > 254
  assert.equal(validarEmail('  a@b.co  '), null);  // trim
});

test('validarApelido: comprimento + controle + blocklist', () => {
  assert.equal(validarApelido('Maradona'), null);
  assert.equal(validarApelido('Zico 10'), null);
  assert.equal(validarApelido('a'), 'apelido_curto');
  assert.equal(validarApelido('x'.repeat(21)), 'apelido_longo');
  assert.equal(validarApelido('ab' + String.fromCharCode(7) + 'cd'), 'apelido_invalido');   // BEL (controle)
  assert.equal(validarApelido('ab' + String.fromCharCode(127) + 'cd'), 'apelido_invalido');   // DEL
  assert.equal(validarApelido('Admin'), 'apelido_reservado');
  assert.equal(validarApelido('  oficial '), 'apelido_reservado');
  assert.equal(validarApelido('Admín'), 'apelido_reservado');       // acento normaliza p/ "admin"
});

test('validarApelido: normalização de acento e substring ofensiva', () => {
  assert.equal(validarApelido('oficiál'), 'apelido_reservado');
  assert.equal(validarApelido('merda'), 'apelido_ofensivo');
  assert.equal(validarApelido('umMerdaAqui'), 'apelido_ofensivo');  // substring
});

test('decidirGravacao: ranked só regride com ato explícito', () => {
  assert.equal(decidirGravacao({ novoScore: 100, rankedScore: null }), 'gravar');          // 1ª vez
  assert.equal(decidirGravacao({ novoScore: 120, rankedScore: 100 }), 'gravar');            // melhora
  assert.equal(decidirGravacao({ novoScore: 80, rankedScore: 100 }), 'worse_than_ranked');  // piora
  assert.equal(decidirGravacao({ novoScore: 100, rankedScore: 100 }), 'worse_than_ranked'); // igual não melhora
  assert.equal(decidirGravacao({ novoScore: 80, rankedScore: 100, confirmOverwrite: true }), 'gravar');
});

test('ipValido: só casta p/ inet; senão null', () => {
  assert.equal(ipValido('189.40.1.2'), '189.40.1.2');
  assert.equal(ipValido('2001:db8::1'), '2001:db8::1');
  assert.equal(ipValido('sem-ip'), null);
  assert.equal(ipValido(''), null);
  assert.equal(ipValido('abc def'), null);
  assert.equal(ipValido(undefined), null);
});

test('gerarToken: 64 hex, alta entropia', () => {
  const a = gerarToken(), b = gerarToken();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
});

test('hashToken: SHA-256 hex, determinístico (vetor conhecido)', async () => {
  const h = await hashToken('abc');
  assert.equal(h, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await hashToken('abc'), h);                 // determinístico
  assert.notEqual(await hashToken('abd'), h);              // sensível
});
