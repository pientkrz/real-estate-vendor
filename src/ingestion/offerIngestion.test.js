import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyOfferState, readOfferState, writeOfferStateAtomic } from '../server/offerState.js';
import { __private__, applyDeliveryToState, replayRetainedDeliveries } from './offerIngestion.js';

const temporaryDirectories = [];
const temporaryDirectory = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'offer-ingestion-'));
  temporaryDirectories.push(directory);
  return directory;
};

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

const offer = (provider, providerOfferId, sourceStatus = 'active') => ({
  id: `${provider}-${providerOfferId}`,
  provider,
  providerOfferId,
  sourceStatus,
  tab: 'mieszkania',
  typ: 'sprzedaz',
  price: 100,
  currency: 'EUR',
  videoUrl: null,
  agent: null,
  params: { tytul: providerOfferId, miasto: 'Chania', powierzchnia: 50 },
  location: { city: 'Chania', country: 'Greece' },
});

const delivery = (provider, kind, offers, id = `${provider}-${kind}`) => ({
  id,
  provider,
  kind,
  offers,
  agents: [],
  receivedAt: '2026-08-21T00:00:00.000Z',
});

describe('FTP delivery classification', () => {
  it.each([
    ['otodom-pl', '<otoDom><ImportType>full</ImportType></otoDom>', 'full'],
    ['otodom-pl', '<otoDom><ImportType>incremental</ImportType></otoDom>', 'differential'],
    ['nieruchomosci-online-pl', '<xml><export><type>full</type></export></xml>', 'full'],
    ['nieruchomosci-online-pl', '<xml><export><type>incremental</type></export></xml>', 'differential'],
    ['oferty-net', '<plik><header><zawartosc_pliku>calosc</zawartosc_pliku></header></plik>', 'full'],
    ['oferty-net', '<plik><header><zawartosc_pliku>roznica</zawartosc_pliku></header></plik>', 'differential'],
  ])('recognises %s %s as %s', (provider, xml, expected) => {
    expect(__private__.classifyDeliveryType(provider, xml)).toBe(expected);
  });

  it('rejects documents without recognised metadata', () => {
    expect(() => __private__.classifyDeliveryType('oferty-net', '<plik><header/></plik>')).toThrow('zawartosc_pliku');
    expect(() => __private__.classifyDeliveryType('otodom-pl', '<otoDom><ImportType>surprise</ImportType></otoDom>')).toThrow('Unrecognised');
  });
});

describe('applyDeliveryToState', () => {
  it('requires a full baseline before accepting a provider differential', () => {
    const result = applyDeliveryToState(createEmptyOfferState(), delivery('otodom-pl', 'differential', [offer('otodom-pl', 'ms1')]));
    expect(result).toMatchObject({ applied: false, reason: 'awaiting-full-baseline' });
    expect(result.state.aggregates).toEqual([]);
  });

  it('can update provider records without regenerating aggregates during a preflight', () => {
    const result = applyDeliveryToState(
      createEmptyOfferState(),
      delivery('otodom-pl', 'full', [offer('otodom-pl', 'ms1')]),
      { rebuildAggregates: false },
    );

    expect(result).toMatchObject({ applied: true });
    expect(result.state.providerStates['otodom-pl'].records.ms1).toMatchObject({ sourceStatus: 'active' });
    expect(result.state.aggregates).toEqual([]);
  });

  it('replaces a provider full state while retaining tombstones for omitted offers', () => {
    const first = applyDeliveryToState(createEmptyOfferState(), delivery('otodom-pl', 'full', [offer('otodom-pl', 'ms1')], 'first')).state;
    const second = applyDeliveryToState(first, delivery('otodom-pl', 'full', [offer('otodom-pl', 'ms2')], 'second')).state;

    expect(second.providerStates['otodom-pl'].records).toMatchObject({
      ms1: { sourceStatus: 'deleted' },
      ms2: { sourceStatus: 'active' },
    });
    expect(second.providerStates['otodom-pl'].fullDeliveryId).toBe('second');
  });

  it('keeps another provider state but hides a property after the first deletion', () => {
    const otodom = applyDeliveryToState(createEmptyOfferState(), delivery('otodom-pl', 'full', [offer('otodom-pl', 'ms1')])).state;
    const withNoe = applyDeliveryToState(otodom, delivery('nieruchomosci-online-pl', 'full', [offer('nieruchomosci-online-pl', '1')])).state;
    const updated = applyDeliveryToState(withNoe, delivery('nieruchomosci-online-pl', 'differential', [offer('nieruchomosci-online-pl', '1', 'deleted')])).state;

    expect(updated.providerStates['otodom-pl'].records.ms1.sourceStatus).toBe('active');
    expect(updated.aggregates).toHaveLength(1);
    expect(updated.aggregates[0].lifecycle).toMatchObject({ state: 'conflict', isVisible: false });
  });
});

