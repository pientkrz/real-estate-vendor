#!/usr/bin/env node

import process from 'node:process';
import { getOfferRuntimeConfig, readOfferState } from '../src/server/offerState.js';
import { bootstrapOtoDomState, processAvailableDeliveries } from '../src/ingestion/offerIngestion.js';

// pnpm forwards a leading `--` on some Windows versions; it is a separator,
// not an ingestion argument.
const args = process.argv.slice(2).filter((argument, index) => !(index === 0 && argument === '--'));
const config = getOfferRuntimeConfig(process.env);

const printStatus = () => {
  const state = readOfferState(config.statePath);
  if (!state) {
    console.info(`No processed offer state at ${config.statePath}`);
    return;
  }
  console.info(JSON.stringify({
    statePath: config.statePath,
    generatedAt: state.generatedAt,
    providers: Object.fromEntries(Object.entries(state.providerStates).map(([provider, value]) => [provider, {
      hasFullBaseline: value.hasFullBaseline,
      offers: Object.keys(value.records || {}).length,
      fullReceivedAt: value.fullReceivedAt,
    }])),
    agents: state.agents.length,
    publishedProperties: state.aggregates.filter((aggregate) => aggregate.lifecycle?.isVisible).length,
    recentDeliveries: state.deliveries.slice(-10),
  }, null, 2));
};

try {
  if (args[0] === '--status') {
    printStatus();
  } else if (args[0] === '--bootstrap-otodom') {
    const xmlPath = args[1];
    if (!xmlPath) throw new Error('Usage: --bootstrap-otodom <properties_otodom.xml path>');
    const state = bootstrapOtoDomState({ config, xmlPath });
    console.info(`Bootstrapped ${state.aggregates.length} Otodom property aggregates into ${config.statePath}`);
  } else if (args.length === 0) {
    const report = await processAvailableDeliveries({ config });
    console.info(`[offer-ingestion] applied=${report.applied.length} ignored=${report.ignored.length} rejected=${report.rejected.length} skipped=${report.skipped.length}`);
    report.rejected.forEach(({ archivePath, reason }) => console.warn(`[offer-ingestion] ${archivePath}: ${reason}`));
  } else {
    throw new Error('Usage: ingest-offers.mjs [--status | --bootstrap-otodom <xml path>]');
  }
} catch (error) {
  console.error(`[offer-ingestion] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
