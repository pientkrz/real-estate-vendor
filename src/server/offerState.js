/**
 * Runtime storage for the processed FTP deliveries.
 *
 * The JSON file is deliberately private to the Node application. It is
 * written by the ingestion command with an atomic rename and read by SSR;
 * neither the web server nor the browser ever reads the FTP inbox directly.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getLogger } from './logger.js';

export const OFFER_STATE_VERSION = 1;

const asPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const asNonNegativeInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

export const getOfferRuntimeConfig = (env = process.env) => {
  const deliveryRoot = env.OFFER_DELIVERY_ROOT || path.join(process.cwd(), 'offer-deliveries');
  const statePath = env.OFFER_STATE_PATH || path.join(process.cwd(), '.offer-data', 'offers-state.json');
  const photoRoot = env.OFFER_PHOTO_ROOT || path.join(process.cwd(), '.offer-data', 'photos');

  return {
    statePath,
    photoRoot,
    photoPublicBasePath: (env.OFFER_PHOTO_PUBLIC_BASE_PATH || '/offer-photos').replace(/\/$/, ''),
    settleMinutes: asPositiveInteger(env.OFFER_SETTLE_MINUTES, 15),
    rejectedRetentionDays: asNonNegativeInteger(env.OFFER_REJECTED_RETENTION_DAYS, 3),
    retainedFullCycles: asPositiveInteger(env.OFFER_RETAINED_FULL_CYCLES, 1),
    unzipBin: env.OFFER_UNZIP_BIN || 'unzip',
    providerDirectories: {
      'otodom-pl': env.OTODOM_DELIVERY_DIR || path.join(deliveryRoot, 'otodom-pl'),
      'nieruchomosci-online-pl': env.NIERUCHOMOSCI_ONLINE_DELIVERY_DIR
        || path.join(deliveryRoot, 'nieruchomosci-online-pl'),
      'oferty-net': env.OFERTY_NET_DELIVERY_DIR || path.join(deliveryRoot, 'oferty-net'),
    },
  };
};

export const createEmptyOfferState = () => ({
  version: OFFER_STATE_VERSION,
  generatedAt: null,
  providerStates: {},
  agents: [],
  aggregates: [],
  deliveries: [],
});

const isOfferState = (value) => (
  value
  && value.version === OFFER_STATE_VERSION
  && value.providerStates
  && Array.isArray(value.aggregates)
  && Array.isArray(value.agents)
  && Array.isArray(value.deliveries)
);

/** Returns undefined when no usable processed snapshot is available yet. */
export const readOfferState = (statePath) => {
  try {
    const value = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return isOfferState(value) ? value : undefined;
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      getLogger().error('offer_state_read_failed', { component: 'offer-state', error });
    }
    return undefined;
  }
};

/**
 * A same-directory temporary file plus rename means SSR sees either the old,
 * complete snapshot or the new, complete snapshot, never a half-written file.
 */
export const writeOfferStateAtomic = (statePath, state) => {
  const directory = path.dirname(statePath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = path.join(
    directory,
    `.${path.basename(statePath)}.${process.pid}.${Date.now()}.tmp`,
  );

  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(state)}\n`, 'utf8');
    fs.renameSync(temporaryPath, statePath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
};