describe('delivery retention', () => {
  it('keeps one full cycle and removes the preceding full, differential, and expired rejection', () => {
    const root = temporaryDirectory();
    const inbox = path.join(root, 'otodom-pl');
    const photoRoot = path.join(root, 'photos');
    fs.mkdirSync(inbox, { recursive: true });
    const oldFull = path.join(inbox, 'old-full.zip');
    const oldDelta = path.join(inbox, 'old-delta.zip');
    const newFull = path.join(inbox, 'new-full.zip');
    const rejected = path.join(inbox, 'rejected.zip');
    [oldFull, oldDelta, newFull, rejected].forEach((file) => fs.writeFileSync(file, 'zip'));

    const state = createEmptyOfferState();
    state.deliveries = [
      { id: 'old-full', provider: 'otodom-pl', archivePath: oldFull, receivedAt: '2026-08-01T00:00:00.000Z', kind: 'full', status: 'applied' },
      { id: 'old-delta', provider: 'otodom-pl', archivePath: oldDelta, receivedAt: '2026-08-02T00:00:00.000Z', kind: 'differential', status: 'applied' },
      { id: 'new-full', provider: 'otodom-pl', archivePath: newFull, receivedAt: '2026-08-03T00:00:00.000Z', kind: 'full', status: 'applied' },
      { id: 'rejected', provider: 'otodom-pl', archivePath: rejected, receivedAt: '2026-08-01T00:00:00.000Z', status: 'rejected' },
    ];

    expect(__private__.pruneDeliveries(state, {
      providerDirectories: { 'otodom-pl': inbox },
      photoRoot,
      retainedFullCycles: 1,
      rejectedRetentionDays: 3,
    }, new Date('2026-08-10T00:00:00.000Z'))).toBe(true);

    expect(fs.existsSync(oldFull)).toBe(false);
    expect(fs.existsSync(oldDelta)).toBe(false);
    expect(fs.existsSync(rejected)).toBe(false);
    expect(fs.existsSync(newFull)).toBe(true);
  });

  it('does not treat the local bootstrap as an FTP retention cycle', () => {
    const root = temporaryDirectory();
    const inbox = path.join(root, 'otodom-pl');
    const photoRoot = path.join(root, 'photos');
    fs.mkdirSync(inbox, { recursive: true });
    const actualFull = path.join(inbox, 'actual-full.zip');
    fs.writeFileSync(actualFull, 'zip');

    const state = createEmptyOfferState();
    state.deliveries = [
      { id: 'bootstrap-otodom', provider: 'otodom-pl', archivePath: path.join(root, 'legacy.xml'), receivedAt: '2026-08-21T12:00:00.000Z', kind: 'full', status: 'applied', bootstrap: true },
      { id: 'actual-full', provider: 'otodom-pl', archivePath: actualFull, receivedAt: '2026-08-21T08:00:00.000Z', kind: 'full', status: 'applied' },
    ];

    __private__.pruneDeliveries(state, {
      providerDirectories: { 'otodom-pl': inbox },
      photoRoot,
      retainedFullCycles: 1,
      rejectedRetentionDays: 3,
    }, new Date('2026-08-21T13:00:00.000Z'));

    expect(fs.existsSync(actualFull)).toBe(true);
  });
});

