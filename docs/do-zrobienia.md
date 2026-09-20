# Do zrobienia

- [ ] Wdróż na VPS build z przetwarzaniem ofert, utwórz opisany wykonawczy `.env`, zainicjuj stan istniejącym pełnym eksportem Otodom i włącz wpisy cron. Zobacz [instrukcję obsługi dostaw ofert](instrukcja-obslugi-dostaw-ofert.md).
- [ ] Przenieś konfigurację runtime z pliku `.env` do zmiennych środowiskowych skonfigurowanych na VPS (w tym ścieżki ofert, SMTP i logowanie), bez zapisywania sekretów w plikach aplikacji.
- [x] Ujednolicić raportowanie błędów klienta i logi aplikacji z modelem OpenTelemetry:
  - [x] Rozszerzyć adapter Winston o `timestamp`, `observedTimestamp`, `severityText`, `severityNumber`, `body`, `resource` i `attributes` w JSONL.
  - [x] Dodać konfigurację `OTEL_SERVICE_NAME`, `OTEL_SERVICE_VERSION`, `OTEL_DEPLOYMENT_ENVIRONMENT` oraz `PUBLIC_APP_RELEASE`.
  - [x] Propagować W3C `traceparent` oraz korelować `traceId`/`spanId` między Astro, API i reporterem przeglądarkowym.
  - [x] Rozszerzyć reporter klienta o komponent, operację, release, źródło błędu, ograniczony komunikat i stack trace po redakcji; utrzymać limity zgłoszeń.
  - [x] Dodać fingerprint błędu i testy redakcji PII, rate limitu, korelacji oraz odporności transportu logów.
  - [x] Uzupełnić dokumentację logowania i wdrażania o analizę przez `jq`, retencję, prywatność i przyszłe mapowanie do OTLP.
  - [x] Wdrożyć i zweryfikować najpierw na domenie testowej; produkcji nie zmieniać bez osobnej zgody.

## Usprawnienia UX i refaktoryzacje po audycie domeny testowej

Poniższe zadania wynikają z przeglądu strony głównej, widoku oferty, bloga oraz filtrów na domenie testowej. Priorytet `P0` oznacza problem wymagający szybkiej poprawy, `P1` ważne usprawnienie, a `P2` zadanie o niższym priorytecie.

1.✅**P0 — Nawigacja mobilna nie udostępnia pełnego menu** 
   - Problem: na telefonie widoczne są tylko logo i przycisk „Zapytaj Teraz”; odnośniki do nieruchomości, bloga, strony „O nas” i kontaktu są ukryte.
   - Rekomendacja: dodać dostępne menu hamburgerowe lub wysuwany panel nawigacji z aktywnym stanem bieżącej strony. Logo powinno być linkiem do strony głównej.

2.✅**P0 — Niespójna wysokość nagłówka i pozycjonowanie sticky**
   - Problem: lista ofert korzysta ze stałego odstępu `96px`, mimo że nagłówek mobilny jest niższy. Może to powodować pustą przestrzeń i nieprawidłowe przyleganie elementów sticky.
   - Rekomendacja: wprowadzić wspólną responsywną zmienną wysokości nagłówka i używać jej dla dopełnienia strony, mapy oraz paska filtrów.

3. **P0 — Sprzeczne lub nieadekwatne dane w szczegółach oferty**
   - Problem: ta sama oferta może jednocześnie pokazywać brak łazienek, wartość `0` i opis wskazujący inną liczbę; oferta sprzedaży może również zawierać sekcję warunków najmu.
   - Rekomendacja: przed prezentacją rozstrzygać konflikty danych według ustalonego źródła/proweniencji, ukrywać wartości zerowe i nieznane oraz wyświetlać sekcje zależne od typu transakcji.

4. **P1 — Karty ofert są trudne do odróżnienia**
   - Problem: nagłówkiem karty jest głównie nazwa miasta, przez co wiele ofert z tej samej lokalizacji wygląda podobnie.
   - Rekomendacja: prezentować krótki tytuł oferty lub typ nieruchomości jako główny nagłówek, a miasto pozostawić jako dodatkową informację lokalizacyjną.

5. **P1 — Mapa zajmuje zbyt dużo pierwszego widoku na telefonie**
   - Problem: mapa o stałej wysokości około `420px` opóźnia dotarcie do listy ofert; podczas ładowania pokazuje dużą pustą przestrzeń.
   - Rekomendacja: zmniejszyć wysokość mapy na urządzeniach mobilnych albo dodać przełącznik „Pokaż mapę” / „Ukryj mapę” z zachowaniem mapy rozwiniętej na desktopie.

6.✅ ~~**P1 — Niespójny język interfejsu**~~
   - Problem: polski interfejs zawierał angielskie etykiety sekcji oferty, transakcji i bloga.
   - Wykonano: ujednolicono teksty interfejsu do języka polskiego; język obcojęzyczny pozostaje tylko w treści dostarczonej przez dostawcę oferty lub autora artykułu.

7.✅ ~~**P1 — Dostępność i semantyka nowych selektorów filtrów**~~
   - Problem: desktopowy popover był oznaczony jako modal, a mobilny panel nie miał pełnego mechanizmu pułapki fokusu.
   - Wykonano: mobilny bottom sheet używa semantyki modalu, blokady tła i pułapki fokusu, a desktopowy popover ma semantykę niemodalną oraz poprawny powrót fokusu do przycisku.

8. **P2 — Brak szybkiej ścieżki wyjścia z pustych wyników**
   - Problem: komunikat o braku ofert nie zawiera bezpośredniej akcji naprawczej.
   - Rekomendacja: dodać w stanie pustym przycisk „Wyczyść filtry” oraz krótką sugestię rozszerzenia kryteriów.

9.✅ ~~**P2 — Brak optymalizacji ładowania zdjęć kart**~~
   - Problem: obrazy kart są kluczowe dla decyzji użytkownika, ale brak wyraźnego stanu ładowania i strategii leniwego ładowania.
   - Wykonano: dodano priorytetowe ładowanie pierwszego zdjęcia, lazy loading kolejnych kart, `decoding="async"`, responsywne `sizes`, wymiary obrazów i bezpieczny lokalny placeholder z obsługą błędów.
