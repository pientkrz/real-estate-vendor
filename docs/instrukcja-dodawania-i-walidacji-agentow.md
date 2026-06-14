# Instrukcja dodawania i walidacji agentów

## Spis treści
1. [Gdzie edytować listę agentów](#1-gdzie-edytować-listę-agentów)
2. [Struktura wpisu agenta](#2-struktura-wpisu-agenta)
3. [Przykład gotowego pliku](#3-przykład-gotowego-pliku)
4. [Jak dodać, edytować lub usunąć agenta](#4-jak-dodać-edytować-lub-usunąć-agenta)
5. [Walidacja — sprawdzanie poprawności pliku](#5-walidacja--sprawdzanie-poprawności-pliku)
6. [Zmiana lokalizacji pliku](#6-zmiana-lokalizacji-pliku)
7. [Najczęstsze błędy](#7-najczęstsze-błędy)

---

> **Szybka walidacja bez instalacji:** otwórz `https://pientkrz.github.io/real-estate-vendor/content/validators/validate-agents.html`, wybierz swój `agents.json` i odczytaj wynik bezpośrednio w przeglądarce.

---

## 1. Gdzie edytować listę agentów

Lista agentów znajduje się w pliku:

```
src/data/agents.json
```

Jest to zwykły plik tekstowy w formacie JSON. Można go otworzyć w dowolnym edytorze tekstu (np. Notatnik, VS Code, Notepad++).

---

## 2. Struktura wpisu agenta

Każdy agent jest opisany przez następujące pola:

| Pole        | Wymagane | Opis                                          | Przykład                        |
|-------------|----------|-----------------------------------------------|---------------------------------|
| `name`      | ✓ tak    | Imię i nazwisko agenta                        | `"Jan Kowalski"`                |
| `role`      | ✓ tak    | Stanowisko / tytuł                            | `"Doradca ds. Nieruchomości"`   |
| `image`     | ✓ tak    | Adres URL zdjęcia profilowego                 | `"https://example.com/jan.jpg"` |
| `email`     | ✓ tak    | Adres e-mail                                  | `"jan@globalshome.com"`         |
| `languages` | ✓ tak    | Lista języków (kody dwuliterowe)              | `["PL", "EN"]`                  |
| `phone`     | nie      | Numer telefonu                                | `"+48 500 100 200"`             |

---

## 3. Przykład gotowego pliku

```json
[
  {
    "name": "Anna Nowak",
    "role": "Dyrektor Sprzedaży",
    "image": "https://example.com/anna.jpg",
    "languages": ["PL", "EN", "DE"],
    "phone": "+48 500 100 200",
    "email": "anna@globalshome.com"
  },
  {
    "name": "Piotr Wiśniewski",
    "role": "Doradca ds. Inwestycji",
    "image": "https://example.com/piotr.jpg",
    "languages": ["PL", "EN"],
    "email": "piotr@globalshome.com"
  }
]
```

> **Uwaga:** Cały plik musi zaczynać się od `[` i kończyć `]`.
> Wpisy agentów są oddzielone przecinkami.
> Po ostatnim agencie **nie** ma przecinka.

---

## 4. Jak dodać, edytować lub usunąć agenta

### Dodanie nowego agenta

1. Otwórz plik `src/data/agents.json` w edytorze tekstu.
2. Przed ostatnim `]` dodaj przecinek po poprzednim agencie, a następnie wklej nowy wpis:

```json
[
  {
    "name": "Istniejący Agent",
    "role": "...",
    "image": "...",
    "languages": ["PL"],
    "email": "istniejacy@globalshome.com"
  },
  {
    "name": "Nowy Agent",
    "role": "Stanowisko",
    "image": "https://link-do-zdjecia.com/foto.jpg",
    "languages": ["PL"],
    "phone": "+48 600 000 000",
    "email": "nowy@globalshome.com"
  }
]
```

### Edytowanie agenta

Znajdź wpis agenta w pliku i zmień wybrane pola. Pamiętaj, żeby nie usuwać cudzysłowów ani przecinków.

### Usunięcie agenta

Usuń cały blok `{ ... }` dotyczący danego agenta wraz z przecinkiem oddzielającym go od sąsiedniego wpisu.

---

## 5. Walidacja — sprawdzanie poprawności pliku

Przed opublikowaniem zmian należy sprawdzić, czy plik agentów nie zawiera błędów. Dostępne są dwa sposoby.

---

### Sposób 1 — walidator w przeglądarce (zalecany, bez instalacji)

1. Otwórz w przeglądarce adres:
   ```
   https://pientkrz.github.io/real-estate-vendor/content/validators/validate-agents.html
   ```
2. Kliknij przycisk **„Wybierz plik"**.
3. Wskaż swój plik `agents.json` na dysku — może znajdować się w dowolnym miejscu.
4. Wynik pojawi się natychmiast na ekranie.

Żadne dane nie są wysyłane do internetu — walidacja działa wyłącznie lokalnie w przeglądarce.

**Wynik poprawny:**

```
✅ Plik jest poprawny — 4 agent(ów) gotowych do użycia.
✅ Agent #1 — Anna Nowak
✅ Agent #2 — Piotr Wiśniewski
```

**Wynik z błędem:**

```
❌ Znaleziono 2 błąd(ów) w 1 agencie/agentach.
❌ Agent #2 — Piotr Wiśniewski
  ✗ Brakuje wymaganego pola "email" — Adres e-mail (email)
  ✗ Pole "languages" nie może być pustą listą
```

---

### Sposób 2 — walidator w terminalu (dla programistów)

Otwórz terminal w folderze projektu i wpisz:

```
pnpm validate:agents
```

---

### Co sprawdza walidator (oba sposoby)

- poprawność składni JSON (brakujące cudzysłowy, przecinki, nawiasy)
- czy plik zawiera listę agentów, a nie pojedynczy obiekt
- czy każdy agent ma wszystkie wymagane pola
- czy typy danych są poprawne (np. `languages` to lista, a nie tekst)
- czy adres e-mail ma poprawny format
- czy pola tekstowe nie są puste

---

## 6. Zmiana lokalizacji pliku

Domyślna ścieżka do pliku agentów to `./src/data/agents.json`.
Można ją zmienić w pliku `.env` znajdującym się w głównym folderze projektu:

```
AGENTS_FILE_PATH=./src/data/agents.json
```

Zmień wartość na ścieżkę do wybranego pliku (względem głównego folderu projektu).
Po zmianie ścieżki uruchom ponownie walidator i przebuduj aplikację.

---

## 7. Najczęstsze błędy

| Objaw | Prawdopodobna przyczyna | Rozwiązanie |
|-------|------------------------|-------------|
| Walidator zgłasza błąd składni JSON | Brakujący cudzysłów, przecinek lub nawias | Sprawdź plik w edytorze i popraw wskazane miejsce |
| Agent nie pojawia się na stronie po wdrożeniu | Błąd w pliku lub strona nie została przebudowana | Uruchom walidator, popraw błędy, wdróż ponownie |
| Zdjęcie agenta się nie wyświetla | Niepoprawny lub niedostępny URL w polu `image` | Wklej link do zdjęcia w przeglądarce i sprawdź czy działa |
| Walidator nie otwiera się w przeglądarce | Strona jeszcze nie została wdrożona | Poczekaj na zakończenie wdrożenia lub użyj terminalu |
