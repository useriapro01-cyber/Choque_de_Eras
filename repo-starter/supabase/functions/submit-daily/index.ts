// ============================================================================
// Edge Function: submit-daily v3 — RANKING SEM AUTH (TDMV-8, PR2)
// ============================================================================
// Identidade = E-MAIL (sem JWT, sem getUser, sem profiles). Recebe
// {email, apelido, decisions, consentimentos}, RE-SIMULA com a seed OFICIAL do
// dia (replay INTACTO), grava a submissão como PENDENTE e manda o e-mail (Resend)
// com o token. O ranked só muda na confirmação (confirm-daily, PR3).
//
// Fronteira de confiança (inalterada): a seed vem do BANCO, o score é
// recalculado AQUI, o cliente nunca envia score. src/engine.js e src/replay.js
// NÃO se tocam — o anti-fraude é o mesmo.
//
// Endpoint ABERTO (anon key, verify_jwt=false): a proteção é rate-limit
// (por e-mail E por IP) + duplo opt-in (nada entra no ranking sem o clique no
// link). Ninguém forja score (replay) nem publica sem confirmar (token).
//
// SEGREDOS/CONFIG só por env (nunca no repo/cliente):
//   SUPABASE_SERVICE_ROLE_KEY (runtime) · RESEND_API_KEY
//   MAIL_FROM (inicial 'onboarding@resend.dev' — sandbox) · MAIL_REPLY_TO
//   CONFIRM_URL · RATE_EMAIL_PER_HOUR (5) · RATE_IP_PER_HOUR (60)
// Trocar o remetente p/ noreply@choquedeeras.com.br = mudar env, sem redeploy —
// tira o DNS do caminho crítico deste PR.
// ============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as Engine from '../../../src/engine.js';
import { submeterReplay } from '../../../src/replay.js';
import { corsHeaders } from '../../../src/cors.js';
import {
  validarEmail, validarApelido, decidirGravacao, ipValido,
  gerarToken, hashToken, TOKEN_TTL_MS,
} from '../../../src/submit-logica.js';
import bruto from './_dados.json' with { type: 'json' };
import versaoDoc from './_versao.json' with { type: 'json' };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // injetada pelo runtime
const SERVER_VERSION = versaoDoc.version;

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? 'Choque de Eras <onboarding@resend.dev>';
const MAIL_REPLY_TO = Deno.env.get('MAIL_REPLY_TO') ?? '';
const CONFIRM_URL = Deno.env.get('CONFIRM_URL') ?? `${SUPABASE_URL}/functions/v1/confirm-daily`;
const RL_EMAIL = parseInt(Deno.env.get('RATE_EMAIL_PER_HOUR') ?? '5', 10);
const RL_IP = parseInt(Deno.env.get('RATE_IP_PER_HOUR') ?? '60', 10);

// O nome do jogador é COSMÉTICO e sai de um RNG isolado (invariante #3): o idioma
// NÃO afeta o score. O servidor re-simula com um pool fixo ('pt') e o placar é
// idêntico ao de qualquer idioma — ranking único e justo para BR e AR.
const poolsIdioma = (nomes: any, lang: string) => ({
  base: nomes.base[lang], sobrenomes: nomes.sobrenomes[lang],
  clubeA: nomes.clube[lang].a, clubeB: nomes.clube[lang].b,
});
const DADOS = Engine.montarDados(bruto, poolsIdioma((bruto as any).nomes, 'pt'));

type Json = (status: number, body: unknown) => Response;

// erro do replay (src/replay.js) → status HTTP estável.
function erroParaResposta(r: any, json: Json): Response {
  switch (r.erro) {
    case 'versao_desatualizada':
      return json(409, { ok: false, erro: r.erro });
    case 'seed_forma': case 'decisoes_forma': case 'decisao_forma':
      return json(400, { ok: false, erro: r.erro, indice: r.indice });
    default:
      return json(422, { ok: false, erro: r.erro ?? 'replay_invalido', indice: r.indice, tipo: r.tipo });
  }
}

// e-mail de confirmação (TRANSACIONAL — não é marketing). Bilíngue por `lang`.
function emailConfirmacao(lang: string, link: string) {
  const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!));
  const href = esc(link);
  if (lang === 'es') return {
    subject: 'Confirmá para entrar al ranking — Choque de Eras',
    html: `<p>Jugaste el Desafío del Día. Para <b>entrar al ranking</b>, confirmá tu e-mail:</p>
      <p><a href="${href}">Confirmar y entrar al ranking</a></p>
      <p>Si no fuiste vos, ignorá este e-mail — no se publicará nada.</p>`,
  };
  return {
    subject: 'Confirme para entrar no ranking — Choque de Eras',
    html: `<p>Você jogou o Desafio do Dia. Para <b>entrar no ranking</b>, confirme seu e-mail:</p>
      <p><a href="${href}">Confirmar e entrar no ranking</a></p>
      <p>Se não foi você, ignore este e-mail — nada será publicado.</p>`,
  };
}

// envia via API HTTP do Resend. Erro é reportado (nunca silencioso).
async function enviarEmail(to: string, lang: string, link: string): Promise<{ ok: boolean; erro?: string }> {
  if (!RESEND_API_KEY) { console.error('[resend] RESEND_API_KEY ausente'); return { ok: false, erro: 'sem_api_key' }; }
  const { subject, html } = emailConfirmacao(lang, link);
  const payload: Record<string, unknown> = { from: MAIL_FROM, to, subject, html };
  if (MAIL_REPLY_TO) payload.reply_to = MAIL_REPLY_TO;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { console.error('[resend] falha', r.status, await r.text().catch(() => '')); return { ok: false, erro: `resend_${r.status}` }; }
    return { ok: true };
  } catch (e) {
    console.error('[resend] exceção de rede', e);
    return { ok: false, erro: 'resend_rede' };
  }
}

