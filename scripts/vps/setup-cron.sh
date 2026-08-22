#!/bin/bash
# Installs a cron @reboot entry that runs start.sh, so the Astro SSR server
# comes back up automatically after the VPS restarts. Idempotent: running
# this multiple times will not create duplicate cron entries.
#
# Usage (on the VPS, after the repository scripts/ folder has been deployed):
#   bash scripts/vps/setup-cron.sh
set -u

APP_DIR="$HOME/apps/new-global-s-home"
START_SCRIPT="$APP_DIR/scripts/vps/start.sh"
INGEST_SCRIPT="$APP_DIR/scripts/vps/ingest-offers.sh"
CRON_ENTRY="@reboot /bin/bash $START_SCRIPT > /dev/null 2>&1"
INGEST_CRON_ENTRY="*/30 * * * * /bin/bash $INGEST_SCRIPT > /dev/null 2>&1"

log_event() {
  level="$1"
  event="$2"
  shift 2
  if [ -f "$APP_DIR/.env" ]; then
    /opt/alt/alt-nodejs22/root/usr/bin/node --env-file="$APP_DIR/.env" "$APP_DIR/scripts/vps/log-process-event.mjs" "$level" "$event" "$@" > /dev/null 2>&1 || true
  fi
}

if [ ! -f "$START_SCRIPT" ]; then
  echo "ERROR: $START_SCRIPT not found. Deploy start.sh to $APP_DIR first." >&2
  exit 1
fi

if [ ! -f "$INGEST_SCRIPT" ]; then
  echo "ERROR: $INGEST_SCRIPT not found. Deploy it before enabling the ingestion schedule." >&2
  exit 1
fi

chmod +x "$START_SCRIPT" "$INGEST_SCRIPT" "$APP_DIR/scripts/vps/run-astro.mjs" "$APP_DIR/scripts/vps/log-process-event.mjs"

existing="$(crontab -l 2>/dev/null || true)"
without_app_entries="$(printf '%s\n' "$existing" | grep -vF "$START_SCRIPT" | grep -vF "$INGEST_SCRIPT" || true)"
{
  printf '%s\n' "$without_app_entries"
  printf '%s\n' "$CRON_ENTRY"
  printf '%s\n' "$INGEST_CRON_ENTRY"
} | crontab -
log_event info cron_entries_configured "rebootSchedule=@reboot" "ingestionSchedule=every-30-minutes"

echo "Configured cron @reboot entry:"
echo "  $CRON_ENTRY"
echo "Configured ingestion schedule:"
echo "  $INGEST_CRON_ENTRY"

echo "Current crontab:"
crontab -l
