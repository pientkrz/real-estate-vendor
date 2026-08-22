/**
 * The FTP inbox worker. It intentionally has no network server or database:
 * cron starts it, it processes settled ZIP files once, and atomically publishes
 * a JSON snapshot that the Astro SSR app can safely read.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { XMLParser } from 'fast-xml-parser';
import {
  parseNieruchomosciOnlineAgentsXml,
  parseNieruchomosciOnlineXml,
  parseOfertyNetXml,
  parseOtoDomXml,
} from '../utils/xmlParser.js';
import { buildPropertyAggregates } from '../utils/propertyAggregate.js';
import {
  createEmptyOfferState,
  readOfferState,
  writeOfferStateAtomic,
} from '../server/offerState.js';
import { getLogger } from '../server/logger.js';

const XML_ENTRIES = Object.freeze({
  'otodom-pl': 'properties_otodom.xml',
  'nieruchomosci-online-pl': 'properties_noe2.xml',
  'oferty-net': 'oferty.xml',
});

const PHOTO_MARKER = 'offer-photo://';
const IMAGE_EXTENSION = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const MAX_XML_BUFFER_BYTES = 512 * 1024 * 1024;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
});

const deliveryTypeValues = Object.freeze({
  full: new Set(['full', 'calosc', 'całość', 'pelny', 'pełny', 'complete']),
  differential: new Set(['incremental', 'roznica', 'różnica', 'delta', 'differential']),
});

const normaliseDeliveryType = (value) => String(value ?? '').trim().toLocaleLowerCase('pl-PL');

const classifyDeliveryType = (provider, xml) => {
  const root = parser.parse(xml);
  let rawType;

  if (provider === 'otodom-pl') {
    if (!root.otoDom) throw new Error('Expected <otoDom> root element');
    rawType = root.otoDom.ImportType;
  } else if (provider === 'nieruchomosci-online-pl') {
    if (!root.xml?.export) throw new Error('Expected <xml><export> root metadata');
    rawType = root.xml.export.type;
  } else if (provider === 'oferty-net') {
    if (!root.plik?.header?.zawartosc_pliku) throw new Error('Expected <plik><header><zawartosc_pliku> metadata');
    rawType = root.plik.header.zawartosc_pliku;
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const type = normaliseDeliveryType(rawType);
  if (deliveryTypeValues.full.has(type)) return 'full';
  if (deliveryTypeValues.differential.has(type)) return 'differential';
  throw new Error(`Unrecognised ${provider} delivery type: ${String(rawType ?? '(empty)')}`);
};

const runUnzip = (unzipBin, args, { encoding = 'utf8', maxBuffer = MAX_XML_BUFFER_BYTES } = {}) => {
  const result = spawnSync(unzipBin, args, { encoding, maxBuffer });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(String(result.stderr || `unzip exited with status ${result.status}`).trim());
  }
  return result.stdout;
};

const listZipEntries = (archivePath, unzipBin) => String(runUnzip(unzipBin, ['-Z1', archivePath]))
  .split(/\r?\n/)
  .map((entry) => entry.trim())
  .filter(Boolean);

const validateZip = (archivePath, unzipBin) => {
  runUnzip(unzipBin, ['-tq', archivePath]);
};

const readXmlFromZip = (archivePath, xmlEntry, unzipBin) => String(
  runUnzip(unzipBin, ['-p', archivePath, xmlEntry]),
);

const safeZipRelativePath = (candidate) => {
  const normalised = path.posix.normalize(String(candidate ?? '').replace(/\\/g, '/').replace(/^\/+/, ''));
  if (!normalised || normalised === '.' || normalised.startsWith('../') || path.posix.isAbsolute(normalised)) return undefined;
  return normalised;
};

const deliveryIdFor = ({ provider, archivePath, size, mtimeMs }) => {
  const fingerprint = `${provider}\0${path.basename(archivePath)}\0${size}\0${Math.trunc(mtimeMs)}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 20);
};

const photoPrefix = (provider) => `${PHOTO_MARKER}${provider}/`;

const parseProviderRecords = (provider, xml, onValidation) => {
  const prefix = photoPrefix(provider);
  if (provider === 'otodom-pl') {
    return {
      offers: parseOtoDomXml(xml, prefix, { includeInactive: true, onValidation }),
      agents: [],
    };
  }
  if (provider === 'nieruchomosci-online-pl') {
    return {
      offers: parseNieruchomosciOnlineXml(xml, prefix, { includeInactive: true }),
      agents: parseNieruchomosciOnlineAgentsXml(xml),
    };
  }
  if (provider === 'oferty-net') return { offers: parseOfertyNetXml(xml, prefix, { includeInactive: true }), agents: [] };
  throw new Error(`Unsupported provider: ${provider}`);
};

const stateRecord = (record) => {
  const { sourceData: _sourceData, ...persisted } = record;
  return persisted;
};

const tombstoneFor = (provider, providerOfferId, priorRecord, sourceStatus = 'deleted') => ({
  ...(priorRecord ? stateRecord(priorRecord) : {}),
  id: priorRecord?.id || `${provider}-${providerOfferId}`,
  provider,
  providerOfferId,
  sourceStatus,
  tab: '',
  typ: '',
  price: 0,
  currency: '',
  videoUrl: null,
  agent: null,
  params: {},
  location: {},
  rawDetails: null,
});

const cloneState = (state) => JSON.parse(JSON.stringify(state));

/** Exported for focused tests: applies a normalised delivery without file I/O. */
export const applyDeliveryToState = (existingState, delivery) => {
  const state = cloneState(existingState || createEmptyOfferState());
  const prior = state.providerStates[delivery.provider] || { records: {}, hasFullBaseline: false };
  const records = { ...(prior.records || {}) };

  if (delivery.kind === 'differential' && !prior.hasFullBaseline) {
    return { state, applied: false, reason: 'awaiting-full-baseline' };
  }
  if (delivery.kind === 'full' && delivery.offers.length === 0) {
    throw new Error(`${delivery.provider} full delivery contains no offer records`);
  }

  const incomingIds = new Set(delivery.offers.map((record) => record.providerOfferId));
  if (delivery.kind === 'full') {
    for (const [providerOfferId, priorRecord] of Object.entries(records)) {
      if (!incomingIds.has(providerOfferId) && priorRecord.sourceStatus === 'active') {
        records[providerOfferId] = tombstoneFor(delivery.provider, providerOfferId, priorRecord);
      }
    }
  }

  for (const record of delivery.offers) {
    if (!record?.providerOfferId) throw new Error(`${delivery.provider} delivery contains a record without an ID`);
    records[record.providerOfferId] = stateRecord(record);
  }

  const previousAgents = Object.fromEntries((state.agents || []).map((agent) => [agent.id, agent]));
  if (delivery.provider === 'nieruchomosci-online-pl') {
    const incomingAgents = Object.fromEntries((delivery.agents || []).filter((agent) => agent?.id).map((agent) => [agent.id, agent]));
    state.agents = delivery.kind === 'full'
      ? Object.values(incomingAgents)
      : Object.values({ ...previousAgents, ...incomingAgents });
  }

  state.providerStates[delivery.provider] = {
    records,
    hasFullBaseline: delivery.kind === 'full' || prior.hasFullBaseline,
    fullDeliveryId: delivery.kind === 'full' ? delivery.id : prior.fullDeliveryId,
    fullReceivedAt: delivery.kind === 'full' ? delivery.receivedAt : prior.fullReceivedAt,
  };
  state.aggregates = buildPropertyAggregates(
    Object.values(state.providerStates).flatMap((providerState) => Object.values(providerState.records || {})),
  );
  state.generatedAt = new Date().toISOString();
  return { state, applied: true };
};

