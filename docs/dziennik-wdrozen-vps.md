# Dziennik wdrożeń VPS

Chronologiczny zapis działań wykonanych na VPS cyberfolks
(`s68.cyber-folks.pl`, użytkownik `ixtnzfseqk`) podczas hostowania tej aplikacji
obok istniejącej, niezależnej aplikacji produkcyjnej w
`/home/ixtnzfseqk/domains/globalshome.com`. Tego katalogu nigdy nie modyfikowano.

Cel testowy: `test.ixtnzfseqk.cfolks.pl` → docroot
`/home/ixtnzfseqk/domains/ixtnzfseqk.cfolks.pl/public_html/test`.

## 2026-08-01 — Rozpoznanie środowiska

- Potwierdzono dostęp SSH przez `plink` na porcie 222 z uwierzytelnianiem hasłem
  odczytywanym ze zmiennych systemu Windows. Standardowy OpenSSH wymaga flagi
  `-o MACs=hmac-sha2-256-etm@openssh.com`.
- Katalog domowy zawierał datowane archiwa ZIP, wyglądające na okresowe eksporty
  Otodom. Zostały tylko odczytane; ich obsługa była wtedy poza zakresem prac.
- Istniała przykładowa aplikacja Express w `~/node_app` na porcie `54321`, ale
  nie działała. Jej środowisko Node 12 było zbyt stare; uruchomiono ją wyłącznie
  testowo przez Node 22.
- Dostępny był Node 22.22.2 pod
  `/opt/alt/alt-nodejs22/root/usr/bin/node`, zgodny z wymaganiami Astro 6.
- Odczytano strukturę `~/domains/` i istniejący reverse proxy w `.htaccess` dla
  domeny testowej. Produkcyjny katalog `globalshome.com` pozostał nietknięty.
- Nie było wpisów crontab. Znaleziono nieużyty, niedokończony build Astro w
  `~/node_app_gsh`, z błędną ścieżką bazową GitHub Pages; nie został wykorzystany.

## 2026-08-01 — Faza A: działająca przykładowa aplikacja

- Przed pracami i po nich sprawdzono `https://globalshome.com/`: odpowiedź
  `200 OK`, bez zmian.
- Przykładowy Express nie uruchamiał się na Node 12, ponieważ zależność używała
  składni optional chaining. Uruchomiono go na Node 22 przez `nohup`.
- Potwierdzono odpowiedź `200 OK` zarówno na `127.0.0.1:54321`, jak i publicznie
  przez `http://test.ixtnzfseqk.cfolks.pl/`. Zweryfikowało to cały łańcuch:
  przeglądarka → LiteSpeed → `.htaccess` → Node.
- Certyfikat obejmował tylko `*.cfolks.pl`, więc trzyczłonowa subdomena testowa
  nie obsługiwała HTTPS. HTTP działał poprawnie.

## 2026-08-01 — Faza B: wdrożenie aplikacji Astro

- Zbudowano aplikację Astro w trybie serwerowym z bazą `/` i domeną testową.
- Przeniesiono `dist/server` i `dist/client` do
  `/home/ixtnzfseqk/apps/new-global-s-home/`.
- Naprawiono brak zależności produkcyjnych: adapter standalone nie dołącza
  pakietów npm, dlatego na VPS wykonano `npm install --omit=dev` z Node 22 na
  `PATH`. Lokalne `node_modules` nie były kopiowane, ponieważ pnpm używa dowiązań
  symbolicznych.
- Ustalono, że `import.meta.env.*` jest wbudowywane w build, a nie czytane w
  czasie uruchomienia. Ponieważ server build nie zachowuje prywatnego katalogu
  `public/`, ręcznie odtworzono w aplikacji oczekiwaną ścieżkę bieżącego XML
  Otodom. To było rozwiązanie tymczasowe.
- Aplikację uruchomiono na `127.0.0.1:54322` przez `nohup`, a reverse proxy
  domeny testowej przełączono z portu 54321 na 54322.
- Lista ofert, mapa Leaflet, zdjęcia i filtry działały publicznie; konsola
  przeglądarki nie zawierała błędów ani ostrzeżeń. Produkcyjna aplikacja
  `globalshome.com` nadal odpowiadała `200 OK`.

## Stan z 2026-08-01

- Przykładowa aplikacja `~/node_app` pozostała na porcie 54321.
- Aplikacja Astro działa w `~/apps/new-global-s-home` na porcie 54322 przez
  `nohup`.
- `.htaccess` domeny testowej kieruje ruch na port 54322.
- Nieużyty build w `~/node_app_gsh` pozostał bez zmian i może zostać usunięty
  podczas odrębnego sprzątania.

## 2026-08-01 — Usunięcie obsługi GitHub Pages

- Aplikacja stała się wyłącznie aplikacją VPS/SSR; usunięto workflow GitHub
  Pages, konfigurację `ASTRO_OUTPUT`, pole `homepage` i zależność `gh-pages`.
- Ustawienia Astro są bezwarunkowo serwerowe, z bazą `/`; `SITE_URL` ma domyślną
  wartość domeny testowej.
- Zaktualizowano przestarzałe odwołania do ścieżki GitHub Pages. Build i testy
  lokalne zakończyły się powodzeniem; nie był wtedy potrzebny ponowny deploy.

## 2026-08-01 — Skrypty przetrwania restartu

Dodano `scripts/vps/start.sh`, który idempotentnie uruchamia Astro przez
`nohup`, oraz `scripts/vps/setup-cron.sh`, który instaluje wpis `@reboot`.
W tym momencie skrypty nie zostały jeszcze przesłane ani uruchomione na VPS.

