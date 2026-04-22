import { XMLParser } from 'fast-xml-parser';

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
