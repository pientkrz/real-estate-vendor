/**
 * Creates a provider-independent representation of one real-estate offer.
 *
 * XML parsers remain adapters: they retain the provider record in
 * `sourceRecords`, while this module owns the deterministic ID matching and
 * field-resolution rules used by the application.
 */

const PROVIDER_PRIORITY = Object.freeze([
  'otodom-pl',
  'nieruchomosci-online-pl',
  'oferty-net',
]);

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const numericValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
};

const normaliseForComparison = (value) => {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ').toLowerCase();
  return JSON.stringify(value);
};

const sourceStatus = (record) => record.sourceStatus ?? 'active';

const ordered = (records) => [...records].sort(
  (left, right) => {
    const leftPriority = PROVIDER_PRIORITY.indexOf(left.provider);
    const rightPriority = PROVIDER_PRIORITY.indexOf(right.provider);
    return (leftPriority === -1 ? PROVIDER_PRIORITY.length : leftPriority)
      - (rightPriority === -1 ? PROVIDER_PRIORITY.length : rightPriority);
  },
);

/**
 * Returns the cross-provider identity used for matching a single property.
 * Otodom prefixes the otherwise shared agency ID by the object kind (`ms` / `ds`).
 */
export const getCanonicalPropertyId = (record) => {
  const sourceId = String(record?.providerOfferId ?? '').trim();
  if (!sourceId) return '';
  if (record.provider === 'otodom-pl') return sourceId.replace(/^(?:ms|ds)/i, '');
  return sourceId;
};

const resolveLifecycle = (records) => {
  const states = Object.fromEntries(records.map((record) => [record.provider, sourceStatus(record)]));
  const statuses = Object.values(states);
  const hasActive = statuses.includes('active');
  const hasInactive = statuses.some((status) => status !== 'active');
  const state = hasActive && hasInactive ? 'conflict' : hasActive ? 'active' : 'inactive';

  return {
    state,
    sourceStatuses: states,
    // A conflict is deliberately not published until a provider-precedence or
    // timestamp policy is agreed. This prevents a recently deleted offer from
    // being advertised merely because another FTP snapshot is stale.
    isVisible: state === 'active',
  };
};

const selectValue = (records, field, getValue, sourceField, conflicts) => {
  const candidates = ordered(records)
    .map((record) => ({
      record,
      value: getValue(record),
      sourceField: typeof sourceField === 'function' ? sourceField(record) : sourceField,
    }))
    .filter((candidate) => hasValue(candidate.value));

  if (candidates.length === 0) return { value: undefined, provenance: undefined };

  const distinctValues = new Map();
  for (const candidate of candidates) {
    const fingerprint = normaliseForComparison(candidate.value);
    if (!distinctValues.has(fingerprint)) {
      distinctValues.set(fingerprint, {
        provider: candidate.record.provider,
        value: candidate.value,
        sourceField: candidate.sourceField,
      });
    }
  }
  if (distinctValues.size > 1) {
    conflicts.push({
      field,
      values: [...distinctValues.values()],
      resolvedBy: candidates[0].record.provider,
    });
  }

  return {
    value: candidates[0].value,
    provenance: {
      provider: candidates[0].record.provider,
      sourceField: candidates[0].sourceField,
    },
  };
};

const setResolvedValue = (target, provenance, conflicts, records, field, getValue, sourceField) => {
  const selected = selectValue(records, field, getValue, sourceField, conflicts);
  if (selected.value !== undefined) {
    target[field] = selected.value;
    provenance[field] = selected.provenance;
  }
  return selected.value;
};

const providerPhotos = (record) => Object.entries(record.params ?? {})
  .filter(([key, value]) => /^zdjecie\d+$/i.test(key) && hasValue(value))
  .sort(([left], [right]) => Number(left.match(/\d+/)?.[0]) - Number(right.match(/\d+/)?.[0]))
  .map(([, url], index) => ({ url, position: index + 1, provider: record.provider }));

