# Application Specification

> **Project**: Local T P — Real Estate Showcase  
> **Stack**: Astro 6 (static), React 19 islands, Tailwind v4, Vitest  
> **Deployment**: GitHub Pages at `https://pientkrz.github.io/real-estate-vendor/`  
> **Last updated**: 2026-05-26

---

## 1. Overview

This is a statically-generated real estate showcase website built with Astro.  
All property listings are sourced from a single **Otodom-format XML export** file bundled with the site.  
There is no server, no API, and no client-side data fetching on the index page — everything is rendered at build time.

---

## 2. Supported Data Format: Otodom XML Import

### 2.1 Specification Reference

The XML format is defined by the **Otodom Import specification v170130**  
(© Otodom 2016, `specyfikacja_otodom_xml.txt`).

### 2.2 File Location

```
public/
└── 2026-05-23_13%3A07%3A04/
    ├── properties_otodom.xml   ← Otodom export
    └── *.jpg / *.gif           ← Property photos (co-located)
```

The timestamped folder name is the photo base path prefix used by the parser.

### 2.3 XML Structure

```xml
<?xml version="1.0" encoding="utf-8"?>
<otoDom>
  <Agency>biuro@example.pl</Agency>   <!-- required -->
  <Date>2024-01-01</Date>             <!-- required: YYYY-MM-DD -->
  <ImportType>full</ImportType>       <!-- required: "full" | "incremental" -->
  <App>App Name</App>                 <!-- optional: client app name -->
  <Insertions>
    <Insertion>...</Insertion>
    ...
  </Insertions>
</otoDom>
```

#### Insertion fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `ID` | string ≤32 chars | ✓ | Unique per offer |
| `Action` | integer | ✓ | 0=update/add, 1=deactivate, 2=delete |
| `Country` | integer | ✓ (Action=0) | 1=Poland |
| `Province` | integer or string | ✓ (Action=0) | 1–16, see dictionary |
| `District` | integer or string | ✓ (Action=0) | See Otodom districts dictionary |
| `City` | string ≤32 | ✓ (Action=0) | |
| `Quarter` | string ≤64 | optional | District/neighbourhood |
| `Street` | string ≤64 | optional | |
| `Price` | float | ✓ (Action=0) | |
| `PriceCurrency` | integer | ✓ (Action=0) | 1=PLN, 2=EUR, 3=GBP, 4=USD, 5=AED, 6=EGP |
| `Area` | float | ✓ for most types | m² |
| `MarketType` | integer | ✓ (Action=0) | 0=primary, 1=secondary |
| `ObjectName` | integer | ✓ (Action=0) | 0–6, see §3 |
| `OfferType` | integer | — | 0=sell, 1=rent |
| `Description` | string | ✓ (Action=0) | HTML stripped |
| `Title` | string ≤50 | optional | |
| `AgentLicense` | string | optional | |
| `GeoMarker.Latitude` | float | optional | −90…90 |
| `GeoMarker.Longitude` | float | optional | −180…180 |
| `ContactInfo` | object | optional | Name, Phone, Email |
| `Photos.Photo[]` | array | optional | ≤20; JPEG/GIF; max 5 MB; min 400×300 px |
| `Video` | string | optional | YouTube URL |
| `Panorama` | string | optional | Panorama URL |

For `Action=1` (deactivate) or `Action=2` (delete): **only `ID` is required**.

---

## 3. ObjectName — Property Types

`ObjectName` determines which `*Details` sub-tag carries type-specific fields:

| ObjectName | Type | Details tag | Requires Area | Requires RoomsNum |
|---|---|---|---|---|
| `0` | Mieszkanie (Flat) | `<FlatDetails>` | ✓ | ✓ |
| `1` | Dom (House) | `<HouseDetails>` | ✓ | ✓ |
| `2` | Działka (Terrain) | `<TerrainDetails>` | ✓ | — |
| `3` | Pokój (Room) | `<RoomDetails>` | — | — |
| `4` | Lokal użytkowy (Commercial) | `<CommercialPropertyDetails>` | ✓ | — |
| `5` | Magazyn/Hala (Hall) | `<HallDetails>` | ✓ | — |
| `6` | Garaż (Garage) | `<GarageDetails>` | — | — |

