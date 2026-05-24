import { XMLParser } from 'fast-xml-parser';
import dict from './otodom-dictionary.json';

// App-internal mapping from Otodom ObjectName code → offer tab slug
const OBJECT_NAME_TAB = { 0: 'mieszkania', 1: 'domy', 2: 'dzialki', 3: 'pokoje', 4: 'lokale', 5: 'hale', 6: 'garaze' };
# TODO: change this naive way of extracting the city since it is not guaranteed to be present in the title, and may be ambiguous (e.g. "Kreta" could refer to the island or to a street name in Warsaw)
// Maps title keywords (case-insensitive) to the city label used in the filter
const LOCATION_KEYWORDS = [
  { words: ['mykonos'],                                                   label: 'Greece (Mykonos)' },
  { words: ['kreta', 'crete', 'heraklion', 'heraklio', 'chania', 'rethymno', 'maleme'], label: 'Greece (Crete)' },
  { words: ['costa del sol', 'marbella', 'málaga', 'malaga'],            label: 'Spain (Costa del Sol)' },
  { words: ['como'],                                                       label: 'Italy (Lake Como)' },
  { words: ['cannes', 'nice', 'monaco', "côte d'azur", 'cote d azur'],   label: 'France (French Riviera)' },
];

/**
 * Derives a params.miasto-compatible location label from an offer title.
 * CollectionManager matches via: city.includes(filter.split(' ')[0])
 */
const extractLocation = (title) => {
  const lower = title.toLowerCase();
  for (const { words, label } of LOCATION_KEYWORDS) {
    if (words.some(w => lower.includes(w))) return label;
  }
  return '';
};

const extractCountry = (title) => {
  const label = extractLocation(title);
  return label ? label.split(' ')[0] : '';
};

// ── Otodom XML parser ─────────────────────────────────────────────────────────

/**
 * Parses an Otodom-format XML file into the normalised offer shape that the
 * existing filter / display components expect.
 *
 * @param {string} xmlString       Raw XML content of the Otodom export file
 * @param {string} photoBasePath   URL prefix for photo files,
 *                                 e.g. "/real-estate-vendor/2026-05-23_13%3A07%3A04/"
 * @returns {Array} Normalised offer objects
 */
export const parseOtoDomXml = (xmlString, photoBasePath = '') => {
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
    // Skip deactivations (Action=1) and deletions (Action=2)
    if (parseInt(ins.Action) !== 0) continue;

    // Resolve the details block for this object type
    const details =
      ins.FlatDetails ??
      ins.HouseDetails ??
      ins.TerrainDetails ??
      ins.RoomDetails ??
      ins.CommercialPropertyDetails ??
      ins.GarageDetails ??
      ins.HallDetails ??
      null;

    const offer = {
      id: `otodom-${ins.ID}`,
      tab: OBJECT_NAME_TAB[parseInt(ins.ObjectName)] ?? 'mieszkania',
      typ: parseInt(ins.OfferType) === 1 ? 'wynajem' : 'sprzedaz',
      price: parseFloat(ins.Price || 0),
      currency: dict.PriceCurrency[String(ins.PriceCurrency)] ?? 'EUR',
      params: {
        powierzchnia:   parseFloat(ins.Area || 0),
        liczbapokoi:    parseInt(details?.RoomsNum || 0),
        liczbalazienek: 0,
        miasto:         extractLocation(ins.Title || ''),
        opis:           ins.Description || '',
        latitude:       parseFloat(ins.GeoMarker?.Latitude || 0),
        longitude:      parseFloat(ins.GeoMarker?.Longitude || 0),
        tytul:          ins.Title || '',
      },
      location: { level1: extractCountry(ins.Title || '') },
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

// ── Legacy internal-format XML parser ────────────────────────────────────────

/**
 * Parsuje plik XML z ofertami do tablicy obiektów.
 * @param {string} xmlString
 * @returns {Array} List of offer objects
 */
export const parseOffersXml = (xmlString) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
  });
  
  const jsonObj = parser.parse(xmlString);
  const offers = [];

  // Structure in current XML: <plik><lista_ofert><dzial>...
  const dzials = Array.isArray(jsonObj.plik?.lista_ofert?.dzial) 
    ? jsonObj.plik.lista_ofert.dzial 
    : jsonObj.plik?.lista_ofert?.dzial ? [jsonObj.plik.lista_ofert.dzial] : [];


  for (const dzial of dzials) {
    const tab = dzial["@_tab"];
    const typ = dzial["@_typ"];
    
    const offerNodes = Array.isArray(dzial.oferta) ? dzial.oferta : [dzial.oferta];

    for (const node of offerNodes) {
      if (!node) continue;

      const offer = {
        id: String(node.id),
        tab,
        typ,
        price: parseFloat(node.cena?.["#text"] || node.cena || 0),
        currency: node.cena?.["@_waluta"] || "EUR",
        params: {}
      };

      // Parse <param> tags
      const params = Array.isArray(node.param) ? node.param : node.param ? [node.param] : [];
      for (const pNode of params) {
        const name = pNode["@_nazwa"];
        const type = pNode["@_typ"];
        let value = pNode["#text"] || pNode;

        if (type === "int" || type === "integer") value = parseInt(value);
        else if (type === "real" || type === "float") value = parseFloat(value);
        else if (type === "bool" || type === "boolean") value = value === "1" || value === "tak" || value === "true";

        offer.params[name] = value;
      }

      // Parse <location>
      if (node.location) {
        offer.location = {};
        const areas = Array.isArray(node.location.area) ? node.location.area : [node.location.area];
        for (const area of areas) {
          const level = area["@_level"];
          offer.location[`level${level}`] = area["#text"] || area;
        }
      }

      offers.push(offer);
    }
  }

  return offers;
};
