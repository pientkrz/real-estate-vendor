/**
 * Server-only loader for processed provider offer state.
 *
 * The normal path reads the atomic JSON state created by the FTP ingestion
 * worker. The former XML path remains solely as a bootstrap fallback before
 * the first processed snapshot exists.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  parseNieruchomosciOnlineAgentsXml,
  parseNieruchomosciOnlineXml,
  parseOfertyNetXml,
  parseOtoDomXml,
} from '../utils/xmlParser.js';
import { buildPropertyAggregates, toOfferDetailView, toOfferSummaryView } from '../utils/propertyAggregate.js';
import { getOfferRuntimeConfig, readOfferState } from './offerState.js';

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;
const firstConfiguredValue = (...values) => values.find(hasValue) ?? '';

const fallbackOtoDomPath = (env) => path.join(
  process.cwd(),
  'public',
  env.XML_COLLECTION_PATH ?? '',
  'properties_otodom.xml',
);

// `process.env` is read by the Node SSR runtime. It must take precedence over
// Vite's build-time `import.meta.env` for VPS paths such as OFFER_STATE_PATH.
const runtimeEnv = (env = import.meta.env) => ({ ...env, ...process.env });

const providerDefinitions = (env) => [
  {
    id: 'otodom-pl',
    xmlPath: firstConfiguredValue(
      env.OTODOM_XML_PATH,
      env.OFFERS_XML_PATH,
      fallbackOtoDomPath(env),
    ),
    photoBaseUrl: firstConfiguredValue(env.OTODOM_PHOTO_BASE_URL, env.PHOTO_BASE_URL),
    // Preserve Otodom deactivations/deletions for lifecycle reconciliation.
    parse: (xml, photoBaseUrl) => parseOtoDomXml(xml, photoBaseUrl, { includeInactive: true }),
  },
  {
    id: 'nieruchomosci-online-pl',
    xmlPath: env.NIERUCHOMOSCI_ONLINE_XML_PATH,
    photoBaseUrl: firstConfiguredValue(
      env.NIERUCHOMOSCI_ONLINE_PHOTO_BASE_URL,
      env.PHOTO_BASE_URL,
    ),
    parse: parseNieruchomosciOnlineXml,
  },
  {
    id: 'oferty-net',
    xmlPath: env.OFERTY_NET_XML_PATH,
    photoBaseUrl: firstConfiguredValue(env.OFERTY_NET_PHOTO_BASE_URL, env.PHOTO_BASE_URL),
    parse: parseOfertyNetXml,
  },
];

/**
 * Read all configured provider files and retain every normalised source record.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {Array} Provider-specific offers, including lifecycle events
 */
export const loadConfiguredProviderOffers = (env = import.meta.env) => {
  const resolvedEnv = runtimeEnv(env);
  const processedState = readOfferState(getOfferRuntimeConfig(resolvedEnv).statePath);
  if (processedState) {
    return Object.values(processedState.providerStates)
      .flatMap((providerState) => Object.values(providerState.records ?? {}));
  }

  const offers = [];

  for (const provider of providerDefinitions(resolvedEnv)) {
    if (!hasValue(provider.xmlPath)) continue;

    try {
      offers.push(...provider.parse(
        fs.readFileSync(provider.xmlPath, 'utf-8'),
        provider.photoBaseUrl,
      ));
    } catch (error) {
      console.warn(
        `[offers] Skipping ${provider.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return offers;
};

/**
 * Load the Nieruchomosci-online.pl agent directory for the offer-detail
 * carousel. Agents are optional: a missing or malformed provider feed must
 * not prevent the property page from rendering.
 */
export const loadConfiguredNieruchomosciOnlineAgents = (env = import.meta.env) => {
  const resolvedEnv = runtimeEnv(env);
  const processedState = readOfferState(getOfferRuntimeConfig(resolvedEnv).statePath);
  if (processedState) return processedState.agents;

  const xmlPath = resolvedEnv.NIERUCHOMOSCI_ONLINE_XML_PATH;
  if (!hasValue(xmlPath)) return [];

  try {
    return parseNieruchomosciOnlineAgentsXml(fs.readFileSync(xmlPath, 'utf-8'));
  } catch (error) {
    console.warn(
      `[agents] Skipping nieruchomosci-online-pl: ${error instanceof Error ? error.message : String(error)}`,
    );
    return [];
  }
};

/**
 * Build one provider-independent aggregate per deterministic property ID.
 * Source records and field provenance remain available server-side for detail
 * enrichment, audits, and future persistence.
 */
export const loadConfiguredPropertyAggregates = (env = import.meta.env) => (
  readOfferState(getOfferRuntimeConfig(runtimeEnv(env)).statePath)?.aggregates
  ?? buildPropertyAggregates(loadConfiguredProviderOffers(env))
);

/**
 * Return compact views for the existing filter/detail components.
 * Lifecycle conflicts are deliberately withheld until a reconciliation policy
 * (provider precedence or trusted upload timestamps) is defined.
 */
export const loadConfiguredOffers = (env = import.meta.env) => (
  loadConfiguredPropertyAggregates(env)
    .filter((aggregate) => aggregate.lifecycle.isVisible)
    .map(toOfferSummaryView)
);

/**
 * Supports canonical links and the provider-prefixed links generated before
 * aggregation was introduced. Only publishable properties can be resolved.
 */
export const loadConfiguredOfferById = (id, env = import.meta.env) => {
  const aggregate = loadConfiguredPropertyAggregates(env).find((candidate) => (
    candidate.lifecycle.isVisible
    && (candidate.id === id || Object.values(candidate.sourceRecords).some((record) => record.id === id))
  ));
  return aggregate ? toOfferDetailView(aggregate) : undefined;
};
