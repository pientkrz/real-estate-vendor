import { XMLParser } from 'fast-xml-parser';
import dict from './otodom-dictionary.json' with { type: 'json' };
import { reverseGeocode } from './reverseGeocode.js';
import { validateOtoDomXml } from './xmlValidator.js';
import {
  NOE_AD_TYPE_TO_TYPE,
  NOE_BOOLEAN_PARAMS,
  NOE_CATEGORY_TO_TAB,
  NOE_CURRENCY_TO_CODE,
  NOE_DETAILS_TO_POLISH_PARAMS,
  OFERTY_NET_TABS,
} from './offerMappings.js';

const normaliseAgent = ({ id, name, email, phone, image, licenseNumber } = {}) => {
  const phoneValue = String(phone ?? '').trim().replace(/[;,\s]+$/, '');
  const normalised = {
    id: String(id ?? '').trim(),
    name: String(name ?? '').trim(),
    email: String(email ?? '').trim(),
    // fast-xml-parser coerces `+48…` XML values to numbers; restore the
    // country prefix for the Polish international format used by the feeds.
    phone: /^48\d{9}$/.test(phoneValue) ? `+${phoneValue}` : phoneValue,
  };

  const imageValue = String(image ?? '').trim();
  const licenseNumberValue = String(licenseNumber ?? '').trim();
  if (imageValue) normalised.image = imageValue;
  if (licenseNumberValue) normalised.licenseNumber = licenseNumberValue;

  return normalised.name || normalised.email || normalised.phone
    ? Object.fromEntries(Object.entries(normalised).filter(([, value]) => value))
    : undefined;
};

// ── Otodom XML parser ─────────────────────────────────────────────────────────

/**
 * Parses an Otodom-format XML file into the normalised offer shape that the
 * existing filter / display components expect.
 *
 * Runs XML validation on every parse and logs warnings to the console when
 * required fields are missing (validation failures do NOT abort parsing —
 * valid insertions are still returned).
 *
 * @param {string} xmlString       Raw XML content of the Otodom export file
 * @param {string} photoBasePath   URL prefix for photos extracted on the VPS,
 *                                 e.g. "/offer-photos/otodom-pl/<delivery>/"
 * @returns {Array} Normalised offer objects
 */
export const parseOtoDomXml = (xmlString, photoBasePath = '', { includeInactive = false } = {}) => {
  // ── Validate and log any spec violations ──────────────────────────────────
  const validation = validateOtoDomXml(xmlString);
  if (!validation.valid) {
    console.warn(
      `[otodom-parser] XML validation found ${validation.errors.length} issue(s):`,
    );
    validation.errors.forEach((err) => console.warn(`  ✗ ${err}`));
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
  });

  const jsonObj = parser.parse(xmlString);
  const insertions = jsonObj.otoDom?.Insertions?.Insertion;
  if (!insertions) return [];

  const nodes = Array.isArray(insertions) ? insertions : [insertions];
  const offers = [];

  for (const ins of nodes) {
    const action = parseInt(ins.Action);
    const sourceStatus = action === 2 ? 'deleted' : action === 1 ? 'deactivated' : 'active';
    const sourceId = String(ins.ID ?? '').trim();
    if (!sourceId || (sourceStatus !== 'active' && !includeInactive)) continue;

    // A deactivation/deletion carries only an ID in the Otodom format. Keep
    // that event when requested so the aggregate can surface a lifecycle
    // conflict instead of silently treating an older provider snapshot as live.
    if (sourceStatus !== 'active') {
      offers.push({
        id: `otodom-${sourceId}`,
        provider: 'otodom-pl',
        providerOfferId: sourceId,
        sourceStatus,
        sourceData: ins,
        tab: '',
        objectName: undefined,
        rawDetails: null,
        typ: '',
        price: 0,
        currency: '',
        videoUrl: null,
        params: {},
        location: {},
      });
      continue;
    }

    // Resolve the details block for this object type
    const objectName = parseInt(ins.ObjectName);
    const details =
      ins.FlatDetails ??
      ins.HouseDetails ??
      ins.TerrainDetails ??
      ins.RoomDetails ??
      ins.CommercialPropertyDetails ??
      ins.GarageDetails ??
      ins.HallDetails ??
      null;

    const lat = parseFloat(ins.GeoMarker?.Latitude || 0);
    const lon = parseFloat(ins.GeoMarker?.Longitude || 0);
    const { city, country, region } = reverseGeocode(lat, lon);

    const offer = {
      id: `otodom-${sourceId}`,
      provider: 'otodom-pl',
      providerOfferId: sourceId,
      sourceStatus,
      sourceData: ins,
      tab: dict.ObjectName[String(ins.ObjectName)] ?? '',
      /** Numeric ObjectName code (0–6); drives PropertyDetailsPanel dispatch */
      objectName,
      /** Raw details block from the XML; fed into propertyDetailsResolver */
      rawDetails: details,
      typ: parseInt(ins.OfferType) === 1 ? 'wynajem' : 'sprzedaz',
      price: parseFloat(ins.Price || 0),
      currency: dict.PriceCurrency[String(ins.PriceCurrency)] ?? 'EUR',
      /** YouTube watch URL from <Video> tag, if present */
      videoUrl: ins.Video || null,
      agent: normaliseAgent({
        name: ins.ContactInfo?.Name,
        email: ins.ContactInfo?.Email,
        phone: ins.ContactInfo?.Phone,
      }),
      params: {
        powierzchnia:   parseFloat(ins.Area || 0),
        liczbapokoi:    parseInt(details?.RoomsNum || 0),
        liczbalazienek: 0,
        miasto:         city,
        opis:           ins.Description || '',
        latitude:       lat,
        longitude:      lon,
        tytul:          ins.Title || '',
      },
      location: { country, city, region },
    };

    // Sort photos by Position (ascending) and assign as zdjecie1…N
    const rawPhotos = ins.Photos?.Photo
      ? (Array.isArray(ins.Photos.Photo) ? ins.Photos.Photo : [ins.Photos.Photo])
      : [];

    rawPhotos
      .filter(p => p.File)
      .sort((a, b) => (parseInt(a.Position) || 99) - (parseInt(b.Position) || 99))
      .forEach((photo, idx) => {
        offer.params[`zdjecie${idx + 1}`] = photoBasePath + photo.File;
      });

    offers.push(offer);
  }

  return offers;
};

