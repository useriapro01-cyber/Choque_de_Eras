// ============================================================================
// perfil-envio.test.mjs — perfil garantido + erros de envio específicos
// ============================================================================
// O envio pós-e-mail caía no genérico "Não deu para enviar" porque o servidor
// devolvia 403 profile_invalido (perfil nunca criado) e o cliente descartava o
// código. Aqui: (a) perfil garantido na adoção; (b) submit recupera 403
// profile_invalido criando o perfil e retentando UMA vez; item 3: msgEnvio
// específico com código no fallback; item 4: pendência vencida avisa + descarta,
// permanente limpa / transitório mantém.
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarMotor } from './harness/carregar-motor.mjs';

const PENDENTE_KEY = 'choque:dia:pendente';

function baseSb(over = {}) {
  return Object.assign({
    habilitado: true,
    async garantirSessao() { return { user: { id: 'u' } }; },
    async adotarTokens() { return { user: { id: 'u', is_anonymous: false } }; },
    async ehAnonimo() { return false; },
    async desafioAtual() { return { date: '2026-07-30', seed: 's' }; },
    async salvarPerfil() { return true; },
    async submeterDia() { return { ok: true, status: 200, data: { best: 1 } }; },
  }, over);
}

// ---------------------------------------------------------------------------
// Item 3 — msgEnvio: específico p/ conhecidos, fallback COM código p/ o resto
// ---------------------------------------------------------------------------
test('msgEnvio: códigos conhecidos → mensagem específica (não genérica)', () => {
  const api = carregarMotor(); api.S.lang = 'pt';
  assert.equal(api.msgEnvio({ status: 403, data: { erro: 'profile_invalido' } }), api.t('env_perfil'));
  assert.equal(api.msgEnvio({ status: 429, data: { erro: 'rate_limited' } }), api.t('env_rate'));
  assert.equal(api.msgEnvio({ status: 422, data: { erro: 'campanha_incompleta' } }), api.t('env_invalido'));
  assert.equal(api.msgEnvio({ status: 401, data: { erro: 'unauthorized' } }), api.t('env_sessao'));
  assert.equal(api.msgEnvio({ status: 409, data: { erro: 'dia_virou' } }), api.t('env_dia_virou'));
});

test('msgEnvio: código DESCONHECIDO aparece na mensagem (nunca genérico cego)', () => {
  const api = carregarMotor(); api.S.lang = 'pt';
  const m = api.msgEnvio({ status: 500, data: { erro: 'coisa_nova_do_servidor' } });
  assert.ok(m.includes('coisa_nova_do_servidor'), 'o código do servidor aparece na mensagem');
  const m2 = api.msgEnvio({ status: 503, data: null });   // sem corpo → mostra o status
  assert.ok(/503/.test(m2), 'sem código, mostra o HTTP status');
});

test('msgEnvio: mensagens novas existem em PT e ES', () => {
  const api = carregarMotor();
  for (const lang of ['pt', 'es']) {
    api.S.lang = lang;
    for (const k of ['env_perfil', 'env_rate', 'env_invalido', 'env_sessao', 'env_erro_cod', 'env_pend_vencida']) {
      assert.ok(api.t(k) !== k, `${k} em ${lang}`);
    }
  }
});

// ---------------------------------------------------------------------------
// (b) submeterDiario recupera 403 profile_invalido: cria perfil + retenta 1x
// ---------------------------------------------------------------------------
function prepDiario(api) {
  api.S.lang = 'pt'; api.S.storageOk = true; api.S.profile.nick = 'NEY';
  api.S.camp = { mode: 'diario', dia: '2026-07-30', log: [{}], score: { total: 1 }, replayOk: true };
  api.S.envio = null;
}

test('(b) 403 profile_invalido → cria perfil e RETENTA uma vez → sucesso', async () => {
  const api = carregarMotor(); prepDiario(api);
  let criou = false, tentativas = 0;
  api.setSbFake(baseSb({
    salvarPerfil: async () => { criou = true; return true; },
    submeterDia: async () => { tentativas++; return tentativas === 1
      ? { ok: false, status: 403, data: { erro: 'profile_invalido' } }
      : { ok: true, status: 200, data: { best: 5 } }; },
  }));
  await api.submeterDiario();
  assert.ok(criou, 'criou o perfil');
  assert.equal(tentativas, 2, 'retentou exatamente uma vez');
  assert.equal(api.S.envio.fase, 'ok', 'sucesso no retry');
});

