import { describe, it, expect } from 'vitest';
import { isValidPhoneNumber, COUNTRY_DIAL_CODES } from './phoneValidation';

describe('isValidPhoneNumber', () => {

  // ── empty / not provided (field is optional) ────────────────────────────

  it('treats an empty string as valid', () => {
    expect(isValidPhoneNumber('')).toBe(true);
  });

  it('treats undefined as valid', () => {
    expect(isValidPhoneNumber(undefined)).toBe(true);
  });

  // ── plausible numbers ─────────────────────────────────────────────────────

  it('accepts a plain digit string of reasonable length', () => {
    expect(isValidPhoneNumber('500123456')).toBe(true);
  });

  it('accepts digits with spaces', () => {
    expect(isValidPhoneNumber('500 123 456')).toBe(true);
  });

  it('accepts digits with hyphens', () => {
    expect(isValidPhoneNumber('500-123-456')).toBe(true);
  });

  it('accepts digits with parentheses (area code style)', () => {
    expect(isValidPhoneNumber('(500) 123 456')).toBe(true);
  });

  it('accepts the shortest plausible length (6 digits)', () => {
    expect(isValidPhoneNumber('123456')).toBe(true);
  });

  it('accepts the longest plausible length (14 digits)', () => {
    expect(isValidPhoneNumber('12345678901234')).toBe(true);
  });

  // ── rejected formats ──────────────────────────────────────────────────────

  it('rejects letters', () => {
    expect(isValidPhoneNumber('50-JOHN-456')).toBe(false);
  });

  it('rejects a too-short number', () => {
    expect(isValidPhoneNumber('12345')).toBe(false);
  });

  it('rejects a too-long number', () => {
    expect(isValidPhoneNumber('123456789012345')).toBe(false);
  });

  it('rejects a plus sign inside the local number (belongs in the dial code, not here)', () => {
    expect(isValidPhoneNumber('+500123456')).toBe(false);
  });
});

describe('COUNTRY_DIAL_CODES', () => {
  it('includes Poland as +48', () => {
    expect(COUNTRY_DIAL_CODES).toContainEqual({ code: '+48', country: 'Polska' });
  });

  it('every entry has a code starting with "+" and a non-empty country name', () => {
    for (const entry of COUNTRY_DIAL_CODES) {
      expect(entry.code).toMatch(/^\+\d+$/);
      expect(entry.country.length).toBeGreaterThan(0);
    }
  });
});
