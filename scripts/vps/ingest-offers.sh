#!/bin/bash
# Short-lived FTP ingestion job. Invoke from cron every 30 minutes.
set -eu

APP_DIR="$HOME/apps/new-global-s-home"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin/node"
ENV_FILE="${OFFER_RUNTIME_ENV_FILE:-$APP_DIR/.env}"
LOCK_DIR="$APP_DIR/data/offer-ingestion"
LOCK_FILE="$LOCK_DIR/ingestion.lock"

log_event() {
  level="$1"
  event="$2"
  shift 2
  if [ -f "$ENV_FILE" ]; then
    "$NODE_BIN" --env-file="$ENV_FILE" "$APP_DIR/scripts/vps/log-process-event.mjs" "$level" "$event" "$@" > /dev/null 2>&1 || true
  else
    "$NODE_BIN" "$APP_DIR/scripts/vps/log-process-event.mjs" "$level" "$event" "$@" > /dev/null 2>&1 || true
  fi
}

mkdir -p "$LOCK_DIR"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log_event info ingestion_lock_skipped "reason=already-running"
  exit 0
fi

if [ -f "$ENV_FILE" ]; then
  log_event info ingestion_process_started
  LOG_PROCESS=ingestion exec "$NODE_BIN" --env-file="$ENV_FILE" "$APP_DIR/scripts/ingest-offers.mjs" > /dev/null 2>&1
else
  log_event error ingestion_process_skipped "reason=missing-runtime-environment"
  exit 1
fi
