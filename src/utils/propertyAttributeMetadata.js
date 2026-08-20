/**
 * Presentation metadata for canonical provider attributes.
 *
 * The parsers keep provider-specific XML out of the UI. This catalogue turns
 * their merged Polish attribute keys into readable, icon-led property details.
 */

const FIELD_DEFINITIONS = Object.freeze({
  liczbalazienek: { label: 'Ilość łazienek', icon: 'bathtub', group: 'Układ nieruchomości' },
  liczbasypialni: { label: 'Ilość sypialni', icon: 'bedroom_parent', group: 'Układ nieruchomości' },
  liczba_sypialni: { label: 'Ilość sypialni', icon: 'bedroom_parent', group: 'Układ nieruchomości' },
  liczbapokoi: { label: 'Ilość pokoi', icon: 'meeting_room', group: 'Układ nieruchomości' },
  pietro: { label: 'Piętro', icon: 'layers', group: 'Układ nieruchomości' },
  liczbapieter: { label: 'Liczba pięter', icon: 'stairs', group: 'Układ nieruchomości' },
  liczba_poziomow: { label: 'Liczba poziomów', icon: 'domain', group: 'Układ nieruchomości' },
  powierzchnia_uzytkowa: { label: 'Powierzchnia użytkowa', icon: 'square_foot', group: 'Powierzchnie', suffix: 'm²' },
  powierzchnia_calkowita: { label: 'Powierzchnia całkowita', icon: 'aspect_ratio', group: 'Powierzchnie', suffix: 'm²' },
  powierzchnia_dzialki: { label: 'Powierzchnia działki', icon: 'landscape', group: 'Powierzchnie', suffix: 'm²' },
  powierzchnia_balkonu: { label: 'Powierzchnia balkonu', icon: 'balcony', group: 'Powierzchnie', suffix: 'm²' },
  powierzchnia_piwnicy: { label: 'Powierzchnia piwnicy', icon: 'inventory_2', group: 'Powierzchnie', suffix: 'm²' },
  powierzchnia_ogrodka: { label: 'Powierzchnia ogródka', icon: 'yard', group: 'Powierzchnie', suffix: 'm²' },
  rokbudowy: { label: 'Rok budowy', icon: 'calendar_today', group: 'Budynek i stan' },
  typbudynkumieszk: { label: 'Typ budynku', icon: 'apartment', group: 'Budynek i stan' },
  stanbudynku: { label: 'Stan budynku', icon: 'construction', group: 'Budynek i stan' },
  stannieruchomosci: { label: 'Stan nieruchomości', icon: 'home_repair_service', group: 'Budynek i stan' },
  forma_wlasnosci: { label: 'Forma własności', icon: 'gavel', group: 'Budynek i stan' },
  rynek_pierwotny: { label: 'Rynek pierwotny', icon: 'new_releases', group: 'Budynek i stan' },
  ogrzewanie: { label: 'Ogrzewanie', icon: 'local_fire_department', group: 'Wyposażenie i media' },
  ma_ogrzewanie: { label: 'Ogrzewanie', icon: 'local_fire_department', group: 'Wyposażenie i media' },
  klimatyzacja: { label: 'Klimatyzacja', icon: 'ac_unit', group: 'Wyposażenie i media' },
  winda: { label: 'Winda', icon: 'elevator', group: 'Wyposażenie i media' },
  balkon: { label: 'Balkon', icon: 'balcony', group: 'Wyposażenie i media' },
  taras: { label: 'Taras', icon: 'deck', group: 'Wyposażenie i media' },
  ogrodek: { label: 'Ogródek', icon: 'yard', group: 'Wyposażenie i media' },
  piwnica: { label: 'Piwnica', icon: 'inventory_2', group: 'Wyposażenie i media' },
  poddasze: { label: 'Poddasze', icon: 'roofing', group: 'Wyposażenie i media' },
  garaz: { label: 'Garaż', icon: 'garage', group: 'Wyposażenie i media' },
  miejscaparkingowe: { label: 'Miejsce parkingowe', icon: 'local_parking', group: 'Wyposażenie i media' },
  liczba_miejsc_parkingowych: { label: 'Liczba miejsc parkingowych', icon: 'local_parking', group: 'Wyposażenie i media' },
  meble: { label: 'Umeblowane', icon: 'chair', group: 'Wyposażenie i media' },
  kuchniawyposazona: { label: 'Wyposażona kuchnia', icon: 'countertops', group: 'Wyposażenie i media' },
  lazienka_wc: { label: 'Łazienka z WC', icon: 'bathroom', group: 'Wyposażenie i media' },
  osobne_wc: { label: 'Osobne WC', icon: 'wc', group: 'Wyposażenie i media' },
  internet: { label: 'Internet', icon: 'wifi', group: 'Wyposażenie i media' },
  telewizja: { label: 'Telewizja', icon: 'tv', group: 'Wyposażenie i media' },
  telefon: { label: 'Telefon', icon: 'phone', group: 'Wyposażenie i media' },
  prad: { label: 'Prąd', icon: 'bolt', group: 'Wyposażenie i media' },
  prad_380v: { label: 'Prąd 380 V', icon: 'electric_bolt', group: 'Wyposażenie i media' },
  gaz: { label: 'Gaz', icon: 'propane_tank', group: 'Wyposażenie i media' },
  woda: { label: 'Woda', icon: 'water_drop', group: 'Wyposażenie i media' },
  wodomierz: { label: 'Wodomierz', icon: 'water_damage', group: 'Wyposażenie i media' },
  licznik_ciepla: { label: 'Licznik ciepła', icon: 'thermostat', group: 'Wyposażenie i media' },
  ksiega_wieczysta: { label: 'Księga wieczysta', icon: 'menu_book', group: 'Informacje dodatkowe' },
  dostosowane_do_niepelnosprawnych: { label: 'Dostosowane dla osób z niepełnosprawnością', icon: 'accessible', group: 'Informacje dodatkowe' },
  biuro: { label: 'Możliwość prowadzenia biura', icon: 'business_center', group: 'Informacje dodatkowe' },
  mozliwosc_zmiany: { label: 'Możliwość zmiany', icon: 'sync_alt', group: 'Informacje dodatkowe' },
  mozliwosc_zmiany_opis: { label: 'Opis możliwości zmiany', icon: 'edit_note', group: 'Informacje dodatkowe' },
  bezprowizji: { label: 'Bez prowizji', icon: 'handshake', group: 'Koszty i dostępność' },
  czynsz: { label: 'Czynsz', icon: 'payments', group: 'Koszty i dostępność' },
  dodatkowe_koszty: { label: 'Dodatkowe koszty', icon: 'receipt_long', group: 'Koszty i dostępność' },
  cena_za_m2: { label: 'Cena za m²', icon: 'price_check', group: 'Koszty i dostępność', suffix: '/ m²' },
  zwalnianeod: { label: 'Dostępne od', icon: 'event_available', group: 'Koszty i dostępność' },
  ulica: { label: 'Ulica', icon: 'signpost', group: 'Lokalizacja' },
  dzielnica: { label: 'Dzielnica', icon: 'location_city', group: 'Lokalizacja' },
  energy_co2_emissions: { label: 'Emisja CO₂', icon: 'co2', group: 'Energetyka' },
  energy_final_demand: { label: 'Zapotrzebowanie na energię końcową', icon: 'energy', group: 'Energetyka' },
  energy_non_renewable_demand: { label: 'Nieodnawialna energia pierwotna', icon: 'bolt', group: 'Energetyka' },
  energy_renewable_share: { label: 'Udział energii odnawialnej', icon: 'solar_power', group: 'Energetyka' },
  energy_usable_demand: { label: 'Zapotrzebowanie na energię użytkową', icon: 'electric_meter', group: 'Energetyka' },
});

