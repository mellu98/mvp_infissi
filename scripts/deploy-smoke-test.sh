#!/usr/bin/env bash
#
# Smoke test post-deploy. Esegui DOPO il deploy su Coolify per verificare
# che l'app risponda e che il DB sia raggiungibile.
#
# Uso:
#   APP_URL=https://app.linkinfissi.it ./scripts/deploy-smoke-test.sh
#   ./scripts/deploy-smoke-test.sh https://app.linkinfissi.it
#
# Exit code:
#   0  → tutti i check passati
#   1  → almeno un check fallito

set -euo pipefail

APP_URL="${1:-${APP_URL:-http://localhost:3000}}"
APP_URL="${APP_URL%/}"  # strip trailing slash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m'

pass=0
fail=0

check() {
  local name="$1"
  local cmd="$2"
  printf "  %-40s " "$name"
  if eval "$cmd" >/dev/null 2>&1; then
    echo -e "${GREEN}OK${RESET}"
    pass=$((pass + 1))
  else
    echo -e "${RED}FAIL${RESET}"
    fail=$((fail + 1))
  fi
}

echo "Smoke test su: ${APP_URL}"
echo

check "Healthcheck /api/health"        "curl -fsSL ${APP_URL}/api/health | grep -q '\"status\":\"ok\"'"
check "DB ping (healthcheck dettaglio)" "curl -fsSL ${APP_URL}/api/health | grep -q '\"db\":\"ok\"'"
check "Login page raggiungibile"       "curl -fsSL ${APP_URL}/login | grep -q 'MVP Infissi'"
check "Redirect home → /dashboard"     "curl -sI ${APP_URL}/ | grep -qiE 'location:.*(/login|/dashboard)'"
check "NextAuth providers endpoint"    "curl -fsSL ${APP_URL}/api/auth/providers | grep -q 'credentials'"

echo
echo -e "${GREEN}${pass}${RESET} passati, ${RED}${fail}${RESET} falliti"

if [ "$fail" -gt 0 ]; then
  echo -e "${YELLOW}Suggerimenti:${RESET}"
  echo "  - Verifica le env vars (NEXTAUTH_URL, NEXTAUTH_SECRET, AUTH_TRUST_HOST, DATABASE_URL)"
  echo "  - Controlla i log dell'app su Coolify"
  echo "  - Verifica che il container abbia montato il volume /app/uploads"
  echo "  - Verifica che 'npm run db:deploy' sia stato eseguito"
  exit 1
fi

echo
echo "Test funzionale manuale consigliato:"
echo "  1. Apri ${APP_URL}/login e fai login con admin@linkinfissi.demo / password-demo-123"
echo "  2. Crea un cliente, poi un preventivo con riga zanzariera 120×240"
echo "  3. Genera PDF preventivo e contratto dal dettaglio preventivo"
echo "  4. Verifica intestazione PDF con dati Link Infissi reali"
