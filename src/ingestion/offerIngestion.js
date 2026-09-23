/**
 * The FTP inbox worker. It intentionally has no network server or database:
 * cron starts it, it processes settled ZIP files once, and atomically publishes
 * a JSON snapshot that the Astro SSR app can safely read.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
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
const require = createRequire(import.meta.url);
let sharpModule;
const getSharp = () => {
  if (!sharpModule) sharpModule = require('sharp');
  return sharpModule;
};

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

const parseProviderRecords = (provider, xml, { onValidation, onUnknownObjectName } = {}) => {
  const prefix = photoPrefix(provider);
  if (provider === 'otodom-pl') {
    return {
      offers: parseOtoDomXml(xml, prefix, {
        includeInactive: true,
        onValidation,
        onUnknownObjectName,
      }),
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
  locationSources: {},
  rawDetails: null,
});

const cloneState = (state) => JSON.parse(JSON.stringify(state));

const rebuildStateAggregates = (state) => {
  state.aggregates = buildPropertyAggregates(
    Object.values(state.providerStates).flatMap((providerState) => Object.values(providerState.records || {})),
  );
  state.generatedAt = new Date().toISOString();
  return state;
};

/** Exported for focused tests: applies a normalised delivery without file I/O. */
export const applyDeliveryToState = (existingState, delivery, { rebuildAggregates = true } = {}) => {
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
  if (rebuildAggregates) rebuildStateAggregates(state);
  return { state, applied: true };
};

const findZipPhotoEntry = (reference, imageEntries) => {
  const direct = safeZipRelativePath(reference);
  if (direct && imageEntries.includes(direct)) return direct;
  const baseName = path.posix.basename(direct || '');
  const sameBaseName = imageEntries.filter((entry) => path.posix.basename(entry) === baseName);
  return sameBaseName.length === 1 ? sameBaseName[0] : undefined;
};

const currentPhotoRoot = (config, provider) => path.resolve(config.photoRoot, provider, 'current');

const publicPhotoUrl = (config, provider, fileName) => (
  `${config.photoPublicBasePath}/${encodeURIComponent(provider)}/current/${encodeURIComponent(fileName)}`
);

const isPathInside = (candidate, root) => candidate === root || candidate.startsWith(`${root}${path.sep}`);

