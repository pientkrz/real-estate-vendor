/**
 * Resolves one provider location without changing the provider's spelling.
 * Explicit XML values always win; the local reverse geocoder only fills the
 * individual fields that the XML did not provide.
 */

import { reverseGeocode } from './reverseGeocode.js';

const LOCATION_FIELDS = ['country', 'region', 'city'];

const text = (value) => String(value ?? '').trim();

const validCoordinates = (latitude, longitude) => (
  Number.isFinite(Number(latitude))
  && Number.isFinite(Number(longitude))
);

/**
 * @param {{
 *   latitude?: number,
 *   longitude?: number,
 *   fields?: Record<string, { value?: unknown, xmlField?: string, legacy?: unknown }>
 * }} input
 * @returns {{ location: Record<string, string>, locationSources: Record<string, object> }}
 */
export const resolveProviderLocation = ({ latitude, longitude, fields = {} } = {}) => {
  const explicit = Object.fromEntries(LOCATION_FIELDS.map((field) => [field, text(fields[field]?.value)]));
  const shouldReverseGeocode = LOCATION_FIELDS.some((field) => !explicit[field]);
  const coordinateLocation = shouldReverseGeocode && validCoordinates(latitude, longitude)
    ? reverseGeocode(Number(latitude), Number(longitude))
    : {};
  const location = {};
  const locationSources = {};

  for (const field of LOCATION_FIELDS) {
    const source = fields[field] || {};
    const xmlField = text(source.xmlField);
    const value = explicit[field] || text(coordinateLocation[field]);
    if (value) location[field] = value;

    if (explicit[field]) {
      locationSources[field] = { source: 'xml', ...(xmlField ? { xmlField } : {}) };
    } else if (shouldReverseGeocode && validCoordinates(latitude, longitude)) {
      locationSources[field] = { source: 'coordinates', ...(xmlField ? { xmlField } : {}) };
    }

    // Otodom's historical Country=1 means only "Poland supported by the old
    // specification". It is not an actual complete location without city or
    // province, but retaining the fact makes migration diagnostics possible.
    if (source.legacy) {
      locationSources[field] ??= { source: 'legacy', ...(xmlField ? { xmlField } : {}) };
      locationSources[field].legacy = {
        source: 'legacy',
        ...(xmlField ? { xmlField } : {}),
        value: text(source.legacy),
      };
    }
  }

  return { location, locationSources };
};

export const countXmlLocationFields = (locationSources = {}) => (
  LOCATION_FIELDS.filter((field) => locationSources?.[field]?.source === 'xml').length
);
