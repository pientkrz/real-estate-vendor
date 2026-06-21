import { describe, it, expect } from 'vitest';
import { convertPrice, FALLBACK_RATES } from './exchangeRates';

const RATES = { EUR: 1, PLN: 4.25, GBP: 0.86, USD: 1.08, AED: 3.97 };

describe('convertPrice', () => {

  // ── same currency (identity) ──────────────────────────────────────────────

  it('returns the original price when from and to currencies are the same', () => {
    expect(convertPrice(100_000, 'EUR', 'EUR', RATES)).toBe(100_000);
  });

  it('returns the original price when from and to are both PLN', () => {
    expect(convertPrice(500_000, 'PLN', 'PLN', RATES)).toBe(500_000);
  });

  // ── EUR ↔ PLN (primary use-case) ─────────────────────────────────────────

  it('converts EUR to PLN by multiplying by the PLN rate', () => {
    expect(convertPrice(100_000, 'EUR', 'PLN', RATES)).toBe(425_000);
  });

  it('converts PLN to EUR by dividing by the PLN rate', () => {
    expect(convertPrice(425_000, 'PLN', 'EUR', RATES)).toBe(100_000);
  });

  // ── cross-currency (USD, GBP, AED) ───────────────────────────────────────

  it('converts USD to EUR via EUR as the common base', () => {
    // 100 USD → 100/1.08 EUR ≈ 92.593 EUR
    expect(convertPrice(100, 'USD', 'EUR', RATES)).toBeCloseTo(92.593, 2);
  });

  it('converts GBP to PLN via EUR', () => {
    // 100 GBP → 100/0.86 EUR → × 4.25 PLN ≈ 494.19 PLN
    expect(convertPrice(100, 'GBP', 'PLN', RATES)).toBeCloseTo(494.19, 1);
  });

  it('converts AED to EUR via EUR as the common base', () => {
    // 100 AED → 100/3.97 EUR ≈ 25.19 EUR
    expect(convertPrice(100, 'AED', 'EUR', RATES)).toBeCloseTo(25.19, 1);
  });

  it('converts USD to PLN via EUR', () => {
    // 100 USD → 100/1.08 EUR → × 4.25 PLN ≈ 393.52 PLN
    expect(convertPrice(100, 'USD', 'PLN', RATES)).toBeCloseTo(393.52, 1);
  });

  // ── null / undefined / falsy prices ──────────────────────────────────────

  it('returns 0 unchanged (falsy guard)', () => {
    expect(convertPrice(0, 'EUR', 'PLN', RATES)).toBe(0);
  });

  it('returns null unchanged', () => {
    expect(convertPrice(null, 'EUR', 'PLN', RATES)).toBeNull();
  });

  it('returns undefined unchanged', () => {
    expect(convertPrice(undefined, 'EUR', 'PLN', RATES)).toBeUndefined();
  });

  // ── missing / unknown currencies ─────────────────────────────────────────

  it('returns the original price when fromCurrency is missing from rates', () => {
    expect(convertPrice(100, 'XYZ', 'PLN', RATES)).toBe(100);
  });

  it('returns the original price when toCurrency is missing from rates', () => {
    expect(convertPrice(100, 'EUR', 'XYZ', RATES)).toBe(100);
  });

  it('returns the original price when fromCurrency is null', () => {
    expect(convertPrice(100, null, 'PLN', RATES)).toBe(100);
  });

  // ── missing rates object ──────────────────────────────────────────────────

  it('returns the original price when rates is null', () => {
    expect(convertPrice(100, 'EUR', 'PLN', null)).toBe(100);
  });

  it('returns the original price when rates is an empty object', () => {
    expect(convertPrice(100, 'EUR', 'PLN', {})).toBe(100);
  });

  // ── FALLBACK_RATES sanity check ───────────────────────────────────────────

  it('FALLBACK_RATES has EUR = 1', () => {
    expect(FALLBACK_RATES.EUR).toBe(1);
  });

  it('FALLBACK_RATES contains all Otodom currencies', () => {
    for (const currency of ['PLN', 'GBP', 'USD', 'AED', 'EGP']) {
      expect(FALLBACK_RATES[currency]).toBeGreaterThan(0);
    }
  });

  it('convertPrice works correctly with FALLBACK_RATES', () => {
    const result = convertPrice(100_000, 'EUR', 'PLN', FALLBACK_RATES);
    expect(result).toBe(100_000 * FALLBACK_RATES.PLN);
  });
});