const currentPhotoPath = (config, provider, fileName) => {
  const root = currentPhotoRoot(config, provider);
  const candidate = path.resolve(root, fileName);
  if (!isPathInside(candidate, root)) throw new Error('Unsafe current photo path');
  return candidate;
};

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
  const storedEntries = new Map();
  const createdPaths = [];
  const prefix = photoPrefix(provider);
  const stagingRoot = path.resolve(config.photoRoot, '.staging', `${process.pid}-${deliveryId}-${Date.now()}`);

  const publishFile = (sourcePath, targetPath) => {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(sourcePath, { force: true });
      return;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.renameSync(sourcePath, targetPath);
    createdPaths.push(targetPath);
  };

  const storeEntry = async (entry) => {
    if (storedEntries.has(entry)) return storedEntries.get(entry);
    const stagingPath = path.resolve(stagingRoot, `${storedEntries.size}${path.extname(entry).toLowerCase()}`);
    if (!isPathInside(stagingPath, stagingRoot)) throw new Error('Unsafe photo staging path');
    await extractZipEntry(archivePath, entry, stagingPath, config.unzipBin);
    const sourceBytes = fs.readFileSync(stagingPath);
    const sourceHash = crypto.createHash('sha256').update(sourceBytes).digest('hex');
    const sourceExtension = path.extname(entry).toLowerCase();
    let metadata;
    try {
      metadata = await getSharp()(sourceBytes, { animated: false }).metadata();
    } catch {
      metadata = undefined;
    }

    const variants = [];
    if (metadata?.width && ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(sourceExtension)) {
      for (const width of config.photoVariantWidths) {
        if (width > metadata.width) continue;
        const fileName = `${sourceHash}-${width}.webp`;
        const targetPath = currentPhotoPath(config, provider, fileName);
        const variantStagingPath = path.resolve(stagingRoot, `${storedEntries.size}-${width}.webp`);
        await getSharp()(sourceBytes, { animated: false })
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: config.photoWebpQuality })
          .toFile(variantStagingPath);
        publishFile(variantStagingPath, targetPath);
        variants.push({ width, url: publicPhotoUrl(config, provider, fileName) });
      }
    }

    if (variants.length > 0) {
      fs.rmSync(stagingPath, { force: true });
    } else {
      const fileName = `${sourceHash}${sourceExtension}`;
      publishFile(stagingPath, currentPhotoPath(config, provider, fileName));
      variants.push({ width: metadata?.width || 0, url: publicPhotoUrl(config, provider, fileName) });
    }

    const defaultVariant = [...variants].sort((left, right) => right.width - left.width)[0];
    const asset = { defaultUrl: defaultVariant.url, variants };
    storedEntries.set(entry, asset);
    return asset;
  };

  const replaceReference = (reference) => {
    const rawReference = String(reference ?? '');
    const sourceReference = rawReference.startsWith(prefix) ? rawReference.slice(prefix.length) : rawReference;
    const entry = findZipPhotoEntry(sourceReference, imageEntries);
    if (!entry) return undefined;
    resolvedEntries.add(entry);
    return entry;
  };

  try {
    for (const offer of offers) {
      for (const [key, value] of Object.entries(offer.params || {})) {
        if (!/^zdjecie\d+$/i.test(key)) continue;
        const resolved = replaceReference(value);
        if (resolved) {
          const asset = await storeEntry(resolved);
          offer.params[key] = asset.defaultUrl;
          offer.photoVariants = { ...(offer.photoVariants || {}), [key]: asset.variants };
        }
        else delete offer.params[key];
      }
    }
    for (const agent of agents) {
      if (!agent?.image) continue;
      const resolved = replaceReference(agent.image);
      if (resolved) {
        const asset = await storeEntry(resolved);
        agent.image = asset.defaultUrl;
        agent.imageVariants = asset.variants;
      }
      else delete agent.image;
    }
    return { photoCount: resolvedEntries.size, createdPaths };
  } catch (error) {
    createdPaths.forEach((photoPath) => fs.rmSync(photoPath, { force: true }));
    throw error;
  } finally {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
  }
};

