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
