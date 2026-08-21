# Łączenie się z VPS (cyberfolks) przez SSH

Instrukcja połączenia z serwerem VPS hostującym aplikację (test: `http://test.ixtnzfseqk.cfolks.pl/`). Historia zmian wykonanych na serwerze: [dziennik-wdrozen-vps.md](dziennik-wdrozen-vps.md). Pełny przewodnik po budowaniu, wdrażaniu, zarządzaniu procesem Node i konfiguracji `.htaccess`: [instrukcja-wdrazania-vps.md](instrukcja-wdrazania-vps.md).

## Dane dostępowe

| Parametr | Wartość |
| :--- | :--- |
| Host | `s68.cyber-folks.pl` |
| Port | **222** (niestandardowy — domyślny 22 nie działa) |
| Użytkownik | `ixtnzfseqk` |
| Uwierzytelnianie | hasło |

**Hasło nie jest zapisane w repozytorium.** Na maszynie deweloperskiej (Windows) dane dostępowe są przechowywane w **systemowych zmiennych środowiskowych**:

- `cyberfolks_server_url` — host
- `cyberfolks_server_username` — użytkownik
- `cyberfolks_server_password` — hasło

> **Uwaga:** SSH na serwerze bywa **wyłączony** (włączany tylko na czas prac administracyjnych). Jeśli połączenie jest odrzucane / przekracza limit czasu, najpierw włącz dostęp SSH w panelu administracyjnym cyberfolks (cyber_Admin / DirectAdmin), a po zakończeniu prac wyłącz go ponownie.

## Sposób 1 — OpenSSH (terminal / Git Bash / PowerShell)

Standardowy klient `ssh` wymaga jawnego wskazania algorytmu MAC — bez tego negocjacja połączenia z tym serwerem potrafi się nie powieść:

```bash
ssh -o MACs=hmac-sha2-256-etm@openssh.com ixtnzfseqk@s68.cyber-folks.pl -p 222
```

Po wywołaniu podaj hasło (ze zmiennej `cyberfolks_server_password`).

## Sposób 2 — PuTTY / plink (Windows, umożliwia podanie hasła w poleceniu)

`plink` (część pakietu PuTTY, `C:\Program Files\PuTTY\`) łączy się z tym serwerem bez dodatkowych flag i pozwala przekazać hasło parametrem — przydatne w skryptach:

```powershell
$hklm = Get-Item 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment'
$pw   = $hklm.GetValue('cyberfolks_server_password')
$user = $hklm.GetValue('cyberfolks_server_username')
$srv  = $hklm.GetValue('cyberfolks_server_url')

& 'C:\Program Files\PuTTY\plink.exe' -ssh -P 222 -pw $pw "$user@$srv" "twoje polecenie"
```

> Odczyt zmiennych bezpośrednio z rejestru (`HKLM`) jest celowy — zmienne systemowe dodane **po** uruchomieniu terminala/IDE nie są widoczne przez `$env:...` bez restartu sesji.

Przy pierwszym połączeniu plink zapyta o akceptację odcisku klucza serwera (host key) — potwierdź `y`.

## Kopiowanie plików — pscp

Transfer plików na serwer (np. artefakty builda) przez `pscp` (również z pakietu PuTTY):

```powershell
& 'C:\Program Files\PuTTY\pscp.exe' -P 222 -pw $pw -r lokalny\folder "$user@${srv}:sciezka/docelowa/"
```

Flaga `-r` kopiuje rekurencyjnie. Uwaga: `pscp` nie odtwarza dowiązań symbolicznych (istotne np. przy `node_modules` z pnpm — zależności instaluj bezpośrednio na serwerze).

## Przydatne fakty o serwerze

- Katalog domowy: `/home/ixtnzfseqk`. Aplikacja Astro: `~/apps/new-global-s-home` (port `54322`, uruchamiana przez `nohup`).
- Node.js ≥ 22 (wymagany przez Astro): `/opt/alt/alt-nodejs22/root/usr/bin/node` — **nie jest na domyślnym `PATH`**; przy `npm install` dopisz katalog do `PATH`, inaczej skrypty postinstall (np. esbuild) nie znajdą polecenia `node`.
- Serwer WWW to **LiteSpeed** (nie Apache), ale reguły `.htaccess` działają zgodnie z konwencją Apache.
- Docroot domeny testowej: `/home/ixtnzfseqk/domains/ixtnzfseqk.cfolks.pl/public_html/test` (zawiera tylko `.htaccess` z reverse proxy na lokalny port aplikacji).
- **Nie modyfikować** niczego w `/home/ixtnzfseqk/domains/globalshome.com` — tam działa osobna, produkcyjna aplikacja.
- Pułapka przy `pkill`: wzorzec podany w tej samej komendzie SSH pasuje też do własnej powłoki i zabija sesję — używaj zapisu z nawiasami, np. `pkill -f '[e]ntry.mjs'`.
