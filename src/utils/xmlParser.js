/**
 * Parsuje plik XML z ofertami do tablicy obiektów.
 * @param {string} xmlString 
 * @returns {Array} List of offer objects
 */
export const parseOffersXml = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const offers = [];

  const dzials = xmlDoc.getElementsByTagName("dzial");
  for (let d = 0; d < dzials.length; d++) {
    const dzial = dzials[d];
    const tab = dzial.getAttribute("tab");
    const typ = dzial.getAttribute("typ");
    const offerNodes = dzial.getElementsByTagName("oferta");

    for (let o = 0; o < offerNodes.length; o++) {
      const node = offerNodes[o];
      const offer = {
        id: node.getElementsByTagName("id")[0]?.textContent,
        tab,
        typ,
        price: parseFloat(node.getElementsByTagName("cena")[0]?.textContent || 0),
        currency: node.getElementsByTagName("cena")[0]?.getAttribute("waluta"),
        params: {}
      };

      // Parse <param> tags
      const params = node.getElementsByTagName("param");
      for (let p = 0; p < params.length; p++) {
        const pNode = params[p];
        const name = pNode.getAttribute("nazwa");
        const type = pNode.getAttribute("typ");
        let value = pNode.textContent;

        if (type === "int" || type === "integer") value = parseInt(value);
        else if (type === "real" || type === "float") value = parseFloat(value);
        else if (type === "bool" || type === "boolean") value = value === "1" || value === "tak" || value === "true";

        offer.params[name] = value;
      }

      // Parse <location>
      const locationNode = node.getElementsByTagName("location")[0];
      if (locationNode) {
        offer.location = {};
        const areas = locationNode.getElementsByTagName("area");
        for (let a = 0; a < areas.length; a++) {
          const level = areas[a].getAttribute("level");
          offer.location[`level${level}`] = areas[a].textContent;
        }
      }

      offers.push(offer);
    }
  }

  return offers;
};
