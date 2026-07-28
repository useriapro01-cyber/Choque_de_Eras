-- ============================================================================
-- 005 — Teto de tamanho do e-mail em profiles (TDMV-5 Fase D-campos)
-- ============================================================================
-- profiles.email era `text` SEM limite — um campo sem teto aceita payload
-- absurdo e vira porta de abuso. Padronizamos em 254 (RFC 5321, tamanho máximo
-- de um endereço), o MESMO número do input e da validação do cliente. Assim o
-- limite é o mesmo na pilha inteira (front + banco) — mexer só no front não
-- bastava para fechar o vetor no banco.
--
-- NULL continua permitido (e-mail é opcional em profiles; o principal vive em
-- auth.users). O CHECK só morde quando há valor.
-- ============================================================================

alter table public.profiles
  add constraint email_tamanho check (email is null or char_length(email) <= 254);