const resolveParams = (activeRecords, provenance, conflicts) => {
  const params = {};
  const paramNames = new Set(activeRecords.flatMap((record) => Object.keys(record.params ?? {})));

  for (const name of paramNames) {
    const selected = selectValue(
      activeRecords,
      `attributes.${name}`,
      (record) => record.params?.[name],
      `params.${name}`,
      conflicts,
    );
    if (selected.value !== undefined) {
      params[name] = selected.value;
      provenance[`attributes.${name}`] = selected.provenance;
    }
  }

  const usableM2 = setResolvedValue(
    {},
    provenance,
    conflicts,
    activeRecords,
    'areas.usableM2',
    (record) => record.provider === 'otodom-pl'
      ? numericValue(record.params?.powierzchnia)
      : numericValue(record.params?.powierzchnia_uzytkowa),
    (record) => record.provider === 'otodom-pl' ? 'Area' : 'details.areaUse',
  );
  const totalM2 = setResolvedValue(
    {},
    provenance,
    conflicts,
    activeRecords,
    'areas.totalM2',
    (record) => record.provider === 'otodom-pl' ? undefined : numericValue(record.params?.powierzchnia),
    (record) => record.provider === 'nieruchomosci-online-pl' ? 'details.area' : 'param.powierzchnia',
  );
  const plotM2 = setResolvedValue(
    {},
    provenance,
    conflicts,
    activeRecords,
    'areas.plotM2',
    (record) => record.provider === 'otodom-pl'
      ? numericValue(record.rawDetails?.TerrainArea)
      : numericValue(record.params?.powierzchnia_dzialki),
    (record) => record.provider === 'otodom-pl' ? 'HouseDetails.TerrainArea' : 'details.areaPlot',
  );

  // The existing components consume `powierzchnia` as the main living area.
  // Keep it backward-compatible while retaining both meanings explicitly.
  if (usableM2) params.powierzchnia = usableM2;
  else if (totalM2) params.powierzchnia = totalM2;
  if (usableM2) params.powierzchnia_uzytkowa = usableM2;
  if (totalM2) params.powierzchnia_calkowita = totalM2;
  if (plotM2) params.powierzchnia_dzialki = plotM2;

  return { params, areas: { usableM2, totalM2, plotM2 } };
};

const buildSourceRecords = (records) => Object.fromEntries(records.map((record) => [record.provider, record]));

const recordReference = (record) => {
  try {
    return {
      provider: String(record?.provider ?? 'unknown'),
      providerOfferId: String(record?.providerOfferId ?? record?.id ?? 'unknown'),
    };
  } catch {
    return { provider: 'unknown', providerOfferId: 'unknown' };
  }
};

const aggregationFailure = (record, error) => ({
  ...recordReference(record),
  reason: error instanceof Error ? error.message : String(error),
});

/**
 * Build an aggregate from known-good provider records. This function is kept
 * separate from the fault-tolerant wrapper so one failing record can be
 * isolated without losing its valid siblings.
 */
const buildPropertyAggregate = (id, allRecords) => {
    const records = ordered(allRecords);
    const activeRecords = records.filter((record) => sourceStatus(record) === 'active');
    const candidates = activeRecords.length > 0 ? activeRecords : records;
    const conflicts = [];
    const provenance = {};
    const scalar = {};

    const tab = setResolvedValue(scalar, provenance, conflicts, candidates, 'category', (record) => record.tab, 'category');
    const typ = setResolvedValue(scalar, provenance, conflicts, candidates, 'transaction', (record) => record.typ, 'transaction');
    const price = setResolvedValue(scalar, provenance, conflicts, candidates, 'price.amount', (record) => numericValue(record.price), 'price');
    const currency = setResolvedValue(scalar, provenance, conflicts, candidates, 'price.currency', (record) => record.currency, 'currency');
    const videoUrl = setResolvedValue(scalar, provenance, conflicts, candidates, 'videoUrl', (record) => record.videoUrl, 'videoUrl');
    const agent = setResolvedValue(scalar, provenance, conflicts, candidates, 'agent', (record) => record.agent, 'agent');
    const objectName = setResolvedValue(scalar, provenance, conflicts, candidates, 'otodom.objectName', (record) => record.objectName, 'ObjectName');
    const rawDetails = setResolvedValue(scalar, provenance, conflicts, candidates, 'otodom.rawDetails', (record) => record.rawDetails, 'ObjectName details');
    const location = {
      country: setResolvedValue({}, provenance, conflicts, candidates, 'location.country', (record) => record.location?.country, 'location.country'),
      region: setResolvedValue({}, provenance, conflicts, candidates, 'location.region', (record) => record.location?.region, 'location.region'),
      city: setResolvedValue({}, provenance, conflicts, candidates, 'location.city', (record) => record.location?.city, 'location.city'),
    };
    const { params, areas } = resolveParams(candidates, provenance, conflicts);
    const bedroomKeys = ['liczbasypialni', 'liczba_sypialni', 'sypialnie', 'bedrooms'];
    const bedroomSourceKey = bedroomKeys.find((key) => params[key] !== undefined);
    const bedrooms = numericValue(bedroomSourceKey ? params[bedroomSourceKey] : undefined);
    if (bedrooms !== undefined) {
      params.liczbasypialni = bedrooms;
      provenance['attributes.liczbasypialni'] = provenance[`attributes.${bedroomSourceKey}`];
      bedroomKeys.filter((key) => key !== 'liczbasypialni').forEach((key) => delete params[key]);
    }
    const media = candidates.flatMap(providerPhotos);
    const lifecycle = resolveLifecycle(records);

    if (lifecycle.state === 'conflict') {
      conflicts.unshift({
        field: 'lifecycle',
        values: Object.entries(lifecycle.sourceStatuses).map(([provider, value]) => ({ provider, value })),
        resolvedBy: 'manual-policy-required',
      });
    }

    return {
      id,
      externalIds: Object.fromEntries(records.map((record) => [record.provider, record.providerOfferId])),
      lifecycle,
      property: {
        category: tab,
        transaction: typ,
        price: { amount: price, currency },
        areas,
        location,
        title: params.tytul ?? '',
        description: params.opis ?? '',
        rooms: numericValue(params.liczbapokoi),
        bedrooms,
        bathrooms: numericValue(params.liczbalazienek),
        attributes: params,
        media,
        videoUrl: videoUrl ?? null,
        agent: agent ?? null,
      },
      provenance,
      conflicts,
      sourceRecords: buildSourceRecords(records),
      // Compatibility values are intentionally limited to the current UI
      // contract. New UI code should read the structured `property` object.
      tab,
      typ,
      price,
      currency,
      videoUrl: videoUrl ?? null,
      agent: agent ?? null,
      objectName,
      rawDetails,
      params,
      location,
    };
};

