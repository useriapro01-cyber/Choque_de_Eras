// SESSÃO SUPABASE POR FETCH CRU (TDMV-5 Fase D) — sem supabase-js, a gestão de
// sessão é NOSSA. Este teste blinda o risco que o founder apontou: sessão nunca
// pode se perder em silêncio. Cobre persistência, refresh antes de expirar,
// refresh morto (limpa, não reusa), conflito de e-mail e submissão autenticada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSB, SB_STORE_KEY, parseHashTokens } from '../src/sb.js';

const resp = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
function memStore() {
  const m = new Map();
  return { get: async k => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, del: async k => { m.delete(k); }, _m: m };
}
const sessao = (at, rt, extra = {}) => ({ access_token: at, refresh_token: rt, expires_in: 3600, user: { id: 'u1', is_anonymous: true }, ...extra });

test('sessão: cria anônima, persiste e RENOVA o token antes de expirar', async () => {
  const clock = { t: 1_700_000_000_000 };
  const store = memStore(); const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push(opts.method + ' ' + url);
    assert.equal(opts.headers.apikey, 'anon-key', 'toda chamada leva apikey');
    if (url.includes('/auth/v1/signup')) return resp(200, sessao('at1', 'rt1'));
    if (url.includes('/auth/v1/token')) return resp(200, sessao('at2', 'rt2'));
    return resp(404, {});
  };
  const sb = criarSB({ fetchImpl, store, url: 'https://x.supabase.co', anon: 'anon-key', now: () => clock.t });

  await sb.garantirSessao();
  assert.equal(await sb.tokenValido(), 'at1');
  assert.equal(await sb.ehAnonimo(), true);
  assert.ok((await store.get(SB_STORE_KEY)).includes('rt1'), 'sessão persistida no store');

  clock.t += 3600 * 1000; // token expira → tokenValido deve refrescar
  assert.equal(await sb.tokenValido(), 'at2');
  assert.ok(calls.some(c => c.includes('/auth/v1/token')), 'houve refresh');

  // "reload" da página: nova instância, mesmo store → restaura sem novo signup
  const sb2 = criarSB({ fetchImpl, store, url: 'https://x.supabase.co', anon: 'anon-key', now: () => clock.t });
  assert.equal(await sb2.tokenValido(), 'at2');
  assert.equal(calls.filter(c => c.includes('/auth/v1/signup')).length, 1, 'não recriou sessão no reload');
});

test('sessão: refresh morto LIMPA a sessão (nunca reusa em silêncio)', async () => {
  const clock = { t: 1_700_000_000_000 }; const store = memStore();
  const fetchImpl = async (url) => {
    if (url.includes('/auth/v1/signup')) return resp(200, sessao('at1', 'rt1'));
    if (url.includes('/auth/v1/token')) return resp(400, { error: 'invalid_grant' });
    return resp(404, {});
  };
  const sb = criarSB({ fetchImpl, store, url: 'https://x.supabase.co', anon: 'k', now: () => clock.t });
  await sb.garantirSessao();
  clock.t += 3600 * 1000;
  assert.equal(await sb.tokenValido(), null, 'refresh falhou → null, não o token velho');
  assert.equal(await store.get(SB_STORE_KEY), null, 'sessão foi limpa do store');
});

test('sessão: sem config (anon vazia) o SB fica DESABILITADO e o jogo segue local', () => {
  const sb = criarSB({ fetchImpl: async () => resp(200, {}), store: memStore(), url: '', anon: '' });
  assert.equal(sb.habilitado, false);
});

test('vínculo: e-mail já usado sinaliza email_em_uso (dispara fluxo de conflito)', async () => {
  const clock = { t: 1_700_000_000_000 }; const store = memStore();
  const fetchImpl = async (url, opts) => {
    if (url.includes('/auth/v1/signup')) return resp(200, sessao('at1', 'rt1'));
    if (opts.method === 'PUT' && url.includes('/auth/v1/user')) return resp(422, { msg: 'email already registered' });
    return resp(404, {});
  };
  const sb = criarSB({ fetchImpl, store, url: 'https://x.supabase.co', anon: 'k', now: () => clock.t });
  await sb.garantirSessao();
  await assert.rejects(() => sb.vincularEmail('taken@x.com'), e => e.codigo === 'email_em_uso');
});

