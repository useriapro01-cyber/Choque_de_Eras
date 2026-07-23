// ============================================================================
// Edge Function: submit-daily — TDMV-5 Fase C (replay anti-fraude)
// ============================================================================
// WRAPPER FINO de I/O. Toda a lógica de anti-fraude vive em src/replay.js
// (puro, testado no Node por tests/replay-antifraude.test.mjs). Aqui só há a
// fronteira: autenticar, buscar a seed OFICIAL, re-simular, gravar privilegiado.
//
// Fronteira de confiança:
//   • profile_id vem SEMPRE do JWT verificado (auth.getUser), NUNCA do corpo.
//   • seed vem SEMPRE do banco (daily_challenges), NUNCA do cliente.
//   • score é SEMPRE recalculado aqui; o cliente não envia score.
//   • service_role (Deno.env, injetada pelo runtime) só grava DEPOIS do replay.
//
// Segredos: SUPABASE_SERVICE_ROLE_KEY é injetada automaticamente pelo runtime
// do Supabase. NUNCA hardcoded, NUNCA commitada, NUNCA enviada ao cliente.
// ============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as Engine from '../../../src/engine.js';
import { submeterReplay } from '../../../src/replay.js';
import bruto from './_dados.json' with { type: 'json' };
import versaoDoc from './_versao.json' with { type: 'json' };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // injetada pelo runtime
const SERVER_VERSION = versaoDoc.version;

const LIMITE_POR_HORA = 30; // teto de submissões por perfil/hora (barreira de borda)

// O nome do jogador é COSMÉTICO e sai de um RNG isolado (invariante #3): o idioma
// NÃO afeta o score. Logo o servidor re-simula com um pool fixo ('pt') e o placar
// é idêntico ao de qualquer idioma — ranking único e justo para BR e AR.
const poolsIdioma = (nomes: any, lang: string) => ({
  base: nomes.base[lang], sobrenomes: nomes.sobrenomes[lang],
  clubeA: nomes.clube[lang].a, clubeB: nomes.clube[lang].b,
});
const DADOS = Engine.montarDados(bruto, poolsIdioma((bruto as any).nomes, 'pt'));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// erro do replay (src/replay.js) → status HTTP + mensagem estável ao cliente.
function erroParaResposta(r: any): Response {
  switch (r.erro) {
    case 'versao_desatualizada':
      return json(409, { ok: false, erro: r.erro, mensagem: 'Nova versão do jogo. Recarregue a página para enviar sua pontuação.' });
    case 'seed_forma':
    case 'decisoes_forma':
    case 'decisao_forma':
      return json(400, { ok: false, erro: r.erro, indice: r.indice });
    case 'decisao_fora_de_faixa':
    case 'decisao_apos_fim':
    case 'decisao_rejeitada':
    case 'campanha_incompleta':
      return json(422, { ok: false, erro: r.erro, indice: r.indice, tipo: r.tipo });
    default:
      return json(422, { ok: false, erro: r.erro ?? 'replay_invalido' });
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, erro: 'metodo' });

  // 1. corpo — nunca contém score, seed nem profile_id
  let body: any;
  try { body = await req.json(); } catch { return json(400, { ok: false, erro: 'json_invalido' }); }
  const { date, decisions, clientVersion } = body ?? {};
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(400, { ok: false, erro: 'date_invalida' });

  // 2. autenticação — profile_id := uid do JWT verificado (nunca do corpo)
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json(401, { ok: false, erro: 'unauthorized' });
  const profileId = userData.user.id;

  // cliente privilegiado (service_role): só para leitura de seed, rate limit e gravação
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // 3. perfil precisa existir
  const { data: perfil } = await admin.from('profiles').select('id').eq('id', profileId).maybeSingle();
  if (!perfil) return json(403, { ok: false, erro: 'profile_invalido' });

  // 4. rate limit (barreira de borda; reaproveita check_rate_limit do schema)
  const rl = await admin.rpc('check_rate_limit', {
    p_bucket: `daily_entry:${profileId}`, p_limit: LIMITE_POR_HORA, p_window: '1 hour',
  });
  if (rl.error) {
    if (String(rl.error.message).includes('rate_limit_exceeded') || rl.error.code === '54000')
      return json(429, { ok: false, erro: 'rate_limited' });
    return json(500, { ok: false, erro: 'erro_interno' });
  }

  // 5. seed OFICIAL do dia (nunca a do cliente)
  const { data: desafio } = await admin.from('daily_challenges').select('seed').eq('date', date).maybeSingle();
  if (!desafio) return json(404, { ok: false, erro: 'seed_inexistente' });

  // 6. re-simular + validar legalidade + versão (tudo em src/replay.js, puro)
  let resultado: any;
  try {
    resultado = submeterReplay({
      Engine, dados: DADOS, seed: desafio.seed, decisions,
      clientVersion, serverVersion: SERVER_VERSION,
    });
  } catch {
    return json(500, { ok: false, erro: 'erro_interno' }); // replay não deve lançar; se lançar, não vaza interno
  }
  if (!resultado.ok) return erroParaResposta(resultado);

  // 7. gravar via service_role — "vale a melhor pontuação" (upsert best)
  //    NOTA de robustez: read-then-write tem corrida sob submissões simultâneas
  //    do MESMO perfil; endurecer depois com um SECURITY DEFINER upsert_daily_best.
  const { data: atual } = await admin.from('daily_entries')
    .select('server_score').eq('challenge_date', date).eq('profile_id', profileId).maybeSingle();
  const melhor = atual ? Math.max(atual.server_score, resultado.score) : resultado.score;
  if (!atual || resultado.score > atual.server_score) {
    const { error: upErr } = await admin.from('daily_entries').upsert({
      challenge_date: date, profile_id: profileId, decisions, server_score: resultado.score,
    }, { onConflict: 'challenge_date,profile_id' });
    if (upErr) return json(500, { ok: false, erro: 'erro_interno' });
  }

  return json(200, { ok: true, score: resultado.score, best: melhor });
});
