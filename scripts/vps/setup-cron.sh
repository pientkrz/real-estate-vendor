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
CRON_ENTRY="@reboot /bin/bash $START_SCRIPT >> $APP_DIR/cron.log 2>&1"
INGEST_CRON_ENTRY="*/30 * * * * /bin/bash $INGEST_SCRIPT >> $APP_DIR/offer-ingestion.log 2>&1"

if [ ! -f "$START_SCRIPT" ]; then
  echo "ERROR: $START_SCRIPT not found. Deploy start.sh to $APP_DIR first." >&2
  exit 1
fi

if [ ! -f "$INGEST_SCRIPT" ]; then
  echo "ERROR: $INGEST_SCRIPT not found. Deploy it before enabling the ingestion schedule." >&2
  exit 1
fi

chmod +x "$START_SCRIPT" "$INGEST_SCRIPT"

existing="$(crontab -l 2>/dev/null || true)"
if echo "$existing" | grep -qF "$START_SCRIPT"; then
  echo "Cron @reboot entry already present, leaving crontab unchanged."
else
  { echo "$existing"; echo "$CRON_ENTRY"; } | crontab -
  echo "Installed cron @reboot entry:"
  echo "  $CRON_ENTRY"
fi

existing="$(crontab -l 2>/dev/null || true)"
if echo "$existing" | grep -qF "$INGEST_SCRIPT"; then
  echo "Ingestion schedule already installed, leaving crontab unchanged."
else
  { echo "$existing"; echo "$INGEST_CRON_ENTRY"; } | crontab -
  echo "Installed ingestion cron entry:"
  echo "  $INGEST_CRON_ENTRY"
fi

echo "Current crontab:"
crontab -l
