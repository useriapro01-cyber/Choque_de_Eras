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

// Fluxo por LINK (sem SMTP p/ OTP): o e-mail de confirmação redireciona para o
// app com os tokens no HASH da URL (#access_token=...&refresh_token=...). Isto
// extrai esses tokens (ou um erro) do hash. Puro/testável.
export function parseHashTokens(hash) {
  const h = (hash || '').replace(/^#/, '');
  if (!h) return null;
  const p = new URLSearchParams(h);
  if (p.get('error') || p.get('error_description')) {
    return { erro: p.get('error_description') || p.get('error') };
  }
  const access_token = p.get('access_token');
  if (!access_token) return null;
  return {
    access_token,
    refresh_token: p.get('refresh_token') || null,
    expires_at: p.get('expires_at') ? Number(p.get('expires_at')) : null,
    expires_in: p.get('expires_in') ? Number(p.get('expires_in')) : null,
    type: p.get('type') || null,
  };
}

// Classifica o RETORNO de um link de e-mail (puro/testável). Fluxo implícito:
// tokens vêm no HASH (#access_token). Cobrimos também a QUERY (?error / ?code)
// só DEFENSIVAMENTE — este cliente é fetch cru, sem PKCE (ver CLAUDE.md); um
// ?code não tem como ser trocado aqui, então é reportado, nunca engolido.
// Devolve: {tipo:'tokens',tok} | {tipo:'erro',erro} | {tipo:'code'}
//        | {tipo:'ilegivel',chaves} | {tipo:'nenhum'}
export function classificarRetorno(hash, search) {
  const tok = parseHashTokens(hash);
  if (tok && tok.access_token) return { tipo: 'tokens', tok };
  if (tok && tok.erro) return { tipo: 'erro', erro: tok.erro };
  const q = new URLSearchParams((search || '').replace(/^\?/, ''));
  if (q.get('error') || q.get('error_description')) return { tipo: 'erro', erro: q.get('error_description') || q.get('error') };
  if (q.get('code')) return { tipo: 'code' };
  // hash/query tinham conteúdo mas nada reconhecível? não pode passar mudo.
  const h = new URLSearchParams((hash || '').replace(/^#/, ''));
  const chaves = [...new Set([...h.keys(), ...q.keys()])];
  if (chaves.length) return { tipo: 'ilegivel', chaves };
  return { tipo: 'nenhum' };
}

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
    catch (e) { console.warn('[sessao] falha ao carregar sessão persistida', e); sessao = null; }
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
  async function req(path, { method = 'GET', body, token, prefer, signal } = {}) {
    const headers = { apikey: anon, 'content-type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (prefer) headers.Prefer = prefer;
    const res = await fetchImpl(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal });
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

  // vincula e-mail ao usuário atual (anônimo -> permanente). Com "Confirm email"
  // ON e sem SMTP p/ OTP, o GoTrue envia um LINK de confirmação; ao clicar, o app
  // volta com os tokens no hash (ver adotarTokens). is_anonymous vira false.
  async function vincularEmail(email) {
    const token = await tokenValido();
    if (!token) throw erro('sem_sessao');
    const r = await req('/auth/v1/user', { method: 'PUT', token, body: { email } });
    if (!r.ok) throw erro(conflitoEmail(r) ? 'email_em_uso' : 'vinculo_falhou', r);
    return true;
  }

  // conflito (item 4): e-mail já é de outra conta -> manda LINK de login (magic
  // link) para a conta existente; o clique redireciona com tokens no hash.
  async function loginLink(email) {
    const r = await req('/auth/v1/otp', { method: 'POST', body: { email, create_user: false } });
    if (!r.ok) throw erro('login_envio_falhou', r);
    return true;
  }

  // adota a sessão vinda do LINK (tokens no hash do redirect): busca o usuário
  // com o access_token e persiste a sessão permanente. Núcleo do "volta e pontua".
  async function adotarTokens(tok) {
    if (!tok || !tok.access_token) return null;
    const s = {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token || null,
      expires_at: tok.expires_at || (tok.expires_in ? nowS() + tok.expires_in : nowS() + 3600),
    };
    const r = await req('/auth/v1/user', { token: s.access_token });
    if (!r.ok || !r.data || !r.data.id) {
      console.warn('[sessao] /auth/v1/user recusou o token do link', { status: r.status });
      return null; // não vira sessão — o app trata (mensagem visível), nunca em silêncio
    }
    s.user = r.data;
    return salvar(s);
  }

  // --- CAMINHO OTP (DORMENTE): reativar quando houver SMTP e template com
  //     {{ .Token }}. Troca o link de confirmação por código de 6 dígitos. ---
  async function confirmarEmailOTP(email, otp) { // vínculo anônimo -> permanente
    const r = await req('/auth/v1/verify', { method: 'POST', body: { type: 'email_change', email, token: otp } });
    if (!r.ok || !r.data || !r.data.access_token) throw erro('otp_invalido', r);
    return salvar(r.data);
  }
  async function confirmarLoginOTP(email, otp) { // login na conta existente
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
  // lê o PRÓPRIO perfil (RLS: id=auth.uid). Devolve {apelido,email} ou null.
  // Usado por garantirPerfil para NÃO sobrescrever o apelido de uma conta que já
  // existe (login numa conta existente preserva o apelido dela).
  async function lerPerfil() {
    const token = await tokenValido(); const u = await usuario();
    if (!token || !u) return null;
    const r = await req(`/rest/v1/profiles?id=eq.${encodeURIComponent(u.id)}&select=apelido,email&limit=1`, { token });
    if (!r.ok || !Array.isArray(r.data) || !r.data.length) return null;
    return { apelido: r.data[0].apelido, email: r.data[0].email };
  }

  // Run pendente NO SERVIDOR (pending_runs): sobrevive a troca de origem/navegador/
  // webview porque é atrelada ao user_id, não ao localStorage. PK=user_id ⇒ upsert
  // substitui (só o dia corrente importa). RLS dono-only permite o anônimo gravar
  // a PRÓPRIA linha (é ele que, ao virar permanente, promove a run). Guardar aqui
  // NÃO é confiar: submit-daily re-simula do zero (anti-fraude intacto).
  async function salvarRunPendente({ date, decisions, clientVersion }) {
    const token = await tokenValido(); const u = await usuario();
    if (!token || !u) throw erro('sem_sessao');
    const r = await req('/rest/v1/pending_runs', {
      method: 'POST', token, prefer: 'resolution=merge-duplicates,return=minimal',
      body: { user_id: u.id, challenge_date: date, decisions, client_version: clientVersion },
    });
    if (!r.ok) throw erro('run_pendente_falhou', r);
    return true;
  }
  // Lê a run pendente do PRÓPRIO usuário para um dia (RLS já restringe ao uid).
  // Devolve {decisions, clientVersion} ou null. É o que a volta do link consulta
  // quando o localStorage (mesmo-contexto) não tem a pendência (veio de webview).
  async function lerRunPendente(date) {
    const token = await tokenValido(); const u = await usuario();
    if (!token || !u) return null;
    const r = await req(`/rest/v1/pending_runs?user_id=eq.${encodeURIComponent(u.id)}` +
      `&challenge_date=eq.${encodeURIComponent(date)}&select=decisions,client_version&limit=1`, { token });
    if (!r.ok || !Array.isArray(r.data) || !r.data.length) return null;
    return { decisions: r.data[0].decisions, clientVersion: r.data[0].client_version };
  }

  // Desafio CORRENTE: o BANCO decide qual é o dia (America/Sao_Paulo) pela view
  // current_daily — o cliente NUNCA calcula "hoje" pelo relógio do aparelho
  // (invariante do fuso). Devolve {date, seed} ou null se o dia ainda não abriu.
  async function desafioAtual() {
    const r = await req(`/rest/v1/current_daily?select=challenge_date,seed`);
    if (!r.ok || !Array.isArray(r.data) || !r.data.length) return null;
    return { date: r.data[0].challenge_date, seed: r.data[0].seed };
  }
  // ranking público (view daily_ranking): [{apelido, score, posicao}]
  async function ranking(date, limite = 50) {
    const r = await req(`/rest/v1/daily_ranking?challenge_date=eq.${encodeURIComponent(date)}` +
      `&select=apelido,score,posicao&order=posicao.asc&limit=${limite}`);
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }

  // submete o Desafio do Dia à Edge Function (score é recalculado no servidor).
  // Devolve {ok, status, data}: o app mapeia 403 email_necessario / 409 versão / etc.
  // TIMEOUT (AbortController): cold start da função pode demorar; sem teto, um
  // fetch pendurado deixaria a UI presa em "Enviando...". Ao estourar, aborta e
  // REJEITA — o app.js trata a rejeição (try/catch) e sai do estado de envio.
  async function submeterDia({ date, decisions, clientVersion, timeoutMs = 15000 }) {
    const token = await tokenValido();
    if (!token) return { ok: false, status: 401, data: { erro: 'sem_sessao' } };
    const ac = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null;
    try {
      return await req('/functions/v1/submit-daily', {
        method: 'POST', token, signal: ac ? ac.signal : undefined,
        body: { date, decisions, clientVersion },
      });
    } finally { if (timer) clearTimeout(timer); }
  }

  return {
    habilitado: true,
    garantirSessao, usuario, ehAnonimo, tokenValido,
    vincularEmail, loginLink, adotarTokens,          // fluxo por LINK (ativo)
    confirmarEmailOTP, confirmarLoginOTP,             // fluxo por OTP (dormente)
    salvarPerfil, lerPerfil, desafioAtual, ranking, submeterDia,
    salvarRunPendente, lerRunPendente,               // run pendente durável (server-side)
    _limpar: limpar, // testes/logout
  };
}

function erro(codigo, r) { const e = new Error(codigo); e.codigo = codigo; if (r) { e.status = r.status; e.data = r.data; } return e; }
// GoTrue sinaliza e-mail já usado de formas diferentes por versão; cobre as comuns.
function conflitoEmail(r) {
  const d = r.data || {}; const msg = (d.msg || d.error_description || d.message || '') + '';
  return r.status === 422 || /already|registered|exists|in use/i.test(msg) || d.error_code === 'email_exists';
}
