import { describe, expect, it } from 'vitest';
import {
  parseNieruchomosciOnlineXml,
  parseOfertyNetXml,
} from './xmlParser.js';

describe('parseNieruchomosciOnlineXml', () => {
  it('normalises NOE 2.0 data, maps vocabulary, and keeps photo order', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <xml>
        <agents><agent><idAgent>174162</idAgent><name>Wojciech</name><surname>Danielak</surname><phone2>+48690048888</phone2><email>wojtek@globalshome.com</email></agent></agents>
        <ads>
          <ad>
            <details>
              <id>123</id><sign>NOE-42</sign><action>insert</action>
              <idAgent>174162</idAgent>
              <idCategory>1</idCategory><idAdType>2</idAdType><idCurrency>2</idCurrency>
              <cityName>Chania</cityName><idRegionName>Kreta</idRegionName>
              <area>52.5</area><areaBalcony>4.5</areaBalcony><areaGarden>15</areaGarden>
              <rooms>2</rooms><bedRooms>1</bedRooms><bathRooms>1</bathRooms><nrGarageStands>2</nrGarageStands>
              <price>235000</price><description>Apartament blisko plaży\nDruga linia</description>
              <isElevator>2</isElevator><isGarden>1</isGarden><isWCSeparated>1</isWCSeparated>
            </details>
            <map><mapLatitude>35.5138</mapLatitude><mapLongitude>24.0180</mapLongitude></map>
            <photos><photo><fileName>first.jpg</fileName></photo><photo><fileName>second.jpg</fileName></photo></photos>
          </ad>
          <ad><details><id>deleted</id><action>delete</action></details></ad>
        </ads>
      </xml>`;

    const [offer] = parseNieruchomosciOnlineXml(xml, '/uploads/nieruchomosci-online-pl');

    expect(offer).toMatchObject({
      id: 'nieruchomosci-online-NOE-42',
      provider: 'nieruchomosci-online-pl',
      providerOfferId: 'NOE-42',
      tab: 'mieszkania',
      typ: 'wynajem',
      price: 235000,
      currency: 'EUR',
      location: { city: 'Chania', region: 'Kreta' },
      agent: { id: '174162', name: 'Wojciech Danielak', phone: '+48690048888', email: 'wojtek@globalshome.com' },
    });
    expect(offer.params).toMatchObject({
      powierzchnia: 52.5,
      liczbapokoi: 2,
      liczbasypialni: 1,
      liczbalazienek: 1,
      powierzchnia_balkonu: 4.5,
      powierzchnia_ogrodka: 15,
      liczba_miejsc_parkingowych: 2,
      winda: false,
      ogrodek: true,
      osobne_wc: true,
      tytul: 'Apartament blisko plaży',
      zdjecie1: '/uploads/nieruchomosci-online-pl/first.jpg',
      zdjecie2: '/uploads/nieruchomosci-online-pl/second.jpg',
    });
  });
});

describe('parseOfertyNetXml', () => {
  it('normalises generic parameters and assigns global photos to their offer', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <plik>
        <lista_ofert>
          <dzial tab="mieszkania" typ="sprzedaz">
            <oferta>
              <id>OF-7</id><cena waluta="EUR">325000</cena>
              <param nazwa="powierzchnia" typ="real">72,5</param>
              <param nazwa="liczbapokoi" typ="int">3</param>
              <param nazwa="liczbalazienek" typ="int">2</param>
              <param nazwa="miasto" typ="text">Ateny</param>
              <param nazwa="kraj" typ="text">Grecja</param>
              <param nazwa="geo_lat" typ="real">37.9838</param>
              <param nazwa="geo_lng" typ="real">23.7275</param>
              <param nazwa="advertisement_text" typ="text">Penthouse w Atenach</param>
              <param nazwa="agent_nazwisko" typ="text">Wojciech Danielak</param>
              <param nazwa="agent_email" typ="text">wojtek@globalshome.com</param>
              <param nazwa="agent_tel_kom" typ="text">+48 690 048 888</param>
              <param nazwa="opis" typ="text"><linia>Pierwsza linia</linia><linia>Druga linia</linia></param>
            </oferta>
          </dzial>
        </lista_ofert>
        <zdjecia>
          <zdjecie><id>OF-7</id><kolejnosc>20</kolejnosc><akcja>d</akcja><nazwa>second.jpg</nazwa></zdjecie>
          <zdjecie><id>OF-7</id><kolejnosc>10</kolejnosc><akcja>d</akcja><nazwa>first.jpg</nazwa></zdjecie>
          <zdjecie><id>OF-7</id><kolejnosc>30</kolejnosc><akcja>u</akcja><nazwa>removed.jpg</nazwa></zdjecie>
        </zdjecia>
      </plik>`;

    const [offer] = parseOfertyNetXml(xml, '/uploads/oferty-net/');

    expect(offer).toMatchObject({
      id: 'oferty-net-OF-7',
      provider: 'oferty-net',
      providerOfferId: 'OF-7',
      tab: 'mieszkania',
      typ: 'sprzedaz',
      price: 325000,
      currency: 'EUR',
      location: { city: 'Ateny', country: 'Grecja' },
      agent: { name: 'Wojciech Danielak', email: 'wojtek@globalshome.com', phone: '+48 690 048 888' },
    });
    expect(offer.params).toMatchObject({
      powierzchnia: 72.5,
      liczbapokoi: 3,
      liczbalazienek: 2,
      opis: 'Pierwsza linia\nDruga linia',
      tytul: 'Penthouse w Atenach',
      zdjecie1: '/uploads/oferty-net/first.jpg',
      zdjecie2: '/uploads/oferty-net/second.jpg',
    });
    expect(offer.params.zdjecie3).toBeUndefined();
  });
});