// IP do cliente (edge do Supabase põe x-forwarded-for). Validado p/ inet.
function clientIp(req: Request): string | null {
  const xff = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim();
  return ipValido(xff || req.headers.get('cf-connecting-ip') || '');
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('Origin'));
  const json: Json = (status, body) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { ok: false, erro: 'metodo' });

  // 1. corpo
  let body: any;
  try { body = await req.json(); } catch { return json(400, { ok: false, erro: 'json_invalido' }); }
  const { email, apelido, decisions, clientVersion, date: bodyDate,
          consent_ranking, consent_marketing, policy_version, confirm_overwrite, lang } = body ?? {};

  // 2. consentimento e campos (server-side; nunca confia no cliente)
  if (consent_ranking !== true) return json(400, { ok: false, erro: 'consent_necessario' });
  if (!policy_version || typeof policy_version !== 'string') return json(400, { ok: false, erro: 'policy_version_necessaria' });
  const eErro = validarEmail(email); if (eErro) return json(400, { ok: false, erro: eErro });
  const aErro = validarApelido(apelido); if (aErro) return json(400, { ok: false, erro: aErro });
  if (bodyDate !== undefined && (typeof bodyDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(bodyDate)))
    return json(400, { ok: false, erro: 'date_invalida' });

  const emailNorm = String(email).trim().toLowerCase();
  const ip = clientIp(req);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // 3. rate-limit por E-MAIL e por IP (lidos de env), incrementando em TENTATIVA
  //    (a RPC incrementa antes de decidir). Estouro → 429 explícito, nunca mudo.
  const baldes: [string, number][] = [[`submit:email:${emailNorm}`, RL_EMAIL]];
  if (ip) baldes.push([`submit:ip:${ip}`, RL_IP]);
  for (const [bucket, limite] of baldes) {
    const rl = await admin.rpc('check_rate_limit', { p_bucket: bucket, p_limit: limite, p_window: '1 hour' });
    if (rl.error) {
      if (String(rl.error.message).includes('rate_limit_exceeded') || rl.error.code === '54000')
        return json(429, { ok: false, erro: 'rate_limited' });
      console.error('[rate_limit] erro', rl.error); return json(500, { ok: false, erro: 'erro_interno' });
    }
  }

  // 4. desafio CORRENTE — o BANCO decide dia/seed (America/Sao_Paulo), nunca o cliente
  const { data: desafio } = await admin.from('current_daily').select('challenge_date, seed').maybeSingle();
  if (!desafio) return json(404, { ok: false, erro: 'seed_inexistente' });
  const date = desafio.challenge_date as string;
  if (bodyDate && bodyDate !== date) return json(409, { ok: false, erro: 'dia_virou' });

  // 5. re-simular + validar (src/replay.js, puro, intacto)
  let resultado: any;
  try {
    resultado = submeterReplay({ Engine, dados: DADOS, seed: desafio.seed, decisions, clientVersion, serverVersion: SERVER_VERSION });
  } catch { return json(500, { ok: false, erro: 'erro_interno' }); }
  if (!resultado.ok) return erroParaResposta(resultado, json);

  // 6. worse_than_ranked: lê o RANKED confirmado do e-mail nesse dia. NUNCA
  //    devolve o número (seria sonda de privacidade) — só o código.
  const { data: linha } = await admin.from('daily_submissions')
    .select('ranked_score').eq('email', emailNorm).eq('challenge_date', date).maybeSingle();
  const acao = decidirGravacao({
    novoScore: resultado.score, rankedScore: linha?.ranked_score ?? null,
    confirmOverwrite: confirm_overwrite === true,
  });
  if (acao === 'worse_than_ranked') return json(409, { ok: false, erro: 'worse_than_ranked' });

  // 7. grava PENDENTE via service_role. Um novo pending gera token novo, o que
  //    INVALIDA o token anterior (o hash muda). ranked_* NÃO é tocado.
  const token = gerarToken();
  const token_hash = await hashToken(token);
  const token_expires_at = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const { error: upErr } = await admin.from('daily_submissions').upsert({
    email: emailNorm, apelido: String(apelido).trim(), challenge_date: date,
    pending_score: resultado.score, pending_decisions: decisions,
    token_hash, token_expires_at,
    consent_ranking: true, consent_marketing: consent_marketing === true,
    consent_ip: ip, consent_at: new Date().toISOString(), policy_version,
  }, { onConflict: 'email,challenge_date' });
  if (upErr) { console.error('[submit] upsert', upErr); return json(500, { ok: false, erro: 'erro_interno' }); }

  // 8. e-mail transacional (duplo opt-in). Falha NÃO é silenciosa: 502 com código;
  //    o pending fica e um novo submit regenera token+e-mail.
  const link = `${CONFIRM_URL}?token=${token}`;
  const env = await enviarEmail(emailNorm, lang === 'es' ? 'es' : 'pt', link);
  if (!env.ok) return json(502, { ok: false, erro: 'email_falhou', detalhe: env.erro });

  // devolve o PRÓPRIO score que o jogador acabou de fazer (não é sonda) + pending.
  return json(200, { ok: true, pending: true, score: resultado.score });
});
