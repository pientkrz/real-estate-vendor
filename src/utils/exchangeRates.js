const CACHE_KEY = 'xr_v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const FALLBACK_RATES = { EUR: 1, PLN: 4.25, GBP: 0.86, USD: 1.08, AED: 3.97, EGP: 52.0 };

async function fromFrankfurter() {
  const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=PLN,GBP,USD,AED,EGP');
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const data = await res.json();
  return {
    base: 'EUR',
    rates: { EUR: 1, ...data.rates },
    timestamp: new Date().toISOString(),
    source: 'frankfurter',
  };
}

async function fromECB() {
  const res = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
  const xml = await res.text();
  const rates = { EUR: 1 };
  for (const m of xml.matchAll(/currency='([A-Z]{3})'\s+rate='([\d.]+)'/g)) {
    rates[m[1]] = parseFloat(m[2]);
  }
  // AED is pegged to USD — derive it if ECB doesn't provide it directly
  if (rates.USD && !rates.AED) rates.AED = +(rates.USD * 3.6725).toFixed(4);
  return {
    base: 'EUR',
    rates,
    timestamp: new Date().toISOString(),
    source: 'ecb',
  };
}

/** Load exchange rates: localStorage cache (1h TTL) → Frankfurter → ECB → stale cache → hardcoded fallback */
export async function loadRates() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached?.timestamp && Date.now() - new Date(cached.timestamp).getTime() < CACHE_TTL) {
      return cached;
    }
  } catch {}

  for (const fetcher of [fromFrankfurter, fromECB]) {
    try {
      const data = await fetcher();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      return data;
    } catch {}
  }

  // Stale cache beats hardcoded fallback
  try {
    const stale = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (stale?.rates) return stale;
  } catch {}

  return { base: 'EUR', rates: FALLBACK_RATES, timestamp: null, source: 'fallback' };
}

/**
 * Convert a price from one currency to another using EUR-based rates.
 * Returns the original price unchanged if rates are missing for either currency.
 */
export function convertPrice(price, fromCurrency, toCurrency, rates) {
  if (!price || !rates || !fromCurrency || fromCurrency === toCurrency) return price;
  const rateFrom = fromCurrency === 'EUR' ? 1 : rates[fromCurrency];
  const rateTo = toCurrency === 'EUR' ? 1 : rates[toCurrency];
  if (!rateFrom || !rateTo) return price;
  return (price / rateFrom) * rateTo;
}