## 2026-08-03 — Wdrożenie funkcji interfejsu

Po tymczasowym odblokowaniu SSH przez firewall cyberfolks wdrożono:
grupowanie znaczników mapy, zdjęcie w dymku mapy, wyrównanie kart,
poprawki prerenderowania tras, tłumaczenia oraz zmianę koloru mapy.

- Dodano `prerender = true` tam, gdzie trasy statyczne z `getStaticPaths()`
  wymagały tego w trybie serwerowym; naprawiło to błędy 500 stron szczegółów i
  bloga na VPS.
- Zastosowano osobne wywołania SSH dla zatrzymania i uruchomienia procesu, aby
  uniknąć samodopasowania wzorca `pkill -f`.
- Po wdrożeniu potwierdzono HTTP 200 dla strony głównej, oferty i bloga oraz
  brak błędów konsoli. `globalshome.com` nadal nie został naruszony.

## 2026-08-03 — Cena w dymku mapy

Dymek mapy otrzymał wspólny formatter ceny zamiast skróconych zapisów typu
`270k` lub `2.2M`. Widok publiczny i konsola zostały sprawdzone po wdrożeniu.

## 2026-08-03 — Kursy walut

- Podłączono wcześniej nieużywaną usługę kursów walut do strony głównej. Usługa
  odświeża kursy przez `node-cron`, najpierw z Frankfurter, a następnie z ECB.
- Potwierdzono działanie zewnętrznego HTTPS na VPS i wyświetlanie znacznika czasu
  aktualnych kursów.
- Usunięto duplikat kursów domyślnych, zachowując podział pomiędzy izomorficznym
  modułem dla klienta a stanową usługą serwerową. Dymek pokazuje również źródło
  kursów.

## 2026-08-03 — Sprzątanie kodu i poprawki

- Usunięto nieużywane zasoby, importy i fixture testowe oraz zaktualizowano
  przestarzałe informacje o parserach.
- Dodano informacje diagnostyczne dla nieudanych pobrań kursów.
- Zastąpiono niebezpieczną mutację refa w czasie renderowania stabilnym
  `useCallback` w mapie ofert.
- ESLint nie wykazał błędów; pozostało jedno wcześniej istniejące ostrzeżenie
  dotyczące zależności efektu. Wdrożenie zweryfikowano lokalnie i publicznie.

## 2026-08-04 — Kolor wody na mapie

Filtr CSS barwił cały kafelek mapy, również ląd. Zastąpiono go warstwą Leaflet,
która przelicza piksele na niebieski wyłącznie w pobliżu koloru wody. Pomiary
pikseli potwierdziły kolor wody `#c2dcff` i niezmieniony kolor lądu. Zmiana
działała lokalnie i publicznie bez komunikatów konsoli.

## 2026-08-07 — Numer telefonu i kod kraju

Wdrożono wspólne komponenty numeru telefonu i wyboru prefiksu międzynarodowego
w obu formularzach. Widok oferty dostał interaktywny formularz zapytania.
Sprawdzono kompilację, działanie lokalne, trasę testową oraz brak błędów
w przeglądarce.

## 2026-08-16 — Wysyłka e-maili i poprawa pola telefonu

- Wdrożono wysyłkę e-maili przez SMTP oraz komponent
  `react-phone-number-input` z walidacją krajową i blokadą polskich numerów
  alarmowych.
- Brak rzeczywistych danych SMTP na VPS oznaczał użycie konta testowego Ethereal.
  Konfiguracja produkcyjnego SMTP została świadomie odroczona.
- Po wdrożeniu brakującej nowej zależności na VPS wykonano
  `npm install --omit=dev`, zrestartowano aplikację i potwierdzono odpowiedzi
  200 dla strony głównej, kontaktu oraz szczegółów oferty.

## 2026-08-21 — Zgoda cookies, parsery dostawców i agregacja ofert

Wdrożono wszystkie zmiany powstałe od 2026-08-16:

- baner zgody cookies i ustawienia wraz z blokowaniem osadzeń YouTube;
- spiderfying markerów o tych samych współrzędnych;
- parsery Nieruchomosci-online.pl oraz Oferty.net;
- usługę serwerową agregującą trzy źródła w niezależne rekordy nieruchomości;
- serwerową stronę szczegółów i kartę przypisanego agenta z katalogu NOE.

Przed wdrożeniem wykryto, że lokalne ścieżki przykładowych XML Windows mogłyby
zostać wbudowane w build przez `import.meta.env`. Na czas kompilacji zmienne
ścieżek zostały wyczyszczone i sprawdzono, że w artefaktach nie ma ścieżek
`C:\Users\pc`. Na VPS nadal korzystano z wcześniejszej bazy Otodom; dwa nowe
źródła były bezpiecznie pomijane do czasu konfiguracji ich dostaw.

Po transferze builda potwierdzono HTTP 200 dla strony głównej, kontaktu i
szczegółów oferty, poprawne renderowanie mapy, listy, galerii i banera cookies,
a także brak błędów konsoli. `globalshome.com` ponownie pozostał bez zmian.

## Otwarte działania

- Wdrożenie nowego procesu przetwarzania ZIP wraz z plikiem `.env`, inicjalizacją
  pełnego eksportu Otodom oraz wpisami cron.
- Rzeczywiste poświadczenia SMTP dla
  `~/apps/new-global-s-home/.env` z uprawnieniami `600`.
- Certyfikat TLS dla trzyczłonowej subdomeny testowej.
- Decyzja o posprzątaniu `~/node_app_gsh`.
- Żadna czynność nie może modyfikować
  `~/domains/globalshome.com` ani jego procesu, portu czy `.htaccess`.
