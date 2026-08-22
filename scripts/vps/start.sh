#!/bin/bash
# Starts the Astro SSR server if it isn't already listening on its port.
# Meant to run on the cyberfolks VPS — via cron @reboot (see setup-cron.sh)
# and safe to re-run manually (idempotent: skips if already up).
set -u

APP_DIR="$HOME/apps/new-global-s-home"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin/node"
PORT=54322
HOST=127.0.0.1
ENV_FILE="${OFFER_RUNTIME_ENV_FILE:-$APP_DIR/.env}"

cd "$APP_DIR" || exit 1

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

if curl -s --max-time 2 "http://$HOST:$PORT/" > /dev/null 2>&1; then
  log_event info process_already_running "port=$PORT"
else
  if [ -f "$ENV_FILE" ]; then
    LOG_PROCESS=astro PORT=$PORT HOST=$HOST nohup "$NODE_BIN" --env-file="$ENV_FILE" scripts/vps/run-astro.mjs > /dev/null 2>&1 &
  else
    log_event error process_start_skipped "reason=missing-runtime-environment"
    exit 1
  fi
  log_event info process_started "port=$PORT" "pid=$!"
fi
