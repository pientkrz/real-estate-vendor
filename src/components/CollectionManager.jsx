import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import ListingFilterBar from './ListingFilterBar';
import FeaturedProperties from './FeaturedProperties';
import { convertPrice, FALLBACK_RATES } from '../utils/exchangeRates';

// Leaflet accesses `window` at module init — skip the import entirely during SSR
const ListingsMap = lazy(() =>
  typeof window === 'undefined'
    ? Promise.resolve({ default: () => null })
    : import('./ListingsMap')
);

const CollectionManager = ({ initialOffers = [], initialRates, initialRatesTimestamp, initialRatesSource }) => {
  const [columns, setColumns] = useState(3);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    countries: [],
    tabs: [],
    minRooms: '',
    sortBy: 'price-desc',
  });
  const [displayCurrency, setDisplayCurrency] = useState('EUR');
  const [rates] = useState(initialRates ?? FALLBACK_RATES);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      const nextColumns = width < 768 ? 1 : width < 1024 ? 2 : 3;
      setColumns(nextColumns);
      setCurrentPage(1);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const setFiltersAndResetPage = (nextFilters) => {
    setCurrentPage(1);
    setFilters(nextFilters);
  };

  const handleCurrencyChange = (currency) => {
    setDisplayCurrency(currency);
    setFiltersAndResetPage(f => ({ ...f, priceMin: null, priceMax: null }));
  };

  const filteredOffers = useMemo(() => {
    let result = initialOffers.filter(offer => {
      if (filters.countries.length > 0 && !filters.countries.includes(offer.location?.country)) return false;
      if (filters.tabs.length > 0 && !filters.tabs.includes(offer.tab)) return false;
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

  const pageSize = rowsPerPage * columns;
  const pageCount = Math.max(1, Math.ceil(filteredOffers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const paginatedOffers = filteredOffers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  return (
    <div className="pt-[var(--navbar-height)] overflow-x-hidden">
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
      <div className="sticky top-[var(--navbar-height)] z-[1100]">
        <ListingFilterBar
          offers={initialOffers}
          filters={filters}
          setFilters={setFiltersAndResetPage}
          displayCurrency={displayCurrency}
          setDisplayCurrency={handleCurrencyChange}
          rates={rates}
          ratesTimestamp={initialRatesTimestamp}
          ratesSource={initialRatesSource}
        />
      </div>

      {/* Listings grid */}
      <div className="px-4 lg:px-8 py-6 w-full">
        <FeaturedProperties
          properties={paginatedOffers}
          totalCount={filteredOffers.length}
          pagination={{
            currentPage: safeCurrentPage,
            pageCount,
            rowsPerPage,
            pageSize,
            onPageChange: setCurrentPage,
            onRowsPerPageChange: (rows) => {
              setRowsPerPage(rows);
              setCurrentPage(1);
            },
          }}
          displayCurrency={displayCurrency}
          rates={rates}
        />
      </div>
    </div>
  );
};

export default CollectionManager;
