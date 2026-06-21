import cron from 'node-cron';

const FALLBACK_RATES = { EUR: 1, PLN: 4.25, GBP: 0.86, USD: 1.08, AED: 3.97, EGP: 52.0 };

let currentRates = { ...FALLBACK_RATES };
let ratesTimestamp = null;
let ratesSource = 'fallback';

async function fromFrankfurter() {
  const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=PLN,GBP,USD,AED,EGP');
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const data = await res.json();
  return { rates: { EUR: 1, ...data.rates }, source: 'frankfurter' };
}

async function fromECB() {
  const res = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
  const xml = await res.text();
  const rates = { EUR: 1 };
  for (const m of xml.matchAll(/currency='([A-Z]{3})'\s+rate='([\d.]+)'/g)) {
    rates[m[1]] = parseFloat(m[2]);
  }
  // AED is pegged to USD; ECB doesn't publish it directly
  if (rates.USD && !rates.AED) rates.AED = +(rates.USD * 3.6725).toFixed(4);
  return { rates, source: 'ecb' };
}

async function refresh() {
  for (const fetcher of [fromFrankfurter, fromECB]) {
    try {
      const { rates, source } = await fetcher();
      currentRates = rates;
      ratesTimestamp = new Date().toISOString();
      ratesSource = source;
      return;
    } catch {}
  }
}

// Guard against duplicate initialisation during HMR in dev
if (!globalThis.__rateServiceStarted) {
  globalThis.__rateServiceStarted = true;
  refresh();
  cron.schedule('0 * * * *', refresh);
}

export function getRates() {
  return { rates: currentRates, timestamp: ratesTimestamp, source: ratesSource };
}
