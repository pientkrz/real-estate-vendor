/**
 * Server-only loader for processed provider offer state.
 *
 * The normal path reads the atomic JSON state created by the FTP ingestion
 * worker. Until the first snapshot is available, the application deliberately
 * returns no offers rather than reading a delivery file during an SSR request.
 */

import { toOfferDetailView, toOfferSummaryView } from '../utils/propertyAggregate.js';
import { getOfferRuntimeConfig, readOfferState } from './offerState.js';

// Vite replaces direct `process.env` references at build time. Going through
// `globalThis` deliberately preserves Node's runtime environment, so the VPS
// `--env-file` configuration overrides any values present during a local build.
const runtimeProcessEnv = () => globalThis.process?.env ?? {};
const runtimeEnv = (env = import.meta.env) => ({ ...env, ...runtimeProcessEnv() });

/**
 * Read normalised provider records from the atomically published ingestion state.
 * FTP archives are deliberately never parsed while serving an SSR request.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {Array} Provider-specific offers, including lifecycle events
 */
export const loadConfiguredProviderOffers = (env = import.meta.env) => {
  const resolvedEnv = runtimeEnv(env);
  const processedState = readOfferState(getOfferRuntimeConfig(resolvedEnv).statePath);
  return processedState
    ? Object.values(processedState.providerStates)
      .flatMap((providerState) => Object.values(providerState.records ?? {}))
    : [];
};

/**
 * Load the Nieruchomosci-online.pl agent directory for the offer-detail
 * carousel. Agents are optional: until the worker publishes a state snapshot,
 * the property page simply has no provider-supplied agents to show.
 */
export const loadConfiguredNieruchomosciOnlineAgents = (env = import.meta.env) => {
  const resolvedEnv = runtimeEnv(env);
  const processedState = readOfferState(getOfferRuntimeConfig(resolvedEnv).statePath);
  return processedState?.agents ?? [];
};

/**
 * Read the atomically published aggregate snapshot. Aggregation belongs to the
 * ingestion worker, never to an SSR request.
 */
export const loadConfiguredPropertyAggregates = (env = import.meta.env) => (
  readOfferState(getOfferRuntimeConfig(runtimeEnv(env)).statePath)?.aggregates ?? []
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
