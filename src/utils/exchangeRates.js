export const FALLBACK_RATES = { EUR: 1, PLN: 4.25, GBP: 0.86, USD: 1.08, AED: 3.97, EGP: 52.0 };

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
