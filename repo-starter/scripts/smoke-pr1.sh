#!/usr/bin/env bash
# ============================================================================
# smoke-pr1.sh — valida a fundação de dados do PR1 CONTRA O BANCO REMOTO.
# NÃO aplica migration nenhuma: só faz chamadas REST. Rode DEPOIS que a
# migration 007 estiver aplicada (você aplica; eu não toco em produção).
#
# Prova, com evidência, as duas invariantes que importam:
#   (2) daily_ranking_v2 devolve a linha ranqueada ao ANON, SEM e-mail.
#   (3) daily_submissions NÃO é legível pelo ANON (cofre fechado).
# Insere uma linha de teste (data fake 1999-12-31, e-mail .invalid), lê como
# anon, e limpa tudo no fim (sempre, mesmo em falha).
#
# Sai 0 SÓ se (2) E (3) passarem. Imprime PASS/FAIL por etapa.
#
# Variáveis de ambiente exigidas (exporte no seu shell, NUNCA no repo):
#   SB_URL          ex.: https://gyyrumqcphdgqovyzlsk.supabase.co
#   SB_SERVICE_KEY  service_role key (grava daily_submissions, ignora RLS)
#   SB_ANON_KEY     anon key (o que o navegador usa; deve bater no cofre)
# ============================================================================
set -uo pipefail

# --- guarda de ambiente: falha CLARA se faltar (curl sem apikey vira
#     "No API key found in request" e parece erro de RLS — isso já mordeu). ---
faltando=""
for v in SB_URL SB_SERVICE_KEY SB_ANON_KEY; do
  if [ -z "${!v:-}" ]; then faltando="$faltando $v"; fi
done
if [ -n "$faltando" ]; then
  echo "ERRO: variáveis de ambiente vazias:$faltando" >&2
  echo "      exporte SB_URL, SB_SERVICE_KEY e SB_ANON_KEY antes de rodar." >&2
  exit 2
fi

BASE="${SB_URL%/}/rest/v1"
DATE="1999-12-31"
EMAIL="smoke-pr1@example.invalid"   # TLD .invalid (RFC 2606): nunca entregável, nunca colide
APELIDO="SmokePR1"
SCORE=4242

pass_step2=0
pass_step3=0

# curl que devolve "corpo\n<http_code>"; ecoa código e corpo por referência.
req() { # $1=method $2=url $3=keytype(service|anon) [$4=json body] [$5=prefer]
  local method="$1" url="$2" keytype="$3" body="${4:-}" prefer="${5:-}"
  local key; if [ "$keytype" = "service" ]; then key="$SB_SERVICE_KEY"; else key="$SB_ANON_KEY"; fi
  local args=(-sS -X "$method" "$url"
    -H "apikey: $key" -H "Authorization: Bearer $key"
    -w $'\n%{http_code}')
  [ -n "$prefer" ] && args+=(-H "Prefer: $prefer")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" --data "$body")
  curl "${args[@]}" 2>/dev/null
}
split_code() { printf '%s' "$1" | tail -n1; }
split_body() { printf '%s' "$1" | sed '$d'; }

cleanup() {
  # apaga a submissão e o desafio de teste (ON DELETE CASCADE cobriria, mas
  # somos explícitos). Silencioso: é limpeza, roda mesmo se algo falhou antes.
  req DELETE "$BASE/daily_submissions?email=eq.$EMAIL&challenge_date=eq.$DATE" service "" "return=minimal" >/dev/null 2>&1
  req DELETE "$BASE/daily_challenges?date=eq.$DATE" service "" "return=minimal" >/dev/null 2>&1
}
trap cleanup EXIT

echo "== smoke PR1 contra $SB_URL =="

# --- setup: garante o desafio de teste (FK de daily_submissions) ---
r=$(req POST "$BASE/daily_challenges" service "{\"date\":\"$DATE\",\"seed\":\"smoke-pr1\"}" "return=minimal")
c=$(split_code "$r")
if [ "$c" = "201" ] || [ "$c" = "409" ]; then
  echo "[setup] desafio de teste ok (HTTP $c)"
else
  echo "[setup] FAIL ao criar desafio de teste (HTTP $c): $(split_body "$r")"
  echo "        a migration 007 pode não estar aplicada, ou a service key está errada."
  exit 1
fi

# --- setup: insere a linha RANQUEADA de teste (via service role) ---
sub="{\"email\":\"$EMAIL\",\"apelido\":\"$APELIDO\",\"challenge_date\":\"$DATE\",\"ranked_score\":$SCORE,\"confirmed_at\":\"1999-12-31T12:00:00Z\",\"consent_ranking\":true}"
r=$(req POST "$BASE/daily_submissions" service "$sub" "return=minimal")
c=$(split_code "$r")
if [ "$c" != "201" ]; then
  echo "[setup] FAIL ao inserir submissão de teste (HTTP $c): $(split_body "$r")"
  echo "        se for 42P01/404, a tabela daily_submissions não existe (migration não aplicada)."
  exit 1
fi
echo "[setup] linha ranqueada de teste inserida (HTTP 201)"

# --- ETAPA 2: anon lê daily_ranking_v2 → deve trazer a linha, SEM e-mail ---
r=$(req GET "$BASE/daily_ranking_v2?challenge_date=eq.$DATE&select=*" anon)
c=$(split_code "$r"); b=$(split_body "$r")
if [ "$c" = "200" ] && printf '%s' "$b" | grep -q "$APELIDO" && printf '%s' "$b" | grep -q "$SCORE" \
   && ! printf '%s' "$b" | grep -qi "$EMAIL" && ! printf '%s' "$b" | grep -qi '"email"'; then
  echo "[etapa 2] PASS — ranking traz a linha SEM e-mail. HTTP $c · corpo: $b"
  pass_step2=1
else
  echo "[etapa 2] FAIL — HTTP $c · corpo: $b"
  echo "          esperado: 200 contendo $APELIDO e $SCORE, e SEM $EMAIL / \"email\"."
  echo "          se veio [] com 200, a view pode estar security_invoker=true (herda RLS)."
fi

# --- ETAPA 3: anon lê daily_submissions → deve ser NEGADO ou vazio ---
r=$(req GET "$BASE/daily_submissions?select=*" anon)
c=$(split_code "$r"); b=$(split_body "$r")
vazou=0
printf '%s' "$b" | grep -qi "$EMAIL" && vazou=1
printf '%s' "$b" | grep -q "$APELIDO" && vazou=1
if [ "$vazou" = "0" ] && { [ "$c" != "200" ] || [ "$(printf '%s' "$b" | tr -d '[:space:]')" = "[]" ]; }; then
  echo "[etapa 3] PASS — daily_submissions fechado ao anon. HTTP $c · corpo: $b"
  pass_step3=1
else
  echo "[etapa 3] FAIL — dado vazou ou tabela legível. HTTP $c · corpo: $b"
fi

# --- veredito (cleanup roda no trap EXIT) ---
echo "== resultado: etapa2=$([ $pass_step2 = 1 ] && echo PASS || echo FAIL) · etapa3=$([ $pass_step3 = 1 ] && echo PASS || echo FAIL) =="
if [ "$pass_step2" = "1" ] && [ "$pass_step3" = "1" ]; then
  echo "SMOKE PR1: PASS"
  exit 0
else
  echo "SMOKE PR1: FAIL"
  exit 1
fi
