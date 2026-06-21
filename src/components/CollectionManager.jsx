import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import ListingFilterBar from './ListingFilterBar';
import FeaturedProperties from './FeaturedProperties';
import { loadRates, convertPrice, FALLBACK_RATES } from '../utils/exchangeRates';

// Leaflet is browser-only — lazy-load so SSR renders the fallback
const ListingsMap = lazy(() => import('./ListingsMap'));

const NAV_H = 96;

const CollectionManager = ({ initialOffers = [] }) => {
  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    countries: [],
    tab: '',
    minRooms: '',
    sortBy: 'price-desc',
  });
  const [displayCurrency, setDisplayCurrency] = useState('EUR');
  const [rates, setRates] = useState(FALLBACK_RATES);

  useEffect(() => {
    loadRates().then(data => setRates(data.rates));
  }, []);

  const handleCurrencyChange = (currency) => {
    setDisplayCurrency(currency);
    // Reset price bounds so histogram re-initialises in the new currency
    setFilters(f => ({ ...f, priceMin: null, priceMax: null }));
  };

  const filteredOffers = useMemo(() => {
    let result = initialOffers.filter(offer => {
      if (filters.countries.length > 0 && !filters.countries.includes(offer.location?.country)) return false;
      if (filters.tab && offer.tab !== filters.tab) return false;
      if (filters.minRooms && (offer.params?.liczbapokoi || 0) < parseInt(filters.minRooms)) return false;
      const offerPrice = convertPrice(offer.price, offer.currency, displayCurrency, rates);
      if (filters.priceMin !== null && offerPrice < filters.priceMin) return false;
      if (filters.priceMax !== null && offerPrice > filters.priceMax) return false;
      return true;
    });

    if (filters.sortBy === 'price-asc') {
      result = [...result].sort((a, b) =>
        convertPrice(a.price, a.currency, displayCurrency, rates) -
        convertPrice(b.price, b.currency, displayCurrency, rates)
      );
    } else if (filters.sortBy === 'price-desc') {
      result = [...result].sort((a, b) =>
        convertPrice(b.price, b.currency, displayCurrency, rates) -
        convertPrice(a.price, a.currency, displayCurrency, rates)
      );
    } else if (filters.sortBy === 'area-desc') {
      result = [...result].sort((a, b) => (b.params?.powierzchnia || 0) - (a.params?.powierzchnia || 0));
    }

    return result;
  }, [initialOffers, filters, displayCurrency, rates]);

  return (
    <div className="pt-[96px] overflow-x-hidden">
      {/* Map — full width */}
      <section className="h-[420px] w-full relative overflow-hidden bg-surface-container-low">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-outline font-label text-xs uppercase tracking-widest">Ładowanie mapy…</span>
            </div>
          }
        >
          <ListingsMap properties={filteredOffers} />
        </Suspense>
      </section>

      {/* Filter bar — sticky below navbar */}
      <div className="sticky z-40" style={{ top: `${NAV_H}px` }}>
        <ListingFilterBar
          offers={initialOffers}
          filters={filters}
          setFilters={setFilters}
          displayCurrency={displayCurrency}
          setDisplayCurrency={handleCurrencyChange}
          rates={rates}
        />
      </div>

      {/* Listings grid */}
      <div className="px-4 lg:px-8 py-6 w-full">
        <FeaturedProperties
          properties={filteredOffers}
          displayCurrency={displayCurrency}
          rates={rates}
        />
      </div>
    </div>
  );
};

export default CollectionManager;
