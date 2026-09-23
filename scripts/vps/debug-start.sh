#!/usr/bin/env bash
# Foreground diagnostic launcher for the test Astro SSR application.
# Unlike start.sh, this script intentionally keeps stdout/stderr visible and
# exits with the server's status so missing modules and bad runtime settings
# are immediately actionable. It must not be used as the cron @reboot entry.
set -u

APP_DIR="${APP_DIR:-$HOME/apps/new-global-s-home}"
NODE_BIN="${NODE_BIN:-/opt/alt/alt-nodejs22/root/usr/bin/node}"
ENV_FILE="${OFFER_RUNTIME_ENV_FILE:-$APP_DIR/.env}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-54322}"

fail() {
  printf 'debug-start: ERROR: %s\n' "$*" >&2
  exit 1
}

printf '%s\n' '--- Astro debug start ---'
printf 'app directory: %s\n' "$APP_DIR"
printf 'env file: %s\n' "$ENV_FILE"
printf 'node binary: %s\n' "$NODE_BIN"
printf 'listen target: %s:%s\n' "$HOST" "$PORT"

[ -d "$APP_DIR" ] || fail "application directory does not exist"
[ -f "$ENV_FILE" ] || fail "runtime environment file does not exist"
[ -x "$NODE_BIN" ] || fail "Node binary is missing or not executable"
[ -f "$APP_DIR/package.json" ] || fail "package.json is missing"

ENTRY_FILE="${ASTRO_ENTRY_FILE:-}"
if [ -z "$ENTRY_FILE" ]; then
  if [ -f "$APP_DIR/server/entry.mjs" ]; then
    ENTRY_FILE="$APP_DIR/server/entry.mjs"
  elif [ -f "$APP_DIR/dist/server/entry.mjs" ]; then
    ENTRY_FILE="$APP_DIR/dist/server/entry.mjs"
  else
    fail "SSR entry is missing (checked server/entry.mjs and dist/server/entry.mjs)"
  fi
fi
[ -f "$ENTRY_FILE" ] || fail "SSR entry is missing: $ENTRY_FILE"

cd "$APP_DIR" || fail "cannot change to application directory"

printf 'node version: '
"$NODE_BIN" --version || fail "Node could not be executed"
printf 'entry syntax: '
"$NODE_BIN" --check "$ENTRY_FILE" || fail "SSR entry has invalid syntax"
printf 'SSR entry: %s\n' "$ENTRY_FILE"

printf '%s\n' 'configured runtime variable names:'
awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/ { print "  " $1 }' "$ENV_FILE" | sort -u

printf '%s\n' 'important paths:'
for path_to_check in \
  "$APP_DIR/server/entry.mjs" \
  "$APP_DIR/server/chunks" \
  "$APP_DIR/client" \
  "$APP_DIR/data" \
  "$APP_DIR/logs"; do
  if [ -e "$path_to_check" ]; then
    printf '  OK   %s\n' "$path_to_check"
  else
    printf '  MISS %s\n' "$path_to_check"
  fi
done

if command -v curl >/dev/null 2>&1; then
  if curl -fsS --max-time 2 "http://$HOST:$PORT/" >/dev/null 2>&1; then
    printf 'warning: something is already listening on %s:%s\n' "$HOST" "$PORT"
  else
    printf 'port check: %s:%s is not currently serving\n' "$HOST" "$PORT"
  fi
fi

printf '%s\n' 'starting Astro in the foreground; press Ctrl+C to stop it.'
printf '%s\n' '--- server output ---'
export HOST PORT LOG_PROCESS=astro
exec "$NODE_BIN" --env-file="$ENV_FILE" "$ENTRY_FILE"
