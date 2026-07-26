-- ============================================================================
-- Choque de Eras — TDMV-5 Fase D — endurecimento de RLS para acesso anônimo
-- ============================================================================
-- Escada freemium: o anônimo (signInAnonymously) JOGA a Campanha Livre e o
-- Desafio do Dia e VÊ o ranking (view daily_ranking é leitura pública), mas
-- NÃO cria perfil nem pontua. O muro fica no ranking, não na porta.
--
-- is_anonymous é claim do JWT do GoTrue: 'true' p/ anônimo; ausente/'false' p/
-- permanente. Ele vira 'false' só depois do OTP confirmar o e-mail — então
-- exigir não-anônimo aqui é, na prática, exigir e-mail CONFIRMADO (elegibilidade).
--
-- Defesa em profundidade: a gravação da pontuação (daily_entries) já é exclusiva
-- da service_role, e a Edge Function submit-daily rejeita anônimo com
-- 403 email_necessario. Esta migration fecha também o caminho de perfil.
-- SQL PURO, sem chaves/segredos. Idempotente (drop policy if exists).
-- ============================================================================

-- profiles: só usuário PERMANENTE (não-anônimo) cria/edita o próprio perfil.
-- Sem isto, um anônimo poderia criar um profiles.id = seu uid e, com um perfil,
-- passar pelo check "perfil existe" da Edge Function.
drop policy if exists "perfil: criar o próprio" on public.profiles;
create policy "perfil: criar o próprio (não-anônimo)"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists "perfil: editar o próprio" on public.profiles;
create policy "perfil: editar o próprio (não-anônimo)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- (as policies de SELECT/DELETE do 001 seguem: cada um lê/apaga só o próprio.
--  Um anônimo consegue no máximo LER um perfil próprio que não existe — inócuo.)
