# Dostawcy ofert

Parser każdego dostawcy jest adapterem używanym przez polecenie przetwarzające
dostawy FTP. Zwraca znormalizowany rekord wraz z identyfikatorem dostawcy i
statusem cyklu życia. Polecenie zapisuje jedną atomową migawkę JSON; aplikacja
SSR odczytuje ją zamiast czytać XML lub archiwa FTP ZIP podczas żądania strony.
Serwer wykorzystuje zapisane rekordy **agregatu nieruchomości** dla filtra ofert
i strony szczegółów.

## Kanoniczny agregat nieruchomości

Tożsamość nieruchomości jest deterministyczna dla obecnych źródeł:

| Dostawca | Klucz dostawcy | Klucz kanoniczny |
| --- | --- | --- |
| Otodom | `Insertion.ID` | Usuń wyłącznie początkowe `ms` lub `ds` (`ms113-6` → `113-6`) |
| Nieruchomosci-online.pl | `details.sign` | Użyj bez zmian |
| Oferty.net | `oferta.id` | Użyj bez zmian |

`src/utils/propertyAggregate.js` grupuje te rekordy i zwraca agregat o
następujących istotnych częściach:

```js
{
  id: '113-6',
  externalIds: { 'otodom-pl': 'ms113-6', 'nieruchomosci-online-pl': '113-6' },
  lifecycle: { state: 'active', sourceStatuses: { /* … */ }, isVisible: true },
  property: {
    price: { amount: 235000, currency: 'EUR' },
    areas: { usableM2: 44, totalM2: 52, plotM2: undefined },
    location: { city: '…', region: '…', country: '…' },
    attributes: { /* merged Polish fields */ },
    media: [/* adresy zdjęć z informacją o źródle */],
  },
  provenance: { 'areas.usableM2': { provider: 'otodom-pl', sourceField: 'Area' } },
  conflicts: [],
  sourceRecords: { /* sparsowane rekordy, zachowane po stronie serwera */ },
}
```

Wyspa React filtra otrzymuje niewielki widok zgodności wyprowadzony z agregatu,
a nie źródłowy XML. Dzięki temu dane po stronie klienta pozostają niewielkie, a
obecne komponenty nadal używają `price`, `params` i `location`. Trasy szczegółów
powstają z tego samego agregatu, więc nieruchomość jest pokazana tylko raz,
niezależnie od liczby dostawców.

Widok listy dostaje wyłącznie pola karty i mapy, m.in. pokoje, sypialnie,
łazienki, powierzchnię użytkową, współrzędne i zdjęcie główne. Trasa szczegółów
otrzymuje pełny bezpieczny zestaw atrybutów i prezentuje go w opisanych grupach
z ikonami. Dane kontaktowe dostawców, identyfikatory źródłowe, surowy XML, pola
obrazów i nieczytelne kody słownikowe celowo pozostają po stronie serwera.

Jeżeli zinterpretowanego rekordu dostawcy nie da się zagregować, błąd trafia do
logu, a pominięty jest tylko ten rekord nieruchomości. Poprawne rekordy innych
dostawców nadal tworzą i zasilają agregat; `skippedSourceRecords` przechowuje
odwołanie do dostawcy oraz powód błędu do diagnostyki po stronie serwera.

### Rozstrzyganie pól

Gdy źródła zawierają równoważne pola, aktualna deterministyczna kolejność
preferencji to Otodom → Nieruchomosci-online.pl → Oferty.net; brakujące wartości
są uzupełniane przez kolejnego dostawcę. Wybrany dostawca jest zapisywany dla
każdego pola w `provenance`.

### Lokalizacja: XML przed współrzędnymi

Lokalizacja jest wyjątkiem od zwykłej kolejności dostawców. Parser najpierw
zachowuje niepuste nazwy dokładnie w pisowni dostawcy; lokalny, offline'owy
reverse geocoder jest wywoływany tylko dla brakujących pól `kraj`–`region`–`miasto`.
Nie tłumaczy ani nie normalizuje nazw z XML.

| Dostawca | Kraj | Region | Miasto |
| --- | --- | --- | --- |
| Otodom | `Country`, przez słownik | `Province`, przez słownik albo tekst | `City` |
| Nieruchomosci-online.pl (NOE) | brak — współrzędne | `idRegionName`, a gdy puste `districtName` | `cityName` |
| Oferty.net | parametr `kraj` | parametr `wojewodztwo` | parametr `miasto` |

W agregacie wygrywa XML rekordu zawierającego najwięcej użytecznych pól
lokalizacji. Remis rozstrzyga kolejność Otodom → NOE → Oferty.net. Dopiero gdy
żaden dostawca nie poda danego pola w XML, używana jest wartość wyprowadzona ze
współrzędnych. Decyzja i ewentualny konflikt są widoczne w `provenance` oraz
`conflicts`; `params.miasto` jest zawsze synchronizowane z końcowym
`location.city`.

