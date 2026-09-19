import React, { useMemo, useEffect } from 'react';
import { convertPrice } from '../utils/exchangeRates';
import FilterSelect from './FilterSelect';
import {
  PROPERTY_CATEGORIES,
  PROPERTY_CATEGORY_LABELS,
} from '../utils/offerMappings.js';

const DISPLAY_CURRENCIES = ['EUR', 'PLN'];
const ROOM_OPTIONS = [
  { value: '', label: 'Dowolna' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
];
const SORT_OPTIONS = [
  { value: 'price-desc', label: 'Cena: malejąco' },
  { value: 'price-asc', label: 'Cena: rosnąco' },
  { value: 'area-desc', label: 'Powierzchnia: malejąco' },
];

const ListingFilterBar = ({
  offers,
  filters,
  setFilters,
  displayCurrency = 'EUR',
  setDisplayCurrency,
  rates = {},
  ratesTimestamp,
  ratesSource,
}) => {
  const RATE_SOURCE_LABELS = { frankfurter: 'api.frankfurter.app', ecb: 'ecb.europa.eu' };
  const tooltipText = ratesTimestamp
    ? `Kursy z ${new Date(ratesTimestamp).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}`
      + (RATE_SOURCE_LABELS[ratesSource] ? ` (źródło: ${RATE_SOURCE_LABELS[ratesSource]})` : '')
    : 'Kursy domyślne (brak połączenia z API)';
  const { minPrice, maxPrice, buckets } = useMemo(() => {
    const prices = offers
      .map(o => convertPrice(o.price, o.currency, displayCurrency, rates))
      .filter(Boolean);
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
  }, [offers, displayCurrency, rates]);

  // Initialize price bounds once data is available (or when currency changes)
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
    return String(Math.round(n));
  };

  const countries = useMemo(
    () => [...new Set(offers.map(o => o.location?.country).filter(Boolean)).values()].sort(),
    [offers],
  );

  const countryLabel =
    filters.countries.length === 0 ? 'Wszystkie kraje' :
    filters.countries.length === 1 ? filters.countries[0] :
    `${filters.countries.length} kraje`;

  const tabs = useMemo(
    () => {
      const additional = [...new Set(offers.map((offer) => offer.tab).filter(Boolean))]
        .filter((tab) => !PROPERTY_CATEGORIES.includes(tab));
      return [...PROPERTY_CATEGORIES, ...additional];
    },
    [offers],
  );

  const selectedTabs = filters.tabs ?? (filters.tab ? [filters.tab] : []);

  const categoryLabel =
    selectedTabs.length === 0 ? 'Wszystkie typy' :
    selectedTabs.length === 1 ? (PROPERTY_CATEGORY_LABELS[selectedTabs[0]] ?? selectedTabs[0]) :
    `${selectedTabs.length} ${selectedTabs.length >= 2 && selectedTabs.length <= 4 ? 'typy' : 'typów'}`;

  const reset = () =>
    setFilters({ priceMin: minPrice, priceMax: maxPrice, countries: [], tabs: [], minRooms: '', sortBy: 'price-desc' });

  return (
    <section className="bg-surface px-4 lg:px-8 py-4 border-b border-outline-variant/10 flex-shrink-0">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 items-end gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1fr)_10rem_10rem_5rem_12rem_9rem]">

        {/* Price range with histogram */}
        <div className="min-w-0">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="font-label text-[10px] uppercase tracking-widest text-primary">Zakres cen</span>
              {/* Currency toggle */}
              <div className="flex items-center border border-outline-variant/30 rounded-sm overflow-hidden">
                {DISPLAY_CURRENCIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setDisplayCurrency?.(c)}
                    className={`px-1.5 py-0.5 font-label text-[9px] uppercase tracking-wider transition-colors ${
                      displayCurrency === c
                        ? 'bg-primary text-surface'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Rates freshness tooltip — always visible */}
              <div className="relative group">
                <span className="material-symbols-outlined text-[13px] text-outline/50 cursor-default select-none leading-none">
                  info
                </span>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                                bg-obsidian text-surface font-label text-[9px] tracking-wide whitespace-nowrap
                                px-2 py-1 rounded-sm
                                opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                  {tooltipText}
                </div>
              </div>
            </div>
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

        <FilterSelect
          label="Lokalizacja"
          value={filters.countries}
          options={countries.map((country) => ({ value: country, label: country }))}
          multiple
          summary={countryLabel}
          onApply={(countries) => setFilters((current) => ({ ...current, countries }))}
        />

        {/* Property type — all documented Otodom categories stay available,
            even when the current delivery has no matching record. */}
        <FilterSelect
          label="Typ nieruchomości"
          value={selectedTabs}
          options={tabs.map((tab) => ({ value: tab, label: PROPERTY_CATEGORY_LABELS[tab] ?? tab }))}
          multiple
          summary={categoryLabel}
          onApply={(tabs) => setFilters((current) => {
            const { tab: legacyTab, ...withoutLegacyTab } = current;
            return { ...withoutLegacyTab, tabs };
          })}
        />

        <FilterSelect
          label="Pokoje"
          value={filters.minRooms ?? ''}
          options={ROOM_OPTIONS}
          summary={ROOM_OPTIONS.find((option) => option.value === (filters.minRooms ?? ''))?.label ?? 'Dowolna'}
          onApply={(minRooms) => setFilters((current) => ({ ...current, minRooms }))}
        />

        <FilterSelect
          label="Sortuj według"
          value={filters.sortBy ?? 'price-desc'}
          options={SORT_OPTIONS}
          summary={SORT_OPTIONS.find((option) => option.value === (filters.sortBy ?? 'price-desc'))?.label ?? 'Cena: malejąco'}
          onApply={(sortBy) => setFilters((current) => ({ ...current, sortBy }))}
        />

        {/* Reset */}
        <button
          onClick={reset}
          className="justify-self-end mb-1 flex items-center gap-2 whitespace-nowrap text-on-surface-variant hover:text-primary transition-all font-label text-[10px] uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-sm">tune</span> Reset filtrów
        </button>
      </div>
    </section>
  );
};

export default ListingFilterBar;
