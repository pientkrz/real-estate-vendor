# Instrukcja dodawania artykułów do bloga

## Spis treści

1. [Jak wygląda strona przed dodaniem artykułu](#1-jak-wygląda-strona-przed-dodaniem-artykułu)
2. [Jak wygląda strona po dodaniu artykułu](#2-jak-wygląda-strona-po-dodaniu-artykułu)
3. [Krok po kroku — dodanie nowego artykułu](#3-krok-po-kroku--dodanie-nowego-artykułu)
4. [Opis pól artykułu](#4-opis-pól-artykułu)
5. [Formatowanie treści artykułu](#5-formatowanie-treści-artykułu)
6. [Najczęstsze błędy](#6-najczęstsze-błędy)

---

## 1. Jak wygląda strona przed dodaniem artykułu

Strona bloga dostępna pod adresem `/blog` wyświetla siatkę kart z istniejącymi wpisami. Każda karta zawiera:

- zdjęcie główne (jeśli podano)
- datę publikacji w prawym górnym rogu zdjęcia
- kategorię artykułu (np. ARCHITEKTURA, INVESTMENT)
- tytuł
- krótki opis (zajawkę)
- przycisk „Read Full Inquiry"

Jeśli nie ma żadnych artykułów, strona wyświetla komunikat o pustym archiwum.

Każdy artykuł posiada własną podstronę dostępną pod adresem `/blog/nazwa-pliku` (bez rozszerzenia `.md`), która zawiera:

- pełny tytuł i opis
- zdjęcie główne (jeśli podano)
- datę publikacji i autora w bocznej kolumnie
- pełną treść artykułu
- karuzelę z powiązanymi artykułami na dole

---

## 2. Jak wygląda strona po dodaniu artykułu

Po dodaniu nowego pliku i wdrożeniu aplikacji:

- nowa karta artykułu pojawia się w siatce na stronie `/blog`
- artykuł jest dostępny pod własnym adresem `/blog/nazwa-twojego-pliku`
- w karuzeli „powiązane artykuły" na stronie każdego wpisu pojawia się nowy artykuł
- artykuły są posortowane od najnowszego do najstarszego na podstawie pola `pubDate`

---

## 3. Krok po kroku — dodanie nowego artykułu

### Krok 1 — skopiuj szablon

Otwórz plik szablonu:

```
docs/szablon-artykulu-blog.md
```

Skopiuj jego zawartość.

---

### Krok 2 — utwórz nowy plik

W folderze:

```
src/content/blog/
```

utwórz nowy plik tekstowy z rozszerzeniem `.md`. Nazwa pliku stanie się adresem URL artykułu, dlatego:

- używaj tylko małych liter
- zamiast spacji używaj myślników `-`
- nie używaj polskich znaków w nazwie pliku
- nie używaj kropek ani innych znaków specjalnych

**Przykłady poprawnych nazw plików:**

| Nazwa pliku | Adres artykułu |
|-------------|----------------|
| `rynek-nieruchomosci-2026.md` | `/blog/rynek-nieruchomosci-2026` |
| `luksusowe-apartamenty-warszawa.md` | `/blog/luksusowe-apartamenty-warszawa` |
| `inwestycje-za-granica.md` | `/blog/inwestycje-za-granica` |

---

### Krok 3 — wypełnij nagłówek artykułu

Na początku pliku znajduje się sekcja nagłówkowa między liniami `---`. Wypełnij każde pole:

```markdown
---
title: "Tytuł Twojego artykułu"
description: "Krótki opis, który pojawi się jako zajawka."
pubDate: 2026-06-15
category: "ARCHITEKTURA"
author: "Imię Nazwisko"
thumbnail: "https://link-do-zdjecia.jpg"
---
```

Szczegółowy opis każdego pola znajdziesz w [sekcji 4](#4-opis-pól-artykułu).

---

### Krok 4 — napisz treść artykułu

Pod zamykającą linią `---` wpisz treść artykułu. Szczegóły dotyczące formatowania (nagłówki, pogrubienie, cytaty) znajdziesz w [sekcji 5](#5-formatowanie-treści-artykułu).

---

### Krok 5 — wdróż zmiany

Zapisz plik, a następnie wypchnij zmiany do repozytorium Git (np. przez GitHub Desktop lub terminal). GitHub Actions automatycznie przebuduje i opublikuje stronę.

Po kilku minutach nowy artykuł pojawi się na stronie `/blog`.

---

## 4. Opis pól artykułu

| Pole | Wymagane | Opis |
|------|----------|------|
| `title` | ✓ tak | Tytuł artykułu wyświetlany na karcie i stronie artykułu |
| `description` | ✓ tak | Krótki opis (1–2 zdania) — pojawia się jako zajawka na liście i jako podtytuł w artykule |
| `pubDate` | ✓ tak | Data publikacji w formacie `RRRR-MM-DD`, np. `2026-06-15` — decyduje o kolejności na liście |
| `category` | nie | Kategoria wyświetlana nad tytułem, np. `ARCHITEKTURA`, `INVESTMENT`, `LIFESTYLE` — pisz wielkimi literami |
| `author` | nie | Imię i nazwisko autora — wyświetlane w bocznej kolumnie artykułu |
| `thumbnail` | nie | Adres URL zdjęcia głównego — wyświetlane na karcie listy i jako baner artykułu |

### Uwagi do pola `pubDate`

Data musi być w formacie `RRRR-MM-DD`:

```
pubDate: 2026-06-15   ✓ poprawnie
pubDate: 15.06.2026   ✗ błędnie
pubDate: June 15      ✗ błędnie
```

### Uwagi do pola `thumbnail`

Zdjęcie można dodać na dwa sposoby:

---

#### Sposób A — link do zdjęcia w internecie (zalecany)

Podaj pełny adres URL do zdjęcia dostępnego publicznie w internecie.

Polecane serwisy z bezpłatnymi zdjęciami wysokiej jakości: [Unsplash](https://unsplash.com).

**Jak skopiować link ze strony Unsplash:**

1. Wejdź na [unsplash.com](https://unsplash.com) i znajdź wybrane zdjęcie.
2. Kliknij zdjęcie, aby je otworzyć.
3. Kliknij przycisk **„Share"**, a następnie **„Copy link"** — skopiuje się link do strony zdjęcia.
4. Alternatywnie: kliknij prawym przyciskiem myszy na zdjęcie → **„Kopiuj adres obrazu"** — to jest gotowy URL do użycia.

```
thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200"
```

---

#### Sposób B — własny plik przesłany do serwera

Możesz także przesłać plik zdjęcia bezpośrednio do folderu w repozytorium projektu i odwołać się do niego ścieżką.

**Krok 1 — umieść plik zdjęcia w folderze:**

```
public/images/blog/
```

Jeśli folder `images/blog/` nie istnieje, utwórz go. Przykład struktury:

```
public/
  images/
    blog/
      moje-zdjecie.jpg
      inwestycje-warszawa.jpg
```

Zalecane formaty: `.jpg`, `.webp`, `.png`. Zalecana szerokość: minimum 1200 px.

**Krok 2 — odwołaj się do pliku w nagłówku artykułu:**

```
thumbnail: "/real-estate-vendor/images/blog/moje-zdjecie.jpg"
```

> **Uwaga:** Ścieżka musi zaczynać się od `/real-estate-vendor/` — jest to stały prefiks adresu strony na serwerze. Nazwa po nim to dokładna ścieżka pliku względem folderu `public/`.

**Pełny przykład:**

Plik umieszczony w:
```
public/images/blog/widok-na-morze.jpg
```

Wartość pola `thumbnail`:
```
thumbnail: "/real-estate-vendor/images/blog/widok-na-morze.jpg"
```

---

## 5. Formatowanie treści artykułu

Treść artykułu piszesz w formacie Markdown — zwykłym tekście z prostymi znacznikami formatowania. Pełna dokumentacja składni dostępna jest pod adresem: [markdownguide.org/basic-syntax](https://www.markdownguide.org/basic-syntax/).

### Nagłówki

```markdown
## Nagłówek sekcji (duży)

### Podsekcja (mniejszy)
```

### Akapity

Każdy akapit oddzielaj **pustą linią**:

```markdown
Pierwszy akapit tekstu.

Drugi akapit tekstu.
```

### Wyróżnienia tekstu

```markdown
**pogrubiony tekst**
*tekst kursywą*
```

### Cytat wyróżniony

Pojawia się jako elegancki wyróżnik przełamujący treść:

```markdown
> "Treść cytatu lub ważnej myśli."
```

### Lista punktowana

```markdown
- Punkt pierwszy
- Punkt drugi
- Punkt trzeci
```

### Zdjęcie wewnątrz artykułu

```markdown
![Opis zdjęcia dla czytników ekranu](https://adres-url-do-zdjecia.jpg)
```

---

## 6. Najczęstsze błędy

| Objaw | Przyczyna | Rozwiązanie |
|-------|-----------|-------------|
| Artykuł nie pojawia się na stronie | Plik jest poza folderem `src/content/blog/` | Upewnij się, że plik jest w odpowiednim folderze |
| Błąd podczas wdrożenia | Brakuje wymaganego pola `title`, `description` lub `pubDate` | Sprawdź czy wszystkie wymagane pola są uzupełnione |
| Błąd daty | Data podana w niepoprawnym formacie | Użyj formatu `RRRR-MM-DD`, np. `2026-06-15` |
| Zdjęcie nie wyświetla się | Niepoprawny lub niedostępny adres URL zdjęcia | Wklej link w przeglądarce i sprawdź czy otwiera się zdjęcie |
| Adres URL artykułu zawiera znaki specjalne | Nazwa pliku zawiera polskie litery lub spacje | Zmień nazwę pliku — używaj tylko liter `a–z`, cyfr i myślników |
| Tytuł lub opis wyświetla się bez cudzysłowów ale zawiera dwukropek | Dwukropek w wartości pola bez cudzysłowów łamie format | Zawsze otaczaj wartości pól cudzysłowami: `title: "Tytuł: podtytuł"` |
