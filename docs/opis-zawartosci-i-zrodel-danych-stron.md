# Zawartość stron i źródła danych

Dokument opisuje, które elementy głównych stron Global S Home są stałe, a które są pobierane lub wyliczane w czasie działania aplikacji.

## Strona główna — filtr i lista ofert

Trasa `/` jest renderowana przez Astro po stronie serwera. Przy każdym żądaniu aplikacja odczytuje opublikowaną migawkę JSON wskazaną przez `OFFER_STATE_PATH`. Migawkę tworzy proces ingestii na podstawie dostaw XML dostawców. Aplikacja internetowa nie odczytuje skrzynek FTP ani nie parsuje ZIP/XML podczas wyświetlania strony. Po publikacji nowej migawki nowe oferty pojawiają się bez przebudowy aplikacji.

### Dane ofert i ich łączenie

Obsługiwani dostawcy to Otodom, Nieruchomosci-online.pl (NOE) i Oferty.net. Ich identyfikatory są sprowadzane do wspólnego identyfikatora nieruchomości, a pasujące rekordy łączone w jeden agregat. Dopasowanie opiera się na identyfikatorach dostawców, a nie na podobieństwie tytułu lub adresu.

Dla większości pól, takich jak cena, typ transakcji, kategoria, parametry, agent i główny zestaw wariantów zdjęcia, obowiązuje kolejność źródeł:

1. Otodom
2. Nieruchomosci-online.pl
3. Oferty.net

Wygrywa pierwsza niepusta wartość w tej kolejności; brakujące wartości są uzupełniane z kolejnych źródeł. Reguła jest stosowana osobno do poszczególnych pól. Gdy dostawcy podają różne wartości, agregat zapisuje źródło wybrane dla pola oraz konflikt do diagnostyki.

Lokalizacja ma osobną regułę: aplikacja preferuje lokalizację podaną w XML. Jeżeli kilka rekordów zawiera dane XML, pierwszeństwo ma ten z największą liczbą pól spośród kraju, regionu i miasta; remis rozstrzyga kolejność Otodom → NOE → Oferty.net. Brakujące pola są uzupełniane lokalnie ze współrzędnych. Nazwy z XML zachowują pisownię dostawcy. Historyczne samo `Country=1` z Otodom nie jest uznawane za kompletną lokalizację.

Oferta jest ukrywana, jeśli którykolwiek z dostawców zgłosił jej usunięcie lub dezaktywację, a inny nadal zgłasza ją jako aktywną. To ostrożna reguła zapobiegająca pokazywaniu oferty, której aktualność jest niepewna.

### Filtr i prezentacja

Mapa, filtr i kafelki korzystają z tej samej listy widocznych agregatów. Filtry działają w przeglądarce na danych przekazanych przez SSR; nie wykonują osobnego zapytania do dostawcy. Można filtrować według kraju, kategorii nieruchomości, minimalnej liczby pokoi i zakresu cen oraz sortować według ceny lub powierzchni. Kraje są wyznaczane z aktualnych ofert, a siedem podstawowych kategorii jest dostępnych także wtedy, gdy dla którejś nie ma obecnie ofert. Nieznane kategorie są dodawane tylko wtedy, gdy występują w danych.

Kwoty ofert i ich waluty pochodzą od dostawców. Przełącznik PLN/EUR przelicza je po stronie przeglądarki. Kursy są pobierane z Frankfurter; w razie błędu aplikacja próbuje Europejskiego Banku Centralnego. Odświeżenie następuje przy uruchomieniu aplikacji i co godzinę. Gdy oba źródła zawiodą, używane są wbudowane kursy zapasowe; interfejs informuje, że kurs jest domyślny.

Kafelki używają danych agregatu, w tym powierzchni, pokoi, sypialni, łazienek, ceny, lokalizacji i zdjęć. Liczba sypialni i łazienek jest pokazywana tylko wtedy, gdy dostawca podał daną wartość. Tagi widoczne na zdjęciu kafelka pochodzą z pola Oferty.net `opis_ang`, rozdzielonego znakiem `|`; nie są osobnym źródłem tagów.

Mapa ofert korzysta z lokalizacji agregatu i zewnętrznych satelitarnych kafelków mapy Esri. Markery i ich treść są tworzone z bieżących ofert. Zdjęcia są przetwarzane podczas ingestii: pliki bieżącego stanu są przechowywane na VPS, a dla obsługiwanych formatów dostępne są warianty WebP. Przeglądarka nie pobiera zdjęć bezpośrednio z FTP ani z adresów zdjęć providerów.

## Szczegóły oferty

Trasa `/property/<id>` jest dynamicznie renderowana po stronie serwera z tej samej opublikowanej migawki JSON co strona główna. Nie tworzy osobnego źródła ani kopii oferty. Jeśli identyfikator jest nieznany albo oferta nie jest widoczna, użytkownik wraca na stronę główną.