// ── Shared provider helpers ──────────────────────────────────────────────────

const toArray = (value) => value == null ? [] : (Array.isArray(value) ? value : [value]);

const readText = (value) => {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  if ('#text' in value) return readText(value['#text']);
  if ('linia' in value) return toArray(value.linia).map(readText).join('\n');
  return '';
};

const readNumber = (value) => {
  const text = readText(value).trim().replace(',', '.');
  if (!text) return undefined;
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
};

const readInteger = (value) => {
  const number = readNumber(value);
  return number == null ? undefined : Math.trunc(number);
};

const joinPhotoUrl = (basePath, fileName) => {
  if (!fileName) return '';
  if (!basePath) return fileName;
  return `${basePath.replace(/\/$/, '')}/${fileName.replace(/^\//, '')}`;
};

const readTypedParam = (param) => {
  const type = String(param?.['@_typ'] ?? '').toLowerCase();
  const text = readText(param).trim();

  if (!text && text !== '0') return '';
  if (type === 'bool' || type === 'boolean') {
    return ['1', 'true', 't', 'tak'].includes(text.toLowerCase());
  }
  if (type === 'int' || type === 'integer') return readInteger(param);
  if (type === 'real' || type === 'float') return readNumber(param);
  return readText(param);
};

const firstDescriptionLine = (description, fallback) => {
  const firstLine = readText(description).split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return (firstLine || fallback || '').slice(0, 160);
};

const locationFromCoordinates = (lat, lon, explicit = {}) => {
  const reverseLocation = reverseGeocode(lat, lon);
  const city = readText(explicit.city).trim() || reverseLocation.city;
  const region = readText(explicit.region).trim() || reverseLocation.region;
  const country = readText(explicit.country).trim() || reverseLocation.country;
  return { city, region, country };
};

const noeBool = (value) => {
  const number = readInteger(value);
  if (number === 1) return true;
  if (number === 2) return false;
  return undefined;
};

// ── Nieruchomosci-online.pl NOE 2.0 parser ───────────────────────────────────

const createNieruchomosciOnlineParser = () => new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
});

const parseNieruchomosciOnlineAgents = (root) => (
  toArray(root?.agents?.agent)
    .map((agent) => normaliseAgent({
      id: readText(agent?.idAgent).trim(),
      name: [readText(agent?.name), readText(agent?.surname)].filter(Boolean).join(' '),
      email: agent?.email,
      phone: agent?.phone2 ?? agent?.phone1,
      image: agent?.photo,
      licenseNumber: agent?.licenseNr,
    }))
    .filter(Boolean)
);

/**
 * Parses the NOE 2.0 agent directory independently from property listings.
 * The provider can therefore supply the carousel even when a delivery contains
 * no active ads.
 *
 * @param {string} xmlString Raw NOE 2.0 export
 * @returns {Array} Normalised agents
 */
export const parseNieruchomosciOnlineAgentsXml = (xmlString) => {
  const root = createNieruchomosciOnlineParser().parse(xmlString).xml;
  return parseNieruchomosciOnlineAgents(root);
};

