// ============================================================================
// Choque de Eras — SB: cliente Supabase mínimo por fetch cru — TDMV-5 Fase D
// ============================================================================
// SEM supabase-js: preserva o bundle single-file zero-dependência. Cobre só o
// que o Desafio do Dia precisa: sessão anônima, vínculo de e-mail por OTP,
// submissão à Edge Function, leitura de seed/ranking. PURO e INJETÁVEL
// (fetch/store/config vêm por parâmetro) para rodar no browser E no teste.
//
// CUIDADO CENTRAL (pedido do founder): sem supabase-js NÃO há gestor de sessão.
// Aqui a sessão é persistida no store e o access_token é RENOVADO pelo
// refresh_token antes de expirar — sessão nunca se perde em silêncio. Coberto
// por tests/sb-sessao.test.mjs.
// ============================================================================

export const SB_STORE_KEY = 'choque:sb:session'; // {access_token, refresh_token, expires_at, user}
const MARGEM_S = 60; // renova o token 60s ANTES de expirar (evita corrida na borda)

// store: { get(k)->Promise<string|null>, set(k,v)->Promise, del(k)->Promise }
export function criarSB({ fetchImpl, store, url, anon, now = () => Date.now() }) {
  if (!url || !anon) return { habilitado: false }; // sem config: ranking desligado, jogo segue local
  const base = url.replace(/\/$/, '');
  let sessao = null;         // cache em memória
  let carregada = false;

  const nowS = () => Math.floor(now() / 1000);

  async function carregar() {
    if (carregada) return sessao;
    try { const raw = await store.get(SB_STORE_KEY); sessao = raw ? JSON.parse(raw) : null; }
    catch { sessao = null; }
    carregada = true; return sessao;
  }
  async function salvar(s) {
    // normaliza expires_at (GoTrue manda unix secs; se vier só expires_in, calcula)
    if (s && !s.expires_at && s.expires_in) s.expires_at = nowS() + s.expires_in;
    sessao = s; carregada = true;
    if (s) await store.set(SB_STORE_KEY, JSON.stringify(s)); else await store.del(SB_STORE_KEY);
    return s;
  }
  async function limpar() { await salvar(null); }

  // --- HTTP ---
  async function req(path, { method = 'GET', body, token, prefer } = {}) {
    const headers = { apikey: anon, 'content-type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (prefer) headers.Prefer = prefer;
    const res = await fetchImpl(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let data = null; try { data = await res.json(); } catch { /* 204/sem corpo */ }
    return { ok: res.ok, status: res.status, data };
  }

  // --- sessão / token ---
  function expirado(s) { return !s || !s.expires_at || nowS() >= s.expires_at - MARGEM_S; }

  async function refresh() {
    const s = await carregar();
    if (!s || !s.refresh_token) return null;
    const r = await req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } });
    if (!r.ok || !r.data || !r.data.access_token) { await limpar(); return null; } // refresh morto: NÃO herda silenciosamente
    return salvar(r.data);
  }

  // token válido para chamadas autenticadas; renova se preciso. null se sem sessão.
  async function tokenValido() {
    let s = await carregar();
    if (!s) return null;
    if (expirado(s)) { s = await refresh(); if (!s) return null; }
    return s.access_token;
  }

  async function signInAnonimo() {
    const r = await req('/auth/v1/signup', { method: 'POST', body: {} });
    if (!r.ok || !r.data || !r.data.access_token) throw erro('anon_falhou', r);
    return salvar(r.data);
  }

  // garante ALGUMA sessão (anônima se não houver) — chamada no boot, sem fricção.
  async function garantirSessao() {
    const s = await carregar();
    if (s) { if (expirado(s)) { const nv = await refresh(); if (nv) return nv; } else return s; }
    return signInAnonimo();
  }

  async function usuario() { const s = await carregar(); return s ? s.user : null; }
  async function ehAnonimo() { const u = await usuario(); return !u || u.is_anonymous === true; }

  // vincula e-mail ao usuário atual (anônimo -> permanente): dispara OTP de troca.
  async function vincularEmail(email) {
    const token = await tokenValido();
    if (!token) throw erro('sem_sessao');
    const r = await req('/auth/v1/user', { method: 'PUT', token, body: { email } });
    if (!r.ok) throw erro(conflitoEmail(r) ? 'email_em_uso' : 'vinculo_falhou', r);
    return true;
  }
  // confirma o OTP de troca de e-mail: sessão vira permanente (is_anonymous=false).
  async function confirmarEmail(email, otp) {
    const r = await req('/auth/v1/verify', { method: 'POST', body: { type: 'email_change', email, token: otp } });
    if (!r.ok || !r.data || !r.data.access_token) throw erro('otp_invalido', r);
    return salvar(r.data);
  }

  // conflito (item 4): e-mail já é de outra conta -> ENTRA na existente por OTP.
  async function loginOtp(email) {
    const r = await req('/auth/v1/otp', { method: 'POST', body: { email, create_user: false } });
    if (!r.ok) throw erro('otp_envio_falhou', r);
    return true;
  }
  async function confirmarLogin(email, otp) {
    const r = await req('/auth/v1/verify', { method: 'POST', body: { type: 'email', email, token: otp } });
    if (!r.ok || !r.data || !r.data.access_token) throw erro('otp_invalido', r);
    return salvar(r.data); // abandona a sessão anônima (progresso NÃO é mesclado)
  }

  // perfil: cria/atualiza o próprio (RLS: id = auth.uid; anônimo é barrado no 002).
  async function salvarPerfil({ apelido, email, clube_coracao }) {
    const token = await tokenValido(); const u = await usuario();
    if (!token || !u) throw erro('sem_sessao');
    const r = await req('/rest/v1/profiles', {
      method: 'POST', token, prefer: 'resolution=merge-duplicates,return=representation',
      body: { id: u.id, apelido, email, clube_coracao },
    });
    if (r.status === 409) throw erro('apelido_em_uso', r);
    if (!r.ok) throw erro('perfil_falhou', r);
    return true;
  }

  // seed OFICIAL do dia (leitura pública). null se o desafio ainda não abriu.
  async function seedDoDia(date) {
    const r = await req(`/rest/v1/daily_challenges?date=eq.${encodeURIComponent(date)}&select=seed`);
    if (!r.ok || !Array.isArray(r.data) || !r.data.length) return null;
    return r.data[0].seed;
  }
  // ranking público (view daily_ranking): [{apelido, score, posicao}]
  async function ranking(date, limite = 50) {
    const r = await req(`/rest/v1/daily_ranking?challenge_date=eq.${encodeURIComponent(date)}` +
      `&select=apelido,score,posicao&order=posicao.asc&limit=${limite}`);
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }

  // submete o Desafio do Dia à Edge Function (score é recalculado no servidor).
  // Devolve {ok, status, data}: o app mapeia 403 email_necessario / 409 versão / etc.
  async function submeterDia({ date, decisions, clientVersion }) {
    const token = await tokenValido();
    if (!token) return { ok: false, status: 401, data: { erro: 'sem_sessao' } };
    return req('/functions/v1/submit-daily', { method: 'POST', token, body: { date, decisions, clientVersion } });
  }

  return {
    habilitado: true,
    garantirSessao, usuario, ehAnonimo, tokenValido,
    vincularEmail, confirmarEmail, loginOtp, confirmarLogin,
    salvarPerfil, seedDoDia, ranking, submeterDia,
    _limpar: limpar, // testes/logout
  };
}

function erro(codigo, r) { const e = new Error(codigo); e.codigo = codigo; if (r) { e.status = r.status; e.data = r.data; } return e; }
// GoTrue sinaliza e-mail já usado de formas diferentes por versão; cobre as comuns.
function conflitoEmail(r) {
  const d = r.data || {}; const msg = (d.msg || d.error_description || d.message || '') + '';
  return r.status === 422 || /already|registered|exists|in use/i.test(msg) || d.error_code === 'email_exists';
}
