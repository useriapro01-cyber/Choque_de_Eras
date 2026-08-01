// ============================================================================
// pending-run.test.mjs — TDMV-5 Fase E: run pendente durável (server-side)
// ============================================================================
// A pendência vivia só em localStorage (por origem/navegador). Ao abrir o e-mail
// num app com WEBVIEW própria, ela ficava órfã e o submit nunca rodava. Cura:
// espelhar a run em pending_runs (atrelada ao uid). Aqui:
//  (A) sb.js: salvarRunPendente/lerRunPendente/lerPerfil batem no endpoint certo.
//  (B) app.js: retomarPendente promove a run do SERVIDOR quando o localStorage
//      está vazio; sem run em lugar nenhum, AVISA (nunca mudo); bootSessao persiste
//      o e-mail da sessão adotada; garantirPerfil NÃO sobrescreve apelido existente.
//
// FRONTEIRA HONESTA: jsdom/vm não têm webview nem storage por-origem. O que provo
// aqui é a LÓGICA (endpoint, priorização local→servidor, mensagens). A sobrevivência
// real à webview do app de e-mail exige NAVEGADOR/CELULAR real (ver checklist do PR).
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSB, SB_STORE_KEY } from '../src/sb.js';
import { carregarMotor } from './harness/carregar-motor.mjs';

const resp = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
function storeCom(sessao) {
  const m = new Map(); if (sessao) m.set(SB_STORE_KEY, JSON.stringify(sessao));
  return { get: async k => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, del: async k => { m.delete(k); } };
}
const sessaoPerm = (t) => ({ access_token: 'AT', refresh_token: 'RT', expires_at: Math.floor(t / 1000) + 3600, user: { id: 'u1', is_anonymous: false } });

// ---------------------------------------------------------------------------
// (A) sb.js — endpoints
// ---------------------------------------------------------------------------
test('salvarRunPendente: POST /pending_runs com upsert e corpo correto', async () => {
  const t = 1_700_000_000_000; let visto = null;
  const fetchImpl = async (url, opts) => {
    if (opts.method === 'POST' && url.includes('/rest/v1/pending_runs')) { visto = { url, opts }; return resp(201, null); }
    return resp(404, {});
  };
  const sb = criarSB({ fetchImpl, store: storeCom(sessaoPerm(t)), url: 'https://x.supabase.co', anon: 'k', now: () => t });
  const ok = await sb.salvarRunPendente({ date: '2026-07-31', decisions: [{ t: 'rolar' }], clientVersion: 'v1' });
  assert.equal(ok, true);
  assert.ok(visto, 'chamou o endpoint');
  assert.match(visto.opts.headers.Prefer || '', /merge-duplicates/, 'upsert (não duplica por usuário)');
  const body = JSON.parse(visto.opts.body);
  assert.equal(body.user_id, 'u1');
  assert.equal(body.challenge_date, '2026-07-31');
  assert.deepEqual(body.decisions, [{ t: 'rolar' }]);
  assert.equal(body.client_version, 'v1');
});

test('lerRunPendente: filtra por uid+dia e devolve {decisions,clientVersion} ou null', async () => {
  const t = 1_700_000_000_000;
  const fetchImpl = async (url, opts) => {
    if (opts.method === undefined || opts.method === 'GET') {
      if (url.includes('/rest/v1/pending_runs') && url.includes('user_id=eq.u1') && url.includes('challenge_date=eq.2026-07-31'))
        return resp(200, [{ decisions: [{ t: 'formacao', f: '4-3-3' }], client_version: 'v9' }]);
      if (url.includes('/rest/v1/pending_runs')) return resp(200, []); // outro dia: vazio
    }
    return resp(404, {});
  };
  const sb = criarSB({ fetchImpl, store: storeCom(sessaoPerm(t)), url: 'https://x.supabase.co', anon: 'k', now: () => t });
  const achou = await sb.lerRunPendente('2026-07-31');
  assert.deepEqual(achou, { decisions: [{ t: 'formacao', f: '4-3-3' }], clientVersion: 'v9' });
  assert.equal(await sb.lerRunPendente('2026-07-30'), null, 'sem run no dia → null');
});

