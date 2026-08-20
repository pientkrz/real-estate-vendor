# Offer providers

The SSR app loads every configured provider feed on each request. Provider
parsers are adapters: each produces a normalised provider record while keeping
its provider ID, lifecycle status, and parsed source data. The server then
builds one **Property Aggregate** per real estate property before the data is
used by the listing filter or detail page.

## Canonical property aggregate

The property identity is deterministic for the current feeds:

| Provider | Provider key | Canonical key |
| --- | --- | --- |
| Otodom | `Insertion.ID` | Remove only a leading `ms` or `ds` (`ms113-6` → `113-6`) |
| Nieruchomosci-online.pl | `details.sign` | Use unchanged |
| Oferty.net | `oferta.id` | Use unchanged |

`src/utils/propertyAggregate.js` groups these records and returns an aggregate
with the following important parts:

```js
{
  id: '113-6',
  externalIds: { 'otodom-pl': 'ms113-6', 'nieruchomosci-online-pl': '113-6' },
  lifecycle: { state: 'active', sourceStatuses: { /* … */ }, isVisible: true },
  property: {
    price: { amount: 235000, currency: 'EUR' },
    areas: { usableM2: 44, totalM2: 52, plotM2: undefined },
    location: { city: '…', region: '…', country: '…' },
    attributes: { /* merged Polish fields */ },
    media: [/* source-aware image URLs */],
  },
  provenance: { 'areas.usableM2': { provider: 'otodom-pl', sourceField: 'Area' } },
  conflicts: [],
  sourceRecords: { /* parsed records, retained server-side */ },
}
```

The filter React island receives a small compatibility view derived from the
aggregate, rather than the source XML. This keeps the client payload small and
allows the current components to continue reading `price`, `params`, and
`location`. Detail routes are generated from the same aggregate, so a property
appears once rather than once per provider.

If a parsed provider record cannot be aggregated, it is logged and omitted from
that property only. Valid records from the other providers still form and serve
the aggregate; `skippedSourceRecords` retains the provider reference and error
reason for server-side diagnosis.

### Field resolution

When equivalent fields are present, the current deterministic preference order
is Otodom → Nieruchomosci-online.pl → Oferty.net; missing fields are enriched
from the next provider. The selected provider is recorded per field in
`provenance`.

Area values are not treated as equivalent: Otodom `Area` and NOE `areaUse` are
stored as `usableM2`; NOE `area` and Oferty.net `powierzchnia` are stored as
`totalM2`. The legacy display field `params.powierzchnia` prefers usable area,
while `params.powierzchnia_uzytkowa` and `params.powierzchnia_calkowita` retain
both values explicitly.

### Lifecycle conflicts

The aggregator preserves Otodom deactivation/deletion records. If one provider
marks a property deleted while another still publishes it, the aggregate state
is `conflict` and `isVisible` is `false`. The public filter and detail routes
therefore do not advertise potentially withdrawn properties.

This is intentionally conservative. Before changing it, agree on an explicit
reconciliation policy—such as authoritative provider precedence or trusted FTP
upload timestamps—and implement that policy in the aggregate lifecycle resolver.

## Provider parser contract

All parsers return a normalised provider record before aggregation:

```js
{
  id: 'provider-source-id',
  provider: 'otodom-pl | nieruchomosci-online-pl | oferty-net',
  providerOfferId: 'source-id',
  sourceStatus: 'active | deactivated | deleted',
  sourceData: { /* parsed provider-specific values; server-side only */ },
  tab: 'mieszkania | domy | dzialki | lokale | pokoje',
  typ: 'sprzedaz | wynajem',
  price: 235000,
  currency: 'EUR',
  videoUrl: null,
  params: { powierzchnia: 52, liczbapokoi: 2, miasto: '…', zdjecie1: '…' },
  location: { country: '…', region: '…', city: '…' },
}
```

## XML structure documentation

- **Oferty.net / Domy.pl XML 0.4.x:** [official XML export specification](https://domy.pl/eksport).
  It documents the `<plik>` → `<header>` → `<lista_ofert>` → `<dzial>` →
  `<oferta>` hierarchy, supported parameter types, photos, location, and the
  complete field lists per property category.
- **Nieruchomosci-online.pl NOE 2.0:** [official integration page](https://www.nieruchomosci-online.pl/integracja-z-nieruchomosci-online.html),
  including the provider's NOE v2.0 download. The detailed reference is also
  available as [NOE 2.0 XML specification (PDF)](https://demo5.imo.net.pl/assets/documents/properties/18554/2fe55f37-714b-40aa-b4b6-6638ede444c7.pdf).
  It documents `<xml>` → `<export>`, `<agents>`, and `<ads>`; each `<ad>`
  contains `<details>` and optional `<photos>`, `<plans>`, `<map>`, and `<pois>`.

The NOE document references supplementary `noeDictionary_v_2_0.xml` and full /
incremental sample exports. Obtain those current attachments through the
[Nieruchomosci-online.pl support contact](https://www.nieruchomosci-online.pl/integracja-z-nieruchomosci-online.html)
when adding mappings not covered by `src/utils/offerMappings.js`.

## VPS configuration

Set these in the deployment environment. The FTP process writes the XML and
referenced photo files into the same provider directory.

```dotenv
OTODOM_XML_PATH=/dostawa-ofert/otodom-pl/properties_otodom.xml
NIERUCHOMOSCI_ONLINE_XML_PATH=/dostawa-ofert/nieruchomosci-online-pl/properties_noe2.xml
OFERTY_NET_XML_PATH=/dostawa-ofert/oferty-net/oferty.xml
```

Photo URLs are independent from disk locations: configure the matching
`*_PHOTO_BASE_URL` variables to the public HTTP path served for each directory.
If omitted, the legacy `PHOTO_BASE_URL` is used for all providers.

## Provider mappings

`Nieruchomosci-online.pl` uses NOE 2.0. Its category IDs are mapped to Polish
tabs: `1` mieszkania, `2` domy, `3` działki, `4` lokale, `5` budynki, and `6`
pokoje. Transaction IDs map to `1` sprzedaż and `2` wynajem; currencies map to
`1` PLN, `2` EUR, and `3` USD. Its numeric/English-like field names are copied
to Polish keys such as `area` → `powierzchnia`, `rooms` → `liczbapokoi`, and
`description` → `opis`.

`Oferty.net` already sends Polish category and parameter names. Its global
`<zdjecia>` list is grouped by offer ID and sorted by `<kolejnosc>` before being
placed in `params.zdjecie1`, `params.zdjecie2`, and so on.

Provider IDs are deliberately prefixed in generated route IDs so offers from
different feeds with the same source identifier do not overwrite one another.
