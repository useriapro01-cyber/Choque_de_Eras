-- ============================================================================
-- Choque de Eras — TDMV-5 Fase E — pending_runs (run pendente sobrevive à origem)
-- ============================================================================
-- PROBLEMA: a submissão pendente vivia SÓ em localStorage, que é por ORIGEM e por
-- NAVEGADOR. O usuário joga no celular, pede o link de e-mail e ABRE o e-mail no
-- app (Gmail/Mail), que usa uma WEBVIEW própria (storage separado). A pendência
-- fica órfã do outro lado da fronteira, o submit nunca roda e a run some do
-- ranking. É o caminho NORMAL de um usuário de celular, não um caso de borda.
--
-- CURA: guardar a run no SERVIDOR, atrelada ao user_id. A sessão anônima é a MESMA
-- que vira permanente no vínculo (updateUser preserva o uid), então a run viaja
-- com o USUÁRIO, não com o navegador. Na volta do link — em QUALQUER contexto,
-- inclusive o webview — a sessão é reconstruída pelos tokens do hash (não pelo
-- localStorage), o cliente lê a própria pending_run pelo uid e submete.
--
-- FRONTEIRA ANTI-FRAUDE: pending_runs é um "clipboard durável" NÃO CONFIÁVEL.
-- Guardar não é confiar: submit-daily continua re-simulando com a seed OFICIAL e
-- recalculando o server_score. Adulterar a própria linha rende o score honesto ou
-- a rejeição — mesma fronteira de sempre. daily_entries (a tabela ranqueada) fica
-- INTOCADA; pending_runs é só a entrada durável a montante.
--
-- Escopo mínimo aprovado: cobre o caso COMUM (e-mail novo → upgrade do mesmo uid).
-- "login em conta existente" (uid diferente) deixa a run órfã sob o anônimo (o
-- piso de UI avisa) — o "claim token" para transferir run entre uids fica no
-- backlog (TDMV-5 Fase E+).
--
-- SQL PURO, sem chaves/segredos. Idempotente (drop ... if exists).
--
-- APLICAÇÃO (regra do CLAUDE.md — "REGISTRADO ≠ APLICADO"): ao aplicar por SQL
-- Editor / Management API fora do `db push`, rode em seguida
--   supabase migration repair --status applied 006
-- e CONFIRA O OBJETO (não a linha de tracking) com o bloco de verificação no fim.
-- ============================================================================

-- ============================================================================
-- 1) pending_runs — rascunho da run do Desafio, à espera do e-mail confirmar
--    PK = user_id  ⇒  no máximo UMA pending_run por usuário (só o dia corrente
--    interessa). Refazer/jogar outro dia = upsert que SUBSTITUI. Isso limita o
--    tamanho da tabela a O(usuários) e evita acúmulo por usuário.
-- ============================================================================
create table if not exists public.pending_runs (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  challenge_date  date not null,
  decisions       jsonb not null,
  client_version  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- decisions tem que ser uma LISTA; teto anti-bloat (medido: run real < 1 KB;
  -- 1000 decisões / 16 KB é folga enorme sobre o legítimo — barra só abuso).
  constraint pending_decisions_e_lista check (jsonb_typeof(decisions) = 'array'),
  constraint pending_decisions_tamanho check (
    jsonb_array_length(decisions) <= 1000 and pg_column_size(decisions) <= 16384
  )
);

comment on table public.pending_runs is
  'Rascunho NÃO CONFIÁVEL da run do Desafio, por usuário (PK=user_id), à espera do e-mail confirmar. Sobrevive a troca de origem/navegador/webview porque viaja com o uid. submit-daily re-simula do zero: guardar aqui não é confiar. Limpa por: delete pós-promoção (service_role), upsert de novo dia e cron diário.';

-- ============================================================================
-- 2) RLS — dono-only. DIFERENTE de profiles: aqui o ANÔNIMO PODE gravar o próprio
--    rascunho (é ele que, ao virar permanente, promove a run). Por isso NÃO há
--    filtro is_anonymous — só a igualdade auth.uid() = user_id.
-- ============================================================================
alter table public.pending_runs enable row level security;

drop policy if exists "pending: dono lê a própria"     on public.pending_runs;
drop policy if exists "pending: dono insere a própria" on public.pending_runs;
drop policy if exists "pending: dono atualiza a própria" on public.pending_runs;
drop policy if exists "pending: dono apaga a própria"  on public.pending_runs;

create policy "pending: dono lê a própria"
  on public.pending_runs for select
  using (auth.uid() = user_id);

