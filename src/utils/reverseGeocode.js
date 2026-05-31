/**
 * Offline reverse geocoder — resolves lat/lon to the nearest city, region, and country.
 *
 * Data sources (all bundled, no network required):
 *  - all-the-cities        GeoNames dataset, 135k+ cities with population ≥ 1 000
 *  - geonames-admin1.json  Mapping of GeoNames admin1 codes → human-readable region names
 *  - Intl.DisplayNames     built-in Node.js API for ISO-2 → English country name
 *
 * Intended for build-time / SSR use in Node.js only — not imported in any
 * client bundle (all callers live in Astro frontmatter or server utilities).
 */

import allCities from 'all-the-cities';
import admin1Map from '../data/geonames-admin1.json' with { type: 'json' };

/** Haversine great-circle distance in km. */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Resolve ISO-2 country codes to English names via the platform's ICU data.
const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

/**
 * Resolve a GeoNames adminCode to a human-readable region name using the
 * bundled admin1CodesASCII mapping (key format: "{countryCode}.{adminCode}").
 *
 * @param {string} countryCode  ISO-2 country code (e.g. "GR")
 * @param {string} adminCode    GeoNames admin1 code (e.g. "ESYE43", "78")
 * @returns {string}  Human-readable region name, or empty string if not found
 */
export const resolveRegionName = (countryCode, adminCode) => {
  if (!countryCode || !adminCode) return '';
  return admin1Map[`${countryCode}.${adminCode}`] ?? '';
};

/**
 * Find the nearest GeoNames city to the given coordinates and return its
 * name alongside the resolved region and country names.
 *
 * Each record in all-the-cities uses GeoJSON coordinate order [lon, lat].
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {{ city: string, region: string, country: string, countryCode: string }}
 */
export const reverseGeocode = (lat, lon) => {
  if (!lat || !lon) return { city: '', region: '', country: '', countryCode: '' };

  let nearest = null;
  let nearestDist = Infinity;

  for (const c of allCities) {
    const [cLon, cLat] = c.loc.coordinates;
    const d = haversineKm(lat, lon, cLat, cLon);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = c;
    }
  }

  const countryCode = nearest?.country ?? '';
  const country = countryCode ? (displayNames.of(countryCode) ?? countryCode) : '';
  const region = resolveRegionName(countryCode, nearest?.adminCode ?? '');

  // todo getting the nearest city instead of the actual city might be problematic - needs to verify with broker
  return {
    city: nearest?.name ?? '',
    country,
    countryCode,
    region,
  };
};
