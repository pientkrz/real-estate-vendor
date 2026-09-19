# Do zrobienia

- [ ] Wdróż na VPS build z przetwarzaniem ofert, utwórz opisany wykonawczy `.env`, zainicjuj stan istniejącym pełnym eksportem Otodom i włącz wpisy cron. Zobacz [instrukcję obsługi dostaw ofert](instrukcja-obslugi-dostaw-ofert.md).
- [ ] Przenieś konfigurację runtime z pliku `.env` do zmiennych środowiskowych skonfigurowanych na VPS (w tym ścieżki ofert, SMTP i logowanie), bez zapisywania sekretów w plikach aplikacji.
- [ ] Ujednolić raportowanie błędów klienta i logi aplikacji z modelem OpenTelemetry:
  - [ ] Rozszerzyć adapter Winston o `timestamp`, `observedTimestamp`, `severityText`, `severityNumber`, `body`, `resource` i `attributes` w JSONL.
  - [ ] Dodać konfigurację `OTEL_SERVICE_NAME`, `OTEL_SERVICE_VERSION`, `OTEL_DEPLOYMENT_ENVIRONMENT` oraz `PUBLIC_APP_RELEASE`.
  - [ ] Propagować W3C `traceparent` oraz korelować `traceId`/`spanId` między Astro, API i reporterem przeglądarkowym.
  - [ ] Rozszerzyć reporter klienta o komponent, operację, release, źródło błędu, ograniczony komunikat i stack trace po redakcji; utrzymać limity zgłoszeń.
  - [ ] Dodać fingerprint błędu i testy redakcji PII, rate limitu, korelacji oraz odporności transportu logów.
  - [ ] Uzupełnić dokumentację logowania i wdrażania o analizę przez `jq`, retencję, prywatność i przyszłe mapowanie do OTLP.
  - [ ] Wdrożyć i zweryfikować najpierw na domenie testowej; produkcji nie zmieniać bez osobnej zgody.