create policy "pending: dono insere a própria"
  on public.pending_runs for insert
  with check (auth.uid() = user_id);

create policy "pending: dono atualiza a própria"
  on public.pending_runs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "pending: dono apaga a própria"
  on public.pending_runs for delete
  using (auth.uid() = user_id);

-- Usuários logados (inclusive anônimos — no Supabase, sign-in anônimo usa o papel
-- `authenticated` com claim is_anonymous=true) operam sob RLS. `anon` (SEM login,
-- sem uid) nunca deve tocar a tabela.
grant select, insert, update, delete on public.pending_runs to authenticated;
revoke all on public.pending_runs from anon;

-- ============================================================================
-- 3) Limpeza periódica — o rascunho só interessa NO SEU dia. Apaga o que já
--    venceu (dia < hoje em America/Sao_Paulo). Complementa o delete pós-promoção
--    (service_role, na Edge Function) e o upsert que substitui ao jogar novo dia.
--    SECURITY DEFINER: roda como dono da função (ignora RLS), como o cron exige.
-- ============================================================================
create or replace function public.limpar_pending_runs_vencidas()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.pending_runs
  where challenge_date < (now() at time zone 'America/Sao_Paulo')::date;
$$;

comment on function public.limpar_pending_runs_vencidas is
  'Apaga pending_runs de dias já vencidos (America/Sao_Paulo). Pendurada no pg_cron (03:30 UTC, logo após a virada das 03:00). Barata: delete indexado, O(linhas).';

-- 03:30 UTC = 00:30 de Brasília: roda logo depois de o dia virar (003/004).
select cron.schedule(
  'limpar-pending-runs-vencidas',
  '30 3 * * *',
  $$select public.limpar_pending_runs_vencidas();$$
);

-- limpa já o que estiver vencido agora (não espera o primeiro tick do cron).
select public.limpar_pending_runs_vencidas();

-- ============================================================================
-- VERIFICAÇÃO DE RLS — RODE MANUALMENTE no SQL Editor (não faz parte do DDL).
-- Prova, no BANCO, que o dono lê/escreve só a PRÓPRIA linha e um anônimo NÃO
-- toca a linha alheia. Regra do CLAUDE.md: "REGISTRADO ≠ APLICADO" — confira o
-- OBJETO. Use DOIS uids REAIS de auth.users (ex.: dois anônimos existentes).
-- Substitua <UID_A> e <UID_B> e rode bloco a bloco.
-- ----------------------------------------------------------------------------
-- -- 0) objeto existe + policies presentes (esperado: 4 policies, rowsecurity=t)
-- select relrowsecurity from pg_class where oid = 'public.pending_runs'::regclass;      -- t
-- select count(*) from pg_policies where tablename = 'pending_runs';                     -- 4
--
-- -- 1) como A: inserir a PRÓPRIA linha (deve FUNCIONAR)
-- set local role authenticated;
-- select set_config('request.jwt.claims', json_build_object('sub','<UID_A>','role','authenticated')::text, true);
-- insert into public.pending_runs(user_id, challenge_date, decisions)
--   values ('<UID_A>', current_date, '[]'::jsonb);                                       -- OK
--
-- -- 2) como A: LER a linha de B (deve voltar 0 linhas — RLS esconde)
-- select set_config('request.jwt.claims', json_build_object('sub','<UID_B>','role','authenticated')::text, true);
-- insert into public.pending_runs(user_id, challenge_date, decisions)
--   values ('<UID_B>', current_date, '[]'::jsonb);                                       -- OK (B insere a própria)
-- select set_config('request.jwt.claims', json_build_object('sub','<UID_A>','role','authenticated')::text, true);
-- select count(*) from public.pending_runs where user_id = '<UID_B>';                    -- 0 (A não vê a de B)
--
-- -- 3) como A: INSERIR/ATUALIZAR/APAGAR linha de B (deve FALHAR ou afetar 0)
-- insert into public.pending_runs(user_id, challenge_date, decisions)
--   values ('<UID_B>', current_date, '[]'::jsonb);                                       -- ERRO: violates RLS (with check)
-- update public.pending_runs set client_version='x' where user_id = '<UID_B>';           -- 0 linhas
-- delete from public.pending_runs where user_id = '<UID_B>';                             -- 0 linhas
--
-- -- 4) limpeza do teste
-- reset role;
-- delete from public.pending_runs where user_id in ('<UID_A>','<UID_B>');
-- ============================================================================
