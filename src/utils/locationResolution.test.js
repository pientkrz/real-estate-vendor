import { describe, expect, it, vi } from 'vitest';

const reverseGeocode = vi.hoisted(() => vi.fn(() => ({
  city: 'Fallback City',
  region: 'Fallback Region',
  country: 'Fallback Country',
})));

vi.mock('./reverseGeocode.js', () => ({ reverseGeocode }));

import {
  parseNieruchomosciOnlineXml,
  parseOfertyNetXml,
  parseOtoDomXml,
} from './xmlParser.js';

const otodom = (location) => `
  <otoDom><ImportType>full</ImportType><Insertions><Insertion>
    <ID>ms-1</ID><Action>0</Action><ObjectName>0</ObjectName><OfferType>0</OfferType>
    <Price>100</Price><PriceCurrency>2</PriceCurrency><Area>50</Area>
    ${location}<GeoMarker><Latitude>35</Latitude><Longitude>24</Longitude></GeoMarker>
    <FlatDetails><RoomsNum>2</RoomsNum></FlatDetails>
  </Insertion></Insertions></otoDom>`;

describe('provider location resolution', () => {
  it('preserves Otodom XML location and resolves its country/province codes', () => {
    reverseGeocode.mockClear();
    const [offer] = parseOtoDomXml(otodom('<Country>1</Country><Province>5</Province><City>Łódź</City>'));

    expect(offer.location).toEqual({ country: 'Polska', region: 'łódzkie', city: 'Łódź' });
    expect(offer.locationSources).toEqual({
      country: { source: 'xml', xmlField: 'Country' },
      region: { source: 'xml', xmlField: 'Province' },
      city: { source: 'xml', xmlField: 'City' },
    });
    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it('treats standalone Otodom Country=1 as legacy and falls back to coordinates', () => {
    const [offer] = parseOtoDomXml(otodom('<Country>1</Country>'));

    expect(offer.location).toEqual({
      country: 'Fallback Country', region: 'Fallback Region', city: 'Fallback City',
    });
    expect(offer.locationSources.country).toEqual({
      source: 'coordinates',
      xmlField: 'Country',
      legacy: { source: 'legacy', xmlField: 'Country', value: '1' },
    });
  });

  it('uses NOE cityName and districtName, filling only its missing country', () => {
    const [offer] = parseNieruchomosciOnlineXml(`
      <xml><ads><ad><details>
        <id>1</id><sign>NOE-1</sign><idCategory>1</idCategory><idAdType>1</idAdType><idCurrency>2</idCurrency>
        <cityName>Heraklion</cityName><districtName>Kreta</districtName><area>50</area><rooms>2</rooms><price>100</price>
      </details><map><mapLatitude>35</mapLatitude><mapLongitude>24</mapLongitude></map></ad></ads></xml>`);

    expect(offer.location).toEqual({ city: 'Heraklion', region: 'Kreta', country: 'Fallback Country' });
    expect(offer.locationSources).toMatchObject({
      city: { source: 'xml', xmlField: 'cityName' },
      region: { source: 'xml', xmlField: 'districtName' },
      country: { source: 'coordinates' },
    });
  });

  it('does not reverse geocode a complete Oferty.net location or translate its spelling', () => {
    reverseGeocode.mockClear();
    const [offer] = parseOfertyNetXml(`
      <plik><lista_ofert><dzial tab="mieszkania" typ="sprzedaz"><oferta>
        <id>OF-1</id><cena waluta="EUR">100</cena>
        <param nazwa="kraj" typ="text">Grecja</param>
        <param nazwa="wojewodztwo" typ="text">Kreta</param>
        <param nazwa="miasto" typ="text">Chania</param>
        <param nazwa="geo_lat" typ="real">35</param><param nazwa="geo_lng" typ="real">24</param>
      </oferta></dzial></lista_ofert></plik>`);

    expect(offer.location).toEqual({ country: 'Grecja', region: 'Kreta', city: 'Chania' });
    expect(offer.locationSources).toEqual({
      country: { source: 'xml', xmlField: 'param.kraj' },
      region: { source: 'xml', xmlField: 'param.wojewodztwo' },
      city: { source: 'xml', xmlField: 'param.miasto' },
    });
    expect(reverseGeocode).not.toHaveBeenCalled();
  });
});