/**
 * Rebuilds an aggregate one source record at a time after an unexpected merge
 * failure. A bad provider record is omitted; data from the remaining providers
 * continues to be published instead of taking down the complete feed.
 */
const buildPropertyAggregateSafely = (id, records) => {
  try {
    return buildPropertyAggregate(id, records);
  } catch (error) {
    console.warn(`[offer-aggregate] Rebuilding ${id} after an aggregation failure: ${error instanceof Error ? error.message : String(error)}`);
  }

  const accepted = [];
  const skippedSourceRecords = [];
  for (const record of ordered(records)) {
    try {
      buildPropertyAggregate(id, [...accepted, record]);
      accepted.push(record);
    } catch (error) {
      skippedSourceRecords.push(aggregationFailure(record, error));
      const reference = recordReference(record);
      console.warn(`[offer-aggregate] Skipping ${reference.provider}:${reference.providerOfferId} for ${id}: ${skippedSourceRecords.at(-1).reason}`);
    }
  }

  if (accepted.length === 0) return undefined;

  try {
    return {
      ...buildPropertyAggregate(id, accepted),
      skippedSourceRecords,
    };
  } catch (error) {
    // The individual records are valid but their combination is not. Retain
    // the highest-priority source, and mark the other records as unavailable.
    const [primary, ...incompatible] = accepted;
    const primaryAggregate = buildPropertyAggregate(id, [primary]);
    return {
      ...primaryAggregate,
      skippedSourceRecords: [
        ...skippedSourceRecords,
        ...incompatible.map((record) => aggregationFailure(record, error)),
      ],
    };
  }
};

/**
 * Merge parsed provider records into one aggregate per deterministic property ID.
 * Unmatched IDs are preserved as one-source aggregates instead of being guessed.
 * Any malformed provider object is logged and omitted without throwing.
 */
export const buildPropertyAggregates = (providerOffers = []) => {
  const grouped = new Map();
  for (const offer of providerOffers) {
    try {
      const canonicalId = getCanonicalPropertyId(offer);
      if (!canonicalId) continue;
      const records = grouped.get(canonicalId) ?? [];
      records.push(offer);
      grouped.set(canonicalId, records);
    } catch (error) {
      const reference = recordReference(offer);
      console.warn(`[offer-aggregate] Skipping unreadable ${reference.provider}:${reference.providerOfferId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return [...grouped.entries()]
    .map(([id, records]) => buildPropertyAggregateSafely(id, records))
    .filter(Boolean);
};

/**
 * Compact view sent to the filter React island and used by the current detail UI.
 * It intentionally omits source records/raw XML, which stay server-side.
 */
export const toOfferDetailView = (aggregate) => ({
  id: aggregate.id,
  tab: aggregate.tab,
  typ: aggregate.typ,
  price: aggregate.price,
  currency: aggregate.currency,
  videoUrl: aggregate.videoUrl,
  agent: aggregate.agent,
  objectName: aggregate.objectName,
  rawDetails: aggregate.rawDetails,
  params: aggregate.params,
  location: aggregate.location,
  lifecycle: aggregate.lifecycle,
});

/** Compact listing/map contract. Keep the complete detail attributes server-side. */
export const toOfferSummaryView = (aggregate) => ({
  id: aggregate.id,
  tab: aggregate.tab,
  typ: aggregate.typ,
  price: aggregate.price,
  currency: aggregate.currency,
  location: aggregate.location,
  lifecycle: aggregate.lifecycle,
  params: {
    tytul: aggregate.params.tytul,
    miasto: aggregate.params.miasto,
    powierzchnia: aggregate.params.powierzchnia,
    liczbapokoi: aggregate.params.liczbapokoi,
    liczbasypialni: aggregate.params.liczbasypialni,
    liczbalazienek: aggregate.params.liczbalazienek,
    latitude: aggregate.params.latitude,
    longitude: aggregate.params.longitude,
    zdjecie1: aggregate.params.zdjecie1,
  },
});

// Kept as an alias while call sites migrate to an explicit projection name.
export const toOfferView = toOfferDetailView;
