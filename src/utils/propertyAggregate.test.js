import { describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock('../server/logger.js', () => ({ getLogger: () => logger }));

import { buildPropertyAggregates, getCanonicalPropertyId, toOfferSummaryView, toOfferView } from './propertyAggregate.js';

const active = (provider, providerOfferId, values = {}) => ({
  id: `${provider}-${providerOfferId}`,
  provider,
  providerOfferId,
  sourceStatus: 'active',
  tab: 'mieszkania',
  typ: 'sprzedaz',
  price: 235000,
  currency: 'EUR',
  videoUrl: null,
  params: {
    miasto: 'Chania',
    opis: 'Opis nieruchomości',
    liczbapokoi: 2,
    liczbalazienek: 1,
    latitude: 35.5,
    longitude: 24.0,
    ...values.params,
  },
  location: { city: 'Chania', region: 'Kreta', country: 'Greece', ...values.location },
  ...values,
});

describe('getCanonicalPropertyId', () => {
  it('removes only Otodom apartment and house prefixes', () => {
    expect(getCanonicalPropertyId(active('otodom-pl', 'ms113-6'))).toBe('113-6');
    expect(getCanonicalPropertyId(active('otodom-pl', 'ds169-4'))).toBe('169-4');
    expect(getCanonicalPropertyId(active('oferty-net', 'ms113-6'))).toBe('ms113-6');
  });
});

describe('buildPropertyAggregates', () => {
  it('creates one rich property with provider provenance and both area meanings', () => {
    const otodom = active('otodom-pl', 'ms113-6', {
      objectName: 0,
      rawDetails: { RoomsNum: 2 },
      agent: { name: 'Wojciech Danielak', email: 'wojtek@globalshome.com', phone: '+48690048888' },
      params: { powierzchnia: 44, zdjecie1: 'https://otodom/1.jpg' },
    });
    const noe = active('nieruchomosci-online-pl', '113-6', {
      params: { powierzchnia: 52, powierzchnia_uzytkowa: 44, ulica: 'Harbor Road' },
    });
    const oferty = active('oferty-net', '113-6', {
      params: { powierzchnia: 52, rokbudowy: 2024, liczba_sypialni: 2, zdjecie1: 'https://oferty/1.jpg' },
    });

    const [aggregate] = buildPropertyAggregates([oferty, noe, otodom]);

    expect(aggregate.id).toBe('113-6');
    expect(aggregate.externalIds).toEqual({
      'otodom-pl': 'ms113-6',
      'nieruchomosci-online-pl': '113-6',
      'oferty-net': '113-6',
    });
    expect(aggregate.lifecycle).toMatchObject({ state: 'active', isVisible: true });
    expect(aggregate.property.areas).toEqual({ usableM2: 44, totalM2: 52, plotM2: undefined });
    expect(aggregate.params).toMatchObject({
      powierzchnia: 44,
      powierzchnia_uzytkowa: 44,
      powierzchnia_calkowita: 52,
      liczbasypialni: 2,
      ulica: 'Harbor Road',
      rokbudowy: 2024,
    });
    expect(aggregate.provenance['areas.usableM2']).toEqual({ provider: 'otodom-pl', sourceField: 'Area' });
    expect(aggregate.provenance['areas.totalM2']).toEqual({ provider: 'nieruchomosci-online-pl', sourceField: 'details.area' });
    expect(aggregate.property.media).toHaveLength(2);
    expect(aggregate.property.bedrooms).toBe(2);
    expect(aggregate.agent).toMatchObject({ name: 'Wojciech Danielak', email: 'wojtek@globalshome.com' });
    expect(toOfferView(aggregate).agent).toMatchObject({ name: 'Wojciech Danielak' });
    expect(toOfferView(aggregate)).not.toHaveProperty('sourceRecords');
    expect(toOfferSummaryView(aggregate).params).toMatchObject({ liczbasypialni: 2 });
    expect(toOfferSummaryView(aggregate).params.rokbudowy).toBeUndefined();
  });

  it('normalises legacy category labels in aggregates and view projections', () => {
    const [aggregate] = buildPropertyAggregates([
      active('otodom-pl', 'ms113-6', { tab: 'Apartament' }),
    ]);

    expect(aggregate.tab).toBe('mieszkania');
    expect(toOfferSummaryView({ ...aggregate, tab: 'Dom' }).tab).toBe('domy');
    expect(toOfferView({ ...aggregate, tab: 'Garaż' }).tab).toBe('garaze');
  });

  it('does not publish conflicting lifecycle states automatically', () => {
    const deletedOtodom = {
      ...active('otodom-pl', 'ms113-6'),
      sourceStatus: 'deleted',
      tab: '',
      typ: '',
      price: 0,
      currency: '',
      params: {},
      location: {},
    };
    const noe = active('nieruchomosci-online-pl', '113-6');

    const [aggregate] = buildPropertyAggregates([deletedOtodom, noe]);

    expect(aggregate.lifecycle).toMatchObject({
      state: 'conflict',
      isVisible: false,
      sourceStatuses: { 'otodom-pl': 'deleted', 'nieruchomosci-online-pl': 'active' },
    });
    expect(aggregate.conflicts[0]).toMatchObject({ field: 'lifecycle', resolvedBy: 'manual-policy-required' });
  });

  it('keeps valid provider data when one provider record cannot be aggregated', () => {
    const otodom = active('otodom-pl', 'ms113-6', { params: { powierzchnia: 44 } });
    const noe = active('nieruchomosci-online-pl', '113-6', { params: { powierzchnia: 52 } });
    const invalidOferty = active('oferty-net', '113-6');
    Object.defineProperty(invalidOferty, 'params', {
      get: () => { throw new Error('invalid provider parameters'); },
    });
    logger.warn.mockClear();

    const aggregates = buildPropertyAggregates([otodom, noe, invalidOferty]);

    expect(aggregates).toHaveLength(1);
    expect(aggregates[0].sourceRecords).toMatchObject({
      'otodom-pl': expect.any(Object),
      'nieruchomosci-online-pl': expect.any(Object),
    });
    expect(aggregates[0].sourceRecords['oferty-net']).toBeUndefined();
    expect(aggregates[0].skippedSourceRecords).toEqual([
      expect.objectContaining({ provider: 'oferty-net', providerOfferId: '113-6' }),
    ]);
    expect(logger.warn).toHaveBeenCalledWith('offer_aggregate_source_skipped', expect.objectContaining({
      provider: 'oferty-net',
      providerOfferId: '113-6',
    }));
  });
});
