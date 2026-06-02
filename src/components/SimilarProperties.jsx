import React from 'react';
import { formatPrice } from '../utils/formatPrice';

const PropertyCard = ({ prop, base }) => {
  const city = prop.params?.miasto || 'Luxury Estate';
  const loc = [prop.location?.city, prop.location?.region, prop.location?.country].filter(Boolean).join(', ');
  const price = formatPrice(prop.price, prop.currency);
  const image = prop.params?.zdjecie1;
  const status = prop.typ === 'sprzedaz' ? 'Na sprzedaż' : 'Wynajem';

  return (
    <a href={`${base}property/${prop.id}`} className="group block">
      <div className="relative overflow-hidden mb-5 aspect-[5/3] rounded-sm bg-surface-container-low">
        {image && (
          <img
            src={image}
            alt={city}
            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
          />
        )}
        <div className="absolute top-4 left-4">
          <span className="bg-surface/90 backdrop-blur-md px-3 py-1 font-label text-[10px] tracking-widest text-primary uppercase">
            {status}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors">
            {city}
          </h3>
          <span className="font-headline text-lg font-bold text-primary shrink-0">{price}</span>
        </div>
        <p className="text-on-surface-variant text-sm font-body">{loc}</p>
        <div className="flex gap-6 pt-1 font-label text-[10px] uppercase tracking-tighter text-outline">
          {prop.params?.liczbapokoi > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">meeting_room</span>
              {prop.params.liczbapokoi} Pokoi
            </span>
          )}
          {prop.params?.powierzchnia && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">square_foot</span>
              {prop.params.powierzchnia} m²
            </span>
          )}
        </div>
      </div>
    </a>
  );
};

const SimilarProperties = ({ properties = [] }) => {
  const base = import.meta.env.BASE_URL;

  if (!properties.length) return null;

  return (
    <section className="py-24 border-t border-outline/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <span className="text-primary font-label text-sm tracking-[0.3em] uppercase mb-4 block">
            Polecane oferty
          </span>
          <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tighter">
            Podobne nieruchomości
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {properties.map((prop) => (
            <PropertyCard key={prop.id} prop={prop} base={base} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SimilarProperties;