/**
 * Parses a NOE 2.0 XML export from Nieruchomosci-online.pl.
 *
 * @param {string} xmlString Raw NOE 2.0 export
 * @param {string} photoBasePath Public URL prefix for the provider photo folder
 * @returns {Array} Normalised offer objects
 */
export const parseNieruchomosciOnlineXml = (xmlString, photoBasePath = '', { includeInactive = false } = {}) => {
  const root = createNieruchomosciOnlineParser().parse(xmlString).xml;
  if (!root?.ads?.ad) return [];

  const agentsById = new Map(
    parseNieruchomosciOnlineAgents(root)
      .map((agent) => [agent.id, agent])
      .filter(([id]) => id),
  );

  const offers = [];
  for (const ad of toArray(root.ads.ad)) {
    const details = ad?.details;
    const action = readText(details?.action).trim().toLowerCase();
    const sourceStatus = action === 'delete' ? 'deleted'
      : ['deactivate', 'deactivated', 'inactive'].includes(action) ? 'deactivated'
        : 'active';
    if (!details) continue;

    const sourceId = readText(details.sign).trim() || readText(details.id).trim();
    if (!sourceId || (sourceStatus !== 'active' && !includeInactive)) continue;

    if (sourceStatus !== 'active') {
      offers.push({
        id: `nieruchomosci-online-${sourceId}`,
        provider: 'nieruchomosci-online-pl',
        providerOfferId: sourceId,
        sourceStatus,
        sourceData: ad,
        tab: '',
        typ: '',
        price: 0,
        currency: '',
        videoUrl: null,
        params: {},
        location: {},
      });
      continue;
    }

    const lat = readNumber(ad.map?.mapLatitude);
    const lon = readNumber(ad.map?.mapLongitude);
    const params = {};

    for (const [sourceField, polishParam] of Object.entries(NOE_DETAILS_TO_POLISH_PARAMS)) {
      const value = details[sourceField];
      if (readText(value).trim()) params[polishParam] = value === details.description ? readText(value) : readNumber(value) ?? readText(value);
    }
    for (const [sourceField, polishParam] of Object.entries(NOE_BOOLEAN_PARAMS)) {
      const value = noeBool(details[sourceField]);
      if (value !== undefined) params[polishParam] = value;
    }

    const location = locationFromCoordinates(lat, lon, {
      city: details.cityName,
      region: details.idRegionName,
    });

    params.powierzchnia ??= readNumber(details.area) ?? 0;
    params.liczbapokoi ??= readInteger(details.rooms) ?? 0;
    params.liczbalazienek ??= readInteger(details.bathRooms) ?? 0;
    params.miasto = readText(params.miasto).trim() || location.city;
    params.opis ??= readText(details.description);
    params.latitude = lat ?? 0;
    params.longitude = lon ?? 0;
    params.tytul = firstDescriptionLine(params.opis, sourceId);

    toArray(ad.photos?.photo)
      .map((photo) => readText(photo?.fileName).trim())
      .filter(Boolean)
      .forEach((fileName, index) => {
        params[`zdjecie${index + 1}`] = joinPhotoUrl(photoBasePath, fileName);
      });

    offers.push({
      id: `nieruchomosci-online-${sourceId}`,
      provider: 'nieruchomosci-online-pl',
      providerOfferId: sourceId,
      sourceStatus,
      sourceData: ad,
      tab: NOE_CATEGORY_TO_TAB[readInteger(details.idCategory)] ?? 'inne',
      typ: NOE_AD_TYPE_TO_TYPE[readInteger(details.idAdType)] ?? 'sprzedaz',
      price: readNumber(details.price) ?? 0,
      currency: NOE_CURRENCY_TO_CODE[readInteger(details.idCurrency)] ?? 'EUR',
      videoUrl: readText(details.videoAdLink).trim() || null,
      agent: agentsById.get(readText(details.idAgent).trim()),
      params,
      location,
    });
  }

  return offers;
};

// ── Oferty.net XML 0.4 parser ────────────────────────────────────────────────

/**
 * Parses the Oferty.net / Domy.pl XML 0.4 export format.
 *
 * @param {string} xmlString Raw Oferty.net export
 * @param {string} photoBasePath Public URL prefix for the provider photo folder
 * @param {{ includeInactive?: boolean }} options Keep differential deletions for lifecycle reconciliation
 * @returns {Array} Normalised offer objects
 */
