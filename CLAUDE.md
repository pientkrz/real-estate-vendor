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

### Data Flow: offers.xml

All property listings come from a single XML file at `public/offers.xml`. The XML structure is:

```
<plik> → <lista_ofert> → <dzial @tab @typ> → <oferta>
```

`src/utils/xmlParser.js` (`parseOffersXml`) converts this into offer objects. Key Polish field names used throughout the codebase:

| XML param `@nazwa` | Meaning |
|--------------------|---------|
| `miasto` | City/location |
| `liczbapokoi` | Room count |
| `liczbalazienek` | Bathroom count |
| `powierzchnia` | Area (m²) |
| `latitude` / `longitude` | Coordinates |
| `opis` | Description (HTML) |
| `zdjecie1`–`zdjecie4` | Photo URLs |

**Index page**: XML is parsed server-side at build time in `src/pages/index.astro` using Node `fs`, then passed as `initialOffers` props to the `CollectionManager` React island — no client-side fetch needed on the homepage.

**Property detail pages** (`src/pages/property/[id].astro`): Fully static with `getStaticPaths()` which reads the same XML to generate one page per offer.

`src/hooks/useOffers.js` does a client-side `fetch('/offers.xml')` but is not used by the main pages; `CollectionManager` handles filtering directly with `useMemo`.

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