const findZipPhotoEntry = (reference, imageEntries) => {
  const direct = safeZipRelativePath(reference);
  if (direct && imageEntries.includes(direct)) return direct;
  const baseName = path.posix.basename(direct || '');
  const sameBaseName = imageEntries.filter((entry) => path.posix.basename(entry) === baseName);
  return sameBaseName.length === 1 ? sameBaseName[0] : undefined;
};

const publicPhotoUrl = (config, provider, deliveryId, entry) => (
  `${config.photoPublicBasePath}/${encodeURIComponent(provider)}/${encodeURIComponent(deliveryId)}/${entry
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`
);

const extractZipEntry = (archivePath, entry, targetPath, unzipBin) => new Promise((resolve, reject) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const child = spawn(unzipBin, ['-p', archivePath, entry], { stdio: ['ignore', 'pipe', 'pipe'] });
  const output = fs.createWriteStream(targetPath);
  let stderr = '';
  let outputFinished = false;
  let childClosed = false;
  let completed = false;
  const finish = (error) => {
    if (completed) return;
    completed = true;
    if (error) reject(error);
    else resolve();
  };
  const finishIfReady = () => {
    if (outputFinished && childClosed) finish();
  };
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', finish);
  output.on('error', finish);
  output.on('finish', () => {
    outputFinished = true;
    finishIfReady();
  });
  child.on('close', (code) => {
    if (code !== 0) {
      finish(new Error(stderr.trim() || `Unable to extract ${entry} from ${archivePath}`));
      return;
    }
    childClosed = true;
    finishIfReady();
  });
  child.stdout.pipe(output);
});

