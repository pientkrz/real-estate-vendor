# Specyfikacja Techniczna: Global S Home — Aplikacja Nieruchomości

**Wersja:** 2.1.0
**Status:** Zaktualizowana — architektura SSR + system kursów walut

---

## 1. Opis Projektu

Global S Home to serwis marketingowy z ofertami nieruchomości, skierowany na rynki śródziemnomorskie i międzynarodowe (Grecja, Włochy, Hiszpania, Francja, ZEA, Egipt). Umożliwia przeglądanie, filtrowanie i składanie zapytań dotyczących nieruchomości pobieranych z eksportu XML platformy Otodom.

Aplikacja działa jako **serwer Node.js (Astro SSR)**. Strona główna jest renderowana po stronie serwera przy każdym żądaniu (świeże dane ofert i kursy walut), natomiast pozostałe strony (szczegóły nieruchomości, blog) są prerenderowane statycznie podczas budowania. Treści zarządzane są przez aktualizację plików — bez CMS.

**Stos technologiczny:** Astro 6 · Node.js adapter (standalone) · React 19 (islands) · Tailwind v4 · Leaflet 1.9 · node-cron · Vitest

---

## 2. Struktura Serwisu

| Ścieżka | Plik | Opis |
| :--- | :--- | :--- |
| `/` | `src/pages/index.astro` | Strona główna — mapa, pasek filtrów, siatka ogłoszeń |
| `/property/[id]` | `src/pages/property/[id].astro` | Szczegółowa strona nieruchomości |
| `/blog` | `src/pages/blog/index.astro` | Lista wpisów blogowych z zakładkami kategorii |
| `/blog/[slug]` | `src/pages/blog/[...slug].astro` | Pojedynczy wpis blogowy |
| `/contact` | `src/pages/contact.astro` | Formularz kontaktowy + dane biura |
| `/o-nas` | `src/pages/o-nas.astro` | Strona „O nas" (statyczna, treść po polsku) |

---

## 3. Architektura

### 3.1 Tryb Renderowania

Astro działa z `output: 'static'` i adapterem `@astrojs/node` (tryb `standalone`). W tej konfiguracji każda strona może być niezależnie prerenderowana (statyczna) lub renderowana po stronie serwera (SSR), co oznacza że w praktyce jest to architektura hybrydowa:

| Strona | Tryb | Uzasadnienie |
| :--- | :--- | :--- |
| `index.astro` | **SSR** (`prerender = false`) | Oferty i kursy walut są odczytywane ze świeżego stanu serwera przy każdym żądaniu |
| `property/[id].astro` | **Statyczna** (`getStaticPaths`) | Generowana raz przy budowaniu; jedna strona na ofertę |
| Blog, kontakt, o-nas | **Statyczna** (domyślna) | Treść nie zmienia się między buildami |

Ścieżka bazowa jest konfigurowana w `astro.config.mjs`. Wszystkie wewnętrzne linki muszą używać `import.meta.env.BASE_URL`.

Serwer produkcyjny uruchamiany jest po zbudowaniu poleceniem:
```bash
node dist/server/entry.mjs
```

### 3.2 React Islands

Tylko komponenty interaktywne są hydratowane w przeglądarce:

| Dyrektywa | Komponenty |
| :--- | :--- |
| `client:load` | Navbar, CollectionManager, ContactForm |
| `client:only="react"` | PropertyMap (Leaflet — tylko przeglądarka) |

`CollectionManager` używa `client:load` (nie `client:only`), co oznacza że Astro SSR renderuje pełną listę ofert do HTML przy każdym żądaniu — korzystne dla SEO. Mapa (`ListingsMap`) wewnątrz `CollectionManager` jest ładowana przez `React.lazy` + `Suspense`, co chroni przed wykonaniem kodu Leaflet podczas SSR.

### 3.3 Przepływ Danych