const copyToCurrentPhotoStore = (config, provider, sourcePath, createdPaths = []) => {
  const extension = path.extname(sourcePath).toLowerCase();
  if (!IMAGE_EXTENSION.test(extension)) throw new Error('Unsupported current photo extension');
  const contents = fs.readFileSync(sourcePath);
  const fileName = `${crypto.createHash('sha256').update(contents).digest('hex')}${extension}`;
  const targetPath = currentPhotoPath(config, provider, fileName);
  if (!fs.existsSync(targetPath)) {
    const temporaryPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(temporaryPath, contents);
    fs.renameSync(temporaryPath, targetPath);
    createdPaths.push(targetPath);
  }
  return publicPhotoUrl(config, provider, fileName);
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

const pruneDeliveries = (state, config, now, logger) => {
  let changed = false;
  for (const [provider, directory] of Object.entries(config.providerDirectories)) {
    const providerDeliveries = state.deliveries.filter((delivery) => delivery.provider === provider && !delivery.purged);
    const successfulFull = providerDeliveries
      // Bootstrap is a local compatibility seed, not an FTP recovery cycle.
      // It must never cause a real full archive to be discarded by retention.
      .filter((delivery) => delivery.status === 'applied' && delivery.kind === 'full' && !delivery.bootstrap)
      .sort((left, right) => Date.parse(right.receivedAt) - Date.parse(left.receivedAt));
    const newestFull = successfulFull[0];

    for (const delivery of providerDeliveries) {
      const ageHours = (now.getTime() - Date.parse(delivery.receivedAt)) / (60 * 60 * 1000);
      const isOldFull = delivery.status === 'applied' && delivery.kind === 'full' && !delivery.bootstrap
        && newestFull && delivery.id !== newestFull.id;
      const isExpiredDifferential = ['applied', 'ignored'].includes(delivery.status)
        && delivery.kind === 'differential'
        && ageHours >= config.differentialRetentionHours;
      const isExpiredRejected = delivery.status === 'rejected'
        && ageHours >= config.rejectedRetentionHours;
      if (!isOldFull && !isExpiredDifferential && !isExpiredRejected) continue;
      const reason = isOldFull ? 'superseded-full' : isExpiredDifferential ? 'differential-expired' : 'rejected-expired';
      const archiveExisted = fs.existsSync(delivery.archivePath);
      if (safelyUnlink(delivery.archivePath, directory, logger)) {
        delivery.purged = true;
        changed = true;
        logger?.info(archiveExisted ? 'delivery_retention_removed' : 'delivery_archive_reconciled', {
          component: 'retention',
          provider,
          deliveryId: delivery.id,
          archiveName: path.basename(delivery.archivePath),
          status: delivery.status,
          retentionReason: reason,
        });
      }
    }
  }
  return changed;
};

const referencedCurrentPhotoPaths = (state, config, provider) => {
  const prefix = `${config.photoPublicBasePath}/${encodeURIComponent(provider)}/current/`;
  const references = new Set();
  const visit = (value) => {
    if (typeof value === 'string' && value.startsWith(prefix)) {
      try {
        references.add(currentPhotoPath(config, provider, decodeURIComponent(value.slice(prefix.length))));
      } catch {
        // Invalid URLs remain unreachable and are deliberately not retained.
      }
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(state);
  return references;
};

const walkFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : entry.isFile() ? [entryPath] : [];
  });
};

const sweepCurrentPhotos = (state, config, logger) => {
  const report = { filesRemoved: 0, bytesRemoved: 0 };
  for (const provider of Object.keys(config.providerDirectories)) {
    const root = currentPhotoRoot(config, provider);
    const referenced = referencedCurrentPhotoPaths(state, config, provider);
    for (const photoPath of walkFiles(root)) {
      if (referenced.has(photoPath)) continue;
      try {
        report.bytesRemoved += fs.statSync(photoPath).size;
        fs.rmSync(photoPath, { force: true });
        report.filesRemoved += 1;
      } catch (error) {
        logger?.warn('current_photo_sweep_remove_failed', { component: 'photos', provider, error });
      }
    }
    for (const directory of walkFiles(root).map((file) => path.dirname(file)).sort((left, right) => right.length - left.length)) {
      try { fs.rmdirSync(directory); } catch { /* non-empty directories are expected */ }
    }
  }
  logger?.info('current_photo_sweep_completed', { component: 'photos', ...report });
  return report;
};

const migrateLegacyPhotoValue = (value, config, provider, createdPaths) => {
  if (typeof value !== 'string') return value;
  const prefix = `${config.photoPublicBasePath}/${encodeURIComponent(provider)}/`;
  if (!value.startsWith(prefix) || value.startsWith(`${prefix}current/`)) return value;
  const parts = value.slice(prefix.length).split('/').map((part) => decodeURIComponent(part));
  if (parts.length < 2 || parts.some((part) => !part || part === '.' || part === '..')) {
    throw new Error('Invalid legacy photo URL during compaction');
  }
  const providerRoot = path.resolve(config.photoRoot, provider);
  const sourcePath = path.resolve(providerRoot, ...parts);
  if (!isPathInside(sourcePath, providerRoot) || !fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw new Error('Legacy photo referenced by state is unavailable');
  }
  return copyToCurrentPhotoStore(config, provider, sourcePath, createdPaths);
};

const migrateLegacyPhotoUrls = (value, config, provider, createdPaths) => {
  if (Array.isArray(value)) return value.map((item) => migrateLegacyPhotoUrls(item, config, provider, createdPaths));
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, migrateLegacyPhotoUrls(item, config, provider, createdPaths)]),
  );
  return migrateLegacyPhotoValue(value, config, provider, createdPaths);
};