**Additional constraint**: Room (`ObjectName=3`) must have `OfferType=1` (rent only).

### 3.1 FlatDetails Fields (ObjectName = 0)

| Field | Type | Notes |
|---|---|---|
| `BuildingType` | integer | 0=blok, 1=kamienica, 2=dom wolnostojący, 3=plomba, 4=szeregowiec, 5=apartamentowiec, 6=loft |
| `BuildingMaterial` | integer | 0=cegła, 1=drewno, 2=pustak, 3=keramzyt, 4=wielka płyta, 5=beton, 6=inne, 7=silikat, 8=beton komórkowy |
| `BuildingFloorsNum` | integer | Total floors in building |
| `BuildingOwnership` | integer | 0=spółdzielcze własnościowe, 1=spółdzielcze własnościowe z KW, 2=pełna własność, 3=udział |
| `FloorNo` | integer | 0=suterena, 1=parter, 2=1st floor … 52=above 50 |
| `RoomsNum` | integer | **Required** |
| `BuildYear` | integer | |
| `ExtrasMask` | ArrayOfInteger | 0=balkon … 10=tylko dla niepalących |
| `ConstructionStatus` | integer | 0=do zamieszkania, 1=do wykończenia, 2=do remontu |
| `WindowsType` | integer | 0=plastikowe, 1=drewniane, 2=aluminiowe |
| `SecurityMask` | ArrayOfInteger | 0=rolety antywłamaniowe … 5=teren zamknięty |
| `MediaMask` | ArrayOfInteger | 0=internet, 1=telewizja, 2=telefon |
| `EquipmentMask` | ArrayOfInteger | 0=pralka … 5=telewizor |
| `Heating` | integer | 0=miejskie, 1=gazowe, 2=piece kaflowe, 3=elektryczne, 4=inne |
| `FreeFrom` | string (YYYY-MM-DD) | |
| `Furnished` | boolean (0/1) | |
| `Rent` | float | |
| `RentCurrency` | integer | Same codes as PriceCurrency |
| `PriceIncludeRent` | boolean (0/1) | |
| `RentToStudents` | boolean (0/1) | |
| `Deposit` | float | |
| `DepositCurrency` | integer | |

### 3.2 HouseDetails Fields (ObjectName = 1)

Key fields: `BuildingType`, `BuildingMaterial`, `TerrainArea`, `ConstructionStatus`, `BuildYear`, `RoofType`, `Type`, `FloorsNum`, `RoomsNum` (**required**), `GarretType`, `WindowsType`, `MediaMask`, `HeatingMask`, `FenceMask`, `Location`, `ExtrasMask`, `VicinityMask`, `AccessMask`, `SecurityMask`, `Roofing`, `FreeFrom`, `Furnished`, `Rent`, `RentCurrency`, `PriceIncludeRent`.

### 3.3 TerrainDetails Fields (ObjectName = 2)

Key fields: `Type`, `Dimensions`, `MediaMask`, `AccessMask` (single value), `Fence`, `VicinityMask`.

### 3.4 RoomDetails Fields (ObjectName = 3)

Key fields: `PersonsMask`, `FreeFrom`, `Furnished`, `BuildingType`, `RoomPlace`, `RoomsNum`, `Rent`, `RentCurrency`, `Deposit`, `DepositCurrency`, `Balcony`, `MediaMask`, `EquipmentMask`, `WomenInFlat`, `MenInFlat`, `WomenInRoom`, `MenInRoom`, `PreferredSex`, `PreferredProffesion`, `NonSmokersOnly`.

