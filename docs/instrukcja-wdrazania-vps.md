# Instrukcja wdrażania aplikacji na VPS (cyberfolks)

Kompletny przewodnik: jak połączyć się z serwerem, jak zbudować i wdrożyć aplikację, jak zarządzać procesem Node oraz jak skonfigurować `.htaccess` dla dowolnej domeny lub subdomeny na tym serwerze.

Historia dotychczasowych wdrożeń (co dokładnie zmieniono i kiedy): [dziennik-wdrozen-vps.md](dziennik-wdrozen-vps.md).
Szczegóły i rozwiązywanie problemów z samym połączeniem SSH: [instrukcja-polaczenia-ssh-vps.md](instrukcja-polaczenia-ssh-vps.md).
Obsługa dostaw FTP, retencja oraz harmonogram procesów: [instrukcja-obslugi-dostaw-ofert.md](instrukcja-obslugi-dostaw-ofert.md).

## Spis treści
1. [Architektura hostingu](#1-architektura-hostingu)
2. [Dane dostępowe i połączenie SSH](#2-dane-dostępowe-i-połączenie-ssh)
3. [Struktura katalogów na serwerze](#3-struktura-katalogów-na-serwerze)
4. [Budowanie i wdrażanie aplikacji](#4-budowanie-i-wdrażanie-aplikacji)
5. [Uruchamianie, zatrzymywanie i restart procesu Node](#5-uruchamianie-zatrzymywanie-i-restart-procesu-node)
6. [Automatyczny start po restarcie serwera](#6-automatyczny-start-po-restarcie-serwera)
7. [Konfiguracja .htaccess dla domeny lub subdomeny](#7-konfiguracja-htaccess-dla-domeny-lub-subdomeny)
8. [Dodawanie nowej domeny lub subdomeny — krok po kroku](#8-dodawanie-nowej-domeny-lub-subdomeny--krok-po-kroku)
9. [Weryfikacja wdrożenia](#9-weryfikacja-wdrożenia)
10. [Najczęstsze błędy i pułapki](#10-najczęstsze-błędy-i-pułapki)
11. [Zasady bezpieczeństwa](#11-zasady-bezpieczeństwa)

---

## 1. Architektura hostingu

Serwer WWW to **LiteSpeed** (nie Apache — ale reguły `.htaccess` działają zgodnie z konwencją Apache). Każda domena/subdomena ma własny docroot z plikiem `.htaccess`, który **nie serwuje plików bezpośrednio**, tylko przekierowuje cały ruch (reverse proxy) do lokalnego procesu Node nasłuchującego na `127.0.0.1:<PORT>`:

```
przeglądarka → LiteSpeed → .htaccess (RewriteRule) → 127.0.0.1:<PORT> → proces Node (Astro SSR)
```

Aplikacja Astro (`output: 'server'`, adapter `@astrojs/node`, tryb standalone) jest budowana **lokalnie** (na maszynie deweloperskiej), a na serwer trafia już gotowy build (`dist/server` + `dist/client`) — na VPS nic się nie kompiluje poza `npm install` zależności produkcyjnych.

Na serwerze może działać wiele niezależnych aplikacji jednocześnie, każda na innym porcie. Obecnie:

| Port | Aplikacja | Katalog na serwerze | Domena |
|---|---|---|---|
| `54322` | `new-global-s-home` (ten projekt, Astro SSR) | `~/apps/new-global-s-home` | `test.ixtnzfseqk.cfolks.pl` — **środowisko testowe** tego projektu (nie produkcyjna domena docelowa) |
| — | `globalshome.com` | `~/domains/globalshome.com` | `globalshome.com` (osobna, produkcyjna aplikacja — **nie modyfikować**, zob. [§11](#11-zasady-bezpieczeństwa)) |

---

## 2. Dane dostępowe i połączenie SSH

| Parametr | Wartość |
|---|---|
| Host | `s68.cyber-folks.pl` |
| Port | **222** (niestandardowy) |
| Użytkownik | `ixtnzfseqk` |
| Uwierzytelnianie | hasło |

Hasło **nie jest zapisane w repozytorium** — na maszynie deweloperskiej jest w zmiennych środowiskowych: `cyberfolks_server_url`, `cyberfolks_server_username`, `cyberfolks_server_password`.

> **SSH bywa wyłączony** na serwerze (włączany tylko na czas prac). Jeśli połączenie jest odrzucane, włącz dostęp SSH w panelu cyberfolks (cyber_Admin / DirectAdmin) i wyłącz go ponownie po zakończeniu.

**Git Bash / WSL** (zmienne już w środowisku powłoki):

```bash
plink -ssh -P 222 -pw "$cyberfolks_server_password" "$cyberfolks_server_username@$cyberfolks_server_url" -batch "polecenie-zdalne"
```

**PowerShell** (odczyt z rejestru — zmienne dodane po starcie terminala nie są widoczne przez `$env:...` bez restartu sesji):

```powershell
$hklm = Get-Item 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment'
$pw   = $hklm.GetValue('cyberfolks_server_password')
$user = $hklm.GetValue('cyberfolks_server_username')
$srv  = $hklm.GetValue('cyberfolks_server_url')

& 'C:\Program Files\PuTTY\plink.exe' -ssh -P 222 -pw $pw "$user@$srv" "polecenie-zdalne"
```

Interaktywna sesja: pominięcie `-batch` i ostatniego argumentu z poleceniem otwiera zwykłą powłokę. Pełne omówienie (w tym `ssh`/OpenSSH jako alternatywa i pułapki połączenia) — [instrukcja-polaczenia-ssh-vps.md](instrukcja-polaczenia-ssh-vps.md).

---

## 3. Struktura katalogów na serwerze

```
~/                                            (/home/ixtnzfseqk)
├── apps/
│   └── new-global-s-home/                    ← aplikacja Astro (ten projekt)
│       ├── server/                           ← z dist/server (build)
│       ├── client/                           ← z dist/client (build)
│       ├── data/offer-ingestion/             ← prywatna migawka JSON ofert i blokada `flock`
│       ├── logs/                              ← dzienne logi JSONL aplikacji (prywatne)
│       ├── node_modules/                     ← zainstalowane NA serwerze (nie kopiować z lokalnej maszyny, pnpm robi symlinki)
│       ├── package.json                      ← kopiowany z repo, potrzebny do `npm install`
│       └── .env                              ← prywatna konfiguracja wykonawcza i logowania (`600`)
├── dostawa-ofert/                            ← skrzynki FTP dostawców (archiwa ZIP)
├── aktualne-zdjecia-ofert/                   ← prywatne zdjęcia wypakowane z zaakceptowanych dostaw
└── domains/
    ├── ixtnzfseqk.cfolks.pl/
    │   └── public_html/
    │       └── test/.htaccess                ← reverse proxy dla test.ixtnzfseqk.cfolks.pl → 127.0.0.1:54322
    └── globalshome.com/                      ← osobna, produkcyjna aplikacja — NIE MODYFIKOWAĆ
```

Środowisko Node ≥ 22 (wymagane przez Astro 6, `>=22.12.0`): `/opt/alt/alt-nodejs22/root/usr/bin/node` — **nie jest na domyślnym `PATH`** powłoki logowania. Przy `npm install` na serwerze dopisz ten katalog do `PATH`, inaczej skrypty postinstall (np. `esbuild`) nie znajdą polecenia `node`:

```bash
export PATH="/opt/alt/alt-nodejs22/root/usr/bin:$PATH"
```

---

## 4. Budowanie i wdrażanie aplikacji

### 4.1 Build lokalny

Na maszynie deweloperskiej, w katalogu projektu:

```bash
pnpm build
```

Produkuje `dist/server/` (kod SSR) i `dist/client/` (statyczne assety). Konfiguracja dostaw ofert na VPS jest odczytywana przez Node w czasie działania z prywatnego `.env` przekazanego przez `--env-file`. Należy odróżnić ją od ewentualnych zmiennych `import.meta.env.*`, które Vite zapisuje na stałe podczas kompilacji.

Zalecane: przed wysyłką na serwer uruchom build samodzielnie lokalnie i sprawdź podstawowe trasy:

```bash
PORT=4322 HOST=127.0.0.1 node dist/server/entry.mjs &
curl -si http://127.0.0.1:4322/
```

### 4.2 Pierwsze wdrożenie (nowa aplikacja)

1. Utwórz katalog na serwerze, np. `~/apps/<nazwa-aplikacji>/`.
2. Wyślij build i `package.json`:
   ```bash
   pscp -P 222 -pw "$cyberfolks_server_password" -r dist/server dist/client package.json \
     "$cyberfolks_server_username@$cyberfolks_server_url:apps/<nazwa-aplikacji>/"
   ```
3. Zainstaluj zależności produkcyjne **na serwerze** (nie kopiuj lokalnego `node_modules` — pnpm używa symlinków, które nie przetrwają transferu SFTP-podobnego):
   ```bash
   plink ... -batch "cd apps/<nazwa-aplikacji> && export PATH=/opt/alt/alt-nodejs22/root/usr/bin:\$PATH && npm install --omit=dev"
   ```
4. Wyślij także katalogi `src/` i `scripts/`. `src/` jest potrzebny wyłącznie
   krótkotrwałemu procesowi przetwarzania (moduły `src/ingestion`, `src/server`
   i `src/utils`); aplikacja SSR nadal uruchamia wyłącznie gotowy build. Utwórz
   prywatny `.env` (uprawnienia `600`), katalog stanu i katalog zdjęć. Ustaw w
   `.env` katalogi FTP dostawców, `OFFER_STATE_PATH` i `OFFER_PHOTO_ROOT`
   zgodnie z [instrukcją obsługi dostaw ofert](instrukcja-obslugi-dostaw-ofert.md):
   ```bash
   mkdir -p apps/<nazwa-aplikacji>/data/offer-ingestion
   mkdir -p ~/aktualne-zdjecia-ofert
   chmod 600 apps/<nazwa-aplikacji>/.env
   ```
5. Przetwórz dostępne dostawy ZIP i zainstaluj wpisy cron zgodnie z instrukcją dostaw. Nie kopiuj ani nie odtwarzaj historycznego XML z katalogu `public/`.
6. Uruchom proces — zob. [§5](#5-uruchamianie-zatrzymywanie-i-restart-procesu-node).
7. Skonfiguruj `.htaccess` dla docelowej domeny/subdomeny — zob. [§7](#7-konfiguracja-htaccess-dla-domeny-lub-subdomeny).

### 4.3 Kolejne wdrożenia (aktualizacja istniejącej aplikacji)

`node_modules`, prywatna migawka ofert, katalog zdjęć i katalog logów zwykle nie zmieniają się między wdrożeniami — wysyłaj tylko nowy build. Gdy zmieniły się zależności lub skrypty, wyślij odpowiednio `package.json` albo `scripts/` i uruchom ponownie `npm install --omit=dev` lub `setup-cron.sh`:

```bash
pscp -P 222 -pw "$cyberfolks_server_password" -r dist/server dist/client \
  "$cyberfolks_server_username@$cyberfolks_server_url:apps/<nazwa-aplikacji>/"
```

`pscp -r` scala się z istniejącym katalogiem (stare pliki o zmienionych hashach zostają jako nieużywany, nieszkodliwy balast — do ewentualnego posprzątania osobno). Następnie zrestartuj proces ([§5](#5-uruchamianie-zatrzymywanie-i-restart-procesu-node)).

---

## 5. Uruchamianie, zatrzymywanie i restart procesu Node

Każda aplikacja to zwykły proces Node uruchomiony przez `nohup` na dedykowanym porcie, nasłuchujący tylko na `127.0.0.1` (nie jest bezpośrednio wystawiony do internetu — dostęp wyłącznie przez `.htaccess` danej domeny).

### Sprawdzenie, czy proces działa

```bash
pgrep -af entry.mjs
curl -si http://127.0.0.1:<PORT>/ | head -3
```

### Zatrzymanie

```bash
pkill -f '[e]ntry.mjs'
```

> **Pułapka:** wzorzec podany w tej samej komendzie SSH pasuje też do własnej powłoki wywołującej `pkill` i zabija sesję zanim polecenie się wykona. Zapis z nawiasami kwadratowymi (`'[e]ntry.mjs'`) omija to — wzorzec z nawiasem nie pasuje sam do siebie w `ps`, ale nadal pasuje do właściwego procesu. Uruchamiaj **zatrzymanie i start jako dwa osobne wywołania** `plink`, nie łącz ich w jednym poleceniu.

### Start

```bash
cd apps/<nazwa-aplikacji>
bash scripts/vps/start.sh
```

Jeśli kilka aplikacji działa na serwerze, każda musi mieć **unikalny port** (zob. tabela w [§1](#1-architektura-hostingu)) — kolejny wolny port to zwykle poprzedni + 1.

> Wywołanie `start` w tle (`&`) w jednej komendzie SSH razem z kolejnymi poleceniami (np. `curl` do weryfikacji) czasem powoduje, że cała sesja `plink` wisi do przekroczenia limitu czasu, mimo że proces wystartował poprawnie i `curl` już zdążył zwrócić `200 OK` zanim sesja się zawiesiła — to kosmetyczny efekt uboczny `nohup`/przekierowania, nie błąd wdrożenia. Zweryfikuj osobnym, kolejnym wywołaniem `plink` (`pgrep -af entry.mjs`), jeśli poprzednie się przez to nie zakończyło.

### Restart (typowy scenariusz po wdrożeniu nowego builda)

Dwa osobne wywołania `plink`:

```bash
plink ... -batch "pkill -f '[e]ntry.mjs' && echo killed || echo 'nothing to kill'"
plink ... -batch "cd apps/<nazwa-aplikacji> && bash scripts/vps/start.sh"
```

### Podgląd logów

Zob. [instrukcja logowania](instrukcja-logowania.md). Przykład ostatnich błędów:

```bash
plink ... -batch "jq -c 'select(.level == \"error\")' apps/<nazwa-aplikacji>/logs/astro-\$(date -u +%F).jsonl | tail -n 50"
```

---

## 6. Automatyczny start po restarcie serwera

`nohup` **nie przetrwa** restartu VPS — proces trzeba by uruchomić ręcznie ponownie. W repo są gotowe skrypty do tego (`scripts/vps/`), jeszcze nieużyte na produkcji:

- **`scripts/vps/start.sh`** — idempotentny: uruchamia serwer tylko jeśli nic jeszcze nie nasłuchuje na jego porcie (sprawdza przez `curl`). Bezpieczny do wielokrotnego uruchomienia.
- **`scripts/vps/ingest-offers.sh`** — uruchamia krótkie przetwarzanie dostaw FTP, z blokadą `flock`.
- **`scripts/vps/setup-cron.sh`** — instaluje wpis `@reboot` dla aplikacji oraz wpis `*/30` dla dostaw ofert. Idempotentny — zastępuje wyłącznie wcześniejsze wpisy tej aplikacji, bez dublowania.
- **`scripts/vps/run-astro.mjs`** i **`log-process-event.mjs`** — uruchamiają SSR przez rejestrację błędów procesu i zapisują zdarzenia supervisor do JSONL; nie uruchamiaj ich ręcznie poza `start.sh`.

Wdrożenie (raz, po przesłaniu skryptów na serwer obok aplikacji):

```bash
pscp -P 222 -pw "$cyberfolks_server_password" -r scripts \
  "$cyberfolks_server_username@$cyberfolks_server_url:apps/<nazwa-aplikacji>/"
plink ... -batch "cd apps/<nazwa-aplikacji> && bash scripts/vps/setup-cron.sh"
```

Skrypty zakładają domyślny port `54322` i katalog `~/apps/new-global-s-home` — przy wdrażaniu dla innej aplikacji dostosuj `APP_DIR`/`PORT` na górze `start.sh` przed wysłaniem.

---

## 7. Konfiguracja .htaccess dla domeny lub subdomeny

Każda domena/subdomena na tym serwerze ma docroot pod `~/domains/<domena>/public_html/` (subdomena „w ścieżce”, np. `test.ixtnzfseqk.cfolks.pl` serwowana z podfolderu istniejącej domeny, ma docroot pod odpowiadającym podfolderem, np. `.../public_html/test/`).

Plik `.htaccess` w tym docrocie **nie serwuje plików** — przekierowuje (reverse proxy) cały ruch do lokalnego portu aplikacji:

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:<PORT>/$1 [P,L]
```

- `<PORT>` — port, na którym `nohup`-owany proces Node danej aplikacji nasłuchuje na `127.0.0.1` (zob. [§5](#5-uruchamianie-zatrzymywanie-i-restart-procesu-node)).
- `[P,L]` — `P` = proxy (mod_proxy), `L` = ostatnia reguła (nie przetwarzaj dalszych). LiteSpeed interpretuje te reguły zgodnie z konwencją Apache mimo że nie jest Apache.
- Nagłówek odpowiedzi `Server:` z takiej domeny czyta `LiteSpeed`, nie `Apache` — to poprawne i oczekiwane.

**Aktualny przykład** (`~/domains/ixtnzfseqk.cfolks.pl/public_html/test/.htaccess`):

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:54322/$1 [P,L]
```

> **HTTPS:** certyfikat zainstalowany na serwerze obejmuje tylko `*.cfolks.pl` (jeden poziom subdomeny) — trzyczłonowe subdomeny w stylu `test.ixtnzfseqk.cfolks.pl` **nie są objęte** i HTTPS na nich nie zadziała bez dedykowanego certyfikatu (np. Let's Encrypt SAN dla tej konkretnej nazwy, wystawiony przez panel cyberfolks). Do tego czasu taka domena działa tylko po HTTP.

---

## 8. Dodawanie nowej domeny lub subdomeny — krok po kroku

1. **Ustal domenę/subdomenę** i upewnij się, że jej docroot istnieje pod `~/domains/<domena>/public_html/` (dla subdomeny „w ścieżce” — odpowiedni podfolder). Jeśli domena jeszcze nie jest skonfigurowana na koncie cyberfolks, trzeba ją najpierw dodać w panelu (poza zakresem SSH).
2. **Wybierz wolny port** — kolejny numer po już zajętych (zob. tabela w [§1](#1-architektura-hostingu)), np. `54323`.
3. **Wdróż aplikację** pod tym portem — zob. [§4.2](#42-pierwsze-wdrożenie-nowa-aplikacja) i [§5](#5-uruchamianie-zatrzymywanie-i-restart-procesu-node).
4. **Utwórz/edytuj `.htaccess`** w docrocie tej domeny, wskazując na wybrany port (szablon w [§7](#7-konfiguracja-htaccess-dla-domeny-lub-subdomeny)):
   ```bash
   plink ... -batch "cat > domains/<domena>/public_html/.htaccess" <<'EOF'
   RewriteEngine On
   RewriteRule ^(.*)$ http://127.0.0.1:<PORT>/$1 [P,L]
   EOF
   ```
   (albo edytuj plik lokalnie i wyślij `pscp`).
5. **Zweryfikuj** — zob. [§9](#9-weryfikacja-wdrożenia).
6. Jeśli chcesz, by aplikacja przetrwała restart VPS — dodaj ją do automatycznego startu ([§6](#6-automatyczny-start-po-restarcie-serwera)).
7. Zapisz zmianę w [dzienniku wdrożeń VPS](dziennik-wdrozen-vps.md) — jaki port, jaka domena, kiedy.

---

## 9. Weryfikacja wdrożenia

Zawsze po wdrożeniu/restarcie:

1. **Na serwerze**, bezpośrednio na porcie aplikacji (pomija `.htaccess`, potwierdza że sam proces działa):
   ```bash
   plink ... -batch "curl -si http://127.0.0.1:<PORT>/ | head -3"
   ```
2. **Z lokalnej maszyny**, przez publiczną domenę (potwierdza cały łańcuch: DNS → LiteSpeed → `.htaccess` → proces):
   ```bash
   curl -si http://<domena>/
   ```
3. **W prawdziwej przeglądarce** (np. przez Chrome DevTools MCP) — sprawdź brak błędów/ostrzeżeń w konsoli i zrób zrzut ekranu kluczowych stron.
4. **Zawsze na końcu** sprawdź, że `https://globalshome.com/` nadal zwraca `200 OK` bez zmian — ta domena jest osobną, niepowiązaną aplikacją produkcyjną i żadna zmiana w krokach powyżej nie powinna jej dotknąć (zob. [§11](#11-zasady-bezpieczeństwa)).

---

## 10. Najczęstsze błędy i pułapki

| Objaw | Przyczyna | Rozwiązanie |
|---|---|---|
| `ERR_MODULE_NOT_FOUND: react` (lub inny pakiet) przy starcie | Adapter `@astrojs/node` standalone nie dołącza prawdziwych zależności npm do `dist/server` — tylko kod pierwszo-osobowy | Skopiuj `package.json` na serwer i uruchom `npm install --omit=dev` tam, z `alt-nodejs22` na `PATH` |
| `esbuild`/skrypt postinstall zgłasza `node: command not found` | `/opt/alt/alt-nodejs22/.../bin` nie jest na domyślnym `PATH` powłoki logowania | `export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH` przed `npm install` |
| Zmienna z `.env` (`import.meta.env.X`) ustawiona na serwerze przy starcie procesu nie ma efektu | `import.meta.env.*` jest zapisywane na stałe w buildzie w momencie `pnpm build`, nie czytane z `process.env` w runtime | Ustaw zmienną **przed buildem lokalnym**, nie przy starcie procesu na serwerze |
| Strona z `getStaticPaths()` (np. szczegóły oferty, wpis bloga) zwraca 500 na serwerze mimo że działa lokalnie | `output: 'server'` nie prerenderuje automatycznie tras z `getStaticPaths()` | Dodaj `export const prerender = true` w danym pliku `.astro` |
| Lista ofert jest pusta po wdrożeniu | Nie ma jeszcze poprawnej migawki `OFFER_STATE_PATH`, albo dostawca przesłał tylko różnice przed pierwszą pełną bazą | Sprawdź `node --env-file=.env scripts/ingest-offers.mjs --status`, a następnie poczekaj na lub uruchom przetwarzanie poprawnego pełnego ZIP-a; nie przywracaj XML do `public/` |
| Sesja `plink` z `pkill -f '<wzorzec>'` kończy się natychmiast bez efektu | Wzorzec w tej samej komendzie pasuje też do własnej powłoki wywołującej `pkill` i zabija samą siebie | Użyj `pkill -f '[p]attern'` (nawias na pierwszej literze) i uruchamiaj kill/start jako osobne wywołania `plink` |
| SSH connection refused / timeout | SSH bywa wyłączony na serwerze poza godzinami prac | Włącz w panelu cyberfolks (cyber_Admin/DirectAdmin) |
| „Nieautoryzowany dostęp” / blokada IP przy próbie SSH | Firewall cyberfolks czasem blokuje IP tymczasowo | Odblokować przez reCAPTCHA na stronie blokady (`https://s68.cyber-folks.pl:18887`) — wymaga ręcznego kliknięcia, nieskryptowalne |
| `https://` na 3-członowej subdomenie (`test.ixtnzfseqk.cfolks.pl`) nie działa | Zainstalowany certyfikat obejmuje tylko `*.cfolks.pl` (jeden poziom) | Używaj `http://` do czasu wystawienia dedykowanego certyfikatu, albo skonfiguruj domenę własną z osobnym certyfikatem |
| pscp kopiuje `node_modules`, ale aplikacja i tak nie startuje | pnpm używa dowiązań symbolicznych, które nie przetrwają transferu SFTP-podobnego | Nie kopiuj `node_modules` — zainstaluj świeżo na serwerze (`npm install --omit=dev`) |

---

## 11. Zasady bezpieczeństwa

- **Nigdy nie modyfikuj `~/domains/globalshome.com`** ani niczego z nim związanego (proces, port, `.htaccess`) — to osobna, produkcyjna aplikacja niezwiązana z tym projektem. Jedyne dozwolone działanie to odczyt/`curl` w celu potwierdzenia, że pozostaje nietknięta (zob. [§9](#9-weryfikacja-wdrożenia) pkt 4).
- **Hasło SSH nigdy nie trafia do repozytorium** — wyłącznie zmienne środowiskowe na maszynie deweloperskiej (`cyberfolks_server_password` itd.), nigdy zahardkodowane w skryptach, kodzie czy commitach.
- Każdy proces Node nasłuchuje wyłącznie na `127.0.0.1:<PORT>` (nie `0.0.0.0`) — jedyna droga z internetu prowadzi przez `.htaccess` danej domeny; nie zmieniaj tego na publiczny bind bez wyraźnej potrzeby.
- Przed i po każdej zmianie na serwerze wykonaj `curl` do `https://globalshome.com/` — to tani, szybki test regresji potwierdzający brak efektów ubocznych.
