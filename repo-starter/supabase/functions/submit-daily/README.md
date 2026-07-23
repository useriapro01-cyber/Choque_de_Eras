# Edge Function `submit-daily` — replay anti-fraude (TDMV-5 Fase C)

Recebe a lista de decisões do Desafio do Dia, **re-simula server-side** com a
seed oficial e o motor compartilhado, e grava a pontuação **calculada aqui**
(nunca a do cliente). É o pré-requisito de qualquer prêmio (plano §7.3).

## Fronteira de confiança
- `profile_id` = `auth.getUser()` do JWT — **nunca** vem do corpo.
- `seed` = `daily_challenges[date]` — **nunca** vem do cliente.
- `score` = recalculado por `src/replay.js` — o cliente não envia score.
- `SUPABASE_SERVICE_ROLE_KEY` = `Deno.env` (injetada pelo runtime) — **nunca**
  hardcoded/commitada. Não é preciso configurar secret manual para esta função.

A lógica de legalidade + replay + versão é pura e vive em `src/replay.js`,
provada por `tests/replay-antifraude.test.mjs` (roda no `npm test`, sem Deno).

## Contrato
`POST` com `Authorization: Bearer <jwt>` e corpo:
```json
{ "date": "2026-07-22", "clientVersion": "<BUILD_VERSION>", "decisions": [ ... ] }
```
Sem `lang`: o nome do jogador é cosmético (RNG isolado, invariante #3), então o
score independe do idioma — o servidor re-simula com um pool fixo e o placar é
o mesmo para BR e AR.
Resposta feliz: `200 { ok, score, best }`. Erros: `401` sem auth · `403`
perfil inexistente · `404` sem desafio no dia · `409` versão desatualizada
(recarregar página) · `422` decisão ilegal/rejeitada/campanha incompleta ·
`429` rate limit · `400` corpo malformado.

## Artefatos gerados pelo build (NÃO editar à mão, git-ignored)
`npm run build` emite, nesta pasta:
- `_dados.json` — mesma fonte de dados do bundle (motor re-simula sobre ela);
- `_versao.json` — versão autoritativa do servidor (comparada com a
  `BUILD_VERSION` que o cliente envia).

## Deploy (manual via CLI — a integração automática não alcança a org nova)
```bash
npm run build                       # regenera _dados.json / _versao.json
supabase login                      # uma vez
supabase link --project-ref <ref>   # <ref> do painel (não é segredo)
supabase functions deploy submit-daily
```
> Rode sempre `npm run build` **antes** do deploy, senão `_dados/_versao`
> ficam defasados do bundle publicado e o servidor rejeitará jogadores por
> versão. O teste de paridade garante motor-no-dist == motor-standalone.

## Pendente para depois (fora do escopo da Fase C)
- Publicar o desafio do dia em `daily_challenges` (job/rotina) — sem isso todo
  POST responde `404 seed_inexistente`.
- Wiring do cliente (`src/app.js`) para autenticar e enviar as decisões +
  `BUILD_VERSION` + `lang`.
- Endurecer o "melhor score" com um `upsert_daily_best` (SECURITY DEFINER),
  eliminando a corrida read-then-write.

> Justiça PT/ES do ranking: **resolvida** no motor (jul/2026) — o nome saiu para
> um RNG cosmético isolado, então mesma seed = mesmo XI e mesmo score em BR e AR,
> sem canonizar idioma. Coberto por `tests/paridade.test.mjs` (NEUTRO DE IDIOMA).
