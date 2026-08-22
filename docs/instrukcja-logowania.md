# Instrukcja logowania

## Cel i zakres

Aplikacja zapisuje ustrukturyzowane logi JSONL lokalnie na VPS. Nie korzysta z
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

Każdy wpis ma między innymi `timestamp`, `level`, `process`, `component`,
`event`, `pid` i bezpieczny kontekst. Dla powiązanych błędów HTTP występuje
`requestId`, a dla dostaw `provider` i `deliveryId`.

Najważniejsze zdarzenia ingestii to `delivery_validation_started`,
`delivery_validation_succeeded`, `delivery_applied`, `delivery_rejected`,
`offer_state_published` oraz `ingestion_run_completed`. Dla aplikacji są to
`http_request_exception`, `http_server_error_response`,
`process_uncaught_exception`, `contact_email_failed` i
`currency_refresh_failed`.

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
żądań do loggera. Błędy przeglądarki są ograniczone wielkością i liczbą zgłoszeń
oraz zapisują wyłącznie typ błędu, trasę bez parametrów i stały kod zdarzenia —
bez stanu formularzy, tekstu błędu i stack trace z przeglądarki.
