#!/usr/bin/env bash
# ============================================================================
# smoke-pr1.sh — valida a fundação de dados do PR1 CONTRA O BANCO REMOTO.
# NÃO aplica migration nenhuma: só faz chamadas REST. Rode DEPOIS que as
# migrations 007 e 008 estiverem aplicadas (você aplica; eu não toco em produção).
#
# Prova, com evidência, as invariantes que importam:
#   (1) service_role CONSEGUE gravar em daily_submissions (grant do cofre — 008).
#   (2) daily_ranking_v2 devolve a linha ranqueada ao ANON, SEM e-mail — e o
#       fato de ela APARECER prova que a view NÃO é security_invoker (senão o
#       anon herdaria o RLS deny e viria []).
#   (3) daily_submissions NÃO é legível pelo ANON (cofre fechado).
#
# Usa o desafio REAL de hoje (current_daily) para o FK — o sistema real nunca
# insere desafio via REST (vem do cron SECURITY DEFINER). A linha de teste
# (e-mail .invalid) é removida no fim, sempre (trap EXIT).
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
EMAIL="smoke-pr1@example.invalid"   # TLD .invalid (RFC 2606): nunca entregável, nunca colide
APELIDO="SmokePR1"
SCORE=4242
DATE=""                             # preenchido do current_daily (desafio REAL de hoje)

pass_step2=0
pass_step3=0

# curl que devolve "corpo\n<http_code>".
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
  # apaga SÓ a submissão de teste (o desafio é o real de hoje — não se toca).
  [ -n "$DATE" ] || return 0
  req DELETE "$BASE/daily_submissions?email=eq.$EMAIL&challenge_date=eq.$DATE" service "" "return=minimal" >/dev/null 2>&1
}
trap cleanup EXIT

echo "== smoke PR1 contra $SB_URL =="

# --- setup: pega o desafio REAL de hoje (current_daily) para o FK ---
r=$(req GET "$BASE/current_daily?select=challenge_date" service)
c=$(split_code "$r"); b=$(split_body "$r")
DATE=$(printf '%s' "$b" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)
if [ -z "$DATE" ]; then
  echo "[setup] FAIL — current_daily não devolveu desafio de hoje (HTTP $c): $b"
  echo "        sem desafio publicado não há FK; o cron pode não ter rodado."
  exit 1
fi
echo "[setup] desafio real de hoje: $DATE"

# --- ETAPA 1: service_role INSERE a linha ranqueada de teste ---
sub="{\"email\":\"$EMAIL\",\"apelido\":\"$APELIDO\",\"challenge_date\":\"$DATE\",\"ranked_score\":$SCORE,\"confirmed_at\":\"${DATE}T12:00:00Z\",\"consent_ranking\":true}"
r=$(req POST "$BASE/daily_submissions" service "$sub" "return=minimal")
c=$(split_code "$r")
if [ "$c" != "201" ]; then
  echo "[etapa 1] FAIL — service_role não gravou (HTTP $c): $(split_body "$r")"
  echo "          42501 => falta o GRANT do service_role (migration 008 não aplicada)."
  echo "          42P01 => tabela não existe (migration 007 não aplicada)."
  exit 1
fi
echo "[etapa 1] PASS — service_role gravou a linha ranqueada (HTTP 201)"

# --- ETAPA 2: anon lê daily_ranking_v2 → traz a linha, SEM e-mail ---
r=$(req GET "$BASE/daily_ranking_v2?challenge_date=eq.$DATE&select=*" anon)
c=$(split_code "$r"); b=$(split_body "$r")
if [ "$c" = "200" ] && printf '%s' "$b" | grep -q "$APELIDO" && printf '%s' "$b" | grep -q "$SCORE" \
   && ! printf '%s' "$b" | grep -qi "$EMAIL" && ! printf '%s' "$b" | grep -qi '"email"'; then
  echo "[etapa 2] PASS — ranking traz a linha SEM e-mail (logo a view é DEFINER, não invoker). HTTP $c · corpo: $b"
  pass_step2=1
else
  echo "[etapa 2] FAIL — HTTP $c · corpo: $b"
  echo "          esperado: 200 contendo $APELIDO e $SCORE, e SEM $EMAIL / \"email\"."
  echo "          se veio [] com 200, a view está security_invoker=true (herda o RLS)."
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
