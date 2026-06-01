import React, { useState, useMemo, lazy, Suspense } from 'react';
import ListingFilterBar from './ListingFilterBar';
import FeaturedProperties from './FeaturedProperties';

// Leaflet is browser-only — lazy-load so SSR renders the fallback
const ListingsMap = lazy(() => import('./ListingsMap'));

const NAV_H = 88; // matches the fixed Navbar height (px)

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
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: `calc(100vh - ${NAV_H}px)`, marginTop: `${NAV_H}px` }}
    >
      <ListingFilterBar offers={initialOffers} filters={filters} setFilters={setFilters} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — scrollable property list */}
        <aside className="w-full md:w-[40%] h-full overflow-y-auto bg-surface">
          <FeaturedProperties properties={filteredOffers} />
        </aside>

        {/* Right panel — map (browser only) */}
        <section className="hidden md:block md:w-[60%] h-full relative bg-surface-container-high">
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
      </div>
    </div>
  );
};

export default CollectionManager;