Strona pobiera z agregatu tytuł i opis, kategorię, sprzedaż/wynajem, cenę i walutę, lokalizację, parametry, zdjęcia, ewentualny film oraz przypisanego agenta. Szczegółowe atrybuty są budowane z aktywnych rekordów providerów według opisanej wyżej kolejności Otodom → NOE → Oferty.net; puste wartości mogą zostać uzupełnione z kolejnego dostawcy. Dane właściwe dla konkretnego rodzaju nieruchomości są prezentowane w panelu odpowiadającym kategorii.

Lokalizacja na stronie i mapa szczegółów korzystają z końcowego obiektu `location` agregatu. Priorytet mają niepuste pola lokalizacji z XML, a reverse geokoder uzupełnia jedynie braki. `params.miasto` jest synchronizowane z końcowym miastem lokalizacji.

Główne zdjęcie, galeria i warianty responsywne pochodzą ze zdjęć zapisanych dla bieżących rekordów providerów. Szczegóły pokazują do dwóch kolejnych zdjęć w galerii, jeśli są dostępne. Brak dalszych zdjęć powoduje wyświetlenie komunikatu o zdjęciach dostępnych na życzenie. Film jest wyświetlany tylko wtedy, gdy agregat ma obsługiwany adres wideo.

Karta opiekuna oferty używa danych agenta z agregatu. Poniżej znajduje się dodatkowa karuzela agentów z katalogu `<agents>` dostawcy Nieruchomosci-online.pl. Jeśli agent nie ma zdjęcia, interfejs pokazuje lokalny obraz zastępczy. Podobne oferty są wybierane z bieżących widocznych agregatów według zbliżonej ceny (60% wyniku) i powierzchni (40% wyniku), a nie z ręcznie utrzymywanej listy.

Formularz zapytania wysyła identyfikator oferty i dane formularza do endpointu aplikacji. Lista adresów e-mail agentów jest ustalana po stronie serwera na podstawie aktywnych rekordów providerów; przeglądarka nie może wskazać odbiorcy. Wiadomość trafia do `info@globalshome.com`, opcjonalnego adresu `MAIL_TO` i unikalnych adresów agentów przypisanych do oferty. Do nadawcy wysyłane jest osobne potwierdzenie.

## O nas

Teksty, misja firmy, układ strony i logo są treścią statyczną utrzymywaną w kodzie strony. Zmiana tych elementów wymaga zmiany i wdrożenia aplikacji.

Sekcja zespołu jest dynamiczna. Jej listę agentów aplikacja odczytuje z katalogu agentów opublikowanego w migawce ingestii na podstawie XML NOE `<agents>`. Wykorzystywane są m.in. imię i nazwisko, telefon, e-mail, zdjęcie i numer licencji, jeśli provider je podał. Pusty katalog ukrywa sekcję zespołu. Brak zdjęcia pojedynczego agenta nie blokuje karty — pojawia się obraz zastępczy. Aktualizacja listy wymaga poprawnego przetworzenia nowej dostawy przez proces ingestii, ale nie przebudowy strony.

## Kontakt

Nagłówki, teksty, dane firmy, NIP, adres `info@globalshome.com` i godziny pracy są zapisane bezpośrednio w stronie, więc są statyczne i zmieniają się wraz z wdrożeniem kodu.

Formularz jest interaktywny. Użytkownik może podać dane kontaktowe, telefon oraz informacje o kierunku, celu, budżecie i preferowanym typie nieruchomości. Interfejs wymaga zaakceptowania zgody i sprawdza poprawność telefonu. Endpoint serwerowy sprawdza wymagane pola i adres e-mail oraz ogranicza liczbę zgłoszeń. Wiadomość jest wysyłana przez SMTP skonfigurowane zmiennymi środowiskowymi. Stałym odbiorcą jest `info@globalshome.com`; może dojść `MAIL_TO`. Formularz kontaktowy nie pobiera dynamicznie listy agentów, ponieważ nie dotyczy konkretnej oferty. Formularz na stronie szczegółów oferty dodaje agentów przypisanych do tej oferty.

Po przyjęciu zapytania system wysyła również potwierdzenie na adres e-mail podany przez użytkownika. Niepowodzenie wysyłki jest zwracane do interfejsu jako błąd formularza.

## Gdzie sprawdzić szczegóły techniczne

- [Dostawcy ofert i mapowania XML](dostawcy-ofert.md) — formaty, mapowania pól, agregacja i priorytety.
- [Obsługa dostaw ofert i procesów VPS](instrukcja-obslugi-dostaw-ofert.md) — ingestia, migawka JSON, zdjęcia i retencja.
- [Instrukcja logowania](instrukcja-logowania.md) — logi aplikacji i ingestii.