const removeLegacyPhotoDirectories = (config, provider) => {
  const providerRoot = path.resolve(config.photoRoot, provider);
  if (!fs.existsSync(providerRoot)) return { directoriesRemoved: 0, bytesRemoved: 0 };
  let directoriesRemoved = 0;
  let bytesRemoved = 0;
  for (const entry of fs.readdirSync(providerRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'current') continue;
    const target = path.resolve(providerRoot, entry.name);
    if (!isPathInside(target, providerRoot)) continue;
    for (const filePath of walkFiles(target)) bytesRemoved += fs.statSync(filePath).size;
    fs.rmSync(target, { recursive: true, force: true });
    directoriesRemoved += 1;
  }
  return { directoriesRemoved, bytesRemoved };
};

/**
 * One-time migration for a deployment that used delivery-ID photo folders.
 * It is deliberately explicit: normal cron ingestion never removes legacy
 * folders until this command has made every active reference content-addressed.
 */
export const compactCurrentPhotos = ({ config, now = new Date(), logger = getLogger('ingestion') } = {}) => {
  const current = readOfferState(config?.statePath);
  const report = { migratedFiles: 0, legacyDirectoriesRemoved: 0, legacyBytesRemoved: 0, reconciledDeliveries: 0 };
  if (!current) {
    logger.warn('photo_compaction_skipped', { component: 'photos', reason: 'missing-state' });
    return report;
  }

  const candidate = cloneState(current);
  const createdPaths = [];
  try {
    for (const provider of Object.keys(config.providerDirectories)) {
      const before = createdPaths.length;
      const migrated = migrateLegacyPhotoUrls(candidate, config, provider, createdPaths);
      Object.assign(candidate, migrated);
      report.migratedFiles += createdPaths.length - before;
    }
    for (const provider of Object.keys(config.providerDirectories)) {
      for (const photoPath of referencedCurrentPhotoPaths(candidate, config, provider)) {
        if (!fs.existsSync(photoPath)) throw new Error('Current photo verification failed');
      }
    }
  } catch (error) {
    createdPaths.forEach((photoPath) => fs.rmSync(photoPath, { force: true }));
    logger.error('photo_compaction_failed', { component: 'photos', error });
    throw error;
  }

  for (const delivery of candidate.deliveries) {
    if (!delivery.purged && delivery.archivePath && !fs.existsSync(delivery.archivePath)) {
      delivery.purged = true;
      report.reconciledDeliveries += 1;
      logger.info('delivery_archive_reconciled', {
        component: 'retention', provider: delivery.provider, deliveryId: delivery.id, retentionReason: 'archive-already-missing',
      });
    }
  }
  writeOfferStateAtomic(config.statePath, candidate);
  sweepCurrentPhotos(candidate, config, logger);
  for (const provider of Object.keys(config.providerDirectories)) {
    const removed = removeLegacyPhotoDirectories(config, provider);
    report.legacyDirectoriesRemoved += removed.directoriesRemoved;
    report.legacyBytesRemoved += removed.bytesRemoved;
  }
  if (pruneDeliveries(candidate, config, now, logger)) writeOfferStateAtomic(config.statePath, candidate);
  logger.info('photo_compaction_completed', { component: 'photos', ...report });
  return report;
};

