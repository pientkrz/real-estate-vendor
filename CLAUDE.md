# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Astro dev server at http://localhost:4321
npm run build     # Static production build
npm run preview   # Preview production build locally
npm test          # Run Vitest tests (watch mode)
```

Run a single test file:
```bash
npx vitest src/components/ContactForm.test.jsx
```

There is no lint script in `package.json` despite the README mentioning one — ESLint is configured (`eslint.config.js`) but not wired to a script.

## Architecture

This is an **Astro static site** (`output: 'static'`) deployed to GitHub Pages at `https://pientkrz.github.io/real-estate-vendor/`. The base path `/real-estate-vendor/` is set in `astro.config.mjs` — always use `import.meta.env.BASE_URL` for internal links in Astro pages/templates.

### Data Flow: Otodom XML export

All property listings come from an Otodom-format XML export at `public/2026-05-23_13%3A07%3A04/properties_otodom.xml`. Photos are co-located in the same timestamped folder. The XML structure is:

```
<otoDom> → <Insertions> → <Insertion>
```

`src/utils/xmlParser.js` exports two parsers — **`parseOtoDomXml`** (active) and the legacy `parseOffersXml` (unused, kept for reference). `parseOtoDomXml` takes the raw XML string and a `photoBasePath` prefix (e.g. `${import.meta.env.BASE_URL}2026-05-23_13%3A07%3A04/`) and returns normalised offer objects.

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

**Index page**: XML is parsed server-side at build time in `src/pages/index.astro` using Node `fs`, then passed as `initialOffers` props to the `CollectionManager` React island — no client-side fetch on the homepage.

**Property detail pages** (`src/pages/property/[id].astro`): Fully static via `getStaticPaths()`, which reads the same XML to generate one page per offer.

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