const materialisePhotos = async ({ offers, agents, provider, deliveryId, archivePath, entries, config }) => {
  const imageEntries = entries
    .map(safeZipRelativePath)
    .filter((entry) => entry && IMAGE_EXTENSION.test(entry));
  const resolvedEntries = new Set();
  const prefix = photoPrefix(provider);

  const replaceReference = (reference) => {
    const rawReference = String(reference ?? '');
    const sourceReference = rawReference.startsWith(prefix) ? rawReference.slice(prefix.length) : rawReference;
    const entry = findZipPhotoEntry(sourceReference, imageEntries);
    if (!entry) return undefined;
    resolvedEntries.add(entry);
    return publicPhotoUrl(config, provider, deliveryId, entry);
  };

  for (const offer of offers) {
    for (const [key, value] of Object.entries(offer.params || {})) {
      if (!/^zdjecie\d+$/i.test(key)) continue;
      const resolved = replaceReference(value);
      if (resolved) offer.params[key] = resolved;
      else delete offer.params[key];
    }
  }
  for (const agent of agents) {
    if (!agent?.image) continue;
    const resolved = replaceReference(agent.image);
    if (resolved) agent.image = resolved;
    else delete agent.image;
  }

  const photoVersionRoot = path.resolve(config.photoRoot, provider, deliveryId);
  const providerRoot = path.resolve(config.photoRoot, provider);
  if (!photoVersionRoot.startsWith(`${providerRoot}${path.sep}`)) throw new Error('Unsafe photo extraction path');

  try {
    for (const entry of resolvedEntries) {
      const targetPath = path.resolve(photoVersionRoot, ...entry.split('/'));
      if (!targetPath.startsWith(`${photoVersionRoot}${path.sep}`)) throw new Error('Unsafe ZIP photo entry path');
      await extractZipEntry(archivePath, entry, targetPath, config.unzipBin);
    }
  } catch (error) {
    fs.rmSync(photoVersionRoot, { recursive: true, force: true });
    throw error;
  }

  return resolvedEntries.size;
};

const isSettledArchive = (stat, settleMinutes, now) => (
  now.getTime() - stat.mtimeMs >= settleMinutes * 60 * 1000
);

const getCandidateArchives = (provider, directory, config, now) => {
  try {
    return fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.zip'))
      .map((entry) => {
        const archivePath = path.join(directory, entry.name);
        const stat = fs.statSync(archivePath);
        return { provider, archivePath, stat };
      })
      .filter(({ stat }) => isSettledArchive(stat, config.settleMinutes, now));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
};

const isKnownDelivery = (state, deliveryId) => state.deliveries.some((delivery) => delivery.id === deliveryId);

const addDelivery = (state, delivery) => {
  state.deliveries.push(delivery);
  // Keep enough metadata for retention and idempotency, without letting an
  // indefinitely growing ledger become its own storage problem.
  state.deliveries = state.deliveries.slice(-5000);
};

const safelyUnlink = (filePath, allowedDirectory, logger) => {
  const target = path.resolve(filePath);
  const root = path.resolve(allowedDirectory);
  if (!target.startsWith(`${root}${path.sep}`) || !target.toLowerCase().endsWith('.zip')) return false;
  try {
    fs.unlinkSync(target);
    return true;
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      logger?.warn('delivery_retention_remove_failed', {
        component: 'retention',
        archiveName: path.basename(target),
        error,
      });
    }
    return error?.code === 'ENOENT';
  }
};

const removePhotoVersion = (delivery, config) => {
  const target = path.resolve(config.photoRoot, delivery.provider, delivery.id);
  const providerRoot = path.resolve(config.photoRoot, delivery.provider);
  if (!target.startsWith(`${providerRoot}${path.sep}`)) return;
  fs.rmSync(target, { recursive: true, force: true });
};

