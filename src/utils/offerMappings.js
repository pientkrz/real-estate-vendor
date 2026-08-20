/**
 * Provider vocabulary translated to the normalised Polish offer shape used by
 * the application.  NOE's complete controlled vocabulary is supplied by the
 * provider in noeDictionary_v_2_0.xml; these are the stable values required to
 * categorise and display an offer before any provider-specific UI is added.
 */

export const NOE_CATEGORY_TO_TAB = Object.freeze({
  1: 'mieszkania',
  2: 'domy',
  3: 'dzialki',
  4: 'lokale',
  5: 'budynki',
  6: 'pokoje',
});

export const NOE_AD_TYPE_TO_TYPE = Object.freeze({
  1: 'sprzedaz',
  2: 'wynajem',
});

export const NOE_CURRENCY_TO_CODE = Object.freeze({
  1: 'PLN',
  2: 'EUR',
  3: 'USD',
});

export const NOE_DETAILS_TO_POLISH_PARAMS = Object.freeze({
  area: 'powierzchnia',
  areaUse: 'powierzchnia_uzytkowa',
  areaPlot: 'powierzchnia_dzialki',
  areaBalcony: 'powierzchnia_balkonu',
  areaBasement: 'powierzchnia_piwnicy',
  areaGarden: 'powierzchnia_ogrodka',
  pricePM: 'cena_za_m2',
  rooms: 'liczbapokoi',
  bedRooms: 'liczbasypialni',
  bedrooms: 'liczbasypialni',
  bathRooms: 'liczbalazienek',
  floor: 'pietro',
  totalFloors: 'liczbapieter',
  levels: 'liczba_poziomow',
  yearBuilt: 'rokbudowy',
  description: 'opis',
  street: 'ulica',
  quarterName: 'dzielnica',
  cityName: 'miasto',
  rent: 'czynsz',
  additionalCharges: 'dodatkowe_koszty',
  availableFrom: 'zwalnianeod',
  nrGarageStands: 'liczba_miejsc_parkingowych',
  possibleChangeText: 'mozliwosc_zmiany_opis',
  videoAdLink: 'wideo',
  propertyUrl: 'zewnetrzny_url',
});

export const NOE_BOOLEAN_PARAMS = Object.freeze({
  isElevator: 'winda',
  isGarageParking: 'garaz',
  isBalcony: 'balkon',
  isBasement: 'piwnica',
  isGarden: 'ogrodek',
  isFurnished: 'meble',
  isAirConditioning: 'klimatyzacja',
  isDisPeopleAdapt: 'dostosowane_do_niepelnosprawnych',
  isGarret: 'poddasze',
  isKw: 'ksiega_wieczysta',
  isMInternet: 'internet',
  isMWater: 'woda',
  isMWaterMetering: 'wodomierz',
  isMGas: 'gaz',
  isMElectricity: 'prad',
  isMElectricity380: 'prad_380v',
  isMHeatMetering: 'licznik_ciepla',
  isMTelephone: 'telefon',
  isMTv: 'telewizja',
  isPossibleOffice: 'biuro',
  isPossibleChange: 'mozliwosc_zmiany',
  isWCSeparated: 'osobne_wc',
  noAgentProvision: 'bezprowizji',
});

/** Oferty.net's `tab` values are already Polish; this validates supported types. */
export const OFERTY_NET_TABS = Object.freeze([
  'mieszkania',
  'domy',
  'dzialki',
  'lokale',
  'pokoje',
]);