export const parseOfertyNetXml = (xmlString, photoBasePath = '', { includeInactive = false } = {}) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
  });
  const root = parser.parse(xmlString).plik;
  if (!root?.lista_ofert?.dzial) return [];

  const globalPhotos = new Map();
  for (const photo of toArray(root.zdjecia?.zdjecie)) {
    const sourceId = readText(photo?.id).trim();
    const fileName = readText(photo?.nazwa).trim();
    if (!sourceId || !fileName || readText(photo?.akcja).toLowerCase() === 'u') continue;
    const photos = globalPhotos.get(sourceId) ?? [];
    photos.push({ fileName, order: readNumber(photo?.kolejnosc) ?? photos.length });
    globalPhotos.set(sourceId, photos);
  }

  const offers = [];
  for (const department of toArray(root.lista_ofert.dzial)) {
    const tab = readText(department?.['@_tab']).trim().toLowerCase();
    const typ = readText(department?.['@_typ']).trim().toLowerCase();
    if (!OFERTY_NET_TABS.includes(tab)) continue;

    for (const rawOffer of toArray(department?.oferta)) {
      const sourceId = readText(rawOffer?.id).trim();
      if (!sourceId) continue;
      // The Oferty.net differential protocol uses an offer-level action when
      // an insertion is removed. `u` (usuń) is documented alongside textual
      // delete/remove variants used by some exporter versions.
      const action = readText(rawOffer?.akcja ?? rawOffer?.action ?? rawOffer?.['@_akcja']).trim().toLowerCase();
      const sourceStatus = ['u', 'usun', 'usuń', 'delete', 'deleted', 'remove', 'removed', 'deactivate', 'deactivated']
        .includes(action)
        ? (['deactivate', 'deactivated'].includes(action) ? 'deactivated' : 'deleted')
        : 'active';
      if (sourceStatus !== 'active' && !includeInactive) continue;

      if (sourceStatus !== 'active') {
        offers.push({
          id: `oferty-net-${sourceId}`,
          provider: 'oferty-net',
          providerOfferId: sourceId,
          sourceStatus,
          sourceData: { offer: rawOffer },
          tab: '',
          typ: '',
          price: 0,
          currency: '',
          videoUrl: null,
          agent: null,
          params: {},
          location: {},
        });
        continue;
      }

      const params = {};
      for (const param of toArray(rawOffer?.param)) {
        const name = readText(param?.['@_nazwa']).trim();
        if (name) params[name] = readTypedParam(param);
      }

      const explicitPhotoNames = Object.entries(params)
        .filter(([name, value]) => /^zdjecie\d+$/i.test(name) && readText(value).trim())
        .sort(([left], [right]) => Number(left.match(/\d+/)?.[0]) - Number(right.match(/\d+/)?.[0]))
        .map(([, value]) => readText(value).trim());
      Object.keys(params)
        .filter((name) => /^zdjecie\d+$/i.test(name))
        .forEach((name) => delete params[name]);

      const photos = globalPhotos.get(sourceId) ?? explicitPhotoNames.map((fileName, order) => ({ fileName, order }));
      photos
        .sort((left, right) => left.order - right.order)
        .forEach((photo, index) => {
          params[`zdjecie${index + 1}`] = joinPhotoUrl(photoBasePath, photo.fileName);
        });

      const lat = readNumber(params.geo_lat) ?? readNumber(params.n_geo_y);
      const lon = readNumber(params.geo_lng) ?? readNumber(params.n_geo_x);
      const location = locationFromCoordinates(lat, lon, {
        city: params.miasto,
        region: params.wojewodztwo,
        country: params.kraj,
      });
      params.powierzchnia = readNumber(params.powierzchnia) ?? 0;
      params.liczbapokoi = readInteger(params.liczbapokoi) ?? 0;
      params.liczbalazienek = readInteger(params.liczbalazienek) ?? 0;
      params.miasto = readText(params.miasto).trim() || location.city;
      params.opis = readText(params.opis);
      params.latitude = lat ?? 0;
      params.longitude = lon ?? 0;
      params.tytul = readText(params.advertisement_text).trim() || firstDescriptionLine(params.opis, sourceId);

      offers.push({
        id: `oferty-net-${sourceId}`,
        provider: 'oferty-net',
        providerOfferId: sourceId,
        sourceStatus,
        sourceData: { offer: rawOffer, photos },
        tab,
        typ: typ === 'wynajem' ? 'wynajem' : 'sprzedaz',
        price: readNumber(rawOffer.cena) ?? 0,
        currency: readText(rawOffer.cena?.['@_waluta']).trim() || 'EUR',
        videoUrl: readText(params.wideo).trim() || null,
        agent: normaliseAgent({
          name: [readText(params.agent_imie), readText(params.agent_nazwisko)].filter(Boolean).join(' '),
          email: params.agent_email,
          phone: params.agent_tel_kom ?? params.agent_tel,
        }),
        params,
        location,
      });
    }
  }

  return offers;
};