const pruneDeliveries = (state, config, now, logger) => {
  let changed = false;
  for (const [provider, directory] of Object.entries(config.providerDirectories)) {
    const providerDeliveries = state.deliveries.filter((delivery) => delivery.provider === provider && !delivery.purged);
    const successfulFull = providerDeliveries
      // Bootstrap is a local compatibility seed, not an FTP recovery cycle.
      // It must never cause a real full archive to be discarded by retention.
      .filter((delivery) => delivery.status === 'applied' && delivery.kind === 'full' && !delivery.bootstrap)
      .sort((left, right) => Date.parse(right.receivedAt) - Date.parse(left.receivedAt));
    const keptFullIds = new Set(successfulFull.slice(0, config.retainedFullCycles).map((delivery) => delivery.id));
    const earliestKeptFull = successfulFull.find((delivery) => keptFullIds.has(delivery.id));

    for (const delivery of providerDeliveries) {
      const rejectedExpired = delivery.status === 'rejected'
        && now.getTime() - Date.parse(delivery.receivedAt) >= config.rejectedRetentionDays * 24 * 60 * 60 * 1000;
      const obsoleteSuccessful = earliestKeptFull
        && ['applied', 'ignored'].includes(delivery.status)
        && Date.parse(delivery.receivedAt) < Date.parse(earliestKeptFull.receivedAt);
      if (!rejectedExpired && !obsoleteSuccessful) continue;
      if (safelyUnlink(delivery.archivePath, directory, logger)) {
        removePhotoVersion(delivery, config);
        delivery.purged = true;
        changed = true;
        logger?.info('delivery_retention_removed', {
          component: 'retention',
          provider,
          deliveryId: delivery.id,
          archiveName: path.basename(delivery.archivePath),
          status: delivery.status,
        });
      }
    }
  }
  return changed;
};

/**
 * Process every completed archive once. This is the entry point used by cron.
 * It catches per-archive errors so one bad provider delivery cannot block the
 * other two providers.
 */
export const processAvailableDeliveries = async ({ config, now = new Date(), logger = getLogger('ingestion') }) => {
  const startedAt = Date.now();
  let state = readOfferState(config.statePath) || createEmptyOfferState();
  let changed = false;
  const report = { applied: [], ignored: [], rejected: [], skipped: [] };
  const candidates = Object.entries(config.providerDirectories)
    .flatMap(([provider, directory]) => getCandidateArchives(provider, directory, config, now))
    .sort((left, right) => left.stat.mtimeMs - right.stat.mtimeMs);

  logger.info('ingestion_run_started', {
    component: 'ingestion',
    providerCount: Object.keys(config.providerDirectories).length,
    settledArchiveCount: candidates.length,
  });

  for (const candidate of candidates) {
    const { provider, archivePath, stat } = candidate;
    const id = deliveryIdFor({ provider, archivePath, size: stat.size, mtimeMs: stat.mtimeMs });
    if (isKnownDelivery(state, id)) {
      report.skipped.push(archivePath);
      logger.debug('delivery_skipped_duplicate', {
        component: 'ingestion',
        provider,
        deliveryId: id,
        archiveName: path.basename(archivePath),
      });
      continue;
    }

    const receivedAt = new Date(stat.mtimeMs).toISOString();
    try {
      logger.info('delivery_validation_started', {
        component: 'validation',
        provider,
        deliveryId: id,
        archiveName: path.basename(archivePath),
        archiveBytes: stat.size,
      });
      validateZip(archivePath, config.unzipBin);
      const entries = listZipEntries(archivePath, config.unzipBin);
      const xmlEntry = XML_ENTRIES[provider];
      if (!entries.includes(xmlEntry)) throw new Error(`Missing expected XML entry: ${xmlEntry}`);
      const xml = readXmlFromZip(archivePath, xmlEntry, config.unzipBin);
      const kind = classifyDeliveryType(provider, xml);
      const { offers, agents } = parseProviderRecords(provider, xml, (validation) => {
        logger.warn('delivery_xml_validation_warning', {
          component: 'validation',
          provider,
          deliveryId: id,
          issueCount: validation.errors.length,
        });
      });
      if (kind === 'full' && offers.length === 0) throw new Error('Full delivery contains no offers');

      logger.info('delivery_validation_succeeded', {
        component: 'validation',
        provider,
        deliveryId: id,
        deliveryKind: kind,
        offerCount: offers.length,
        agentCount: agents.length,
      });

      const candidateDelivery = {
        id,
        provider,
        kind,
        offers,
        agents,
        receivedAt,
      };
      const attempt = applyDeliveryToState(state, candidateDelivery);
      if (!attempt.applied) {
        addDelivery(state, { id, provider, archivePath, receivedAt, kind, status: 'ignored', reason: attempt.reason });
        changed = true;
        report.ignored.push(archivePath);
        logger.warn('delivery_ignored', {
          component: 'ingestion',
          provider,
          deliveryId: id,
          deliveryKind: kind,
          reason: attempt.reason,
        });
        continue;
      }

      const photoCount = await materialisePhotos({ offers, agents, provider, deliveryId: id, archivePath, entries, config });
      // Materialising rewrites image paths, therefore the persisted source
      // records must be built afterwards rather than from the pre-extraction
      // validation attempt above.
      state = applyDeliveryToState(state, candidateDelivery).state;
      addDelivery(state, { id, provider, archivePath, receivedAt, kind, status: 'applied' });
      changed = true;
      report.applied.push(archivePath);
      logger.info('delivery_applied', {
        component: 'ingestion',
        provider,
        deliveryId: id,
        deliveryKind: kind,
        offerCount: offers.length,
        agentCount: agents.length,
        photoCount,
      });
    } catch (error) {
      addDelivery(state, {
        id,
        provider,
        archivePath,
        receivedAt,
        status: 'rejected',
        reason: error instanceof Error ? error.message : String(error),
      });
      changed = true;
      report.rejected.push({ archivePath, reason: error instanceof Error ? error.message : String(error) });
      logger.warn('delivery_rejected', {
        component: 'validation',
        provider,
        deliveryId: id,
        archiveName: path.basename(archivePath),
        error,
      });
    }
  }

  let published = false;
  if (changed) {
    writeOfferStateAtomic(config.statePath, state);
    published = true;
    logger.info('offer_state_published', {
      component: 'ingestion',
      aggregateCount: state.aggregates.length,
      visibleAggregateCount: state.aggregates.filter((aggregate) => aggregate.lifecycle?.isVisible).length,
    });
  }
  if (pruneDeliveries(state, config, now, logger)) {
    writeOfferStateAtomic(config.statePath, state);
    published = true;
  }
  logger.info('ingestion_run_completed', {
    component: 'ingestion',
    appliedCount: report.applied.length,
    ignoredCount: report.ignored.length,
    rejectedCount: report.rejected.length,
    skippedCount: report.skipped.length,
    statePublished: published,
    durationMs: Date.now() - startedAt,
  });
  return report;
};