### 3.5 CommercialPropertyDetails Fields (ObjectName = 4)

Key fields: `PropertyUseMask`, `ExtrasMask`, `Floor`, `FreeFrom`, `Furnished`, `BuildingType`, `TerrainArea`, `ConstructionStatus`, `BuildYear`, `MediaMask`, `SecurityMask`.

### 3.6 HallDetails Fields (ObjectName = 5)

Key fields: `Height`, `AccessMask`, `Structure`, `MediaMask`, `Heating`, `UseMask`, `ParkingType`, `Flooring`, `ConstructionStatus`, `OfficeSpace`, `SocialFacilities`, `Ramp`, `SecurityMask`, `Fence`.

### 3.7 GarageDetails Fields (ObjectName = 6)

Key fields: `Heating`, `Lighting`, `Localization`, `Structure`.

### 3.8 ArrayOfInteger Encoding

Multi-value fields (Mask fields) are encoded as nested `<value>` tags:

```xml
<ExtrasMask>
  <value>0</value>   <!-- balkon -->
  <value>5</value>   <!-- taras -->
</ExtrasMask>
```

---

## 4. Data Flow: XML → Components

```
public/.../properties_otodom.xml
        │
        ▼ (build time, Node fs.readFileSync)
src/utils/xmlParser.js  parseOtoDomXml(xmlString, photoBasePath)
        │
        │  runs xmlValidator.validateOtoDomXml() → logs warnings if invalid
        │
        │  returns normalised offer[]
        ▼
src/pages/index.astro                src/pages/property/[id].astro
  (server-side, passes to)            (server-side via getStaticPaths)
        │                                       │
        ▼                                       ▼
CollectionManager (React island)    PropertyDetailsPanel (static render)
  └── RealEstateFilter                  └── resolvePropertyDetails()
  └── FeaturedProperties                └── FlatDetailsPanel | HouseDetailsPanel | ...
```

### 4.1 Normalised Offer Shape

```ts
{
  id:          string;          // "otodom-{ID}"
  tab:         string;          // Human-readable type: "Mieszkanie" | "Dom" | ...
  objectName:  number;          // Raw integer 0–6 from ObjectName field
  rawDetails:  object | null;   // Raw *Details block from XML; fed to resolver
  typ:         "sprzedaz" | "wynajem";
  price:       number;
  currency:    string;          // "PLN" | "EUR" | ...
  params: {
    powierzchnia:   number;     // Area in m²
    liczbapokoi:    number;     // RoomsNum from details block
    liczbalazienek: number;     // Always 0 (not in Otodom XML)
    miasto:         string;     // Reverse-geocoded from GeoMarker lat/lon
    opis:           string;     // Description (HTML)
    latitude:       number;
    longitude:      number;
    tytul:          string;     // Title
    zdjecie1...N:   string;     // Photo URLs (sorted by Position)
  };
  location: {
    country: string;
    city:    string;
  };
}
```

### 4.2 Photo Handling

- Photos are sorted ascending by `Position` (unpositioned photos get position `99`)
- Assigned as `params.zdjecie1`, `params.zdjecie2`, … `params.zdjecie{N}`
- Maximum 20 photos per offer (Otodom spec limit)
- URLs are prefixed with `photoBasePath` (the timestamped folder)

### 4.3 Location Derivation

`params.miasto` / `location.city` / `location.country` are derived by **reverse geocoding** the `GeoMarker.Latitude` / `GeoMarker.Longitude` coordinates using the `all-the-cities` dataset (`src/utils/reverseGeocode.js`).  
If coordinates are `0,0` or absent, `reverseGeocode` returns a fallback.

---

## 5. XML Validation

### 5.1 Module

`src/utils/xmlValidator.js` — `validateOtoDomXml(xmlString)`

### 5.2 Rules

Validation is **backward compatible**:
- ✅ **Extra / unknown fields** (fields not in the spec) → valid, silently ignored
- ❌ **Missing required fields** → invalid, error recorded