```
[plik XML na serwerze, spoza projektu]
        │ ścieżka: OFFERS_XML_PATH (lub fallback: public/XML_COLLECTION_PATH/)
        ▼ (każde żądanie SSR, Node fs.readFileSync)
src/utils/xmlParser.js → parseOtoDomXml()
        │  ├─ validateOtoDomXml()   (xmlValidator.js)
        │  ├─ reverseGeocode()      (reverseGeocode.js, offline, all-the-cities)
        │  └─ wstrzykiwany prefiks photoBasePath (PHOTO_BASE_URL)
        │
        ├─▶ index.astro (SSR) → initialOffers[] + initialRates{} → CollectionManager
        └─▶ [id].astro (statyczna) → getStaticPaths() czyta XML raz przy buildzie

[src/server/rateService.js — singleton Node.js]
        │ uruchamia się przy starcie serwera
        │ odpytuje Frankfurter API → ECB (fallback) → co 1 godzinę (node-cron)
        │ przechowuje kursy w pamięci procesu
        ▼
index.astro (SSR) → getRates() → initialRates{} + ratesTimestamp → CollectionManager
```

**Filtrowanie działa w pamięci klienta:** przy każdej zmianie filtra przeglądarka przelicza wyniki bezpośrednio w React, bez żadnego żądania do serwera. Wszystkie oferty i kursy walut są ładowane do pamięci JavaScript po otwarciu strony.

`src/hooks/useOffers.js` jest nieaktualny (pobiera stary `/offers.xml`) i nie jest używany przez żadną stronę.

### 3.4 Hierarchia Komponentów (strona główna)

```
Layout.astro
├── Navbar (client:load)
└── [zawartość strony]
    ├── ListingsMap (client:only="react")
    ├── ListingFilterBar  ← zarządzany przez CollectionManager
    └── CollectionManager (client:load)
        ├── ListingFilterBar   (stan filtrów)
        └── FeaturedProperties (przefiltrowane i posortowane oferty)
            └── PropertyCard[]
```

---

## 4. Źródło Danych: Otodom XML

### 4.1 Lokalizacja Pliku

W środowisku produkcyjnym plik XML i zdjęcia znajdują się **poza katalogiem projektu Astro**, w lokalizacji konfigurowanej przez zmienną środowiskową `OFFERS_XML_PATH`:

```
/srv/data/properties/properties_otodom.xml   ← przykład ścieżki produkcyjnej
/srv/data/properties/[pliki zdjęć]
```

W środowisku deweloperskim (gdy `OFFERS_XML_PATH` nie jest ustawiona), plik XML czytany jest ze struktury lokalnego folderu `public/`:

```
public/2026-05-23_13%3A07%3A04/properties_otodom.xml
public/2026-05-23_13%3A07%3A04/[pliki zdjęć]
```

Logika wyboru ścieżki w `index.astro`:
```js
const xmlPath = import.meta.env.OFFERS_XML_PATH
  ?? path.join(process.cwd(), 'public', import.meta.env.XML_COLLECTION_PATH ?? '', 'properties_otodom.xml');
```

### 4.2 Struktura XML

```
<otoDom>
  <Agency>…</Agency>
  <Date>…</Date>
  <ImportType>…</ImportType>
  <Insertions>
    <Insertion>…</Insertion>
  </Insertions>
</otoDom>
```

Wpisy z `Action !== 0` (dezaktywacja/usunięcie) są pomijane.

### 4.3 Mapowanie Pól

| Pole Otodom | Właściwość oferty | Uwagi |
| :--- | :--- | :--- |
| `Insertion.ID` | `id` → `"otodom-{ID}"` | Używane jako slug URL |
| `Insertion.ObjectName` | `objectName` | 0=mieszkanie, 1=dom, 2=działka, 3=pokój, 4=lokal, 5=hala, 6=garaż |
| `Insertion.OfferType` | `typ` | 1=wynajem, inne=sprzedaż |
| `Insertion.Price` | `price` | |
| `Insertion.PriceCurrency` | `currency` | Rozwiązywane przez `otodom-dictionary.json` |
| `Insertion.Area` | `params.powierzchnia` | m² |
| `*Details.RoomsNum` | `params.liczbapokoi` | Z bloku Details dla danego typu |
| `Insertion.GeoMarker.Latitude/Longitude` | `params.latitude/longitude` | |
| `Insertion.Description` | `params.opis` | HTML |
| `Insertion.Title` | `params.tytul` | |
| `Insertion.Photos.Photo[].File` | `params.zdjecie1…N` | Sortowane wg `Position`, poprzedzone `photoBasePath` |
| `Insertion.Video` | `videoUrl` | URL YouTube; konwertowany na embed przez `getYouTubeEmbedUrl()` |
| `GeoMarker` | `params.miasto` | **Wyznaczane** offline przez odwrotne geokodowanie — nie odczytywane z XML |

