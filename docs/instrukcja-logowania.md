# Instrukcja logowania

## Cel i zakres

Aplikacja zapisuje ustrukturyzowane logi JSONL lokalnie na VPS. Planowane
rozszerzenie nada rekordom strukturę zgodną z modelem logów OpenTelemetry,
dzięki czemu będą mogły zostać później przekazane do OpenTelemetry Collector/OTLP
bez zmiany nazw zdarzeń. Nie korzysta z
zewnętrznego hostingu, Sentry ani automatycznych alertów. Każda linia jest
samodzielnym dokumentem JSON, dlatego można ją bezpiecznie przeszukiwać przez
`jq` bez parsowania tekstu konsoli.

Logowane są proces Astro SSR, odświeżanie kursów, API formularzy, błędy
przeglądarki, worker dostaw FTP oraz skrypty cron/startowe. Zwykłe odpowiedzi
HTTP 2xx i oczekiwane 404 zdjęć nie są zapisywane, by nie tworzyć szumu.

## Konfiguracja

W prywatnym pliku `.env` aplikacji ustaw:

```dotenv
LOG_DIRECTORY=/home/ixtnzfseqk/apps/new-global-s-home/logs
LOG_RETENTION_DAYS=30
LOG_LEVEL=info
OTEL_SERVICE_NAME=global-s-home
OTEL_SERVICE_VERSION=0.0.1
OTEL_DEPLOYMENT_ENVIRONMENT=test
# Docelowo wartość publiczna będzie przekazywana do reportera podczas builda.
PUBLIC_APP_RELEASE=0.0.1
```

Katalog musi być poza `public_html` i dostępny dla użytkownika aplikacji:

```bash
mkdir -p /home/ixtnzfseqk/apps/new-global-s-home/logs
chmod 700 /home/ixtnzfseqk/apps/new-global-s-home/logs
```

Winston tworzy pliki dzienne i automatycznie usuwa pliki starsze niż 30 dni.
Nie należy ręcznie usuwać pliku `.astro-rotation-audit.json` ani analogicznych
plików audytu — zawierają jedynie metadane rotacji.

## Pliki i zdarzenia

| Plik | Zawartość |
| --- | --- |
| `astro-YYYY-MM-DD.jsonl` | SSR, middleware, API, e-mail, kursy, zdjęcia i błędy przeglądarki |
| `ingestion-YYYY-MM-DD.jsonl` | ZIP/XML, walidacja, parsowanie, zdjęcia, publikacja stanu i retencja dostaw |
| `supervisor-YYYY-MM-DD.jsonl` | Start Astro, cron, blokada `flock` oraz błędy wrapperów VPS |

Każdy obecny wpis ma między innymi `timestamp`, `level`, `process`, `component`,
`event`, `pid` i bezpieczny kontekst. W ramach planowanego rozszerzenia nowe
rekordy powinny dodatkowo mieć następujące pola zgodne z OpenTelemetry:

| Pole | Znaczenie |
| --- | --- |
| `timestamp`, `observedTimestamp` | Czas zdarzenia i czas zapisania rekordu w UTC |
| `severityText`, `severityNumber` | Poziom Winston odwzorowany na poziom OTel |
| `body` | Stabilna nazwa/treść zdarzenia bez pełnego payloadu |
| `resource` | `service.name`, wersja usługi i środowisko wdrożenia |
| `attributes` | Bezpieczny kontekst, np. `event.name`, `component`, `requestId` i `deliveryId` |
| `traceId`, `spanId` | Korelacja żądania, operacji i błędów klienta |

`traceId` należy odczytać z poprawnego nagłówka W3C `traceparent` albo wygenerować
dla żądania. `spanId` identyfikuje bieżące żądanie lub operację. Identyfikatory
nie zawierają danych użytkownika i mogą być używane do łączenia wpisów przez
`jq` albo przyszły Collector.

Najważniejsze zdarzenia ingestii to `delivery_validation_started`,
`delivery_validation_succeeded`, `delivery_applied`, `delivery_rejected`,
`offer_state_published` oraz `ingestion_run_completed`. Dla aplikacji są to
`http_request_exception`, `http_server_error_response`,
`process_uncaught_exception`, `contact_email_failed` i
`currency_refresh_failed`.

Po wdrożeniu rozszerzenia reporter przeglądarkowy będzie zapisywał
`client_runtime_error`. Rekord będzie zawierał typ
błędu, trasę bez parametrów, release, komponent/operację, ścieżkę źródłową
bez hosta, ograniczony komunikat i stack trace po redakcji oraz `traceId`.
Raportowanie jest ograniczone do trzech zdarzeń na dokument, a endpoint do
dziesięciu zgłoszeń na klienta w ciągu minuty.

## Odczyt i diagnoza

```bash
# Ostatnie zdarzenia workerów FTP
jq -c 'select(.process == "ingestion")' logs/ingestion-$(date -u +%F).jsonl | tail -n 50

# Wszystkie błędy bieżącego dnia
jq -c 'select(.level == "error")' logs/*-$(date -u +%F).jsonl

# Odrzucone dostawy konkretnego dostawcy
jq -c 'select(.event == "delivery_rejected" and .provider == "otodom-pl")' logs/ingestion-*.jsonl
```

Jeśli plik dzienny jeszcze nie istnieje, proces nie zapisał żadnego zdarzenia
albo nie ma prawa zapisu do `LOG_DIRECTORY`. Wtedy sprawdź właściciela katalogu,
wartości `.env`, a następnie uruchom ręcznie `bash scripts/vps/ingest-offers.sh`.

Logi LiteSpeed, systemowego crona i SSH są własnością VPS, nie aplikacji.
Są pomocne, gdy skrypt nie uruchomił się w ogóle, ale nie zastępują powyższych
logów aplikacyjnych.

## Prywatność

Logger redaguje dane kontaktowe, hasła, tokeny, nagłówki, payloady HTTP,
adresy IP i pełne ścieżki serwera. Nie przekazuj danych formularza ani obiektów
żądań do loggera. Docelowo błędy przeglądarki będą ograniczone wielkością i
liczbą zgłoszeń; tekst błędu oraz ograniczony stack trace będą zapisywane
wyłącznie po tej samej redakcji. Nie zapisujemy DOM, cookies, storage,
user-agenta ani pełnych payloadów.

## Zgodność z OpenTelemetry

Lokalny JSONL jest formatem operacyjnym, ale nazwy pól i kontekst są utrzymywane
w sposób zgodny z modelem logów OpenTelemetry. Obecny zakres nie uruchamia
Collectora ani wysyłki poza VPS. Gdy będzie potrzebna centralizacja, należy
dodać transport/adaptor mapujący `body`, `severity*`, `resource` i `attributes`
do OTLP oraz zachować redakcję przed eksportem. Do korelacji używaj:

```bash
# Jeden ślad przez Astro, API i reporter klienta
jq -c 'select(.traceId == "TRACE_ID")' logs/astro-*.jsonl

# Błędy klienta z jednego komponentu i release
jq -c 'select(.event == "client_runtime_error" and .component == "PropertyMap")' logs/astro-*.jsonl
```

Konfigurację VPS, restart procesu i bezpieczne sprawdzenie logów opisuje
[instrukcja wdrażania VPS](instrukcja-wdrazania-vps.md).
