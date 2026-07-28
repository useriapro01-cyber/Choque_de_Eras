// ============================================================================
// submeter-diario.test.mjs — resiliência do envio ao ranking (TDMV-5 Fase D-cors)
// ============================================================================
// submeterDiario() setava S.envio="enviando" e chamava `await sb().submeterDia`.
// Quando o fetch REJEITAVA (CORS/rede/timeout) — um passo antes do res.json() —
// não havia try/catch, então o estado ficava preso em "enviando" para sempre.
// Estes testes dirigem submeterDiario com um SB falso e provam: (a) rejeição →
// sai de "enviando" e mostra erro acionável; (b) 403 email_necessario → fluxo de
// vínculo; (c) erro de rede preserva a submissão pendente do Local Storage;
// (d) sucesso → estado ok + dailyFeito marcado.
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarMotor } from './harness/carregar-motor.mjs';

// prepara um fim-de-campanha do diário pronto para enviar
function prep(api) {
  api.S.lang = 'pt';
  api.S.storageOk = true;
  api.S.profile.nick = 'NEY';
  api.S.camp = { mode: 'diario', dia: '2026-07-27', log: [{ tipo: 'x' }], score: { total: 100 }, replayOk: true };
  api.S.envio = null;
  api.S.screen = 'fim';
}

test('rede: fetch rejeitando → sai de "enviando" e mostra erro acionável', async () => {
  const api = carregarMotor();
  prep(api);
  api.setSbFake({ habilitado: true, submeterDia: async () => { throw new TypeError('Failed to fetch'); } });

  await api.submeterDiario();

  assert.ok(api.S.envio, 'S.envio setado');
  assert.notEqual(api.S.envio.fase, 'enviando', 'NÃO ficou preso em "enviando"');
  assert.equal(api.S.envio.fase, 'erro', 'estado de erro');
  assert.ok(api.S.envio.msg && /conex|ranking/i.test(api.S.envio.msg), 'mensagem de rede acionável');
});

test('timeout: AbortController abortando (rejeição) também sai de "enviando"', async () => {
  const api = carregarMotor();
  prep(api);
  api.setSbFake({ habilitado: true, submeterDia: async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; } });

  await api.submeterDiario();
  assert.equal(api.S.envio.fase, 'erro', 'timeout vira erro, não trava');
});

test('403 email_necessario → vai para o fluxo de vínculo de e-mail', async () => {
  const api = carregarMotor();
  prep(api);
  api.setSbFake({ habilitado: true, submeterDia: async () => ({ ok: false, status: 403, data: { erro: 'email_necessario' } }) });

  await api.submeterDiario();
  assert.equal(api.S.screen, 'vincular', 'foi para a tela de vínculo');
  assert.ok(!api.S.envio || api.S.envio.fase !== 'enviando', 'não deixou "enviando" pendurado');
});

test('erro de rede PRESERVA a submissão pendente no Local Storage', async () => {
  const store = new Map();
  store.set('local:choque:dia:pendente', JSON.stringify({ date: '2026-07-27', decisions: [], clientVersion: 'x' }));
  store.set('choque:dia:pendente', JSON.stringify({ date: '2026-07-27', decisions: [], clientVersion: 'x' }));
  const api = carregarMotor({ store });
  prep(api);
  api.setSbFake({ habilitado: true, submeterDia: async () => { throw new Error('net'); } });

  await api.submeterDiario();
  assert.ok(store.get('choque:dia:pendente'), 'pendência NÃO foi apagada por erro de rede');
});

test('sucesso → estado ok e dailyFeito do dia oficial marcado', async () => {
  const api = carregarMotor();
  prep(api);
  api.setSbFake({ habilitado: true, submeterDia: async () => ({ ok: true, status: 200, data: { best: 100 } }) });

  await api.submeterDiario();
  assert.equal(api.S.envio.fase, 'ok');
  assert.equal(api.S.profile.dailyFeito, '2026-07-27', 'marca o dia que o servidor confirmou');
});
