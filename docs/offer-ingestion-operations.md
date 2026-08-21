# FTP offer ingestion and VPS operations

This document describes the complete offer-delivery process for a fresh VPS.
It applies to this Astro SSR application only. Never modify
`/home/ixtnzfseqk/domains/globalshome.com`; it is a separate production app.

## Processes

| Process | Type | Schedule / start | Responsibility |
| --- | --- | --- | --- |
| Astro application | Node 22 + `nohup` | `@reboot` cron runs `start.sh` | Serves SSR pages on `127.0.0.1:54322` through LiteSpeed reverse proxy. |
| Currency refresh | `node-cron` inside Astro Node process | hourly | Refreshes exchange rates; it is not a separate VPS job. |
| Offer ingestion | short-lived Node CLI | `*/30 * * * *` cron | Validates ZIP uploads, updates state, extracts referenced photos, and cleans retention. |
| Agent validation | none | removed | Agents now come from the NOE `<agents>` section during ingestion. |

The current VPS has no systemd command available for this user. Cron is the
intentional, simple process supervisor. The ingestion runner uses `flock`, so a
slow run cannot overlap the next one.

## Runtime directories and environment

Create `/home/ixtnzfseqk/apps/new-global-s-home/.env` with permissions `600`.
These values are read at Node runtime via `--env-file`; they are not baked into
the Astro build.

```dotenv
OFFER_DELIVERY_ROOT=/home/ixtnzfseqk/dostawa-ofert
OTODOM_DELIVERY_DIR=/home/ixtnzfseqk/dostawa-ofert/otodom-pl
NIERUCHOMOSCI_ONLINE_DELIVERY_DIR=/home/ixtnzfseqk/dostawa-ofert/nieruchomosci-online-pl
OFERTY_NET_DELIVERY_DIR=/home/ixtnzfseqk/dostawa-ofert/oferty-net

OFFER_STATE_PATH=/home/ixtnzfseqk/apps/new-global-s-home/data/offer-ingestion/offers-state.json
OFFER_PHOTO_ROOT=/home/ixtnzfseqk/aktualne-zdjecia-ofert
OFFER_PHOTO_PUBLIC_BASE_PATH=/offer-photos
OFFER_SETTLE_MINUTES=15
OFFER_RETAINED_FULL_CYCLES=1
OFFER_REJECTED_RETENTION_DAYS=3
OFFER_UNZIP_BIN=unzip
```

`OFFER_STATE_PATH` is the durable last-known-good JSON snapshot. It contains
normalised provider records, NOE agents, aggregates, and delivery metadata.
It is private and atomically replaced. `OFFER_PHOTO_ROOT` is also private; the
Astro route `/offer-photos/<provider>/<delivery-id>/<file>` reads only images
created there by ingestion.

## Delivery behaviour and retention

Provider FTP folders are inboxes and must not be reorganised. The worker only
examines ZIP files that have not changed for 15 minutes. It validates the ZIP,
expected XML entry, XML root, and the delivery marker before parsing.

- Full delivery: replaces its provider state. The worker accepts a valid full
  delivery even if its offer count decreased.
- Differential delivery: upserts offers and applies deletion/deactivation
  events. It is ignored until that provider has a full baseline.
- Invalid delivery: recorded as rejected and leaves the last-known-good state
  untouched.
- Retention: keep one successful cycle per provider—the newest full ZIP and all
  later differential ZIPs. After a newer full state is published, delete the
  prior full and its differentials. Rejected ZIPs are retained for three days.

Images are copied directly from accepted ZIP entries into a delivery-specific
folder under `OFFER_PHOTO_ROOT`; the archive is never unpacked into a temporary
directory. When a delivery is removed by retention, its extracted photo folder
is removed too.

## First setup and deployment

Prerequisites: Node 22, `cron`, `flock`, and `unzip`. On the current
cyberfolks host the Node executable is
`/opt/alt/alt-nodejs22/root/usr/bin/node`.

1. Deploy `dist/server`, `dist/client`, `package.json`, `scripts/`, and the
   private `.env` to `~/apps/new-global-s-home`; install production packages
   with Node 22 on `PATH`.
2. Create the state parent directory and `OFFER_PHOTO_ROOT`; keep both outside
   `public_html`.
3. Bootstrap the existing Otodom full export once, copying its local sibling
   photos into the private photo root:

   ```bash
   /opt/alt/alt-nodejs22/root/usr/bin/node --env-file=.env \
     scripts/ingest-offers.mjs --bootstrap-otodom public/<collection>/properties_otodom.xml
   ```

4. Install the app restart and ingestion cron entries:

   ```bash
   bash scripts/vps/setup-cron.sh
   ```

5. Restart the Astro process using the existing deployment procedure. It now
   starts with `--env-file=.env` and reads the materialized state on every SSR
   request.

Use `node --env-file=.env scripts/ingest-offers.mjs --status` to inspect the
latest baselines and deliveries. Logs are `app.log`, `start.log`, and
`offer-ingestion.log` in the application directory.

## Recovery

The site continues serving the prior snapshot when an upload is incomplete or
invalid. To investigate, inspect the rejected ZIP and `offer-ingestion.log`.
The retained full ZIP plus later differential ZIPs is sufficient to rebuild the
current provider state by deleting only the generated state file and rerunning
the ingestion command; never delete an FTP archive before confirming a newer
full cycle has been published.
