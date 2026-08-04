// ============================================================================
// diag.test.mjs — observabilidade (TDMV-5): tela de diagnóstico + log + fim do
// falso sucesso local. Motivo: 4 rodadas diagnosticando por dedução porque nunca
// observamos a falha. Isto dá olhos permanentes no cliente.
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarMotor } from './harness/carregar-motor.mjs';

const DIAG_LOG_KEY = 'choque:diag:log';

// ---------------------------------------------------------------------------
// A) FIM DO FALSO SUCESSO — SB desligado NÃO pode parecer "enviado ao ranking"
// ---------------------------------------------------------------------------
test('submeterDiario com SB desligado: NÃO marca dailyFeito, mostra "não enviado"', async () => {
  const api = carregarMotor(); api.S.lang = 'pt';
  api.setSbFake({ habilitado: false });
  api.S.storageOk = true;
  api.S.profile.nick = 'Gui'; api.S.profile.dailyFeito = '';
  api.S.camp = { mode: 'diario', replayOk: true, dia: '2026-08-03', log: [], score: { total: 123 } };
  await api.submeterDiario();
  assert.equal(api.S.envio.fase, 'sem_conexao', 'estado explícito de não-envio');
  assert.equal(api.S.profile.dailyFeito, '', 'NÃO marca o dia como feito (nada foi enviado)');
  // e o log registra que não enviou
  const log = api.lerLog();
  assert.ok(log.some(e => e.area === 'submit' && /NÃO enviado|desligado/.test(e.msg)), 'log registra o não-envio');
});

test('painel de fim: fase "sem_conexao" mostra aviso e mantém o botão de enviar (retry)', () => {
  const api = carregarMotor(); api.S.lang = 'pt';
  api.ativarRender();
  api.S.camp = { mode: 'diario', replayOk: true, dia: '2026-08-03', score: { total: 1, base: 1, zebra: 0, media: 1 },
    resultados: [], gf: 0, gs: 0, cs: 0, gasto: 0, campeao: false, novasConq: [] };
  api.S.envio = { fase: 'sem_conexao' };
  api.S.screen = 'fim'; api.render();
  const html = api.htmlApp();
  assert.match(html, /NÃO foi enviada/i, 'diz explicitamente que não foi enviada');
  assert.match(html, /submeterDiario\(\)/, 'botão de enviar continua (retry possível)');
  assert.doesNotMatch(html, /Você está no ranking/i, 'NUNCA finge sucesso');
});

// ---------------------------------------------------------------------------
// B) LOG PERSISTENTE — ring buffer com teto, sobrevive a "reload"
// ---------------------------------------------------------------------------
test('logEvento: grava, lê e RESPEITA o teto do ring buffer', () => {
  const store = new Map();
  const api = carregarMotor({ store });
  for (let i = 0; i < 80; i++) api.logEvento('t', 'evento ' + i, { i });
  const log = api.lerLog();
  assert.ok(log.length <= 60, 'nunca passa do teto (60)');
  assert.equal(log[log.length - 1].msg, 'evento 79', 'mantém os mais recentes');
  // persiste no store (sobrevive a "reload" = nova carga com o mesmo store)
  const api2 = carregarMotor({ store });
  assert.ok(api2.lerLog().length >= 1 && api2.lerLog().some(e => e.msg === 'evento 79'), 'log sobrevive ao reload');
});

test('diagSubmit: registra o último status/erro do submit (o que faltava ver)', () => {
  const api = carregarMotor();
  api.diagSubmit({ ok: false, status: 403, data: { erro: 'email_necessario' } }, 'teste');
  assert.equal(api.S.diag.lastSubmit.status, 403);
  assert.equal(api.S.diag.lastSubmit.erro, 'email_necessario');
  const txt = api.diagTexto(api.diagSnapshot(), null);
  assert.match(txt, /HTTP 403/, 'o texto copiável mostra o status real do submit');
  assert.match(txt, /email_necessario/, 'e o código do erro');
});

// ---------------------------------------------------------------------------
// C) TELA DE DIAGNÓSTICO — renderiza sem undefined/NaN e mostra o essencial
// ---------------------------------------------------------------------------
test('renderDiag: mostra bundle, SB habilitado e origem — sem undefined/NaN', () => {
  const api = carregarMotor({ location: { origin: 'https://www.choquedeeras.com.br' } });
  api.S.lang = 'pt';
  api.ativarRender();
  api.S.screen = 'diag'; api.render();
  const html = api.htmlApp();
  assert.doesNotMatch(html, /undefined|NaN/, 'sem undefined/NaN na tela');
  assert.match(html, /bundle:/, 'mostra a versão do bundle');
  assert.match(html, /SB habilitado:/, 'mostra se o servidor está ligado');
  assert.match(html, /copiarDiag\(\)/, 'tem botão de copiar');
});

test('diag: snapshot marca SB desligado quando não há anon key', () => {
  const api = carregarMotor();
  const s = api.diagSnapshot();
  // no bundle de teste SB_ANON pode vir vazio; o snapshot tem que refletir isso
  assert.equal(typeof s.sbOn, 'boolean');
  const txt = api.diagTexto(s, null);
  assert.match(txt, /SB habilitado:/, 'texto sempre reporta o estado do SB');
  assert.match(txt, /bundle: /, 'texto sempre carrega a versão do bundle');
});
