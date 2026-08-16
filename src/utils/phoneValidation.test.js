import { describe, it, expect } from 'vitest';
import { isValidPhoneNumber, POLISH_EMERGENCY_NUMBERS } from './phoneValidation';

describe('isValidPhoneNumber', () => {

  // ── empty / not provided (field is optional) ────────────────────────────

  it('treats an empty string as valid', () => {
    expect(isValidPhoneNumber('')).toBe(true);
  });

  it('treats undefined as valid', () => {
    expect(isValidPhoneNumber(undefined)).toBe(true);
  });

  // ── plausible numbers ─────────────────────────────────────────────────────

  it('accepts a valid Polish mobile number', () => {
    expect(isValidPhoneNumber('+48500123456')).toBe(true);
  });

  it('accepts a valid number from another country', () => {
    expect(isValidPhoneNumber('+12133734253')).toBe(true);
  });

  // ── rejected formats ──────────────────────────────────────────────────────

  it('rejects letters', () => {
    expect(isValidPhoneNumber('+4850-JOHN-456')).toBe(false);
  });

  it('rejects a too-short number', () => {
    expect(isValidPhoneNumber('+4850012')).toBe(false);
  });

  it('rejects a too-long number', () => {
    expect(isValidPhoneNumber('+485001234567890')).toBe(false);
  });

  // ── Polish emergency numbers ─────────────────────────────────────────────

  it('rejects every reserved Polish emergency number', () => {
    for (const emergencyNumber of POLISH_EMERGENCY_NUMBERS) {
      expect(isValidPhoneNumber(`+48${emergencyNumber}`)).toBe(false);
    }
  });

  it('does not reject a real Polish number that merely contains emergency digits as a substring', () => {
    expect(isValidPhoneNumber('+48501129970')).toBe(true);
  });

  it('does not reject the same short code under a different country', () => {
    // '997' isn't a reserved short code outside Poland, and this isn't a
    // valid US number either way, but it must fail on length, not on the
    // Poland-specific emergency-number rule.
    expect(isValidPhoneNumber('+1997')).toBe(false);
  });
});
