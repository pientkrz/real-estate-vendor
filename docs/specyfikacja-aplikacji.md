# Specyfikacja aplikacji

> **Projekt:** Global S Home — prezentacja nieruchomości  
> **Technologie:** Astro 6 SSR, React 19 (wyspy), Tailwind CSS v4, Vitest  
> **Wdrożenie:** własny VPS z Node 22 i LiteSpeed  
> **Ostatnia aktualizacja:** 2026-08-21

## Cel i architektura

Aplikacja prezentuje oferty nieruchomości i ich szczegóły. Jest aplikacją Astro
renderowaną po stronie serwera (`output: 'server'`) z adapterem
`@astrojs/node`. Nie jest już stroną GitHub Pages ani statycznym eksportem.
Strony listy ofert i szczegółów są odświeżane z trwałej migawki danych podczas
żądania SSR, bez ponownego budowania aplikacji po każdej dostawie.

Interaktywne części strony są komponentami React. W szczególności filtr i lista
ofert są wyspą React, nawigacja jest ładowana po stronie klienta, a mapa używa
komponentu tylko przeglądarkowego. Niewymagające interakcji fragmenty, w tym
szczegóły nieruchomości, są renderowane przez Astro.

## Źródła danych i agregacja

Aplikacja obsługuje trzech dostawców, którzy przekazują te same nieruchomości w
różnych formatach XML:

| Dostawca | Katalog dostaw na VPS | Klucz oferty |
| --- | --- | --- |
| Otodom | `dostawa-ofert/otodom-pl` | `Insertion.ID`, bez początkowego `ms` lub `ds` |
| Nieruchomosci-online.pl (NOE 2.0) | `dostawa-ofert/nieruchomosci-online-pl` | `details.sign` |
| Oferty.net | `dostawa-ofert/oferty-net` | `oferta.id` |

Po przetworzeniu dane są łączone przez `src/utils/propertyAggregate.js` w jeden
**agregat nieruchomości**. Zawiera on wartości najlepsze dla oferty, informacje
o pochodzeniu pól (`provenance`), identyfikatory zewnętrzne, cykl życia,
konflikty i rekordy źródłowe dostępne tylko po stronie serwera.

Gdy kilka źródeł przesyła to samo pole, obowiązuje kolejność Otodom →
Nieruchomosci-online.pl → Oferty.net. Brak wartości jest uzupełniany z kolejnego
źródła. Powierzchnie użytkowa i całkowita pozostają oddzielnymi polami. Jeżeli
choć jeden dostawca oznaczy ofertę jako usuniętą lub dezaktywowaną, agregat jest
natychmiast ukrywany. Błąd pojedynczego rekordu źródłowego nie blokuje ofert
pozostałych dostawców.

Szczegółowy opis kluczy, mapowań i dokumentacji XML znajduje się w
[dostawcy-ofert.md](dostawcy-ofert.md).

## Przetwarzanie dostaw

Archiwa ZIP pozostają w katalogach FTP. Krótko działające polecenie Node,
uruchamiane przez cron co 30 minut, przetwarza wyłącznie archiwa, które nie
zmieniły się od 15 minut i przechodzą `unzip -t`. Sprawdza oczekiwany plik XML,
korzeń dokumentu oraz rodzaj dostawy.

- Pełna dostawa zastępuje stan danego dostawcy.
- Dostawa różnicowa aktualizuje lub usuwa tylko wskazane rekordy; przed pierwszą
  pełną dostawą jest ignorowana.
- Uszkodzona, niekompletna, błędna lub już przetworzona dostawa nie modyfikuje
  opublikowanego stanu.
- Migawka JSON jest publikowana atomowo i jest jedynym źródłem ofert dla SSR.
- Retencja przechowuje najnowszy pełny cykl oraz późniejsze różnice, a odrzucone
  archiwa przez trzy dni.

Zdjęcia z zaakceptowanych archiwów są kopiowane do prywatnego katalogu i
udostępniane przez trasę `/offer-photos/...`; nie korzysta się z adresów GitHub
ani zewnętrznych serwisów zdjęciowych. Pełna instrukcja konfiguracji i
odtwarzania: [instrukcja-obslugi-dostaw-ofert.md](instrukcja-obslugi-dostaw-ofert.md).

## Model danych używany przez interfejs

Widok listy otrzymuje tylko bezpieczny, niewielki zestaw pól kart i mapy:

- cena i waluta;
- typ transakcji oraz rodzaj nieruchomości;
- miasto i współrzędne;
- powierzchnia, liczba pokoi, sypialni i łazienek;
- główne zdjęcie.

Strona szczegółów otrzymuje pełny bezpieczny zbiór atrybutów. Renderuje go w
opisanych, ikonograficznych sekcjach — m.in. powierzchnie, budynek, media,
wyposażenie, otoczenie, dostępność i warunki oferty. Puste wartości nie są
wyświetlane. Dane kontaktowe dostawców, nieczytelne kody słownikowe, surowy XML
i identyfikatory źródłowe nie są przekazywane do przeglądarki.

## Agenci

Lista agentów i agent przypisany do oferty pochodzą z sekcji `<agents>` pliku
NOE 2.0. Nie jest już używany `src/data/agents.json`. Karuzela agentów znika,
jeżeli poprawna dostawa NOE nie zawiera katalogu agentów. Gdy dostawca nie poda
zdjęcia, karta agenta i karuzela pokazują lokalny obraz zastępczy
`/assets/agent-placeholder.svg`.

## Interfejs i styl

Motyw Tailwind zdefiniowany w `src/index.css` korzysta z następujących głównych
tokenów:

| Token | Wartość | Zastosowanie |
| --- | --- | --- |
| `primary` | `#7a590c` | złoty akcent, ikony i wyróżnienia |
| `surface` | `#fcf9f8` | kremowe tło strony |
| `on-surface` | `#1c1b1b` | główny kolor tekstu |
| `font-headline` | Work Sans | nagłówki |
| `font-body` / `font-label` | Inter | tekst, etykiety i nawigacja |
| `font-serif` | Cormorant Garamond | tekst redakcyjny |

Projekt unika separatorów o grubości 1 px; do oddzielania sekcji wykorzystuje
zmiany tonu tła. Układ szczegółów oferty jest responsywną siatką o równych
kolumnach w obrębie każdej sekcji.

## Testowanie i lokalne uruchomienie

```bash
pnpm dev
pnpm build
pnpm test
pnpm offers:status
```

Testy są umieszczone obok komponentów i modułów. Obejmują parsowanie i
agregowanie ofert, pełne oraz różnicowe dostawy, retencję, obsługę błędów,
komponenty formularzy i widoki szczegółów. Po zmianie interfejsu należy także
sprawdzić stronę lokalnie w przeglądarce oraz konsolę przeglądarki.

## Wdrożenie

Aktualna konfiguracja VPS, reverse proxy, proces Node i procedura awaryjna są
opisane w [instrukcja-wdrazania-vps.md](instrukcja-wdrazania-vps.md). Zapis
dotychczasowych zmian na serwerze znajduje się w
[dziennik-wdrozen-vps.md](dziennik-wdrozen-vps.md). Katalog
`/home/ixtnzfseqk/domains/globalshome.com` jest poza zakresem projektu i nie
wolno go zmieniać.
