import React from 'react';
import { formatPrice } from '../utils/formatPrice';
import { convertPrice } from '../utils/exchangeRates';
import FilterSelect from './FilterSelect';

const displayCount = (value) => (Number(value) > 0 ? value : '—');
const hasCount = (value) => Number(value) > 0;
const getPhotoTags = (value) => [...new Set(
  String(value ?? '')
    .split('|')
    .map((tag) => tag.trim())
    .filter(Boolean),
)];

const PropertyMetric = ({ icon, children }) => (
  <span className="flex items-center gap-1.5 whitespace-nowrap">
    <span className="material-symbols-outlined text-base text-primary">{icon}</span>
    {children}
  </span>
);

const PropertyCard = ({ id, title, city, region, country, rooms, bedrooms, baths, area, price, image, photoVariants, status, photoTags, priority = false }) => {
  const base = import.meta.env.BASE_URL;
  const placeholder = `${base}assets/placeholder.svg`;
  const loc = [city, region, country].filter(Boolean).join(', ');
  const imageSource = image || placeholder;
  const imageSrcSet = Object.values(photoVariants?.zdjecie1 || {})
    .filter((variant) => variant?.url && Number(variant.width) > 0)
    .sort((left, right) => Number(left.width) - Number(right.width))
    .map((variant) => `${variant.url} ${variant.width}w`)
    .join(', ');

  const handleImageError = (event) => {
    const element = event.currentTarget;
    if (element.dataset.fallbackApplied === 'true') return;
    element.dataset.fallbackApplied = 'true';
    element.src = placeholder;
    element.removeAttribute('srcSet');
    element.removeAttribute('srcset');
  };

  return (
    <a href={`${base}property/${id}`} className="group block cursor-pointer">
      <div className="relative overflow-hidden mb-4 aspect-[4/5] lg:aspect-[5/3] rounded-sm">
        <img
          alt={title}
          src={imageSource}
          srcSet={imageSrcSet || undefined}
          width="1200"
          height="750"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          sizes="(min-width: 1024px) 31vw, (min-width: 768px) 45vw, 100vw"
          onError={handleImageError}
          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-start gap-2">
          <span className="bg-surface/90 backdrop-blur-md px-3 py-1 font-label text-[10px] tracking-widest text-primary uppercase">
            {status}
          </span>
          {photoTags.map((tag) => (
            <span
              key={tag}
              className="bg-primary/90 backdrop-blur-md px-3 py-1 font-label text-[10px] tracking-widest text-on-primary uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface">{title}</h3>
          <span className="font-headline text-lg font-bold text-primary shrink-0">{price}</span>
        </div>
        <p className="text-on-surface-variant text-sm font-body">{loc}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 font-label text-[10px] uppercase tracking-tighter text-outline">
          <PropertyMetric icon="meeting_room">{displayCount(rooms)} Pokoi</PropertyMetric>
          {hasCount(bedrooms) ? (
            <PropertyMetric icon="bedroom_parent">{bedrooms} Sypialni</PropertyMetric>
          ) : null}
          {hasCount(baths) ? (
            <PropertyMetric icon="bathtub">{baths} Łazienek</PropertyMetric>
          ) : null}
          <PropertyMetric icon="square_foot">{area || '—'}</PropertyMetric>
        </div>
      </div>
    </a>
  );
};

const FeaturedProperties = ({
  properties = [],
  title = 'Wyselekcjonowane oferty',
  displayCurrency = 'EUR',
  rates = {},
  totalCount = properties.length,
  pagination,
}) => (
  <div>
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-end">
      <h2 className="font-serif text-2xl lg:text-4xl font-bold tracking-tight text-on-surface">
        {title}
      </h2>
      <p className="font-label text-xs text-outline tracking-widest uppercase">
        {totalCount} nieruchomości
      </p>
    </div>

    {pagination && (
      <div className="mb-6">
        <FilterSelect
          label="Oferty na stronie"
          value={pagination.rowsPerPage}
          options={[5, 10, 20].map((rows) => ({
            value: rows,
            label: `${rows * (pagination.pageSize / pagination.rowsPerPage)} ofert`,
          }))}
          summary={`${pagination.pageSize} ofert`}
          onApply={(rows) => pagination.onRowsPerPageChange(Number(rows))}
        />
      </div>
    )}

    {properties.length === 0 ? (
      <div className="py-16 text-center">
        <span className="material-symbols-outlined text-4xl text-outline/30 mb-4 block">search_off</span>
        <p className="text-on-surface-variant font-body italic text-sm">
          Brak nieruchomości spełniających kryteria.
        </p>
      </div>
    ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {properties.map((prop, index) => (
          <div key={prop.id || index}>
            <PropertyCard
              id={prop.id}
              title={prop.params?.miasto || 'Luxury Estate'}
              city={prop.location?.city || prop.params?.miasto}
              region={prop.location?.region}
              country={prop.location?.country}
              rooms={prop.params?.liczbapokoi}
              bedrooms={prop.params?.liczbasypialni}
              baths={prop.params?.liczbalazienek}
              area={prop.params?.powierzchnia ? `${prop.params.powierzchnia} m²` : ''}
              price={formatPrice(
                convertPrice(prop.price, prop.currency, displayCurrency, rates),
                displayCurrency,
              )}
              image={prop.params?.zdjecie1}
              photoVariants={prop.photoVariants}
              priority={index === 0}
              status={prop.typ === 'sprzedaz' ? 'Na sprzedaż' : 'Wynajem'}
              photoTags={getPhotoTags(prop.params?.opis_ang)}
            />
          </div>
        ))}
      </div>
      {pagination?.pageCount > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination {...pagination} />
        </div>
      )}
      </>
    )}
  </div>
);

const Pagination = ({ currentPage, pageCount, onPageChange }) => {
  const visiblePages = new Set([1, pageCount]);
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 0 && page <= pageCount) visiblePages.add(page);
  }
  const pages = [...visiblePages].sort((left, right) => left - right);

  return (
    <nav aria-label="Paginacja ofert" className="flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Poprzednia strona"
        className="min-h-11 min-w-11 rounded-sm px-3 text-sm text-on-surface-variant hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>
      {pages.map((page, index) => (
        <React.Fragment key={page}>
          {index > 0 && pages[index - 1] !== page - 1 && (
            <span aria-hidden="true" className="px-1 text-outline">…</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Strona ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`min-h-11 min-w-11 rounded-sm px-3 text-sm ${page === currentPage ? 'bg-primary text-surface' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {page}
          </button>
        </React.Fragment>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount}
        aria-label="Następna strona"
        className="min-h-11 min-w-11 rounded-sm px-3 text-sm text-on-surface-variant hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </nav>
  );
};

export default FeaturedProperties;