const GROUP_ORDER = [
  'Układ nieruchomości',
  'Powierzchnie',
  'Budynek i stan',
  'Wyposażenie i media',
  'Koszty i dostępność',
  'Lokalizacja',
  'Energetyka',
  'Informacje dodatkowe',
];

const HIDDEN_ATTRIBUTE = /^(?:attributes\.|zdjecie\d+|opis|tytul|advertisement_text|latitude|longitude|geo_|n_geo_|miasto|wojewodztwo|kraj|market_type|sprzedane|zewnetrzny_url|agent_)/i;

const hasValue = (value) => (
  value !== undefined
  && value !== null
  && !(typeof value === 'string' && value.trim() === '')
  && !(typeof value === 'object' && !Array.isArray(value))
);

const humanizeKey = (key) => key
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/^./, (letter) => letter.toUpperCase());

const formatValue = (value, suffix) => {
  const text = Array.isArray(value) ? value.join(', ') : value === true ? 'Tak' : value === false ? 'Nie' : String(value);
  return suffix ? `${text} ${suffix}`.trim() : text;
};

/**
 * Produces only user-safe, populated rows. Unknown future provider parameters
 * remain visible in the final group rather than being silently discarded.
 */
export const getPropertyDetailGroups = (params = {}) => {
  const groups = new Map();

  for (const [key, value] of Object.entries(params)) {
    if (HIDDEN_ATTRIBUTE.test(key) || !hasValue(value)) continue;
    const definition = FIELD_DEFINITIONS[key] ?? {
      label: humanizeKey(key),
      icon: 'info',
      group: 'Informacje dodatkowe',
    };
    const rows = groups.get(definition.group) ?? [];
    rows.push({
      key,
      label: definition.label,
      icon: definition.icon,
      value: formatValue(value, definition.suffix),
    });
    groups.set(definition.group, rows);
  }

  return GROUP_ORDER
    .filter((name) => groups.has(name))
    .map((name) => ({ name, rows: groups.get(name) }));
};
