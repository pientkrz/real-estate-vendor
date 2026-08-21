#!/bin/bash
# Short-lived FTP ingestion job. Invoke from cron every 30 minutes.
set -eu

APP_DIR="$HOME/apps/new-global-s-home"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin/node"
ENV_FILE="${OFFER_RUNTIME_ENV_FILE:-$APP_DIR/.env}"
LOCK_DIR="$APP_DIR/data/offer-ingestion"
LOCK_FILE="$LOCK_DIR/ingestion.lock"

mkdir -p "$LOCK_DIR"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "$(date -Iseconds) ingestion already running; skipping"
  exit 0
fi

if [ -f "$ENV_FILE" ]; then
  exec "$NODE_BIN" --env-file="$ENV_FILE" "$APP_DIR/scripts/ingest-offers.mjs"
else
  echo "$(date -Iseconds) missing runtime environment: $ENV_FILE" >&2
  exit 1
fi
