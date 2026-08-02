#!/bin/bash
# Installs a cron @reboot entry that runs start.sh, so the Astro SSR server
# comes back up automatically after the VPS restarts. Idempotent: running
# this multiple times will not create duplicate cron entries.
#
# Usage (on the VPS, after start.sh has been deployed alongside it):
#   bash setup-cron.sh
set -u

APP_DIR="$HOME/apps/new-global-s-home"
START_SCRIPT="$APP_DIR/start.sh"
CRON_ENTRY="@reboot /bin/bash $START_SCRIPT >> $APP_DIR/cron.log 2>&1"

if [ ! -f "$START_SCRIPT" ]; then
  echo "ERROR: $START_SCRIPT not found. Deploy start.sh to $APP_DIR first." >&2
  exit 1
fi

chmod +x "$START_SCRIPT"

existing="$(crontab -l 2>/dev/null || true)"
if echo "$existing" | grep -qF "$START_SCRIPT"; then
  echo "Cron @reboot entry already present, leaving crontab unchanged."
else
  { echo "$existing"; echo "$CRON_ENTRY"; } | crontab -
  echo "Installed cron @reboot entry:"
  echo "  $CRON_ENTRY"
fi

echo "Current crontab:"
crontab -l
