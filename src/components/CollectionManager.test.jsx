import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { parseOtoDomXml } from '../utils/xmlParser';
import CollectionManager from './CollectionManager';
import MOCK_XML from '../../test/fixtures/mock-offers.xml?raw';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// ListingsMap depends on Leaflet which requires a real browser DOM — stub it out.
vi.mock('./ListingsMap', () => ({ default: () => <div data-testid="map" /> }));

// reverseGeocode iterates 135 000 cities on every call — replace with a fast,
// deterministic stub keyed on longitude (mirrors the fixture's coordinate scheme,
// documented in test/fixtures/mock-offers.xml).
vi.mock('../utils/reverseGeocode', () => ({
  reverseGeocode: (_lat, lon) => {
    if (lon < -3)   return { city: 'Madrid',       country: 'Spain',   region: 'Madrid',            countryCode: 'ES' };
    if (lon < 0)    return { city: 'Barcelona',    country: 'Spain',   region: 'Catalonia',         countryCode: 'ES' };
    if (lon < 23)   return { city: 'Thessaloniki', country: 'Greece',  region: 'Central Macedonia', countryCode: 'GR' };
    if (lon < 27)   return { city: 'Athens',       country: 'Greece',  region: 'Attica',            countryCode: 'GR' };
    if (lon < 32.5) return { city: 'Paphos',       country: 'Cyprus',  region: 'Paphos',            countryCode: 'CY' };
    return             { city: 'Limassol',     country: 'Cyprus',  region: 'Limassol',          countryCode: 'CY' };
  },
}));

// Suppress XML validation warnings — the minimal fixture omits fields like
// Province / District / City that the spec requires but parsing ignores.
vi.mock('../utils/xmlValidator', () => ({
  validateOtoDomXml: () => ({ valid: true, errors: [] }),
}));

// ── Fixture ───────────────────────────────────────────────────────────────────

// Parse once; each test gets a fresh render but reuses the same offer list.
const offers = parseOtoDomXml(MOCK_XML, '/test/photos/');

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderApp = () => render(<CollectionManager initialOffers={offers} />);

/** Wait for the listings heading so Suspense / effects have settled. */
const waitForListings = () =>
  screen.findByRole('heading', { name: 'Wyselekcjonowane oferty' });

/** Count rendered property-card headings (h3). */
const cardCount = () => screen.getAllByRole('heading', { level: 3 }).length;

const openCountryDropdown = () =>
  fireEvent.click(screen.getByRole('button', { name: /wszystkie kraje|kraje|spain|greece|cyprus/i }));

const checkCountry = (name) =>
  fireEvent.click(screen.getByRole('checkbox', { name }));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('parseOtoDomXml — fixture integrity', () => {
  it('returns 6 active offers and excludes the inactive one (Action=1)', () => {
    expect(offers).toHaveLength(6);
    const ids = offers.map((o) => o.id);
    expect(ids).not.toContain('otodom-inactive1');
  });

  it('assigns the correct country to each offer via the geocode stub', () => {
    const byCountry = (c) => offers.filter((o) => o.location.country === c);
    expect(byCountry('Spain')).toHaveLength(2);
    expect(byCountry('Greece')).toHaveLength(2);
    expect(byCountry('Cyprus')).toHaveLength(2);
  });

  it('maps offer prices correctly', () => {
    const prices = offers.map((o) => o.price).sort((a, b) => a - b);
    expect(prices).toEqual([180000, 250000, 270000, 320000, 380000, 450000]);
  });
});

describe('CollectionManager — country filter', () => {
  it('shows all 6 offers on initial load with no country selected', async () => {
    renderApp();
    await waitForListings();

    expect(cardCount()).toBe(6);
    expect(screen.getByRole('button', { name: /wszystkie kraje/i })).toBeInTheDocument();

    for (const city of ['Madrid', 'Barcelona', 'Athens', 'Thessaloniki', 'Limassol', 'Paphos']) {
      expect(screen.getByRole('heading', { name: city })).toBeInTheDocument();
    }
  });

  it('filtering by Spain shows only 2 Spanish offers', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');

    await waitFor(() => expect(cardCount()).toBe(2));

    expect(screen.getByRole('heading', { name: 'Madrid' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Barcelona' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Athens' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Thessaloniki' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Limassol' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Paphos' })).not.toBeInTheDocument();
  });

  it('button label shows the single selected country name', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Greece');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^greece/i })).toBeInTheDocument(),
    );
  });

  it('selecting two countries shows their combined offers', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');
    checkCountry('Greece');

    await waitFor(() => expect(cardCount()).toBe(4));

    expect(screen.getByRole('heading', { name: 'Madrid' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Barcelona' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Athens' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thessaloniki' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Limassol' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Paphos' })).not.toBeInTheDocument();
  });

  it('button label shows "{n} kraje" when more than one country is selected', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');
    checkCountry('Cyprus');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /2 kraje/i })).toBeInTheDocument(),
    );
  });

  it('deselecting a country removes its offers', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');
    checkCountry('Greece');
    await waitFor(() => expect(cardCount()).toBe(4));

    // Uncheck Spain
    checkCountry('Spain');
    await waitFor(() => expect(cardCount()).toBe(2));

    expect(screen.getByRole('heading', { name: 'Athens' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thessaloniki' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Madrid' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Barcelona' })).not.toBeInTheDocument();
  });

  it('all three countries selected shows all 6 offers', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');
    checkCountry('Greece');
    checkCountry('Cyprus');

    await waitFor(() => expect(cardCount()).toBe(6));
  });

  it('reset filters restores all offers and resets the button label', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');
    await waitFor(() => expect(cardCount()).toBe(2));

    fireEvent.click(screen.getByRole('button', { name: /reset filtrów/i }));

    await waitFor(() => expect(cardCount()).toBe(6));
    expect(screen.getByRole('button', { name: /wszystkie kraje/i })).toBeInTheDocument();
  });
});