#### Root-level checks

| Element | Requirement |
|---|---|
| `<otoDom>` | Must be the root element |
| `<Agency>` | Required |
| `<Date>` | Required |
| `<ImportType>` | Required; must be `"full"` or `"incremental"` |

#### Per-insertion checks (Action=0 only)

- `ID`, `Price`, `PriceCurrency`, `Description`, `MarketType`
- Location: `Country`, `Province`, `District`, `City`
- `ObjectName` must be present and in range 0–6
- `Area` where required (see §3 table)
- The corresponding `*Details` block must be present
- `RoomsNum` inside `FlatDetails` / `HouseDetails`
- Room (`ObjectName=3`): `OfferType` must equal `1`

For `Action=1` (deactivate) and `Action=2` (delete): only `ID` is required.

### 5.3 Validation at Parse Time

`parseOtoDomXml` runs the validator automatically on every call and logs any issues to the console:

```
[otodom-parser] XML validation found 2 issue(s):
  ✗ Insertion ID=42 (Mieszkanie (Flat)): missing required field 'Price'
  ✗ Insertion ID=43: Room (ObjectName=3) requires OfferType=1 (rent)
```

Validation failures are **non-blocking** — valid insertions are still returned.

---

## 6. Property Details UI

### 6.1 Component Architecture

```
PropertyDetailsPanel                 ← dispatcher (property/[id].astro)
├── resolveFlatDetails()             ← via propertyDetailsResolver.js
├── FlatDetailsPanel               (ObjectName=0)
├── HouseDetailsPanel              (ObjectName=1)
├── TerrainDetailsPanel            (ObjectName=2)
├── RoomDetailsPanel               (ObjectName=3)
├── CommercialPropertyDetailsPanel (ObjectName=4)
├── HallDetailsPanel               (ObjectName=5)
└── GarageDetailsPanel             (ObjectName=6)
```

Shared primitives: `DetailRow` (single labelled row), `TagList` (chip array).

### 6.2 Resolution Pipeline

```
rawDetails (XML numbers)
        │
        ▼  resolvePropertyDetails(objectName, rawDetails)
            src/utils/propertyDetailsResolver.js
        │
        ▼  e.g. resolveFlatDetails(raw) →
{
  buildingType: "blok",        // dict lookup
  extras: ["balkon","garaż"],  // ArrayOfInteger → string[]
  furnished: true,             // boolean(0/1)
  rent: 1500,                  // parseFloat
  ...
}
        │
        ▼  Panel component receives `details` prop and renders
```

### 6.3 Panel Sections

| Panel | Sections shown |
|---|---|
| FlatDetailsPanel | Dane budynku, Cechy mieszkania, Udogodnienia/Security/Media/Wyposażenie chips, Warunki najmu (conditional) |
| HouseDetailsPanel | Dane posesji, Dane budynku, Ogrzewanie/Media/Ogrodzenie/Okolica/Dojazd/Zabezpieczenia chips, Warunki najmu (conditional) |
| TerrainDetailsPanel | Dane działki, Media/Sąsiedztwo chips |
| RoomDetailsPanel | Dane pokoju, Lokatorzy i preferencje, Liczba osób/Media/Wyposażenie chips, Warunki finansowe (conditional) |
| CommercialPropertyDetailsPanel | Dane lokalu, Dostępność, Przeznaczenie/Udogodnienia/Media/Zabezpieczenia chips |
| HallDetailsPanel | Dane obiektu, Udogodnienia, Przeznaczenie/Dojazd/Media/Zabezpieczenia chips |
| GarageDetailsPanel | Dane garażu |

`DetailRow` components automatically render `null` when a field value is `null` / `undefined` / `""`, so empty fields never produce blank rows.

---

## 7. Filtering & Display

### 7.1 CollectionManager

Client-side React island that takes `initialOffers` (pre-parsed at build time) and manages filter state without any network requests.