const readRetainedDelivery = ({ provider, archivePath, deliveryId, expectedKind, config, logger }) => {
  validateZip(archivePath, config.unzipBin);
  const entries = listZipEntries(archivePath, config.unzipBin);
  const xmlEntry = XML_ENTRIES[provider];
  if (!entries.includes(xmlEntry)) throw new Error(`Missing expected XML entry: ${xmlEntry}`);
  const xml = readXmlFromZip(archivePath, xmlEntry, config.unzipBin);
  const kind = classifyDeliveryType(provider, xml);
  if (kind !== expectedKind) throw new Error(`Retained ZIP type ${kind} does not match recorded ${expectedKind} delivery`);
  const { offers, agents } = parseProviderRecords(provider, xml, {
    onValidation: (validation) => {
      logger.warn('delivery_xml_validation_warning', {
        component: 'validation',
        provider,
        deliveryId,
        issueCount: validation.errors.length,
      });
    },
    onUnknownObjectName: ({ objectName, providerOfferId }) => {
      logger.warn('otodom_unknown_object_name', {
        component: 'parsing',
        provider,
        deliveryId,
        providerOfferId,
        objectName,
      });
    },
  });
  if (kind === 'full' && offers.length === 0) throw new Error('Full delivery contains no offers');
  return { kind, offers, agents, entries };
};

const locationSourceCounts = (offers) => offers.reduce((counts, offer) => {
  for (const field of ['country', 'region', 'city']) {
    const source = offer.locationSources?.[field]?.source;
    if (source && Object.hasOwn(counts, source)) counts[source] += 1;
    if (offer.locationSources?.[field]?.legacy) counts.legacy += 1;
  }
  return counts;
}, { xml: 0, coordinates: 0, legacy: 0 });

const retainedCycle = (state, provider) => {
  const deliveries = state.deliveries
    .filter((delivery) => (
      delivery.provider === provider
      && delivery.status === 'applied'
      && !delivery.bootstrap
      && ['full', 'differential'].includes(delivery.kind)
      && delivery.archivePath
    ))
    .sort((left, right) => Date.parse(left.receivedAt) - Date.parse(right.receivedAt));
  const fullIndex = deliveries.map((delivery) => delivery.kind).lastIndexOf('full');
  if (fullIndex === -1) return { deliveries: [], reason: 'no-retained-full-cycle' };
  const cycle = deliveries.slice(fullIndex);
  const unavailable = cycle.some((delivery) => delivery.purged || !fs.existsSync(delivery.archivePath));
  return unavailable
    ? { deliveries: [], reason: 'incomplete-retained-history' }
    : { deliveries: cycle };
};

/**
 * Rebuild provider snapshots from the single retained full delivery and its
 * later differentials. A provider failure leaves its current records intact;
 * the combined replacement remains a single atomic state-file publish.
 */
