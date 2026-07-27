-- ============================================================================
-- 004 — Publicação AUTOMÁTICA do Desafio do Dia (pg_cron)
-- ============================================================================
-- O desafio do dia passa a ser publicado por agendamento, não à mão. O "dia" é
-- America/Sao_Paulo (invariante do fuso). pg_cron agenda em UTC; o Brasil não
-- tem horário de verão desde 2019, então America/Sao_Paulo é UTC-3 o ano todo
-- e 03:00 UTC == 00:00 de Brasília de forma estável (sem salto de DST).
-- ============================================================================

create extension if not exists pg_cron;

-- Garante o desafio do dia CORRENTE (America/Sao_Paulo). Idempotente: se a linha
-- do dia já existe, não faz nada (on conflict do nothing) — nunca troca a seed
-- de um dia já publicado. A seed é aleatória (não previsível na véspera): impede
-- treinar o desafio de amanhã antes de ele abrir.
create or replace function public.ensure_daily_challenge()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.daily_challenges (date, seed)
  values (
    (now() at time zone 'America/Sao_Paulo')::date,
    'dia-' || ((now() at time zone 'America/Sao_Paulo')::date)::text
      || '-' || substr(md5(gen_random_uuid()::text), 1, 10)
  )
  on conflict (date) do nothing;
$$;

-- Job primário: publica o desafio à meia-noite de Brasília (03:00 UTC).
select cron.schedule(
  'publicar-desafio-do-dia',
  '0 3 * * *',
  $$select public.ensure_daily_challenge();$$
);

-- Rede de segurança: de hora em hora garante que o dia corrente existe, cobrindo
-- cron falho ou projeto pausado sobre a janela das 03:00 UTC. Idempotente e
-- barato (no-op quando o dia já foi publicado).
select cron.schedule(
  'garantir-desafio-corrente',
  '0 * * * *',
  $$select public.ensure_daily_challenge();$$
);

-- Publica já o desafio de hoje (não espera o primeiro tick do cron).
select public.ensure_daily_challenge();