test('link: parseHashTokens extrai tokens do redirect e detecta erro', () => {
  const t = parseHashTokens('#access_token=AT&refresh_token=RT&expires_in=3600&type=email_change');
  assert.equal(t.access_token, 'AT'); assert.equal(t.refresh_token, 'RT'); assert.equal(t.type, 'email_change');
  assert.equal(parseHashTokens(''), null, 'hash vazio → null');
  assert.equal(parseHashTokens('#foo=1'), null, 'sem access_token → null');
  assert.ok(parseHashTokens('#error=access_denied&error_description=expired').erro, 'hash de erro → {erro}');
});

test('link: adotarTokens busca o usuário e persiste sessão PERMANENTE', async () => {
  const clock = { t: 1_700_000_000_000 }; const store = memStore();
  const fetchImpl = async (url, opts) => {
    if (url.includes('/auth/v1/user') && (!opts.method || opts.method === 'GET')) {
      assert.equal(opts.headers.Authorization, 'Bearer AT');
      return resp(200, { id: 'u9', is_anonymous: false, email: 'a@b.com' });
    }
    return resp(404, {});
  };
  const sb = criarSB({ fetchImpl, store, url: 'https://x.supabase.co', anon: 'k', now: () => clock.t });
  const s = await sb.adotarTokens({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600 });
  assert.ok(s, 'adotou a sessão');
  assert.equal(await sb.tokenValido(), 'AT');
  assert.equal(await sb.ehAnonimo(), false, 'sessão do link é PERMANENTE');
  assert.ok((await store.get(SB_STORE_KEY)).includes('u9'), 'persistiu com o usuário');
});

test('desafio do dia: lê current_daily (o BANCO decide o dia em SP), nunca envia data do cliente', async () => {
  const store = memStore(); let urlDesafio = null;
  const fetchImpl = async (url) => {
    if (url.includes('/auth/v1/signup')) return resp(200, sessao('at1', 'rt1'));
    if (url.includes('/rest/v1/current_daily')) { urlDesafio = url; return resp(200, [{ challenge_date: '2026-07-26', seed: 'dia-2026-07-26' }]); }
    return resp(404, {});
  };
  const sb = criarSB({ fetchImpl, store, url: 'https://x.supabase.co', anon: 'k', now: () => 1_700_000_000_000 });
  await sb.garantirSessao();
  const d = await sb.desafioAtual();
  assert.deepEqual(d, { date: '2026-07-26', seed: 'dia-2026-07-26' });
  assert.ok(urlDesafio.includes('/rest/v1/current_daily'), 'usa a view current_daily (dia decidido no banco)');
  assert.ok(!/date=eq|challenge_date=eq/.test(urlDesafio), 'NUNCA filtra por data do cliente');
});

test('submissão: envia Bearer do token válido e REPASSA a resposta da Edge Function', async () => {
  const clock = { t: 1_700_000_000_000 }; const store = memStore(); let auth = null;
  const fetchImpl = async (url, opts) => {
    if (url.includes('/auth/v1/signup')) return resp(200, sessao('at1', 'rt1', { user: { id: 'u1', is_anonymous: false } }));
    if (url.includes('/functions/v1/submit-daily')) { auth = opts.headers.Authorization; return resp(200, { ok: true, score: 123, best: 123 }); }
    return resp(404, {});
  };
  const sb = criarSB({ fetchImpl, store, url: 'https://x.supabase.co', anon: 'k', now: () => clock.t });
  await sb.garantirSessao();
  const r = await sb.submeterDia({ date: '2026-07-25', decisions: [], clientVersion: 'v1' });
  assert.equal(r.ok, true);
  assert.equal(r.data.score, 123);
  assert.equal(auth, 'Bearer at1');
});
