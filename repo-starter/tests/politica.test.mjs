// POLÍTICA DE PRIVACIDADE (LGPD) — PR1. A página é ESTÁTICA e autossuficiente
// (sem JS): garante que o build a emite e que ela cobre, em PT e ES, os pontos
// de LGPD que a coleta de e-mail exige. Guarda contra alguém apagar/esvaziar a
// política sem perceber — sem ela, a coleta de e-mail em produção é irregular.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'dist', 'privacidade.html'), 'utf8');
const low = html.toLowerCase();

test('build emite a política com versão carimbada e as duas línguas', () => {
  assert.match(html, /data-policy-version="\d{4}-\d{2}-\d{2}"/, 'precisa de data-policy-version (o cliente envia esse valor)');
  assert.match(html, /id="pt"[^>]*lang="pt/i, 'seção PT com lang');
  assert.match(html, /id="es"[^>]*lang="es"/i, 'seção ES com lang');
});

test('PT cobre os requisitos de LGPD', () => {
  for (const termo of ['consentimento', 'excluir', 'revogar', 'opt-out', 'controlador', 'menor']) {
    assert.ok(low.includes(termo), `PT deve mencionar "${termo}"`);
  }
  // consentimento granular e separado (ranking vs novidades/lead)
  assert.ok(low.includes('opcional'), 'PT deve deixar o consentimento de novidades OPCIONAL');
  // e-mail nunca é público
  assert.match(html, /e-mail nunca é exibido/i, 'PT deve afirmar que o e-mail nunca é exibido');
});

test('ES cobre os requisitos de LGPD', () => {
  for (const termo of ['consentimiento', 'eliminar', 'revocar', 'baja', 'responsable']) {
    assert.ok(low.includes(termo), `ES deve mencionar "${termo}"`);
  }
  assert.match(html, /e-mail nunca se muestra/i, 'ES deve afirmar que o e-mail nunca se mostra');
});

test('política não tem lixo de template', () => {
  for (const ruim of ['undefined', 'NaN', '{{', '@BUNDLE', '/*@']) {
    assert.ok(!html.includes(ruim), `não pode conter "${ruim}"`);
  }
});

test('GATE do PR2: nenhum placeholder de dado legal sobrou (não pode ir ao ar com colchetes)', () => {
  for (const ph of ['[CONTROLADOR', '[RESPONSABLE', '[E-MAIL DE CONTATO', '[E-MAIL DE CONTACTO', 'class="todo"']) {
    assert.ok(!html.includes(ph), `placeholder/aviso "${ph}" não pode existir ao coletar e-mail`);
  }
  // controlador e contato preenchidos (PT e ES compartilham o mesmo nome/e-mail)
  assert.ok(html.includes('Guilherme Cassiano Nogueira'), 'controlador nomeado');
  assert.ok(html.includes('mailto:guicnogueira@hotmail.com'), 'contato de privacidade clicável');
});

test('política não carrega recurso de terceiro (token não vaza por Referer)', () => {
  // a página que exibe/recebe URLs sensíveis não pode puxar analytics/fonte/CDN
  // externa — o Referer levaria a URL inteira a terceiros.
  for (const externo of ['http://', 'https://cdn', 'fonts.googleapis', 'googletagmanager', 'analytics', '<script']) {
    assert.ok(!html.toLowerCase().includes(externo.toLowerCase()), `sem recurso externo "${externo}"`);
  }
});
