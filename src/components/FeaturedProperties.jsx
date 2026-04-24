import React from 'react';

const PropertyCard = ({ id, title, location, beds, baths, area, price, image, status }) => {
  return (
    <a href={`/real-estate-vendor/property/${id}`} className="group block cursor-pointer">
      <div className="relative overflow-hidden aspect-[4/5] mb-6 rounded-sm">
        <img
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          src={image}
        />
        <div className="absolute top-6 left-6">
          <span className="bg-surface/90 glass-effect px-4 py-1 text-[10px] font-label uppercase tracking-widest text-on-surface">
            {status}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-headline font-bold mb-1">{title}</h3>
          <p className="text-on-surface-variant font-body text-sm mb-4">{location}</p>
          <div className="flex items-center gap-6 text-outline text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">bed</span> {beds} Beds
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">shower</span> {baths} Baths
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">straighten</span> {area}
            </span>
          </div>
        </div>
        <p className="text-primary font-headline font-bold text-xl">{price}</p>
      </div>
    </a>
  );
};


const FeaturedProperties = ({ properties = [] }) => {
  return (
    <section className="px-12 py-32 max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-end mb-16">
        <div>
          <span className="text-primary font-label text-sm tracking-[0.2em] uppercase mb-4 block">Curated Listings</span>
          <h2 className="text-5xl font-headline font-bold tracking-tight">The Architectural Collection</h2>
        </div>
        <button className="text-primary font-semibold border-b border-primary pb-1 hover:opacity-70 transition-opacity">
          View Full Portfolio
        </button>
      </div>
      {properties.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant font-body italic">No estates match your current criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {properties.map((prop, index) => (
            <PropertyCard
              key={prop.id || index}
              id={prop.id}
              title={prop.params?.miasto || "Luxury Estate"}
              location={prop.location?.level2 || prop.params?.miasto}
              beds={prop.params?.liczbapokoi}
              baths={prop.params?.liczbalazienek}
              area={`${prop.params?.powierzchnia}m²`}
              price={`${prop.currency === 'EUR' ? '€' : prop.currency}${(prop.price / 1000000).toFixed(1)}M`}
              image={prop.params?.zdjecie1}
              status={prop.typ === 'sprzedaz' ? 'For Sale' : 'For Rent'}
            />

          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedProperties;
