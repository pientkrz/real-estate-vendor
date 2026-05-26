import { XMLParser } from 'fast-xml-parser';
import dict from './otodom-dictionary.json';
import { reverseGeocode } from './reverseGeocode.js';
import { validateOtoDomXml } from './xmlValidator.js';

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
 * @param {string} photoBasePath   URL prefix for photo files,
 *                                 e.g. "/real-estate-vendor/2026-05-23_13%3A07%3A04/"
 * @returns {Array} Normalised offer objects
 */
export const parseOtoDomXml = (xmlString, photoBasePath = '') => {
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
    // Skip deactivations (Action=1) and deletions (Action=2)
    if (parseInt(ins.Action) !== 0) continue;

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
    const { city, country } = reverseGeocode(lat, lon);

    const offer = {
      id: `otodom-${ins.ID}`,
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
      location: { country, city },
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