### 4.4 Wyznaczanie Lokalizacji

`params.miasto` (etykieta miasta) **nie jest** obecne w XML. Wyznaczane jest w czasie parsowania przez `reverseGeocode(lat, lon)` używając zbioru danych `all-the-cities` (135k+ miast, odległość Haversine'a). Wynik zawiera `{ city, region, country, countryCode }`. Filtr krajów w CollectionManager używa `city.includes(filter.split(' ')[0])`.

### 4.5 Szczegóły Według Typu

Każdy `ObjectName` ma odpowiadający blok XML `*Details` oraz resolver w `propertyDetailsResolver.js`. Numeryczne kody słownikowe i maski bitowe `ArrayOfInteger` dekodowane są do czytelnych etykiet przy użyciu `otodom-dictionary.json` (spec Otodom v170130).

---

## 5. Funkcjonalności

### 5.1 Mapa Ogłoszeń

Pełnoszerokościowa mapa Leaflet wyświetlana nad paskiem filtrów na stronie głównej. Pokazuje wszystkie **aktualnie przefiltrowane** nieruchomości jako markery `divIcon` z oznaczeniem ceny. Kliknięcie markera otwiera popup z miniaturą, tytułem, ceną i linkiem do strony szczegółów. Mapa wyśrodkowana na Morzu Śródziemnym `[37, 23]` przy zoomie 5; automatycznie dopasowuje zakres przy zmianie ofert.

### 5.2 Pasek Filtrów

Przyklejony pasek (`top-[NAV_H]`) z następującymi kontrolkami:

| Kontrolka | Klucz stanu | Zachowanie |
| :--- | :--- | :--- |
| Suwak zakresu cen | `priceMin`, `priceMax` | Podwójny zakres na histogramie przedziałów cenowych |
| Przełącznik waluty | `displayCurrency` | Przełącza histogram i wyświetlanie cen między EUR a PLN; reset filtra ceny |
| Ikona ⓘ (tooltip) | — | Po najechaniu pokazuje datę i godzinę ostatniego pobrania kursów walut |
| Multi-select krajów | `countries` | Lista checkboxów; „Wszystkie" odznacza pozostałe |
| Wybór typu nieruchomości | `tab` | Mapuje na `objectName` (0–6) |
| Minimalna liczba pokoi | `minRooms` | Filtruje `params.liczbapokoi` |
| Sortowanie | `sortBy` | `price_asc`, `price_desc`, `area_desc` |
| Przycisk resetowania | — | Czyści wszystkie filtry do wartości domyślnych |

Przedziały histogramu i etykiety cen używają skróconej notacji M/k. Przy zmianie waluty wyświetlania histogram jest przeliczany, filtry cenowe są resetowane, a ceny na kartach ofert są przeliczane na bieżąco w pamięci klienta.

### 5.3 Siatka Ogłoszeń

Responsywna siatka komponentów `PropertyCard` poniżej mapy. Każda karta pokazuje:
- Miniaturę głównego zdjęcia (szarość → kolor po najechaniu)
- Cenę (formatowaną przez `formatPrice` z `Intl.NumberFormat pl-PL`)
- Etykietę miasto/kraj
- Pasek parametrów: powierzchnia (m²), liczba pokoi, typ oferty (sprzedaż/wynajem)
- Plakietkę statusu

Na ekranach `lg` co druga kolumna przesunięta jest o 12 px ku górze dla efektu redakcyjnego.

### 5.4 Strona Szczegółów Nieruchomości

Statyczna strona generowana dla każdej oferty. Sekcje w kolejności:

1. **Nawigacja breadcrumb** — link powrotny do listy ogłoszeń
2. **Hero** — główne zdjęcie, tytuł oferty, cena, powierzchnia
3. **Galeria bento** — do 4 dodatkowych zdjęć w siatce
4. **Przyklejony pasek parametrów** — cena / powierzchnia / pokoje
5. **Opis** — pełny HTML z `params.opis`
6. **Panel parametrów zależny od typu** — przekierowywany przez `PropertyDetailsPanel` do jednego z 7 komponentów panelowych
7. **Wirtualny spacer video** — osadzony iframe YouTube (jeśli `videoUrl` jest obecny)
8. **Mapa nieruchomości** — mapa Leaflet z jednym pulsującym markerem; nakładka „Lokalizacja zastrzeżona" gdy brak współrzędnych
9. **Podobne nieruchomości** — karuzela powiązanych ofert
10. **Siatka agentów** — zakodowany na stałe zespół 4 osób (Monika, Wojciech, Krzysztof, Szymon) z linkami kontaktowymi
11. **Formularz zapytania** — przyklejony formularz „Zapytaj o ofertę"

### 5.5 Panele Szczegółów Według Typu

| ObjectName | Komponent | Kluczowe pola |
| :--- | :--- | :--- |
| 0 — Mieszkanie | `FlatDetailsPanel` | Typ budynku, piętro, stan wykończenia, pokoje, ogrzewanie, dodatki, informacje o wynajmie |
| 1 — Dom | `HouseDetailsPanel` | Typ budynku, pow. działki, piętra, rok budowy, media, okolica |
| 2 — Działka | `TerrainDetailsPanel` | Typ nieruchomości, wymiary, dojazd, media |
| 3 — Pokój | `RoomDetailsPanel` | Umeblowanie, data dostępności, preferencje lokatorów, czynsz/kaucja |
| 4 — Lokal użytkowy | `CommercialPropertyDetailsPanel` | Piętro, wykończenie, typ użytkowania, media, bezpieczeństwo |
| 5 — Hala/Magazyn | `HallDetailsPanel` | Konstrukcja, wysokość, posadzka, rampa, przestrzeń biurowa |
| 6 — Garaż | `GarageDetailsPanel` | Lokalizacja, konstrukcja, ogrzewanie, oświetlenie |

Wszystkie panele używają `DetailRow` (ikona + etykieta/wartość) i `TagList` (tablice chipów) jako wspólnych prymitywów i zwracają `null` dla pustych wartości.

### 5.6 Blog

- **Strona listingu**: 3-kolumnowa redakcyjna siatka z przyklejoną nawigacją zakładek kategorii (Wszystkie / Architektura / Inwestycje / Styl życia / Raporty rynkowe). Przesunięcie col-2 na desktopie.
- **Strona wpisu**: Metadane w bocznym panelu (data, autor, udostępnienie), pełna treść Markdown, oraz `RelatedCarousel` (do 6 ostatnich wpisów, przewijanie poziome z przyciskami chevron).
- **Schemat frontmatter**: `title`, `description`, `pubDate` (wymagane); `author`, `thumbnail`, `category` (opcjonalne).
- **Katalog z treścią**: Konfigurowany przez zmienną środowiskową `BLOG_CONTENT_PATH` (patrz §7.1). Domyślnie `./src/content/blog`. Może wskazywać dowolny katalog — przydatne przy montowaniu zewnętrznego wolumenu z treścią bez zmian w kodzie. Serwer deweloperski musi zostać zrestartowany po zmianie tej wartości.

### 5.7 Strona Kontaktowa

Układ dwukolumnowy: lewa kolumna pokazuje dane biura (adres Mediolan, telefon, email, godziny otwarcia) z ikonami Material Symbols. Prawa kolumna zawiera wyspę React `ContactForm`.

Pola `ContactForm`: imię i nazwisko, email, telefon, preferowana metoda kontaktu (Email / Telefon / WhatsApp), wiadomość, checkbox zgody RODO. Przycisk wysyłania jest nieaktywny do zaznaczenia zgody. W tekście RODO wymieniona jest spółka Smart Trade Sp. z o.o.

### 5.8 Strona „O nas" (`/o-nas`)

W pełni statyczna. Lewa kolumna: opis firmy po polsku pozycjonujący Global S Home na rynku śródziemnomorskim. Prawa kolumna: dekoracyjny znak firmowy SVG (moneta + południki globu + „S" + ikony domu/palmy). Brak danych dynamicznych.

### 5.9 System Kursów Walut

Użytkownik może przełączać wyświetlanie cen między **EUR** a **PLN** za pomocą przełącznika w pasku filtrów. Wszystkie ceny ofert — niezależnie od waluty źródłowej zapisanej w XML (`currency` oferty) — są przeliczane na wybraną walutę wyświetlania.

#### Architektura

```
[node-cron, co 1h]
        │
        ├─ Frankfurter API (primary): api.frankfurter.app
        │  └─ EUR jako baza → PLN, GBP, USD, AED, EGP
        │
        └─ ECB (fallback): ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
           └─ Parsowanie XML; AED wyznaczane jako USD × 3.6725 (kurs stały)

[src/server/rateService.js — singleton w procesie Node.js]
        │ przechowuje currentRates{} i ratesTimestamp w pamięci
        │ zabezpieczenie globalThis.__rateServiceStarted zapobiega
        │ wielokrotnemu uruchomieniu cron przy hot-reload (dev)
        ▼
index.astro (SSR) → getRates() → props do CollectionManager
        ▼
[przeglądarka] convertPrice(price, fromCurrency, toCurrency, rates)
        │ przelicza przez EUR jako wspólną bazę:
        │   priceInEUR = price / rates[fromCurrency]
        │   result     = priceInEUR × rates[toCurrency]
        ▼
formatPrice(result, displayCurrency) → Intl.NumberFormat('pl-PL')
```

#### Polityka fallback kursów

| Priorytet | Źródło | Warunek |
| :---: | :--- | :--- |
| 1 | Frankfurter API | Dostępne |
| 2 | ECB eurofxref XML | Frankfurter niedostępny |
| 3 | Poprzednie kursy (w pamięci) | Oba API niedostępne; kursy z ostatniego udanego pobrania |
| 4 | Kursy przybliżone (hardcode) | Pierwsze uruchomienie, oba API niedostępne |

#### Świeżość kursów

Kursy są pobierane raz przy starcie serwera (natychmiast), a następnie co godzinę przez `node-cron`. Kursy przechowywane są w pamięci procesu — restart serwera powoduje natychmiastowe ponowne pobranie.

Użytkownik z otwartą kartą przez wiele godzin widzi kursy z momentu wczytania strony. Aktualna data/godzina pobrania kursów widoczna jest w tooltipie ikony ⓘ przy przełączniku waluty (format: `dd.mm.rrrr, HH:MM`).

#### Pliki

| Plik | Rola |
| :--- | :--- |
| `src/server/rateService.js` | Singleton serwera: cron, pobieranie, pamięć kursów |
| `src/utils/exchangeRates.js` | `convertPrice()` (czysty, współdzielony klient/serwer), `FALLBACK_RATES` |
| `src/utils/formatPrice.js` | Formatowanie liczby z symbolem waluty (`Intl.NumberFormat`) |

---

## 6. System Designu

### 6.1 Tokeny Kolorów (`src/index.css` `@theme`)

| Token | Wartość | Zastosowanie |
| :--- | :--- | :--- |
| `primary` | `#7a590c` | Złoto — przyciski CTA, akcenty, linki |
| `secondary` | `#79582f` | Ciepły brąz |
| `surface` / `background` | `#fcf9f8` | Kremowe tło strony |
| `on-surface` / `obsidian` | `#1c1b1b` | Prawie czarny tekst |
| `outline` | `#807666` | Taupe — obramowania, wyciszony tekst |

Pełny system kolorów Material Design 3 (kontenery, stałe, warianty odwrócone) jest zdefiniowany, ale używany wybiórczo.

### 6.2 Typografia

| Rola | Czcionka | Styl |
| :--- | :--- | :--- |
| `font-headline` | Work Sans | Pogrubiona, ścisły tracking |
| `font-body` / `font-label` | Inter | Lekka/normalna, rozluźniony interlinia |
| `font-serif` | Cormorant Garamond | Kursywa, redakcyjna |

### 6.3 Kluczowe Klasy Użytkowe

- `.editorial-gradient` — `linear-gradient(135deg, #7a590c → #c2994a)`
- **Brak linii separatorów 1px** — zamiast obramowań stosowane są przesunięcia tonalne tła
- Glassmorphism przez `backdrop-blur-md` na nakładkach

---

## 7. Infrastruktura Techniczna

### 7.1 Zmienne Środowiskowe

Wszystkie wartości zależne od środowiska konfigurowane są przez plik `.env` w katalogu głównym projektu (skopiuj `.env.example` na start). Serwer deweloperski musi zostać **zrestartowany** po każdej zmianie `.env` — Vite odczytuje je przy uruchomieniu, nie przy hot-reload.

| Zmienna | Wymagana | Opis |
| :--- | :--- | :--- |
| `OFFERS_XML_PATH` | Produkcja | Bezwzględna ścieżka do pliku XML Otodom na serwerze, poza katalogiem projektu. Przykład: `/srv/data/properties/properties_otodom.xml`. Gdy ustawiona, `XML_COLLECTION_PATH` jest ignorowana. |
| `XML_COLLECTION_PATH` | Dev (fallback) | Folder z znacznikiem czasu w `public/` zawierający XML Otodom i zdjęcia. Używany gdy `OFFERS_XML_PATH` nie jest ustawiona. Przykład: `2026-05-23_13%3A07%3A04` |
| `PHOTO_BASE_URL` | Nie | Prefiks URL dodawany do każdej nazwy pliku zdjęcia parsowanego z XML. Jeśli pominięty, zdjęcia rozwiązywane są względem lokalnego folderu `public/`. Dla produkcji ustaw na URL serwera lub CDN skąd serwowane są zdjęcia. |
| `BLOG_CONTENT_PATH` | Nie | Katalog (względem katalogu głównego projektu) zawierający pliki Markdown bloga. Domyślnie `./src/content/blog` jeśli nie ustawiono. |

### 7.2 Protokół Aktualizacji XML

Ponieważ strona główna jest renderowana SSR, **nowy eksport XML jest widoczny natychmiast po zapisaniu pliku** — bez przebudowania serwisu. Strony szczegółów nieruchomości (`/property/[id]`) są prerenderowane statycznie i wymagają przebudowania.

**Środowisko produkcyjne (XML poza projektem):**
1. Wyeksportuj `properties_otodom.xml` z Otodom.
2. Wgraj plik XML na serwer pod ścieżkę wskazaną przez `OFFERS_XML_PATH`.
3. Wgraj powiązane zdjęcia pod ścieżkę wskazywaną przez `PHOTO_BASE_URL`.
4. Następne żądanie do strony głównej automatycznie wczyta nowe dane.
5. Aby zaktualizować strony szczegółów — uruchom `pnpm build && node dist/server/entry.mjs`.

**Środowisko deweloperskie (XML w `public/`):**
1. Wyeksportuj `properties_otodom.xml` z Otodom.
2. Wgraj XML i zdjęcia do nowego folderu z znacznikiem czasu w `public/`.
3. Ustaw `XML_COLLECTION_PATH` w `.env` na nazwę nowego folderu.
4. Zaktualizuj `PHOTO_BASE_URL` jeśli potrzebne.
5. Zrestartuj serwer deweloperski.

### 7.3 Walidacja XML

`xmlValidator.js` uruchamiany jest w czasie parsowania i sprawdza:
- Strukturę główną (`otoDom`, `Agency`, `Date`, `ImportType`)
- Wymagane pola dla każdego `ObjectName` (ID, Price, Description, MarketType, lokalizacja)
- Wymaganie pola Area; bloki Details dla danego typu; obecność RoomsNum
- Oferty `Room` muszą mieć `OfferType=1` (tylko wynajem)
- Dodatkowe/nieznane pola są dozwolone (kompatybilność w przód)

### 7.4 Testowanie

Testy używają Vitest + React Testing Library ze środowiskiem `jsdom`. Plik konfiguracyjny: `test/setup.js`.

| Plik | Zakres |
| :--- | :--- |
| `ContactForm.test.jsx` | Renderowanie pól, blokada RODO |
| `CollectionManager.test.jsx` | Parsowanie fixture XML, filtr krajów, multi-select, reset |
| `videoUrl.test.js` | Warianty konwersji URL YouTube |
| `xmlValidator.test.js` | Wymagane pola, walidacja per typ, przypadki brzegowe dezaktywacji |
| `reverseGeocode.test.js` | Wyszukiwanie po współrzędnych, obsługa null, mapowanie kodów administracyjnych |
| `*DetailsPanel.test.jsx` × 7 | Renderowanie szczegółów, sekcje warunkowe, bezpieczeństwo null |
| `PropertyDetailsPanel.test.jsx` | Routing dispatchera wg `objectName` |

Uruchom wszystkie testy: `pnpm test`
Uruchom pojedynczy plik: `pnpm vitest src/components/ContactForm.test.jsx`

| Plik | Zakres |
| :--- | :--- |
| `exchangeRates.test.js` | `convertPrice()` — konwersje walut, przypadki brzegowe (null, nieznana waluta, ta sama waluta) |

### 7.5 Runtime Serwera

Serwis działa jako samodzielny serwer Node.js generowany przez `@astrojs/node` w trybie `standalone`.

```bash
pnpm build                    # buduje dist/server/entry.mjs
node dist/server/entry.mjs    # uruchamia serwer HTTP
```

**`src/server/rateService.js`** jest singletonem: importowany przez `index.astro` przy pierwszym żądaniu, inicjalizuje się raz przez cały czas życia procesu. Zawiera:
- Natychmiastowe pobranie kursów przy starcie (`refresh()` wywoływane synchronicznie przy imporcie)
- Harmonogram `node-cron` uruchamiający odświeżenie co pełną godzinę (`0 * * * *`)
- Flaga `globalThis.__rateServiceStarted` zapobiegająca wielokrotnemu uruchomieniu przy hot-reload w trybie deweloperskim

**Restart serwera** powoduje natychmiastowe ponowne pobranie kursów i odczyt XML z dysku przy następnym żądaniu.

---

## 8. Historyjki Użytkownika

### Epic 1 — Odkrywanie Nieruchomości

**US-01** — Jako kupujący chcę widzieć wszystkie aktywne ogłoszenia na mapie po otwarciu serwisu, aby od razu uzyskać geograficzny przegląd dostępnych nieruchomości.

**US-02** — Jako kupujący chcę filtrować ogłoszenia według zakresu cen za pomocą suwaka histogramu, aby zawęzić wyniki do swojego budżetu bez znajomości dokładnych wartości granicznych.

**US-03** — Jako kupujący chcę wybierać jeden lub więcej krajów z listy rozwijanej, aby przeglądać oferty z wielu rynków jednocześnie.

**US-04** — Jako kupujący chcę filtrować ogłoszenia według typu nieruchomości (mieszkanie, dom, działka, pokój, lokal, hala, garaż), aby ukryć nieistotne typy.

**US-05** — Jako kupujący chcę filtrować według minimalnej liczby pokoi, aby wykluczyć nieruchomości zbyt małe dla mojej rodziny.

**US-06** — Jako kupujący chcę sortować ogłoszenia według ceny (rosnąco/malejąco) lub powierzchni (od największej), aby szybko znaleźć najlepsze dopasowanie.

**US-07** — Jako kupujący chcę resetować wszystkie aktywne filtry jednym kliknięciem, aby rozpocząć nowe wyszukiwanie bez odświeżania strony.

**US-08** — Jako kupujący chcę, aby markery na mapie aktualizowały się w czasie rzeczywistym przy zmianie filtrów, dzięki czemu mapa zawsze odzwierciedla przefiltrowany zestaw wyników.

---

### Epic 2 — Szczegóły Nieruchomości

**US-09** — Jako kupujący chcę przeglądać pełnoekranową galerię zdjęć nieruchomości, aby ocenić jej stan i wygląd przed złożeniem zapytania.

**US-10** — Jako kupujący chcę czytać pełny opis nieruchomości (z eksportu Otodom), aby zrozumieć co jest zawarte w ogłoszeniu.

**US-11** — Jako kupujący chcę widzieć parametry techniczne zależne od typu (np. piętro, materiał budynku, typ ogrzewania dla mieszkania; powierzchnia działki, typ domu dla domu), abym miał szczegóły potrzebne do porównania opcji.

**US-12** — Jako kupujący chcę widzieć lokalizację nieruchomości na mapie, aby ocenić bliskość punktów zainteresowania.

**US-13** — Jako kupujący chcę oglądać wirtualny spacer osadzony na stronie szczegółów, aby zdalnie zapoznać się z nieruchomością.

**US-14** — Jako kupujący chcę widzieć podobne nieruchomości na dole strony szczegółów, aby kontynuować przeglądanie powiązanych ofert bez powrotu do listy.

**US-15** — Jako kupujący chcę widzieć który agent obsługuje nieruchomość i jego dane kontaktowe, aby wiedzieć z kim się skontaktować.

**US-16** — Jako kupujący chcę złożyć zapytanie („Zapytaj o ofertę") bezpośrednio ze strony szczegółów nieruchomości, aby wyrazić zainteresowanie w jednym kroku.

---

### Epic 3 — Kontakt i Pozyskiwanie Leadów

**US-17** — Jako odwiedzający chcę złożyć zapytanie kontaktowe z podaniem preferowanej metody kontaktu (email, telefon, WhatsApp), aby agencja mogła się ze mną skontaktować w preferowany przeze mnie sposób.

**US-18** — Jako odwiedzający chcę być zobowiązany do wyrażenia zgody RODO przed wysłaniem jakiegokolwiek formularza, aby być poinformowanym o tym jak moje dane będą przetwarzane.

**US-19** — Jako odwiedzający chcę widzieć adres biura, telefon i email agencji na stronie kontaktowej, abym mógł skontaktować się z nimi bezpośrednio.

---

### Epic 4 — Blog i Treści

**US-20** — Jako czytelnik chcę przeglądać artykuły blogowe pogrupowane według kategorii (Architektura, Inwestycje, Styl życia, Raporty rynkowe), aby szybko znaleźć treści istotne dla moich zainteresowań.

**US-21** — Jako czytelnik chcę czytać pełny artykuł blogowy z odpowiednią typografią i obsługą obrazów, aby doświadczenie czytania odpowiadało premium publikacji redakcyjnej.

**US-22** — Jako czytelnik chcę widzieć powiązane artykuły na końcu wpisu, abym mógł kontynuować czytanie bez powrotu do indeksu.

**US-23** — Jako redaktor treści chcę opublikować nowy wpis blogowy przez dodanie pliku Markdown do `src/content/blog/`, aby nie były potrzebne zmiany w kodzie ani dostęp do CMS.

---

### Epic 5 — Zarządzanie Danymi

**US-24** — Jako administrator chcę aktualizować listę nieruchomości przez zastąpienie pliku eksportu XML Otodom i przebudowanie serwisu, aby wszystkie strony odzwierciedlały najnowsze dane bez dotykania kodu aplikacji.

**US-25** — Jako administrator chcę, aby parser automatycznie pomijał dezaktywowane lub usunięte ogłoszenia (`Action !== 0`), dzięki czemu wygasłe oferty nigdy nie pojawiają się na serwisie.

**US-26** — Jako administrator chcę, aby walidator XML raportował brakujące wymagane pola w czasie budowania, dzięki czemu problemy z jakością danych są wykrywane przed wdrożeniem.

**US-27** — Jako administrator chcę, aby lokalizacje nieruchomości były automatycznie wyznaczane ze współrzędnych GPS przez offline'owe odwrotne geokodowanie, dzięki czemu przy eksporcie z Otodom nie jest wymagane ręczne tagowanie miast.

---

### Epic 6 — Wydajność i Jakość

**US-28** — Jako deweloper chcę, aby strona główna była renderowana po stronie serwera (SSR), dzięki czemu oferty i kursy walut są zawsze aktualne bez przebudowania serwisu, a jednocześnie strony szczegółów i blog pozostają prerenderowane statycznie dla maksymalnej wydajności.

**US-28a** — Jako deweloper chcę, aby pełna lista ogłoszeń była obecna w HTML zwracanym przez serwer (`client:load` zamiast `client:only`), dzięki czemu roboty wyszukiwarek indeksują wszystkie oferty.

**US-29** — Jako deweloper chcę, aby mapa Leaflet była ładowana leniwie przez `React.lazy` + `Suspense`, dzięki czemu SSR dla `CollectionManager` nie kończy się błędem przez API przeglądarki używane przez Leaflet.

**US-30** — Jako deweloper chcę testów jednostkowych obejmujących parser XML, walidator, geokodera i wszystkie panele szczegółów nieruchomości, dzięki czemu regresje w przetwarzaniu danych są wykrywane w CI.

**US-31** — Jako deweloper chcę, aby narzędzie `formatPrice` obsługiwało wszystkie waluty Otodom (PLN, EUR, GBP, USD, AED, EGP) i gracefully degradowało się w razie błędu, dzięki czemu żadne ogłoszenie nie wyświetla surowej liczby jako ceny.
