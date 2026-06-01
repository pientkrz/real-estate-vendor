import React from 'react';
import { formatPrice } from '../utils/formatPrice';

const PropertyCard = ({ id, title, city, region, country, beds, baths, area, price, image, status, tab }) => {
  const base = import.meta.env.BASE_URL;
  const loc = [city, region, country].filter(Boolean).join(', ');

  return (
    <a href={`${base}property/${id}`} className="group block cursor-pointer">
      <div className="relative overflow-hidden mb-6 aspect-[4/3] rounded-sm">
        <img
          alt={title}
          src={image}
          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-surface/90 backdrop-blur-md px-3 py-1 font-label text-[10px] tracking-widest text-primary uppercase">
            {status}
          </span>
        </div>
        <button
          className="absolute top-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.preventDefault()}
        >
          <span className="material-symbols-outlined">favorite</span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface">{title}</h3>
          <span className="font-headline text-lg font-bold text-primary shrink-0">{price}</span>
        </div>
        <p className="text-on-surface-variant text-sm font-body">{loc}</p>
        <div className="flex gap-6 pt-2 font-label text-[10px] uppercase tracking-tighter text-outline">
          {beds > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">bed</span> {beds} Sypialni
            </span>
          )}
          {baths > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">bathtub</span> {baths} Łazienek
            </span>
          )}
          {area && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">square_foot</span> {area}
            </span>
          )}
        </div>
      </div>
    </a>
  );
};

const FeaturedProperties = ({ properties = [] }) => (
  <div className="p-8 space-y-12">
    <div className="flex justify-between items-baseline">
      <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
        Wyselekcjonowane oferty
      </h1>
      <p className="font-label text-xs text-outline tracking-widest uppercase shrink-0 ml-4">
        {properties.length} nieruchomości
      </p>
    </div>

    {properties.length === 0 ? (
      <div className="py-16 text-center">
        <span className="material-symbols-outlined text-4xl text-outline/30 mb-4 block">search_off</span>
        <p className="text-on-surface-variant font-body italic text-sm">
          Brak nieruchomości spełniających kryteria.
        </p>
      </div>
    ) : (
      properties.map((prop, index) => (
        <PropertyCard
          key={prop.id || index}
          id={prop.id}
          tab={prop.tab}
          title={prop.params?.miasto || 'Luxury Estate'}
          city={prop.location?.city || prop.params?.miasto}
          region={prop.location?.region}
          country={prop.location?.country}
          beds={prop.params?.liczbapokoi}
          baths={prop.params?.liczbalazienek}
          area={prop.params?.powierzchnia ? `${prop.params.powierzchnia} m²` : ''}
          price={formatPrice(prop.price, prop.currency)}
          image={prop.params?.zdjecie1}
          status={prop.typ === 'sprzedaz' ? 'Na sprzedaż' : 'Wynajem'}
        />
      ))
    )}
  </div>
);

export default FeaturedProperties;