Każdy zapisany rekord dostawcy zawiera prywatne `locationSources` dla trzech
pól (`source: xml | coordinates`, nazwa pola XML). Historyczne samotne
`Otodom Country=1` jest oznaczone dodatkowo jako `legacy` i **nie** jest
traktowane jako pełna lokalizacja — kraj, region i miasto są wtedy uzupełniane
ze współrzędnych. Te metadane pozostają w stanie JSON po stronie serwera i nie
trafiają do przeglądarki. Rekordy zapisane przed wprowadzeniem metadanych są
bezpiecznie traktowane jak wartości z fallbacku współrzędnych.

Wartości powierzchni nie są traktowane jako równoważne: `Area` z Otodom i
`areaUse` z NOE trafiają do `usableM2`; `area` z NOE i `powierzchnia` z
Oferty.net trafiają do `totalM2`. Dotychczasowe pole wyświetlania
`params.powierzchnia` preferuje powierzchnię użytkową, natomiast
`params.powierzchnia_uzytkowa` i `params.powierzchnia_calkowita` zachowują obie
wartości jawnie.

### Konflikty cyklu życia

Agregator zachowuje rekordy dezaktywacji i usunięcia z Otodom. Jeśli jeden
dostawca oznaczy nieruchomość jako usuniętą, gdy drugi nadal ją publikuje, stan
agregatu to `conflict`, a `isVisible` przyjmuje wartość `false`. Publiczny filtr
i trasy szczegółów nie promują więc oferty, która mogła zostać wycofana.

To celowo ostrożna zasada. Przed jej zmianą należy ustalić wyraźną politykę
uzgadniania — np. pierwszeństwo wiarygodnego dostawcy albo zaufane znaczniki
czasu wysyłki FTP — i wdrożyć ją w resolverze cyklu życia agregatu.

## Kontrakt parsera dostawcy

Każdy parser przed agregacją zwraca znormalizowany rekord dostawcy:

```js
{
  id: 'provider-source-id',
  provider: 'otodom-pl | nieruchomosci-online-pl | oferty-net',
  providerOfferId: 'source-id',
  sourceStatus: 'active | deactivated | deleted',
  sourceData: { /* sparsowane wartości specyficzne dla dostawcy; tylko serwer */ },
  tab: 'mieszkania | domy | dzialki | pokoje | lokale | hale-magazyny | garaze | budynki | inne',
  typ: 'sprzedaz | wynajem',
  price: 235000,
  currency: 'EUR',
  videoUrl: null,
  params: { powierzchnia: 52, liczbapokoi: 2, miasto: '…', zdjecie1: '…' },
  location: { country: '…', region: '…', city: '…' },
}
```

## Dokumentacja struktury XML

