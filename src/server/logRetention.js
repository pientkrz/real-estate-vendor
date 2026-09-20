import fs from 'node:fs';
import path from 'node:path';

const APP_LOG_FILE_RE = /^(astro|ingestion|supervisor)-(\d{4}-\d{2}-\d{2})\.jsonl$/;
const DAY_MS = 24 * 60 * 60 * 1_000;

const parseLogDate = (value) => {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) ? timestamp : undefined;
};

/** Removes only dated JSONL files owned by this application. */
export const pruneApplicationLogs = ({ directory, retentionDays, now = new Date() }) => {
  const report = { scanned: 0, removed: 0, skipped: 0 };
  const cutoff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    - (retentionDays * DAY_MS);

  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return report;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = APP_LOG_FILE_RE.exec(entry.name);
    if (!match) {
      report.skipped += 1;
      continue;
    }
    report.scanned += 1;
    const date = parseLogDate(match[2]);
    if (date === undefined || date >= cutoff) continue;
    fs.unlinkSync(path.join(directory, entry.name));
    report.removed += 1;
  }
  return report;
};

export const __private__ = { APP_LOG_FILE_RE, parseLogDate };