### 7.2 RealEstateFilter

Filter state: `type` (sprzedaz/wynajem), `objectType` (tab value), `city`, `priceRange`, `areaRange`.

`city` filter uses `city.includes(filter.split(' ')[0])` — partial, case-sensitive prefix match.

### 7.3 Tab Values

The `tab` field in each offer is the human-readable Polish name from the `ObjectName` dictionary:

| tab | ObjectName |
|---|---|
| Mieszkanie | 0 |
| Dom | 1 |
| Działka | 2 |
| Pokój | 3 |
| Lokal | 4 |
| Magazyn | 5 |
| Garaż | 6 |

---

## 8. Design System

Custom Tailwind v4 tokens (defined in `src/index.css` under `@theme`):

| Token | Value | Role |
|---|---|---|
| `primary` | `#7a590c` | Gold accent, icons, highlights |
| `surface` | `#fcf9f8` | Page background (cream) |
| `on-surface` | `#1c1b1b` | Primary text |
| `font-headline` | Work Sans | Headings |
| `font-body` | Inter | Body copy |
| `font-label` | Inter | Labels, chips, nav |
| `font-serif` | Cormorant Garamond | Editorial serif |

`.editorial-gradient` — gold gradient `#7a590c → #c2994a`.  
Design principle: **no 1px separator lines** — use background tone shifts.

---

## 9. Testing

Tests are co-located with the source they cover. Run with:

```bash
npm test           # watch mode
npx vitest run     # single run (CI)
npx vitest run src/utils/xmlValidator.test.js  # single file
```

### 9.1 Test Coverage

| File | Coverage |
|---|---|
| `src/utils/xmlValidator.test.js` | Root element checks, per-type required fields, backward compatibility, Action=1/2, mixed valid/invalid |
| `src/components/property-details/FlatDetailsPanel.test.jsx` | All field types, chip rendering, rental section conditional, null/empty graceful handling |
| `src/components/property-details/HouseDetailsPanel.test.jsx` | As above for house-specific fields |
| `src/components/property-details/TerrainDetailsPanel.test.jsx` | Plot type, dimensions, fence boolean, chips |
| `src/components/property-details/RoomDetailsPanel.test.jsx` | Occupant data, preferences, financial section |
| `src/components/property-details/CommercialPropertyDetailsPanel.test.jsx` | Use/extras chips, availability fields |
| `src/components/property-details/HallDetailsPanel.test.jsx` | Structure, amenity booleans, use/access/security chips |
| `src/components/property-details/GarageDetailsPanel.test.jsx` | Localization, structure, boolean fields |
| `src/components/property-details/PropertyDetailsPanel.test.jsx` | Correct panel dispatched per objectName, resolver integration, null handling |
| `src/components/ContactForm.test.jsx` | Form rendering, RODO checkbox gate |

---

## 10. Build & Deploy

```bash
npm run dev      # Astro dev server → http://localhost:4321
npm run build    # Static production build → dist/
npm run preview  # Preview dist/ locally
```

Static output is deployed to GitHub Pages at `https://pientkrz.github.io/real-estate-vendor/`.  
The base path `/real-estate-vendor/` is configured in `astro.config.mjs`.  
Always use `import.meta.env.BASE_URL` for internal links.

---

## 11. Known Limitations & Future Work

| Item | Note |
|---|---|
| `liczbalazienek` always 0 | Otodom XML has no bathroom count field |
| `useOffers.js` is stale | Fetches legacy `/offers.xml` format; not used by any page |
| Photo max per spec | 20 photos; parser enforces via the sort+assign loop |
| District dictionary | Not bundled; spec references `http://www.otodom.pl/api/lite/dictionaries` |
| Validation is log-only | Failures are `console.warn`; no UI feedback and no offer rejection |
| Hardcoded XML path | Path to XML file is hard-coded in `index.astro` and `[id].astro`; parameterising it would enable multi-export support |
