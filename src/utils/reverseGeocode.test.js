import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveRegionName } from './reverseGeocode';

// ── resolveRegionName ─────────────────────────────────────────────────────────
// Tests against the bundled geonames-admin1.json — no mocking needed.

describe('resolveRegionName', () => {

  // ── Greek NUTS-style codes ────────────────────────────────────────────────

  it('resolves Greek Crete (ESYE43)', () => {
    expect(resolveRegionName('GR', 'ESYE43')).toBe('Crete');
  });

  it('resolves Greek Attica (ESYE31)', () => {
    expect(resolveRegionName('GR', 'ESYE31')).toBe('Attica');
  });

  it('resolves Greek South Aegean (ESYE42) — covers Mykonos', () => {
    expect(resolveRegionName('GR', 'ESYE42')).toBe('South Aegean');
  });

  // ── Polish numeric codes ──────────────────────────────────────────────────

  it('resolves Polish Mazovia (78) — covers Warsaw', () => {
    expect(resolveRegionName('PL', '78')).toBe('Mazovia');
  });

  it('resolves Polish Lesser Poland (77) — covers Kraków', () => {
    expect(resolveRegionName('PL', '77')).toBe('Lesser Poland');
  });

  // ── Spanish numeric codes ─────────────────────────────────────────────────

  it('resolves Spanish Andalusia (51)', () => {
    expect(resolveRegionName('ES', '51')).toBe('Andalusia');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('returns empty string for an unknown admin code', () => {
    expect(resolveRegionName('GR', 'UNKNOWN')).toBe('');
  });

  it('returns empty string for empty country code', () => {
    expect(resolveRegionName('', 'ESYE43')).toBe('');
  });

  it('returns empty string for empty admin code', () => {
    expect(resolveRegionName('GR', '')).toBe('');
  });

  it('returns empty string when both args are empty', () => {
    expect(resolveRegionName('', '')).toBe('');
  });

  it('returns empty string when both args are undefined', () => {
    expect(resolveRegionName(undefined, undefined)).toBe('');
  });
});

// ── reverseGeocode ────────────────────────────────────────────────────────────
// Mocks all-the-cities with a tiny dataset so the scan is fast and deterministic.

vi.mock('all-the-cities', () => ({
  default: [
    // Heraklion, Crete, Greece
    { name: 'Heraklion', country: 'GR', adminCode: 'ESYE43', loc: { coordinates: [25.1442, 35.3387] } },
    // Warsaw, Poland
    { name: 'Warsaw', country: 'PL', adminCode: '78', loc: { coordinates: [21.0122, 52.2297] } },
    // Barcelona, Spain
    { name: 'Barcelona', country: 'ES', adminCode: '56', loc: { coordinates: [2.1734, 41.3851] } },
    // London, UK — adminCode is alphabetic, still resolved via mapping
    { name: 'London', country: 'GB', adminCode: 'ENG', loc: { coordinates: [-0.1278, 51.5074] } },
  ],
}));

describe('reverseGeocode', () => {
  let reverseGeocode;

  beforeEach(async () => {
    // Dynamic import after vi.mock is registered so the mock is applied
    const mod = await import('./reverseGeocode');
    reverseGeocode = mod.reverseGeocode;
  });

  it('resolves coordinates near Heraklion to Crete, Greece', () => {
    const result = reverseGeocode(35.34, 25.13);
    expect(result.city).toBe('Heraklion');
    expect(result.region).toBe('Crete');
    expect(result.country).toBe('Greece');
    expect(result.countryCode).toBe('GR');
  });

  it('resolves coordinates near Warsaw to Mazovia, Poland', () => {
    const result = reverseGeocode(52.23, 21.01);
    expect(result.city).toBe('Warsaw');
    expect(result.region).toBe('Mazovia');
    expect(result.country).toBe('Poland');
    expect(result.countryCode).toBe('PL');
  });

  it('returns empty strings when lat/lon are both 0', () => {
    const result = reverseGeocode(0, 0);
    expect(result).toEqual({ city: '', region: '', country: '', countryCode: '' });
  });

  it('returns empty strings when lat/lon are undefined', () => {
    const result = reverseGeocode(undefined, undefined);
    expect(result).toEqual({ city: '', region: '', country: '', countryCode: '' });
  });

  it('always returns a region key in the result object', () => {
    const result = reverseGeocode(35.34, 25.13);
    expect(result).toHaveProperty('region');
  });
});
