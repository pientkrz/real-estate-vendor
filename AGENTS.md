# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev       # Start Astro dev server at http://localhost:4321
pnpm build     # SSR production build (dist/server + dist/client)
pnpm preview   # Preview production build locally
pnpm test      # Run Vitest tests (watch mode)
```

Run a single test file:
```bash
pnpm vitest src/components/ContactForm.test.jsx
```

There is no lint script in `package.json` despite the README mentioning one — ESLint is configured (`eslint.config.js`) but not wired to a script.

## Validation

After every code change, **always validate in the browser before reporting the task as done**:

1. Start the dev server (`pnpm dev`) if not already running — it starts on port 4321 (or next available).
2. Navigate to `http://localhost:<port>/` using Chrome DevTools (`mcp__chrome-devtools__navigate_page`).
3. Take a screenshot (`mcp__chrome-devtools__take_screenshot`) to confirm the page renders.
4. Check console for errors (`mcp__chrome-devtools__list_console_messages` with `types: ["error", "warn"]`) — investigate and fix any errors before finishing.
5. For server-side errors (SSR failures, `window is not defined`, etc.) read the server terminal output — it contains the real Node.js stack trace.

## Architecture

This is an **Astro SSR app** (`output: 'server'`, `@astrojs/node` standalone adapter) hosted on a self-managed VPS — no GitHub Pages, no static export. The site is served from the domain root (`base: '/'`); see `docs/dziennik-wdrozen-vps.md` for the hosting setup. `site` in `astro.config.mjs` defaults to the test domain and is overridden via the `SITE_URL` env var for production once that domain exists.

### Data flow: provider deliveries

The three provider inboxes on the VPS are `/home/ixtnzfseqk/dostawa-ofert/{otodom-pl,nieruchomosci-online-pl,oferty-net}`. The short-lived `scripts/ingest-offers.mjs` worker, scheduled every 30 minutes with `flock`, validates settled ZIP deliveries, extracts referenced photos to `OFFER_PHOTO_ROOT`, and atomically publishes the normalised state JSON at `OFFER_STATE_PATH`.

The Astro SSR app reads **only** that state through `src/server/offerService.js`; it never parses ZIP/XML files during a request and has no fallback to a timestamped `public/` collection. Runtime paths are read through Node's runtime environment, loaded with `node --env-file=.env`, so VPS configuration is not baked into a local build. Photos are served from the VPS under `OFFER_PHOTO_PUBLIC_BASE_PATH` (currently `/offer-photos`).

Otodom is one of the XML sources processed by the worker. Its core structure is:

```
<otoDom> → <Insertions> → <Insertion>
```

`src/utils/xmlParser.js` exports the provider parsers used by ingestion. `parseOtoDomXml` takes the raw XML string and a photo-base URL (for example `/offer-photos/otodom-pl/<delivery>/`) and returns normalised offer objects.

Key Otodom XML fields and how they map to offer objects:

| Otodom field | Offer property | Notes |
|---|---|---|
| `Insertion.ID` | `id` (`otodom-{ID}`) | |
| `Insertion.ObjectName` | `tab` | 0=mieszkania, 1=domy, 2=dzialki, 3=pokoje, 4=lokale, 5=hale, 6=garaze |
| `Insertion.OfferType` | `typ` | 1=wynajem, other=sprzedaz |
| `Insertion.Price` | `price` | |
| `Insertion.PriceCurrency` | `currency` | Resolved via `otodom-dictionary.json` |
| `Insertion.Area` | `params.powierzchnia` | m² |
| `*Details.RoomsNum` | `params.liczbapokoi` | From `FlatDetails`, `HouseDetails`, etc. |
| `Insertion.GeoMarker.Latitude/Longitude` | `params.latitude/longitude` | |
| `Insertion.Description` | `params.opis` | HTML |
| `Insertion.Title` | `params.tytul` | Also used to derive `params.miasto` |
| `Insertion.Photos.Photo[].File` | `params.zdjecie1…N` | Sorted by `Position`; prefixed with `photoBasePath` |

**Location derivation**: `params.miasto` is not in the XML — it is inferred from the offer title via keyword matching in `extractLocation()` (e.g. "mykonos" → `"Greece (Mykonos)"`). `CollectionManager` filters by `city.includes(filter.split(' ')[0])`.

**Insertions with `Action !== 0`** (deactivations/deletions) are skipped during parsing.

**Index page**: the atomically published state is read server-side on every request (SSR) in `src/pages/index.astro`, then passed as `initialOffers` props to the `CollectionManager` React island. A successful ingestion is therefore visible without rebuilding the site.

**Property detail pages** (`src/pages/property/[id].astro`): server-rendered (`prerender = false`) from the same published state.

`src/hooks/useOffers.js` is **stale** — it still fetches the old `/offers.xml` via `parseOffersXml` and is not used by any page.

### React Islands Pattern

Only interactive components are hydrated as React islands. Directives used:
- `client:load` — Navbar, CollectionManager, ContactForm (hydrate immediately)
- `client:only="react"` — PropertyMap (Leaflet is browser-only; cannot SSR)

### Component Hierarchy (index page)

```
Layout.astro
└── Navbar (client:load)
└── Hero
    └── CollectionManager (client:load)
        ├── RealEstateFilter   ← manages filter state
        └── FeaturedProperties ← receives filteredOffers
└── Ethos
└── Footer
```

### Blog

Blog posts are Markdown files in `src/content/blog/`. The content collection is defined in `src/content.config.ts`. Required frontmatter: `title`, `description`, `pubDate`. Optional: `author`, `thumbnail`, `category`.

### Design System

Custom Tailwind v4 theme tokens are defined in `src/index.css` under `@theme`. Key tokens:

- `primary` = Gold `#7a590c`
- `surface` / `background` = Cream `#fcf9f8`
- `on-surface` / `obsidian` = Near-black `#1c1b1b`
- `font-headline` = Work Sans, `font-body`/`font-label` = Inter, `font-serif` = Cormorant Garamond

Utility class `.editorial-gradient` applies the gold gradient (`#7a590c` → `#c2994a`). The design principle is **no 1px separator lines** — use background tone shifts instead.

### Testing

Tests are co-located with components (e.g., `src/components/ContactForm.test.jsx`). The test environment is `jsdom` with setup in `test/setup.js`. Uses Vitest + React Testing Library.

## Conventions

### Documentation and manuals
All user-facing instructions and manuals (how-to guides, onboarding docs, process instructions) go in `docs/`. Do not place them in the repo root or alongside source files.

### External validators and tooling
Any validator or tool intended for use **outside the application** (i.e. not imported by Astro/React code, not part of the build) belongs in `public/content/validators/`. This keeps external tooling co-located, deployed with the site, and accessible without a local dev environment.
