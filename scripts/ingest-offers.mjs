#!/usr/bin/env node

import process from 'node:process';
import { getOfferRuntimeConfig, readOfferState } from '../src/server/offerState.js';
import { bootstrapOtoDomState, compactCurrentPhotos, processAvailableDeliveries, replayRetainedDeliveries } from '../src/ingestion/offerIngestion.js';
import { getLogger, registerProcessErrorLogging } from '../src/server/logger.js';

process.env.LOG_PROCESS = 'ingestion';
const logger = getLogger('ingestion');
registerProcessErrorLogging(logger, 'ingestion');

// pnpm forwards a leading `--` on some Windows versions; it is a separator,
// not an ingestion argument.
const args = process.argv.slice(2).filter((argument, index) => !(index === 0 && argument === '--'));
const config = getOfferRuntimeConfig(process.env);

const printStatus = () => {
  const state = readOfferState(config.statePath);
  if (!state) {
    process.stdout.write('No processed offer state is available yet.\n');
    return;
  }
  process.stdout.write(`${JSON.stringify({
    generatedAt: state.generatedAt,
    providers: Object.fromEntries(Object.entries(state.providerStates).map(([provider, value]) => [provider, {
      hasFullBaseline: value.hasFullBaseline,
      offers: Object.keys(value.records || {}).length,
      fullReceivedAt: value.fullReceivedAt,
    }])),
    agents: state.agents.length,
    publishedProperties: state.aggregates.filter((aggregate) => aggregate.lifecycle?.isVisible).length,
    recentDeliveries: state.deliveries.slice(-10),
  }, null, 2)}\n`);
};

try {
  if (args[0] === '--status') {
    printStatus();
  } else if (args[0] === '--bootstrap-otodom') {
    const xmlPath = args[1];
    if (!xmlPath) throw new Error('Usage: --bootstrap-otodom <properties_otodom.xml path>');
    const state = bootstrapOtoDomState({ config, xmlPath, logger });
    process.stdout.write(`Bootstrapped ${state.aggregates.length} Otodom property aggregates.\n`);
  } else if (args[0] === '--replay-retained') {
    const report = await replayRetainedDeliveries({ config, logger });
    process.stdout.write(`replayed=${report.applied.length} skipped=${report.skipped.length} failed=${report.failed.length} published=${report.statePublished}\n`);
  } else if (args[0] === '--compact-current-photos') {
    const report = compactCurrentPhotos({ config, logger });
    process.stdout.write(`migrated=${report.migratedFiles} legacyDirectoriesRemoved=${report.legacyDirectoriesRemoved} reconciledDeliveries=${report.reconciledDeliveries}\n`);
  } else if (args.length === 0) {
    const report = await processAvailableDeliveries({ config, logger });
    process.stdout.write(`applied=${report.applied.length} ignored=${report.ignored.length} rejected=${report.rejected.length} skipped=${report.skipped.length}\n`);
  } else {
    throw new Error('Usage: ingest-offers.mjs [--status | --bootstrap-otodom <xml path> | --replay-retained | --compact-current-photos]');
  }
} catch (error) {
  logger.error('ingestion_command_failed', { component: 'ingestion', error });
  process.exitCode = 1;
}