- **Otodom Import XML v170130:** [opis struktury formatu Otodom](https://zaadresowani.pl/import/dokumentacja)
  opisuje `<otoDom>` → `<Insertions>` → `<Insertion>` oraz rozróżnienie
  dostawy pełnej `<ImportType>full</ImportType>` i przyrostowej
  `<ImportType>incremental</ImportType>`. Używana przez parser referencja
  słowników wskazuje też historyczny [endpoint słowników Otodom](http://www.otodom.pl/api/lite/dictionaries).

  | `ObjectName` | Kategoria aplikacji | Wymagany blok szczegółów |
  | --- | --- | --- |
  | `0` | mieszkania | `FlatDetails` |
  | `1` | domy | `HouseDetails` |
  | `2` | działki | `TerrainDetails` |
  | `3` | pokoje | `RoomDetails` |
  | `4` | lokale | `CommercialPropertyDetails` |
  | `5` | hale-magazyny | `HallDetails` |
  | `6` | garaże | `GarageDetails` |

  Parser odczytuje wyłącznie blok przypisany do wartości `ObjectName`.
  Zgodnie ze specyfikacją pokój (`ObjectName=3`) może mieć wyłącznie
  `OfferType=1` (wynajem). Nieznany przyszły kod jest zachowany jako kategoria
  `inne`, logowany i nie jest łączony z blokiem szczegółów innego typu.
- **Oferty.net / Domy.pl XML 0.4.x:** [oficjalna specyfikacja eksportu XML](https://domy.pl/eksport).
  Opisuje hierarchię `<plik>` → `<header>` → `<lista_ofert>` → `<dzial>` →
  `<oferta>`, obsługiwane typy parametrów, zdjęcia, lokalizację i kompletne
  listy pól dla każdej kategorii nieruchomości.
- **Nieruchomosci-online.pl NOE 2.0:** [oficjalna strona integracji](https://www.nieruchomosci-online.pl/integracja-z-nieruchomosci-online.html),
  zawierająca pobranie NOE w wersji 2.0. Szczegółowa referencja jest też
  dostępna jako [specyfikacja XML NOE 2.0 (PDF)](https://demo5.imo.net.pl/assets/documents/properties/18554/2fe55f37-714b-40aa-b4b6-6638ede444c7.pdf).
  Opisuje `<xml>` → `<export>`, `<agents>` i `<ads>`; każdy `<ad>` zawiera
  `<details>` oraz opcjonalne `<photos>`, `<plans>`, `<map>` i `<pois>`.

Dokument NOE odwołuje się do dodatkowego `noeDictionary_v_2_0.xml` oraz
przykładowych eksportów pełnych i przyrostowych. Przy dodawaniu mapowań,
których nie obejmuje `src/utils/offerMappings.js`, pobierz aktualne załączniki
przez [kontakt ze wsparciem Nieruchomosci-online.pl](https://www.nieruchomosci-online.pl/integracja-z-nieruchomosci-online.html).

## Karuzela agentów

Karuzela agentów na stronie szczegółów oferty jest zasilana wyłącznie katalogiem
`<agents>` NOE 2.0 z dostawy XML Nieruchomosci-online.pl. Proces przetwarzania
zapisuje katalog w tej samej migawce stanu co oferty. Parser wykorzystuje pola
`idAgent`, `name`, `surname`, `phone2` (z rezerwą `phone1`), `email` oraz
opcjonalne `licenseNr` i `photo`. Pusty lub niedostępny kanał dostawcy po prostu
ukrywa karuzelę; nigdy nie blokuje wyrenderowania strony nieruchomości.

## Protokół dostaw FTP

VPS otrzymuje archiwa ZIP, a nie luźne pliki XML, w
`/home/ixtnzfseqk/dostawa-ofert/<provider>/`. Zadanie cron uruchamia się co 30
minut i akceptuje archiwum dopiero, gdy ma ono co najmniej 15 minut, przejdzie
`unzip -t`, zawiera oczekiwany wpis XML i deklaruje rozpoznany rodzaj dostawy:

| Dostawca | Wpis XML | Znacznik pełnej/różnicowej dostawy |
| --- | --- | --- |
| Otodom | `properties_otodom.xml` | `<otoDom><ImportType>` |
| Nieruchomosci-online.pl | `properties_noe2.xml` | `<xml><export><type>` |
| Oferty.net | `oferty.xml` | `<plik><header><zawartosc_pliku>` |

Pełny eksport zastępuje bazę danego dostawcy, a późniejsze różnice ją
aktualizują. Różnice otrzymane przed pierwszą pełną bazą dostawcy są zapisywane
i ignorowane. Zdarzenie usunięcia lub dezaktywacji od dowolnego dostawcy
natychmiast ukrywa agregat. Nieprawidłowe archiwum nigdy nie zmienia
opublikowanego stanu.

Zdjęcia wskazane przez zaakceptowane oferty są wypakowywane bezpośrednio z ZIP
do prywatnego, konfigurowalnego katalogu zdjęć i udostępniane przez Astro pod
`/offer-photos/...`. Po utworzeniu przetworzonego stanu nie używa się
zewnętrznych adresów obrazów ani GitHub.

Opis konfiguracji, retencji, odtwarzania i procesów VPS znajduje się w
[instrukcji obsługi dostaw ofert](instrukcja-obslugi-dostaw-ofert.md).

## Mapowania dostawców

`Nieruchomosci-online.pl` korzysta z NOE 2.0. Jego identyfikatory kategorii są
mapowane na polskie zakładki: `1` mieszkania, `2` domy, `3` działki, `4` lokale,
`5` budynki i `6` pokoje. Identyfikatory transakcji mapują się na `1` sprzedaż
i `2` wynajem, a waluty na `1` PLN, `2` EUR i `3` USD. Nazwy pól liczbowe lub
zbliżone do angielskich są kopiowane do polskich kluczy, np. `area` →
`powierzchnia`, `rooms` → `liczbapokoi`, `description` → `opis`. Normalizowane
są także pola powierzchni użytkowej/całkowitej, balkonu, ogrodu, piwnicy,
parkingu, dostępności, mediów, dostępności architektonicznej i osobnego WC.
Pole sypialni przekazane jako `bedRooms`, `bedrooms`, `liczba_sypialni` lub
`liczbasypialni` trafia do `liczbasypialni`. Jeśli żaden dostawca nie poda tej
wartości, interfejs pokazuje `—`, zamiast wyciągać ją z liczby pokoi.

`Oferty.net` przekazuje już polskie nazwy kategorii i parametrów. Globalna lista
`<zdjecia>` jest grupowana po identyfikatorze oferty i sortowana po
`<kolejnosc>`, zanim zdjęcia trafią kolejno do `params.zdjecie1`,
`params.zdjecie2` itd.

Identyfikatory dostawców zachowują prefiks w rekordach źródłowych. Publiczne
trasy nieruchomości używają kanonicznego, połączonego identyfikatora, dlatego ta
sama nieruchomość jest prezentowana tylko raz, niezależnie od liczby dostawców.