const materialiseBootstrapPhotos = ({ offers, xmlPath, config }) => {
  const sourceRoot = path.resolve(path.dirname(xmlPath));
  const targetRoot = path.resolve(config.photoRoot, 'otodom-pl', 'bootstrap');
  const prefix = photoPrefix('otodom-pl');

  for (const offer of offers) {
    for (const [key, value] of Object.entries(offer.params || {})) {
      if (!/^zdjecie\d+$/i.test(key)) continue;
      const relativePath = safeZipRelativePath(String(value).startsWith(prefix) ? String(value).slice(prefix.length) : value);
      if (!relativePath) {
        delete offer.params[key];
        continue;
      }
      const sourcePath = path.resolve(sourceRoot, ...relativePath.split('/'));
      const targetPath = path.resolve(targetRoot, ...relativePath.split('/'));
      if (!sourcePath.startsWith(`${sourceRoot}${path.sep}`)
        || !targetPath.startsWith(`${targetRoot}${path.sep}`)
        || !fs.existsSync(sourcePath)
        || !fs.statSync(sourcePath).isFile()) {
        delete offer.params[key];
        continue;
      }
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      offer.params[key] = publicPhotoUrl(config, 'otodom-pl', 'bootstrap', relativePath);
    }
  }
};

/** Bootstrap the established static Otodom full XML into the new state file. */
export const bootstrapOtoDomState = ({ config, xmlPath, logger = getLogger('ingestion') }) => {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const offers = parseOtoDomXml(xml, photoPrefix('otodom-pl'), { includeInactive: true });
  if (offers.length === 0) throw new Error('Bootstrap Otodom XML contains no offers');
  materialiseBootstrapPhotos({ offers, xmlPath, config });
  const id = 'bootstrap-otodom';
  const attempt = applyDeliveryToState(readOfferState(config.statePath) || createEmptyOfferState(), {
    id,
    provider: 'otodom-pl',
    kind: 'full',
    offers,
    agents: [],
    receivedAt: new Date().toISOString(),
  });
  if (!attempt.applied) throw new Error('Unable to bootstrap Otodom state');
  addDelivery(attempt.state, {
    id,
    provider: 'otodom-pl',
    archivePath: xmlPath,
    receivedAt: new Date().toISOString(),
    kind: 'full',
    status: 'applied',
    bootstrap: true,
  });
  writeOfferStateAtomic(config.statePath, attempt.state);
  logger.info('offer_state_bootstrapped', {
    component: 'ingestion',
    provider: 'otodom-pl',
    offerCount: offers.length,
    aggregateCount: attempt.state.aggregates.length,
  });
  return attempt.state;
};

export const __private__ = {
  classifyDeliveryType,
  deliveryIdFor,
  pruneDeliveries,
  safeZipRelativePath,
};
