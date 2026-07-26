-- ============================================================================
-- 003 — O DIA do Desafio é definido em America/Sao_Paulo (TDMV-5)
-- ============================================================================
-- INVARIANTE: o "dia" do Desafio do Dia vira à meia-noite de Brasília
-- (America/Sao_Paulo, UTC-3), NUNCA em UTC nem no relógio do cliente. O público
-- é BR/AR/UY — todos em UTC-3. O servidor Supabase roda em UTC, então `now()`
-- e `current_date` referem-se a UTC: usá-los faria o desafio virar 3h cedo.
--
-- Esta migration cria a fonte ÚNICA de "que dia é hoje": a view current_daily.
-- • O cliente lê current_daily (sem informar data) para saber a seed do dia.
-- • A Edge Function lê current_daily (service_role) para decidir o dia oficial.
-- Assim ninguém — cliente ou aparelho com data errada — dita qual é o desafio.
-- ============================================================================

-- Desafio CORRENTE segundo o relógio de Brasília. A cláusula é reavaliada a
-- cada consulta (now() é volátil), então a view "vira" sozinha à meia-noite SP.
create or replace view public.current_daily as
  select date as challenge_date, seed, sponsor
  from public.daily_challenges
  where date = (now() at time zone 'America/Sao_Paulo')::date;

comment on view public.current_daily is
  'Desafio CORRENTE. O dia é definido em America/Sao_Paulo (nunca UTC, nunca relógio do cliente). Fonte única de "que dia é hoje" para o cliente e para a Edge Function submit-daily.';

grant select on public.current_daily to anon, authenticated, service_role;
