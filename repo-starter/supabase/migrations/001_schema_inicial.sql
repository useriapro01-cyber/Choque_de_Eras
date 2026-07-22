-- ============================================================================
-- Choque de Eras — TDMV-5 Fase B — schema inicial do backend de ranking
-- ============================================================================
-- SQL PURO. Não contém chaves, URLs de projeto nem segredos.
--
-- Modelo de segurança (resumo):
--  * Tudo com RLS habilitado.
--  * `service_role` (usado só pelo servidor/edge, nunca exposto ao cliente)
--    ignora RLS e faz o trabalho privilegiado: publicar o desafio do dia e
--    GRAVAR as pontuações DEPOIS de re-simular o replay.
--  * `anon`/`authenticated` (chave pública, roda no browser) só conseguem o
--    mínimo: ler o desafio do dia, ler o ranking (via view), gerir o próprio
--    perfil e ENVIAR (insert) reports de era.
--  * A pontuação nunca é calculada no cliente: `daily_entries.server_score`
--    só entra pela service_role, então ninguém forja placar (anti-fraude).
--
-- Supabase (Postgres 15): gen_random_uuid() e auth.uid() já existem.
-- ============================================================================


-- ============================================================================
-- 1) profiles — identidade mínima do jogador (LGPD: coleta enxuta)
--    id casa com auth.users(id): é o que permite "cada um edita só o seu".
-- ============================================================================
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  apelido        text not null,
  email          text,                       -- opcional (auth.users já guarda o principal)
  clube_coracao  text,
  created_at     timestamptz not null default now(),
  constraint apelido_tamanho check (char_length(apelido) between 2 and 20)
);

-- apelido único, sem diferenciar maiúsculas ("Torcedor" == "torcedor")
create unique index profiles_apelido_unico on public.profiles (lower(apelido));

comment on table public.profiles is 'Perfil do jogador; id = auth.users.id. RLS: cada um só mexe no próprio.';

alter table public.profiles enable row level security;

-- Protege: um usuário só LÊ/CRIA/EDITA/APAGA o próprio perfil (auth.uid() = id).
-- Sem isso, um usuário poderia ler e-mails/editar apelidos de terceiros.
create policy "perfil: ler o próprio"     on public.profiles for select using  (auth.uid() = id);
create policy "perfil: criar o próprio"   on public.profiles for insert with check (auth.uid() = id);
create policy "perfil: editar o próprio"  on public.profiles for update using  (auth.uid() = id) with check (auth.uid() = id);
create policy "perfil: apagar o próprio"  on public.profiles for delete using  (auth.uid() = id);

-- Privilégios de tabela: só usuário logado gere perfil; anônimo não toca.
revoke all on public.profiles from anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;


-- ============================================================================
-- 2) daily_challenges — o Desafio do Dia (mesma seed para todo mundo)
--    Publicado pelo servidor (service_role). O cliente só LÊ a seed do dia.
-- ============================================================================
create table public.daily_challenges (
  date        date primary key,              -- um desafio por dia
  seed        text not null,                 -- semeia a campanha; igual para todos
  sponsor     text,                          -- "apresentado por [marca]" (opcional)
  created_at  timestamptz not null default now()
);

comment on table public.daily_challenges is 'Desafio do dia. Leitura pública; escrita só via service_role.';

alter table public.daily_challenges enable row level security;

-- Protege: qualquer um LÊ o desafio (precisa da seed para jogar), mas
-- NINGUÉM (anon/authenticated) cria/edita — só a service_role, que não tem
-- policy e portanto ignora o RLS. Impede trocar a seed/patrocínio do dia.
create policy "desafio: leitura pública" on public.daily_challenges for select using (true);

revoke all on public.daily_challenges from anon, authenticated;
grant select on public.daily_challenges to anon, authenticated;


-- ============================================================================
-- 3) daily_entries — a submissão do jogador (decisões) + placar do servidor
--    CORAÇÃO DO ANTI-FRAUDE: escrita EXCLUSIVA da service_role.
-- ============================================================================
create table public.daily_entries (
  id              uuid primary key default gen_random_uuid(),
  challenge_date  date not null references public.daily_challenges (date) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  decisions       jsonb not null,            -- lista de decisões; o servidor re-simula
  server_score    integer not null,          -- placar calculado NO SERVIDOR (nunca no cliente)
  created_at      timestamptz not null default now(),
  -- "uma única posição por usuário" por dia: o servidor faz upsert com o melhor score
  constraint uma_entrada_por_dia unique (challenge_date, profile_id)
);

create index daily_entries_ranking_idx on public.daily_entries (challenge_date, server_score desc);
create index daily_entries_profile_idx on public.daily_entries (profile_id);

comment on table public.daily_entries is
  'Submissões do Desafio do Dia. Escrita SÓ pela service_role, após re-simular o replay. O cliente nunca insere nem lê aqui direto (ranking sai pela view daily_ranking).';

alter table public.daily_entries enable row level security;

-- Protege: NENHUMA policy para anon/authenticated => qualquer INSERT/UPDATE/
-- DELETE/SELECT do cliente é BLOQUEADO. Só a service_role (que ignora RLS)
-- grava, e só depois de re-simular a campanha com a seed e conferir o score.
-- É isto que impede placar falsificado por F12/replay adulterado.
-- (Sem policies + revoke explícito abaixo = cofre fechado para o cliente.)
revoke all on public.daily_entries from anon, authenticated;


