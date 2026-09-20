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

const categoryOffers = [
  ['mieszkania', 'Mieszkanie testowe'],
  ['domy', 'Dom testowy'],
  ['dzialki', 'Działka testowa'],
].map(([tab, city], index) => ({
  id: `category-${tab}`,
  tab,
  typ: 'sprzedaz',
  price: 100000 + index,
  currency: 'EUR',
  location: { city, country: 'Polska' },
  params: { miasto: city, powierzchnia: 50, liczbapokoi: 2 },
}));

const renderCategoryApp = () => render(<CollectionManager initialOffers={categoryOffers} />);

/** Wait for the listings heading so Suspense / effects have settled. */
const waitForListings = () =>
  screen.findByRole('heading', { name: 'Wyselekcjonowane oferty' });

/** Count rendered property-card headings (h3). */
const cardCount = () => screen.getAllByRole('heading', { level: 3 }).length;

const openCountryDropdown = () =>
  fireEvent.click(screen.getByRole('button', { name: /wszystkie kraje|kraje|spain|greece|cyprus/i }));

const checkCountry = (name) =>
  fireEvent.click(screen.getByRole('checkbox', { name }));

const applyFilter = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Zastosuj' }));

const openCategoryDropdown = () =>
  fireEvent.click(screen.getByRole('button', { name: /wszystkie typy|mieszkania|domy|działki|typy|typów/i }));

const checkCategory = (name) =>
  fireEvent.click(screen.getByRole('checkbox', { name }));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('parseOtoDomXml — fixture integrity', () => {
  it('returns 6 active offers and excludes the inactive one (Action=1)', () => {
    expect(offers).toHaveLength(6);
    const ids = offers.map((o) => o.id);
    expect(ids).not.toContain('otodom-inactive1');
  });

  it('retains an inactive record with lifecycle metadata when aggregation requests it', () => {
    const records = parseOtoDomXml(MOCK_XML, '/test/photos/', { includeInactive: true });
    const inactive = records.find((offer) => offer.id === 'otodom-inactive1');

    expect(records).toHaveLength(7);
    expect(inactive).toMatchObject({
      provider: 'otodom-pl',
      providerOfferId: 'inactive1',
      sourceStatus: 'deactivated',
    });
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
  it('uses the shared responsive navbar height for page and sticky filter offsets', () => {
    const { container } = renderApp();
    const page = container.firstElementChild;
    const stickyFilter = container.querySelector('.sticky');

    expect(page).toHaveClass('pt-[var(--navbar-height)]');
    expect(stickyFilter).toHaveClass('top-[var(--navbar-height)]');
    expect(stickyFilter).not.toHaveAttribute('style');
  });

  it('shows all 6 offers on initial load with no country selected', async () => {
    renderApp();
    await waitForListings();

    expect(cardCount()).toBe(6);
    expect(screen.getByRole('button', { name: /wszystkie kraje/i })).toBeInTheDocument();

    for (const city of ['Madrid', 'Barcelona', 'Athens', 'Thessaloniki', 'Limassol', 'Paphos']) {
      expect(screen.getByRole('heading', { name: city })).toBeInTheDocument();
    }

    expect(screen.queryByText(/sypialni/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/łazienek/i)).not.toBeInTheDocument();
  });

  it('filtering by Spain shows only 2 Spanish offers', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');
    applyFilter();

    await waitFor(() => expect(cardCount()).toBe(2));

    expect(screen.getByRole('heading', { name: 'Madrid' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Barcelona' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Athens' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Thessaloniki' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Limassol' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Paphos' })).not.toBeInTheDocument();
  });

  it('does not change results until a country selection is applied', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');

    expect(cardCount()).toBe(6);

    applyFilter();
    await waitFor(() => expect(cardCount()).toBe(2));
  });

  it('button label shows the single selected country name', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Greece');
    applyFilter();

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
    applyFilter();

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
    applyFilter();

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
    applyFilter();
    await waitFor(() => expect(cardCount()).toBe(4));

    // Uncheck Spain
    openCountryDropdown();
    checkCountry('Spain');
    applyFilter();
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
    applyFilter();

    await waitFor(() => expect(cardCount()).toBe(6));
  });

  it('reset filters restores all offers and resets the button label', async () => {
    renderApp();
    await waitForListings();

    openCountryDropdown();
    checkCountry('Spain');
    applyFilter();
    await waitFor(() => expect(cardCount()).toBe(2));

    fireEvent.click(screen.getByRole('button', { name: /reset filtrów/i }));

    await waitFor(() => expect(cardCount()).toBe(6));
    expect(screen.getByRole('button', { name: /wszystkie kraje/i })).toBeInTheDocument();
  });
});

describe('CollectionManager — multi-category filter', () => {
  it('always offers all seven documented Otodom categories', async () => {
    renderCategoryApp();
    await waitForListings();

    openCategoryDropdown();

    for (const category of [
      'Mieszkania',
      'Domy',
      'Działki',
      'Pokoje',
      'Lokale użytkowe',
      'Hale i magazyny',
      'Garaże',
    ]) {
      expect(screen.getByRole('checkbox', { name: category })).toBeInTheDocument();
    }
  });

  it('shows the union of multiple categories and supports deselection', async () => {
    renderCategoryApp();
    await waitForListings();

    openCategoryDropdown();
    checkCategory('Mieszkania');
    checkCategory('Domy');
    applyFilter();

    await waitFor(() => expect(cardCount()).toBe(2));
    expect(screen.getByRole('button', { name: /2 typy/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Działka testowa' })).not.toBeInTheDocument();

    openCategoryDropdown();
    checkCategory('Domy');
    applyFilter();

    await waitFor(() => expect(cardCount()).toBe(1));
    expect(screen.getByRole('button', { name: /^mieszkania/i })).toBeInTheDocument();
  });

  it('reset clears all category selections', async () => {
    renderCategoryApp();
    await waitForListings();

    openCategoryDropdown();
    checkCategory('Mieszkania');
    applyFilter();
    await waitFor(() => expect(cardCount()).toBe(1));

    fireEvent.click(screen.getByRole('button', { name: /reset filtrów/i }));

    await waitFor(() => expect(cardCount()).toBe(3));
    expect(screen.getByRole('button', { name: /wszystkie typy/i })).toBeInTheDocument();
  });
});
