# Do zrobienia

- [ ] Wdróż na VPS build z przetwarzaniem ofert, utwórz opisany wykonawczy `.env`, zainicjuj stan istniejącym pełnym eksportem Otodom i włącz wpisy cron. Zobacz [instrukcję obsługi dostaw ofert](instrukcja-obslugi-dostaw-ofert.md).
- [ ] Przenieś konfigurację runtime z pliku `.env` do zmiennych środowiskowych skonfigurowanych na VPS (w tym ścieżki ofert, SMTP i logowanie), bez zapisywania sekretów w plikach aplikacji.

## Usprawnienia UX i refaktoryzacje po audycie domeny testowej

Poniższe zadania wynikają z przeglądu strony głównej, widoku oferty, bloga oraz filtrów na domenie testowej. Priorytet `P0` oznacza problem wymagający szybkiej poprawy, `P1` ważne usprawnienie, a `P2` zadanie o niższym priorytecie.

1. **P0 — Sprzeczne lub nieadekwatne dane w szczegółach oferty**
   - Problem: ta sama oferta może jednocześnie pokazywać brak łazienek, wartość `0` i opis wskazujący inną liczbę; oferta sprzedaży może również zawierać sekcję warunków najmu.
   - Rekomendacja: przed prezentacją rozstrzygać konflikty danych według ustalonego źródła/proweniencji, ukrywać wartości zerowe i nieznane oraz wyświetlać sekcje zależne od typu transakcji.

2. **P1 — Karty ofert są trudne do odróżnienia**
   - Problem: nagłówkiem karty jest głównie nazwa miasta, przez co wiele ofert z tej samej lokalizacji wygląda podobnie.
   - Rekomendacja: prezentować krótki tytuł oferty lub typ nieruchomości jako główny nagłówek, a miasto pozostawić jako dodatkową informację lokalizacyjną.

3. **P1 — Mapa zajmuje zbyt dużo pierwszego widoku na telefonie**
   - Problem: mapa o stałej wysokości około `420px` opóźnia dotarcie do listy ofert; podczas ładowania pokazuje dużą pustą przestrzeń.
   - Rekomendacja: zmniejszyć wysokość mapy na urządzeniach mobilnych albo dodać przełącznik „Pokaż mapę” / „Ukryj mapę” z zachowaniem mapy rozwiniętej na desktopie.