describe('retained delivery replay', () => {
  const replayLogger = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  const replayConfig = (root, providers = { 'otodom-pl': path.join(root, 'otodom-pl') }) => ({
    statePath: path.join(root, 'offers-state.json'),
    providerDirectories: providers,
    photoRoot: path.join(root, 'photos'),
    photoPublicBasePath: '/offer-photos',
  });

  it('replays the retained full delivery and later differential without changing other providers', async () => {
    const root = temporaryDirectory();
    const config = replayConfig(root, {
      'otodom-pl': path.join(root, 'otodom-pl'),
      'oferty-net': path.join(root, 'oferty-net'),
    });
    let state = applyDeliveryToState(createEmptyOfferState(), delivery('otodom-pl', 'full', [offer('otodom-pl', 'ms1')], 'old-state')).state;
    state = applyDeliveryToState(state, delivery('oferty-net', 'full', [offer('oferty-net', '1')], 'oferty-state')).state;
    state.deliveries = [
      { id: 'oto-full', provider: 'otodom-pl', archivePath: path.join(root, 'otodom-full.zip'), receivedAt: '2026-08-20T00:00:00.000Z', kind: 'full', status: 'applied' },
      { id: 'oto-delta', provider: 'otodom-pl', archivePath: path.join(root, 'otodom-delta.zip'), receivedAt: '2026-08-20T01:00:00.000Z', kind: 'differential', status: 'applied' },
    ];
    writeOfferStateAtomic(config.statePath, state);
    const reader = vi.fn(async ({ archivePath }) => {
      const isDelta = archivePath.endsWith('otodom-delta.zip');
      return {
        kind: isDelta ? 'differential' : 'full',
        offers: [offer('otodom-pl', 'ms1', 'active')],
        agents: [],
        entries: [],
      };
    });
    const materialise = vi.fn(async () => 0);

    const report = await replayRetainedDeliveries({
      config,
      logger: replayLogger(),
      readDelivery: reader,
      materialise,
    });
    const replayed = readOfferState(config.statePath);

    expect(report).toMatchObject({ applied: ['otodom-pl'], skipped: ['oferty-net'], failed: [], statePublished: true });
    expect(reader).toHaveBeenCalledTimes(2);
    expect(materialise).toHaveBeenCalledTimes(2);
    expect(replayed.providerStates['otodom-pl'].fullDeliveryId).toBe('oto-full');
    expect(replayed.providerStates['oferty-net']).toEqual(state.providerStates['oferty-net']);
    expect(replayed.deliveries).toEqual(state.deliveries);
  });

  it('does not overwrite a provider when its retained ZIP cannot be read', async () => {
    const root = temporaryDirectory();
    const config = replayConfig(root);
    const state = applyDeliveryToState(createEmptyOfferState(), delivery('otodom-pl', 'full', [offer('otodom-pl', 'ms1')], 'old-state')).state;
    state.deliveries = [
      { id: 'broken-full', provider: 'otodom-pl', archivePath: path.join(root, 'missing.zip'), receivedAt: '2026-08-20T00:00:00.000Z', kind: 'full', status: 'applied' },
    ];
    writeOfferStateAtomic(config.statePath, state);

    const report = await replayRetainedDeliveries({
      config,
      logger: replayLogger(),
      readDelivery: async () => { throw new Error('corrupt zip'); },
      materialise: async () => 0,
    });

    expect(report).toMatchObject({ applied: [], failed: ['otodom-pl'], statePublished: false });
    expect(readOfferState(config.statePath)).toEqual(state);
  });
});