export const replayRetainedDeliveries = async ({
  config,
  logger = getLogger('ingestion'),
  readDelivery = readRetainedDelivery,
  materialise = materialisePhotos,
} = {}) => {
  const current = readOfferState(config?.statePath);
  const report = { applied: [], skipped: [], failed: [], statePublished: false };
  if (!current) {
    logger.warn('location_replay_skipped', { component: 'location-replay', reason: 'missing-state' });
    return report;
  }

  const candidate = cloneState(current);
  const providers = Object.keys(config.providerDirectories);
  logger.info('location_replay_started', {
    component: 'location-replay',
    providerCount: providers.length,
  });

  for (const provider of providers) {
    const retained = retainedCycle(current, provider);
    const cycle = retained.deliveries;
    if (cycle.length === 0) {
      report.skipped.push(provider);
      logger.warn('location_replay_provider_skipped', {
        component: 'location-replay',
        provider,
        reason: retained.reason,
      });
      continue;
    }

    try {
      let restored = createEmptyOfferState();
      let counts = { xml: 0, coordinates: 0, legacy: 0 };
      for (const delivery of cycle) {
        const parsed = await readDelivery({
          provider,
          archivePath: delivery.archivePath,
          deliveryId: delivery.id,
          expectedKind: delivery.kind,
          config,
          logger,
        });
        const candidateDelivery = {
          id: delivery.id,
          provider,
          kind: parsed.kind,
          offers: parsed.offers,
          agents: parsed.agents,
          receivedAt: delivery.receivedAt,
        };
        const preflight = applyDeliveryToState(restored, candidateDelivery, { rebuildAggregates: false });
        if (!preflight.applied) throw new Error(`Cannot replay ${delivery.kind}: ${preflight.reason}`);
        await materialise({
          offers: parsed.offers,
          agents: parsed.agents,
          provider,
          deliveryId: delivery.id,
          archivePath: delivery.archivePath,
          entries: parsed.entries,
          config,
        });
        restored = applyDeliveryToState(restored, candidateDelivery, { rebuildAggregates: false }).state;
        const deliveryCounts = locationSourceCounts(parsed.offers);
        counts = Object.fromEntries(Object.keys(counts).map((key) => [key, counts[key] + deliveryCounts[key]]));
      }

      candidate.providerStates[provider] = restored.providerStates[provider];
      if (provider === 'nieruchomosci-online-pl') candidate.agents = restored.agents;
      report.applied.push(provider);
      logger.info('location_replay_provider_applied', {
        component: 'location-replay',
        provider,
        fullDeliveryId: cycle[0].id,
        deliveryCount: cycle.length,
        offerCount: Object.keys(restored.providerStates[provider]?.records || {}).length,
        locationSources: counts,
      });
    } catch (error) {
      report.failed.push(provider);
      logger.error('location_replay_provider_failed', {
        component: 'location-replay',
        provider,
        fullDeliveryId: cycle[0].id,
        error,
      });
    }
  }

  if (report.applied.length > 0) {
    rebuildStateAggregates(candidate);
    writeOfferStateAtomic(config.statePath, candidate);
    sweepCurrentPhotos(candidate, config, logger);
    report.statePublished = true;
  }
  logger.info('location_replay_completed', {
    component: 'location-replay',
    appliedProviderCount: report.applied.length,
    skippedProviderCount: report.skipped.length,
    failedProviderCount: report.failed.length,
    statePublished: report.statePublished,
  });
  return report;
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
  const unpublishedPhotoPaths = [];
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
      const { offers, agents } = parseProviderRecords(provider, xml, {
        onValidation: (validation) => {
          logger.warn('delivery_xml_validation_warning', {
            component: 'validation',
            provider,
            deliveryId: id,
            issueCount: validation.errors.length,
          });
        },
        onUnknownObjectName: ({ objectName, providerOfferId }) => {
          logger.warn('otodom_unknown_object_name', {
            component: 'parsing',
            provider,
            deliveryId: id,
            providerOfferId,
            objectName,
          });
        },
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
      const attempt = applyDeliveryToState(state, candidateDelivery, { rebuildAggregates: false });
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

      const photoAssets = await materialisePhotos({ offers, agents, provider, deliveryId: id, archivePath, entries, config });
      unpublishedPhotoPaths.push(...(photoAssets?.createdPaths || []));
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
        photoCount: photoAssets?.photoCount || 0,
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
    try {
      writeOfferStateAtomic(config.statePath, state);
    } catch (error) {
      unpublishedPhotoPaths.forEach((photoPath) => fs.rmSync(photoPath, { force: true }));
      logger.warn('photo_staging_cleanup_completed', {
        component: 'photos',
        reason: 'state-publication-failed',
        fileCount: unpublishedPhotoPaths.length,
      });
      throw error;
    }
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
  if (published) sweepCurrentPhotos(state, config, logger);
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
      if (!sourcePath.startsWith(`${sourceRoot}${path.sep}`)
        || !fs.existsSync(sourcePath)
        || !fs.statSync(sourcePath).isFile()) {
        delete offer.params[key];
        continue;
      }
      offer.params[key] = copyToCurrentPhotoStore(config, 'otodom-pl', sourcePath);
    }
  }
};

/** Bootstrap the established static Otodom full XML into the new state file. */
export const bootstrapOtoDomState = ({ config, xmlPath, logger = getLogger('ingestion') }) => {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const offers = parseOtoDomXml(xml, photoPrefix('otodom-pl'), {
    includeInactive: true,
    onUnknownObjectName: ({ objectName, providerOfferId }) => {
      logger.warn('otodom_unknown_object_name', {
        component: 'parsing',
        provider: 'otodom-pl',
        providerOfferId,
        objectName,
      });
    },
  });
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
