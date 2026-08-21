# Obsługa dostaw ofert FTP i procesy VPS

Ten dokument opisuje kompletny proces dostarczania ofert na nowy VPS. Dotyczy
wyłącznie tej aplikacji Astro SSR. Nigdy nie modyfikuj
`/home/ixtnzfseqk/domains/globalshome.com` — działa tam oddzielna aplikacja
produkcyjna.

## Procesy

| Proces | Typ | Harmonogram / uruchomienie | Odpowiedzialność |
| --- | --- | --- | --- |
| Aplikacja Astro | Node 22 + `nohup` | cron `@reboot` uruchamia `start.sh` | Obsługuje strony SSR na `127.0.0.1:54322` przez reverse proxy LiteSpeed. |
| Odświeżanie walut | `node-cron` wewnątrz procesu Node Astro | co godzinę | Odświeża kursy walut; nie jest osobnym zadaniem VPS. |
| Przetwarzanie ofert | krótkotrwałe CLI Node | cron `*/30 * * * *` | Waliduje wysyłki ZIP, aktualizuje stan, wypakowuje użyte zdjęcia i czyści archiwum. |
| Walidacja agentów | brak | usunięta | Agenci pochodzą teraz z sekcji NOE `<agents>` podczas przetwarzania dostawy. |

Dla tego użytkownika VPS nie udostępnia `systemd`. Celowo używany jest prosty
i niezawodny nadzór przez cron. Skrypt przetwarzający korzysta z `flock`, więc
wolne wykonanie nie nakłada się na następne.

## Katalogi wykonawcze i zmienne środowiskowe

Utwórz `/home/ixtnzfseqk/apps/new-global-s-home/.env` z uprawnieniami `600`.
Poniższe wartości są odczytywane przez Node w czasie działania przez
`--env-file`; nie są wbudowywane w build Astro.

```dotenv
OFFER_DELIVERY_ROOT=/home/ixtnzfseqk/dostawa-ofert
OTODOM_DELIVERY_DIR=/home/ixtnzfseqk/dostawa-ofert/otodom-pl
NIERUCHOMOSCI_ONLINE_DELIVERY_DIR=/home/ixtnzfseqk/dostawa-ofert/nieruchomosci-online-pl
OFERTY_NET_DELIVERY_DIR=/home/ixtnzfseqk/dostawa-ofert/oferty-net

OFFER_STATE_PATH=/home/ixtnzfseqk/apps/new-global-s-home/data/offer-ingestion/offers-state.json
OFFER_PHOTO_ROOT=/home/ixtnzfseqk/aktualne-zdjecia-ofert
OFFER_PHOTO_PUBLIC_BASE_PATH=/offer-photos
OFFER_SETTLE_MINUTES=15
OFFER_RETAINED_FULL_CYCLES=1
OFFER_REJECTED_RETENTION_DAYS=3
OFFER_UNZIP_BIN=unzip
```

`OFFER_STATE_PATH` jest trwałym migawkowym plikiem JSON z ostatnim poprawnym
stanem. Zawiera znormalizowane rekordy dostawców, agentów NOE, agregaty i metadane
dostaw. Jest prywatny i zastępowany atomowo. `OFFER_PHOTO_ROOT` także jest
prywatny; trasa Astro `/offer-photos/<provider>/<delivery-id>/<file>` odczytuje
wyłącznie zdjęcia zapisane tam przez proces przetwarzania.

## Zasady dostaw i retencji

Katalogi FTP dostawców są skrzynkami odbiorczymi i nie wolno zmieniać ich
struktury. Proces analizuje wyłącznie pliki ZIP, których modyfikacja nastąpiła
co najmniej 15 minut temu. Przed parsowaniem sprawdza archiwum ZIP, oczekiwany
wpis XML, korzeń XML oraz znacznik rodzaju dostawy.

- Pełna dostawa zastępuje stan danego dostawcy. Poprawna pełna dostawa jest
  przyjmowana także wtedy, gdy zawiera mniej ofert.
- Dostawa różnicowa dodaje lub aktualizuje oferty oraz stosuje zdarzenia
  usunięcia/dezaktywacji. Jest ignorowana, dopóki dostawca nie ma pełnej bazy.
- Nieprawidłowa dostawa jest oznaczana jako odrzucona i nie zmienia ostatniego
  poprawnego stanu.
- Retencja zachowuje jeden pomyślny cykl dla dostawcy: najnowszy pełny ZIP i
  wszystkie późniejsze ZIP-y różnicowe. Po opublikowaniu nowszego pełnego stanu
  poprzedni pełny plik oraz jego różnice są usuwane. Odrzucone ZIP-y są
  przechowywane przez trzy dni.

Zdjęcia są kopiowane bezpośrednio z zaakceptowanych wpisów ZIP do katalogu
odpowiedniej dostawy w `OFFER_PHOTO_ROOT`; archiwum nie jest rozpakowywane do
tymczasowego katalogu. Gdy dostawa jest usuwana przez retencję, usuwany jest
także jej katalog ze zdjęciami.

## Pierwsza konfiguracja i wdrożenie

Wymagania: Node 22, `cron`, `flock` i `unzip`. Na obecnym hostingu cyberfolks
plik wykonywalny Node znajduje się pod adresem
`/opt/alt/alt-nodejs22/root/usr/bin/node`.

1. Wdróż `dist/server`, `dist/client`, `package.json`, `scripts/` oraz prywatny
   `.env` do `~/apps/new-global-s-home`; zainstaluj zależności produkcyjne,
   mając Node 22 na `PATH`.
2. Utwórz katalog nadrzędny pliku stanu i `OFFER_PHOTO_ROOT`; oba muszą
   znajdować się poza `public_html`.
3. Jednorazowo zainicjuj stan z istniejącego pełnego eksportu Otodom, kopiując
   sąsiadujące zdjęcia do prywatnego katalogu zdjęć:

   ```bash
   /opt/alt/alt-nodejs22/root/usr/bin/node --env-file=.env \
     scripts/ingest-offers.mjs --bootstrap-otodom public/<collection>/properties_otodom.xml
   ```

4. Zainstaluj wpisy cron uruchamiające aplikację po restarcie i przetwarzanie
   dostaw:

   ```bash
   bash scripts/vps/setup-cron.sh
   ```

5. Zrestartuj proces Astro zgodnie z istniejącą procedurą wdrożeniową. Uruchamia
   się teraz z `--env-file=.env` i odczytuje zmaterializowany stan przy każdym
   żądaniu SSR.

Polecenie `node --env-file=.env scripts/ingest-offers.mjs --status` pokazuje
ostatnie bazy i dostawy. Logi `app.log`, `start.log` oraz `offer-ingestion.log`
znajdują się w katalogu aplikacji.

## Odtwarzanie po błędzie

Gdy wysyłka jest niekompletna lub nieprawidłowa, strona nadal korzysta z
poprzedniej migawki. Aby znaleźć przyczynę, sprawdź odrzucony ZIP oraz
`offer-ingestion.log`. Zachowany pełny ZIP wraz z późniejszymi różnicami
wystarcza do odtworzenia bieżącego stanu dostawcy: usuń wyłącznie wygenerowany
plik stanu i ponownie uruchom polecenie przetwarzające. Nigdy nie usuwaj
archiwum FTP przed potwierdzeniem opublikowania nowszego pełnego cyklu.
