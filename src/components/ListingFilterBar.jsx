import React, { useMemo, useEffect } from 'react';

const ListingFilterBar = ({ offers, filters, setFilters }) => {
  const { minPrice, maxPrice, buckets } = useMemo(() => {
    const prices = offers.map(o => o.price).filter(Boolean);
    if (prices.length === 0) return { minPrice: 0, maxPrice: 0, buckets: Array(10).fill(0) };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const bucketSize = (max - min) / 10 || 1;
    const b = Array(10).fill(0);
    for (const p of prices) {
      const i = Math.min(9, Math.floor((p - min) / bucketSize));
      b[i]++;
    }
    return { minPrice: min, maxPrice: max, buckets: b };
  }, [offers]);

  // Initialize price bounds once data is available
  useEffect(() => {
    if (minPrice && filters.priceMin === null) {
      setFilters(f => ({ ...f, priceMin: minPrice, priceMax: maxPrice }));
    }
  }, [minPrice, maxPrice]);

  const pMin = filters.priceMin ?? minPrice;
  const pMax = filters.priceMax ?? maxPrice;
  const priceRange = maxPrice - minPrice || 1;
  const step = Math.max(1, Math.round(priceRange / 100));

  const leftPct = ((pMin - minPrice) / priceRange) * 100;
  const rightPct = ((pMax - minPrice) / priceRange) * 100;
  const maxBucket = Math.max(...buckets, 1);

  const fmt = (n) => {
    if (!n && n !== 0) return '0';
    if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return String(n);
  };

  const countries = useMemo(
    () => ['', ...new Set(offers.map(o => o.location?.country).filter(Boolean)).values()].sort(),
    [offers],
  );

  const tabs = useMemo(
    () => ['', ...new Set(offers.map(o => o.tab).filter(Boolean)).values()],
    [offers],
  );

  const reset = () =>
    setFilters({ priceMin: minPrice, priceMax: maxPrice, country: '', tab: '', minRooms: '', sortBy: 'price-desc' });

  return (
    <section className="bg-surface-container-low px-8 py-4 border-b border-outline-variant/10 flex-shrink-0">
      <div className="max-w-screen-2xl mx-auto flex flex-wrap items-end gap-8">

        {/* Price range with histogram */}
        <div className="flex-1 min-w-[260px]">
          <div className="flex justify-between items-center mb-1">
            <span className="font-label text-[10px] uppercase tracking-widest text-primary">Zakres cen</span>
            <span className="font-label text-[10px] font-bold text-on-surface-variant">
              {fmt(pMin)} – {pMax >= maxPrice ? `${fmt(maxPrice)}+` : fmt(pMax)}
            </span>
          </div>

          {/* Histogram */}
          <div className="relative h-10 flex items-end gap-0.5 mb-2">
            {buckets.map((count, i) => {
              const bucketStart = minPrice + i * (priceRange / 10);
              const bucketEnd = bucketStart + priceRange / 10;
              const active = bucketEnd >= pMin && bucketStart <= pMax;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${Math.max(8, (count / maxBucket) * 100)}%`,
                    background: active ? 'rgba(122,89,12,0.6)' : 'rgba(122,89,12,0.15)',
                  }}
                />
              );
            })}
          </div>

          {/* Dual range slider */}
          <div className="relative h-5 flex items-center">
            <div className="absolute w-full h-1 bg-outline-variant/30 rounded-full" />
            <div
              className="absolute h-1 bg-primary rounded-full"
              style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
            />
            <input
              type="range" min={minPrice} max={maxPrice} step={step} value={pMin}
              onChange={e => { const v = Number(e.target.value); if (v <= pMax) setFilters(f => ({ ...f, priceMin: v })); }}
              className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer pointer-events-none
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:shadow-md"
            />
            <input
              type="range" min={minPrice} max={maxPrice} step={step} value={pMax}
              onChange={e => { const v = Number(e.target.value); if (v >= pMin) setFilters(f => ({ ...f, priceMax: v })); }}
              className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer pointer-events-none
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>
        </div>

        <div className="h-10 w-px bg-outline-variant/30 hidden md:block mb-1" />

        {/* Location */}
        <div>
          <span className="font-label text-[10px] uppercase tracking-widest text-primary block mb-1">Lokalizacja</span>
          <select
            className="bg-transparent border-none text-on-surface font-medium focus:ring-0 p-0 text-sm cursor-pointer hover:text-primary transition-colors"
            value={filters.country ?? ''}
            onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}
          >
            {countries.map(c => <option key={c} value={c}>{c || 'Wszystkie kraje'}</option>)}
          </select>
        </div>

        {/* Property type */}
        <div>
          <span className="font-label text-[10px] uppercase tracking-widest text-primary block mb-1">Typ nieruchomości</span>
          <select
            className="bg-transparent border-none text-on-surface font-medium focus:ring-0 p-0 text-sm cursor-pointer hover:text-primary transition-colors"
            value={filters.tab ?? ''}
            onChange={e => setFilters(f => ({ ...f, tab: e.target.value }))}
          >
            {tabs.map(t => <option key={t} value={t}>{t || 'Wszystkie typy'}</option>)}
          </select>
        </div>

        {/* Rooms */}
        <div>
          <span className="font-label text-[10px] uppercase tracking-widest text-primary block mb-1">Pokoje</span>
          <select
            className="bg-transparent border-none text-on-surface font-medium focus:ring-0 p-0 text-sm cursor-pointer hover:text-primary transition-colors"
            value={filters.minRooms ?? ''}
            onChange={e => setFilters(f => ({ ...f, minRooms: e.target.value }))}
          >
            <option value="">Dowolna</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>

        {/* Sort */}
        <div className="border-l border-outline-variant/30 pl-8 mb-1">
          <span className="font-label text-[10px] uppercase tracking-widest text-primary block mb-1">Sortuj według</span>
          <select
            className="bg-transparent border-none text-on-surface font-medium focus:ring-0 p-0 text-sm cursor-pointer hover:text-primary transition-colors"
            value={filters.sortBy ?? 'price-desc'}
            onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
          >
            <option value="price-desc">Cena: malejąco</option>
            <option value="price-asc">Cena: rosnąco</option>
            <option value="area-desc">Powierzchnia: malejąco</option>
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={reset}
          className="ml-auto mb-1 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all font-label text-[10px] uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-sm">tune</span> Reset filtrów
        </button>
      </div>
    </section>
  );
};

export default ListingFilterBar;
