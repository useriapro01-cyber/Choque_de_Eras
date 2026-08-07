-- ============================================================================
-- Choque de Eras — Reconstrução do ranking SEM Auth — PR1: fundação de dados
-- ============================================================================
-- Troca a identidade-via-Auth (profiles/daily_entries atrelados a auth.users)
-- por IDENTIDADE = E-MAIL + token de confirmação (duplo opt-in). O ANTI-FRAUDE
-- NÃO muda: continua sendo o REPLAY server-side — a service_role só grava o
-- score depois de re-simular a campanha com a seed OFICIAL do dia. Aqui só
-- entram a tabela, a view pública e a higiene (GC). O envio de e-mail, o replay
-- e o rate-limit do endpoint ABERTO são do PR2; a confirmação por token é do PR3.
--
-- NUMERAÇÃO: a 006 é o pending_runs (PR #10, não mergeado mas aplicado no banco).
-- Para não colidir tracking (lição REGISTRADO≠APLICADO), esta é a 007. O
-- pending_runs morre na reconstrução; a limpeza do tracking da 006 é à parte.
--
-- SQL PURO — sem chaves, URLs de projeto nem segredos.
-- ============================================================================


-- ============================================================================
-- daily_submissions — a submissão do Desafio do Dia por E-MAIL (sem conta)
--   CORAÇÃO DO ANTI-FRAUDE: escrita EXCLUSIVA da service_role (após o replay).
-- ============================================================================
create table public.daily_submissions (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  apelido           text not null,
  challenge_date    date not null references public.daily_challenges (date) on delete cascade,

  -- RANQUEADO: a entrada CONFIRMADA que aparece no ranking. Fica intacta enquanto
  -- uma nova submissão aguarda confirmação — rejogar não te tira do ranking até o
  -- novo score confirmar. ranked_decisions é a TRILHA DE AUDITORIA: permite
  -- re-simular (replay) QUALQUER score do ranking a qualquer momento — o DNA
  -- anti-fraude. Custo medido: ~600 bytes/campanha (máx ~950), jsonb é TOASTado.
  ranked_score      integer,
  ranked_decisions  jsonb,
  confirmed_at      timestamptz,

  -- PENDENTE: a submissão em trânsito, aguardando o clique no link. Promovida a
  -- ranked_* na confirmação (PR3) e então ZERADA. Transiente por natureza — o GC
  -- abaixo remove/limpa pendências vencidas.
  pending_score     integer,
  pending_decisions jsonb,
  token_hash        text,                          -- SHA-256 do token (NUNCA o token cru)
  token_expires_at  timestamptz,

  -- CONSENTIMENTO (LGPD): granular e SEPARADO. consent_ranking é a base para
  -- pontuar (transacional — o próprio e-mail de confirmação); consent_marketing é
  -- OPCIONAL (uso do e-mail como lead). consent_ip/at/policy_version = prova do
  -- duplo opt-in (quando/de onde/sob qual versão da política consentiu).
  consent_ranking   boolean not null default false,
  consent_marketing boolean not null default false,
  consent_ip        inet,
  consent_at        timestamptz,
  policy_version    text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- UMA submissão por e-mail por dia; rejogar faz UPSERT (sobrescreve o pendente).
  constraint uma_submissao_por_email_por_dia unique (email, challenge_date),
  constraint apelido_tamanho check (char_length(apelido) between 2 and 20),
  constraint email_tamanho   check (char_length(email) <= 254)   -- RFC 5321 (mesmo teto do input)
);

-- Ranking: só linhas CONFIRMADAS, por dia + score desc (índice parcial enxuto).
create index daily_submissions_ranking_idx
  on public.daily_submissions (challenge_date, ranked_score desc)
  where ranked_score is not null;
-- Confirmação (PR3) busca por token; o GC busca por expiração.
create index daily_submissions_token_idx  on public.daily_submissions (token_hash)       where token_hash is not null;
create index daily_submissions_expira_idx on public.daily_submissions (token_expires_at) where token_expires_at is not null;

comment on table public.daily_submissions is
  'Submissões do Desafio do Dia por E-MAIL (sem Auth). Escrita SÓ pela service_role, após re-simular o replay. O cliente nunca lê/escreve aqui: o ranking sai pela view daily_ranking_v2 (apelido+score, NUNCA e-mail).';

alter table public.daily_submissions enable row level security;
-- COFRE: NENHUMA policy para anon/authenticated => todo insert/update/delete/select
-- do cliente é bloqueado. Só a service_role (ignora RLS) grava, e só depois de
-- re-simular a campanha com a seed e conferir o score. É o que impede placar forjado.
revoke all on public.daily_submissions from anon, authenticated;

-- updated_at automático em qualquer UPDATE.
create or replace function public.tg_daily_submissions_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger daily_submissions_touch
  before update on public.daily_submissions
  for each row execute function public.tg_daily_submissions_touch();


-- ============================================================================
-- daily_ranking_v2 — a ÚNICA janela pública do placar (mesmo modelo da
--   daily_ranking: a view (dona = postgres) lê a tabela ignorando o RLS dela,
--   mas expõe SÓ apelido + score + posição. NUNCA e-mail, decisions, token ou
--   consentimento. Só linhas CONFIRMADAS (ranked_score not null). O cliente
--   filtra por challenge_date (dia corrente ou histórico).
-- ============================================================================
create view public.daily_ranking_v2
  -- DEFINER (explícito): o anon lê via o DONO da view (postgres), ignorando o RLS
  -- da tabela base — é o que deixa o ranking POPULADO. Se fosse security_invoker=
  -- true, o anon herdaria o `revoke all`+RLS da daily_submissions e o ranking
  -- voltaria VAZIO em silêncio. Explícito p/ blindar contra mudança de default.
  with (security_invoker = false)
  as
  select
    challenge_date,
    apelido,
    ranked_score as score,
    rank() over (partition by challenge_date order by ranked_score desc) as posicao
  from public.daily_submissions
  where ranked_score is not null;

comment on view public.daily_ranking_v2 is
  'Ranking público (identidade por e-mail). Expõe apenas apelido, score e posição — NUNCA e-mail, decisions, token ou consentimento. É a única leitura pública de daily_submissions.';

grant select on public.daily_ranking_v2 to anon, authenticated;


-- ============================================================================
-- GC de pendências — higiene e anti-lixo do endpoint ABERTO (PR2). Remove
-- pendências órfãs (expiradas e NUNCA confirmadas) e limpa o pendente vencido
-- de linhas já confirmadas (preservando o ranked_*). pg_cron já habilitado (004).
-- ============================================================================
create or replace function public.gc_daily_submissions()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- 1) linha só-pendente, nunca confirmada e já expirada => remove a linha inteira
  delete from public.daily_submissions
   where ranked_score is null
     and token_expires_at is not null
     and token_expires_at < now();
  -- 2) linha já confirmada com pendente vencido => limpa só o pendente (mantém o ranked)
  update public.daily_submissions
     set pending_score = null, pending_decisions = null,
         token_hash = null, token_expires_at = null
   where ranked_score is not null
     and token_expires_at is not null
     and token_expires_at < now();
end;
$$;

revoke all on function public.gc_daily_submissions() from public, anon, authenticated;
grant execute on function public.gc_daily_submissions() to service_role;

-- Agenda horária (idempotente: cron.schedule com mesmo jobname atualiza o job).
select cron.schedule('gc-daily-submissions', '7 * * * *', $$select public.gc_daily_submissions();$$);
