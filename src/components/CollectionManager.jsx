import React, { useState, useMemo, lazy, Suspense } from 'react';
import ListingFilterBar from './ListingFilterBar';
import FeaturedProperties from './FeaturedProperties';

// Leaflet is browser-only — lazy-load so SSR renders the fallback
const ListingsMap = lazy(() => import('./ListingsMap'));

const NAV_H = 96;

const CollectionManager = ({ initialOffers = [] }) => {
  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    country: '',
    tab: '',
    minRooms: '',
    sortBy: 'price-desc',
  });

  const filteredOffers = useMemo(() => {
    let result = initialOffers.filter(offer => {
      if (filters.country && offer.location?.country !== filters.country) return false;
      if (filters.tab && offer.tab !== filters.tab) return false;
      if (filters.minRooms && (offer.params?.liczbapokoi || 0) < parseInt(filters.minRooms)) return false;
      if (filters.priceMin !== null && offer.price < filters.priceMin) return false;
      if (filters.priceMax !== null && offer.price > filters.priceMax) return false;
      return true;
    });

    if (filters.sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    else if (filters.sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (filters.sortBy === 'area-desc') result = [...result].sort((a, b) => (b.params?.powierzchnia || 0) - (a.params?.powierzchnia || 0));

    return result;
  }, [initialOffers, filters]);

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
        <ListingFilterBar offers={initialOffers} filters={filters} setFilters={setFilters} />
      </div>

      {/* Listings grid */}
      <div className="px-4 lg:px-8 py-6 w-full">
        <FeaturedProperties properties={filteredOffers} />
      </div>
    </div>
  );
};

export default CollectionManager;
