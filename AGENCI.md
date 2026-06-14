# Instrukcja zarządzania listą agentów

## Spis treści
1. [Gdzie edytować listę agentów](#1-gdzie-edytować-listę-agentów)
2. [Struktura wpisu agenta](#2-struktura-wpisu-agenta)
3. [Przykład gotowego pliku](#3-przykład-gotowego-pliku)
4. [Jak dodać, edytować lub usunąć agenta](#4-jak-dodać-edytować-lub-usunąć-agenta)
5. [Walidacja — sprawdzanie poprawności pliku](#5-walidacja--sprawdzanie-poprawności-pliku)
6. [Zmiana lokalizacji pliku](#6-zmiana-lokalizacji-pliku)
7. [Najczęstsze błędy](#7-najczęstsze-błędy)

---

## 1. Gdzie edytować listę agentów

Lista agentów znajduje się w pliku:

```
src/data/agents.json
```

Jest to zwykły plik tekstowy w formacie JSON. Można go otworzyć w dowolnym edytorze tekstu
(np. Notatnik, VS Code, Notepad++).

---

## 2. Struktura wpisu agenta

Każdy agent jest opisany przez następujące pola:

| Pole        | Wymagane | Opis                                                          | Przykład                              |
|-------------|----------|---------------------------------------------------------------|---------------------------------------|
| `name`      | ✓ tak    | Imię i nazwisko agenta                                        | `"Jan Kowalski"`                      |
| `role`      | ✓ tak    | Stanowisko / tytuł                                            | `"Doradca ds. Nieruchomości"`         |
| `image`     | ✓ tak    | Adres URL zdjęcia profilowego (link do internetu lub ścieżka) | `"https://example.com/jan.jpg"`       |
| `email`     | ✓ tak    | Adres e-mail                                                  | `"jan@globalshome.com"`               |
| `languages` | ✓ tak    | Lista języków (kody dwuliterowe)                              | `["PL", "EN"]`                        |
| `phone`     | nie      | Numer telefonu                                                | `"+48 500 100 200"`                   |

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
    ...
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

Przed uruchomieniem aplikacji warto sprawdzić, czy plik agentów nie zawiera błędów.

### Jak uruchomić walidator

Otwórz terminal w folderze projektu i wpisz:

```
pnpm validate:agents
```

Walidator **nie wymaga** dodatkowych instalacji — działa na Node.js, który jest już zainstalowany w projekcie.

### Co sprawdza walidator

- czy plik istnieje pod wskazaną ścieżką
- czy plik zawiera poprawny JSON (brak literówek, brakujących przecinków itp.)
- czy plik zawiera listę (a nie pojedynczy obiekt)
- czy każdy agent posiada wszystkie wymagane pola
- czy typy danych są poprawne (np. `languages` to lista, a nie tekst)
- czy adres e-mail ma poprawny format

### Przykładowy wynik — plik poprawny

```
────────────────────────────────────────────────────────────
 Walidator listy agentów — Global S Home
────────────────────────────────────────────────────────────

► Plik: /projekt/src/data/agents.json
  ✓  Plik istnieje
  ✓  Składnia JSON jest poprawna
  ✓  Znaleziono 4 agentów

► Sprawdzanie poszczególnych agentów:
  ✓  Agent #1 (Anna Nowak): wszystkie pola są poprawne
  ✓  Agent #2 (Piotr Wiśniewski): wszystkie pola są poprawne

────────────────────────────────────────────────────────────
 ✓  Plik jest poprawny i gotowy do użycia w aplikacji.
────────────────────────────────────────────────────────────
```

### Przykładowy wynik — błąd

```
  ✗  Agent #2 (Piotr Wiśniewski): brakuje wymaganego pola "email"
  ✗  Znaleziono błędy — popraw je przed uruchomieniem aplikacji.
```

---

## 6. Zmiana lokalizacji pliku

Domyślna ścieżka do pliku agentów to `./src/data/agents.json`.
Można ją zmienić w pliku `.env` znajdującym się w głównym folderze projektu:

```
AGENTS_FILE_PATH=./src/data/agents.json
```

Zmień wartość na ścieżkę do wybranego pliku (względem głównego folderu projektu).
Po zmianie ścieżki uruchom ponownie walidator i aplikację.

---

## 7. Najczęstsze błędy

| Objaw | Prawdopodobna przyczyna | Rozwiązanie |
|-------|------------------------|-------------|
| Walidator zgłasza błąd składni | Brakujący cudzysłów, przecinek lub nawias | Otwórz plik i sprawdź zaznaczone miejsce |
| Agent nie pojawia się na stronie | Błąd w pliku lub brak przebudowania aplikacji | Uruchom walidator, popraw błędy, uruchom `pnpm build` |
| Zdjęcie agenta się nie wyświetla | Niepoprawny lub niedostępny URL w polu `image` | Sprawdź czy link do zdjęcia działa w przeglądarce |
| Walidator nie znajduje pliku | Zła ścieżka w `AGENTS_FILE_PATH` | Sprawdź plik `.env` i upewnij się, że plik istnieje |