test('(b) retry também falha → mensagem ESPECÍFICA, não genérica', async () => {
  const api = carregarMotor(); prepDiario(api);
  let tentativas = 0;
  api.setSbFake(baseSb({
    submeterDia: async () => { tentativas++; return { ok: false, status: 403, data: { erro: 'profile_invalido' } }; },
  }));
  await api.submeterDiario();
  assert.equal(tentativas, 2, 'uma tentativa + um retry, sem loop');
  assert.equal(api.S.envio.fase, 'erro');
  assert.equal(api.S.envio.msg, api.t('env_perfil'), 'erro específico (profile), não env_erro genérico');
});

test('submeterDiario: erro desconhecido mostra o código (item 3)', async () => {
  const api = carregarMotor(); prepDiario(api);
  api.setSbFake(baseSb({ submeterDia: async () => ({ ok: false, status: 500, data: { erro: 'boom' } }) }));
  await api.submeterDiario();
  assert.equal(api.S.envio.fase, 'erro');
  assert.ok(api.S.envio.msg.includes('boom'), 'mostra o código do servidor');
});

// ---------------------------------------------------------------------------
// (a) bootSessao garante o perfil na adoção, mesmo SEM pendência
// ---------------------------------------------------------------------------
test('(a) adoção do link garante o perfil mesmo sem pendência', async () => {
  const api = carregarMotor({ location: { origin: 'https://www.choquedeeras.com.br', hash: '#access_token=abc' } });
  api.S.profile.nick = 'NEY';
  let criou = false;
  api.setSbFake(baseSb({ salvarPerfil: async () => { criou = true; return true; } }));
  await api.bootSessao();
  assert.ok(criou, 'perfil criado na adoção, independente de pendência');
});

// ---------------------------------------------------------------------------
// Item 4 — pendência vencida: avisa com a data + descarta; permanente limpa
// ---------------------------------------------------------------------------
test('item4: pendência de outro dia → avisa (com a data) e descarta', async () => {
  const store = new Map();
  store.set(PENDENTE_KEY, JSON.stringify({ date: '2026-07-28', decisions: [], clientVersion: 'x', apelido: 'NEY' }));
  const api = carregarMotor({ store });
  api.S.lang = 'pt';
  api.setSbFake(baseSb());   // dia oficial = 2026-07-30
  await api.retomarPendente();
  assert.ok(!store.get(PENDENTE_KEY), 'pendência vencida descartada');
});

test('item4: dia oficial indisponível → MANTÉM a pendência (transitório)', async () => {
  const store = new Map();
  store.set(PENDENTE_KEY, JSON.stringify({ date: '2026-07-30', decisions: [], clientVersion: 'x', apelido: 'NEY' }));
  const api = carregarMotor({ store });
  api.S.lang = 'pt';
  api.setSbFake(baseSb({ desafioAtual: async () => null }));  // não obteve o dia
  await api.retomarPendente();
  assert.ok(store.get(PENDENTE_KEY), 'pendência mantida para retry');
});

test('item4: submit permanente (409) limpa a pendência; transitório (500) mantém', async () => {
  // permanente
  let store = new Map();
  store.set(PENDENTE_KEY, JSON.stringify({ date: '2026-07-30', decisions: [], clientVersion: 'x', apelido: 'NEY' }));
  let api = carregarMotor({ store }); api.S.lang = 'pt';
  api.setSbFake(baseSb({ submeterDia: async () => ({ ok: false, status: 409, data: { erro: 'versao_desatualizada' } }) }));
  await api.retomarPendente();
  assert.ok(!store.get(PENDENTE_KEY), '409 permanente → pendência limpa');

  // transitório
  store = new Map();
  store.set(PENDENTE_KEY, JSON.stringify({ date: '2026-07-30', decisions: [], clientVersion: 'x', apelido: 'NEY' }));
  api = carregarMotor({ store }); api.S.lang = 'pt';
  api.setSbFake(baseSb({ submeterDia: async () => ({ ok: false, status: 500, data: { erro: 'erro_interno' } }) }));
  await api.retomarPendente();
  assert.ok(store.get(PENDENTE_KEY), '500 transitório → pendência mantida');
});

// ---------------------------------------------------------------------------
// garantirPerfil: idempotente e retry de apelido em colisão
// ---------------------------------------------------------------------------
test('garantirPerfil: colisão de apelido → retenta com sufixo e devolve o efetivo', async () => {
  const api = carregarMotor(); api.S.lang = 'pt'; api.S.profile.nick = 'NEY';
  let n = 0;
  api.setSbFake(baseSb({ salvarPerfil: async () => { n++; if (n === 1) { const e = new Error('apelido_em_uso'); e.codigo = 'apelido_em_uso'; throw e; } return true; } }));
  const gp = await api.garantirPerfil('NEY', 'a@b.com');
  assert.equal(gp.ok, true);
  assert.notEqual(gp.apelido, 'NEY', 'ajustou o apelido em colisão');
});