-- ============================================================================
-- 4) era_reports — "🚩 reportar erro nesta era" (QA da comunidade)
--    Insert PÚBLICO, mas sem update/delete público e sem auto-validação.
-- ============================================================================
create table public.era_reports (
  id               uuid primary key default gen_random_uuid(),
  clube            text not null,
  ano              smallint not null check (ano between 1900 and 2100),
  descricao        text not null check (char_length(descricao) between 3 and 1000),
  reporter_apelido text,                       -- opcional (report pode ser anônimo)
  status           text not null default 'pendente'
                     check (status in ('pendente','validado','rejeitado','duplicado')),
  created_at       timestamptz not null default now()
);

create index era_reports_status_idx on public.era_reports (status);
create index era_reports_era_idx    on public.era_reports (clube, ano);

comment on table public.era_reports is
  'Reports de erro em eras. Insert público (status forçado a pendente); triagem/edição só via service_role.';

alter table public.era_reports enable row level security;

-- Protege: qualquer um ENVIA um report, mas o WITH CHECK obriga status
-- 'pendente' — ninguém insere um report já "validado" para burlar a curadoria.
create policy "report: insert público (sempre pendente)"
  on public.era_reports for insert with check (status = 'pendente');

-- Sem policy de SELECT/UPDATE/DELETE para o público => a fila de reports e a
-- mudança de status (validar/rejeitar) ficam restritas à service_role (triagem).
-- Isso evita que alguém liste/edite/apague reports alheios.
revoke all on public.era_reports from anon, authenticated;
grant insert on public.era_reports to anon, authenticated;


-- ============================================================================
-- 5) rate_limit — janela fixa (fixed-window) para conter abuso
--    Estratégia: contador (bucket, janela) incrementado atomicamente por uma
--    função SECURITY DEFINER; um trigger no insert público de era_reports a
--    aciona. A tabela é um cofre: só a função (dona = postgres) escreve nela.
--    Obs.: o limite fino por IP fica na borda (edge function/API); aqui é a
--    barreira no banco para o caminho de insert público.
-- ============================================================================
create table public.rate_limit (
  bucket        text not null,               -- ex.: 'era_report:'||apelido
  window_start  timestamptz not null,        -- início da janela fixa
  count         integer not null default 0,
  primary key (bucket, window_start)
);

comment on table public.rate_limit is 'Contador de rate limit (janela fixa). Escrita só via check_rate_limit() (SECURITY DEFINER).';

alter table public.rate_limit enable row level security;
-- Cofre fechado: nem anon nem authenticated leem/escrevem direto.
revoke all on public.rate_limit from anon, authenticated;

-- Incrementa o contador da janela atual e estoura erro se passar do limite.
-- SECURITY DEFINER: roda como o dono (postgres), então consegue gravar em
-- rate_limit mesmo sendo chamada dentro de um insert feito pela role anon.
create or replace function public.check_rate_limit(p_bucket text, p_limit integer, p_window interval)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_secs   double precision := extract(epoch from p_window);
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / v_secs) * v_secs);
  v_count  integer;
begin
  insert into public.rate_limit (bucket, window_start, count)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update set count = public.rate_limit.count + 1
  returning count into v_count;

  if v_count > p_limit then
    raise exception 'rate_limit_exceeded: % (limite % por %)', p_bucket, p_limit, p_window
      using errcode = '54000';
  end if;
end;
$$;

-- A função não é exposta ao cliente (evita alguém esgotar a cota alheia
-- chamando-a direto). Só a service_role e triggers definer (donos = postgres).
revoke all on function public.check_rate_limit(text, integer, interval) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, interval) to service_role;

-- Trigger no insert público de era_reports: máx. 5 reports / 10 min por apelido
-- (ou 'anon' quando sem apelido). SECURITY DEFINER para poder chamar a função
-- e gravar no cofre mesmo o insert vindo da role anon.
create or replace function public.tg_era_reports_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.check_rate_limit('era_report:' || coalesce(new.reporter_apelido, 'anon'), 5, interval '10 minutes');
  return new;
end;
$$;

create trigger era_reports_rate_limit
  before insert on public.era_reports
  for each row execute function public.tg_era_reports_rate_limit();


-- ============================================================================
-- 6) daily_ranking — a ÚNICA janela pública para o placar
--    View SECURITY DEFINER (dona = postgres): lê daily_entries+profiles
--    ignorando o RLS delas, mas expõe SÓ apelido + score + posição.
--    O cliente não tem acesso às tabelas-base; só a esta view.
-- ============================================================================
create view public.daily_ranking as
  select
    e.challenge_date,
    p.apelido,
    e.server_score as score,
    rank() over (partition by e.challenge_date order by e.server_score desc) as posicao
  from public.daily_entries e
  join public.profiles p on p.id = e.profile_id;

comment on view public.daily_ranking is
  'Ranking público do Desafio do Dia. Expõe apenas apelido, score e posição — nunca decisions nem profile_id/e-mail. É a única leitura pública de daily_entries.';

-- Leitura pública só da view (as tabelas-base seguem trancadas pelo RLS acima).
grant select on public.daily_ranking to anon, authenticated;