test('lerPerfil: devolve {apelido,email} do próprio ou null', async () => {
  const t = 1_700_000_000_000;
  const fetchImpl = async (url) => {
    if (url.includes('/rest/v1/profiles') && url.includes('id=eq.u1')) return resp(200, [{ apelido: 'GuiNog', email: 'g@h.com' }]);
    return resp(200, []);
  };
  const sb = criarSB({ fetchImpl, store: storeCom(sessaoPerm(t)), url: 'https://x.supabase.co', anon: 'k', now: () => t });
  assert.deepEqual(await sb.lerPerfil(), { apelido: 'GuiNog', email: 'g@h.com' });
});

// ---------------------------------------------------------------------------
// (B) app.js — promoção da run e mensagens
// ---------------------------------------------------------------------------
function baseSb(over = {}) {
  return Object.assign({
    habilitado: true,
    async ehAnonimo() { return false; },
    async desafioAtual() { return { date: '2026-07-31', seed: 's' }; },
    async salvarPerfil() { return true; },
    async submeterDia() { return { ok: true, status: 200, data: { best: 1 } }; },
  }, over);
}
function comWarnSpy(fn) {
  const orig = console.warn; const warns = [];
  console.warn = (...a) => { warns.push(a.map(String).join(' ')); };
  return Promise.resolve(fn(warns)).finally(() => { console.warn = orig; });
}

test('retomarPendente: sem localStorage, mas COM run no servidor → promove e submete', async () => {
  const api = carregarMotor(); api.S.lang = 'pt';
  let submetido = null;
  api.setSbFake(baseSb({
    async lerRunPendente(d) { return d === '2026-07-31' ? { decisions: [{ t: 'rolar' }], clientVersion: 'v1' } : null; },
    async submeterDia(p) { submetido = p; return { ok: true, status: 200, data: { best: 1 } }; },
  }));
  await api.retomarPendente();
  assert.ok(submetido, 'submeteu a run vinda do servidor');
  assert.deepEqual(submetido.decisions, [{ t: 'rolar' }]);
  assert.equal(submetido.date, '2026-07-31');
});

test('retomarPendente: sem run em lugar nenhum → AVISA (warn), não submete', async () => {
  await comWarnSpy(async (warns) => {
    const api = carregarMotor(); api.S.lang = 'pt';
    let submeteu = false;
    api.setSbFake(baseSb({
      async lerRunPendente() { return null; },
      async submeterDia() { submeteu = true; return { ok: true, status: 200, data: {} }; },
    }));
    await api.retomarPendente();
    assert.equal(submeteu, false, 'não submete sem run');
    assert.ok(warns.some(w => /sem pendência/.test(w)), 'logou warn de sem pendência (nunca mudo)');
  });
});

test('bootSessao: persiste o e-mail da sessão adotada em S.profile.email', async () => {
  const api = carregarMotor({ location: { origin: 'https://www.choquedeeras.com.br', hash: '#access_token=abc' } });
  api.S.lang = 'pt';
  api.setSbFake(baseSb({
    async garantirSessao() { return { user: { id: 'perm' } }; },
    async adotarTokens() { return { user: { id: 'perm', is_anonymous: false, email: 'gui@hotmail.com' } }; },
    async lerRunPendente() { return null; },
  }));
  await api.bootSessao();
  assert.equal(api.S.profile.email, 'gui@hotmail.com', 'e-mail confirmado agora vive no perfil (não mais NULL)');
});

test('garantirPerfil: perfil já existente → NÃO sobrescreve apelido (preserva a conta)', async () => {
  const api = carregarMotor(); api.S.lang = 'pt';
  let salvou = false;
  api.setSbFake(baseSb({
    async lerPerfil() { return { apelido: 'ContaExistente', email: 'a@b.com' }; },
    async salvarPerfil() { salvou = true; return true; },
  }));
  const gp = await api.garantirPerfil('OutroNick', 'x@y.com');
  assert.equal(gp.ok, true);
  assert.equal(gp.apelido, 'ContaExistente', 'preservou o apelido da conta existente');
  assert.equal(salvou, false, 'não chamou salvarPerfil (não pisou no apelido de A)');
});
