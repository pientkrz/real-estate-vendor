/**
 * Formats a raw price number into a localised string with the currency
 * code/symbol from the Otodom dictionary (PriceCurrency values: EUR, PLN,
 * GBP, USD, AED, EGP).
 *
 * Uses the built-in Intl.NumberFormat so thousand separators are always
 * correct and currency positioning follows the locale standard.
 *
 * @param {number} price
 * @param {string} currency  e.g. "EUR", "PLN", "USD"
 * @returns {string}         e.g. "€1,500,000" / "PLN 2,500,000"
 */
export const formatPrice = (price, currency) => {
  if (!price) return 'Contact for Price';
  try {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    // Fallback for unknown/unsupported currency codes
    return `${price.toLocaleString('pl-PL')} ${currency ?? ''}`.trim();
  }
};
