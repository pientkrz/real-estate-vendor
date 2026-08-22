import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createEmptyOfferState, writeOfferStateAtomic } from './offerState.js';
import {
  loadConfiguredNieruchomosciOnlineAgents,
  loadConfiguredOffers,
  loadConfiguredProviderOffers,
  loadConfiguredPropertyAggregates,
} from './offerService.js';

const originalStatePath = process.env.OFFER_STATE_PATH;
const temporaryDirectories = [];

afterEach(() => {
  if (originalStatePath === undefined) delete process.env.OFFER_STATE_PATH;
  else process.env.OFFER_STATE_PATH = originalStatePath;
  temporaryDirectories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

describe('processed offer state loader', () => {
  it('uses the materialized state instead of reading provider XML during SSR', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'offer-service-'));
    temporaryDirectories.push(directory);
    const statePath = path.join(directory, 'offers-state.json');
    const state = createEmptyOfferState();
    state.agents = [{ id: '7', name: 'Piotr Danielak', email: 'piotr@example.com' }];
    state.aggregates = [{
      id: '191-2',
      lifecycle: { state: 'active', isVisible: true },
      tab: 'domy',
      typ: 'sprzedaz',
      price: 2200000,
      currency: 'EUR',
      videoUrl: null,
      agent: state.agents[0],
      objectName: 1,
      rawDetails: {},
      params: { tytul: 'Willa', miasto: 'Kreta', powierzchnia: 220, liczbapokoi: 7 },
      location: { city: 'Kreta', country: 'Greece' },
    }];
    writeOfferStateAtomic(statePath, state);
    process.env.OFFER_STATE_PATH = statePath;

    expect(loadConfiguredPropertyAggregates()).toEqual(state.aggregates);
    expect(loadConfiguredOffers()).toEqual([
      expect.objectContaining({ id: '191-2', params: expect.objectContaining({ tytul: 'Willa' }) }),
    ]);
    expect(loadConfiguredNieruchomosciOnlineAgents()).toEqual(state.agents);
  });

  it('does not fall back to public or direct XML files before ingestion', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'offer-service-empty-'));
    temporaryDirectories.push(directory);
    process.env.OFFER_STATE_PATH = path.join(directory, 'offers-state.json');

    expect(loadConfiguredProviderOffers()).toEqual([]);
    expect(loadConfiguredPropertyAggregates()).toEqual([]);
    expect(loadConfiguredOffers()).toEqual([]);
    expect(loadConfiguredNieruchomosciOnlineAgents()).toEqual([]);
  });
});
