import React, { useState } from 'react';

const RealEstateFilter = () => {
  const [filters, setFilters] = useState({
    country: 'Spain (Costa del Sol)',
    price: '€2,000,000 - €5,000,000',
    bedrooms: '3+',
    bathrooms: '2+',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    console.log('Searching for properties with filters:', filters);
    // Add filtering logic here if needed
  };

  return (
    <section className="px-12 -mt-20 relative z-20">
      <div className="bg-surface-container-lowest shadow-2xl p-10 rounded-xl max-w-6xl mx-auto flex flex-wrap lg:flex-nowrap items-end gap-8 border border-outline-variant/10">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-primary font-label text-xs uppercase tracking-widest mb-3">Country</label>
          <div className="relative group">
            <select 
              name="country"
              value={filters.country}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 py-3 appearance-none cursor-pointer font-body"
            >
              <option>Spain (Costa del Sol)</option>
              <option>Greece (Mykonos)</option>
              <option>Italy (Lake Como)</option>
              <option>France (French Riviera)</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-primary font-label text-xs uppercase tracking-widest mb-3">Price Range</label>
          <div className="relative group">
            <select 
              name="price"
              value={filters.price}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 py-3 appearance-none cursor-pointer font-body"
            >
              <option>€2,000,000 - €5,000,000</option>
              <option>€5,000,000 - €10,000,000</option>
              <option>€10,000,000+</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>
        </div>
        <div className="w-32">
          <label className="block text-primary font-label text-xs uppercase tracking-widest mb-3">Bedrooms</label>
          <div className="relative group">
            <select 
              name="bedrooms"
              value={filters.bedrooms}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 py-3 appearance-none cursor-pointer font-body"
            >
              <option>3+</option>
              <option>5+</option>
              <option>8+</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>
        </div>
        <div className="w-32">
          <label className="block text-primary font-label text-xs uppercase tracking-widest mb-3">Bathrooms</label>
          <div className="relative group">
            <select 
              name="bathrooms"
              value={filters.bathrooms}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 py-3 appearance-none cursor-pointer font-body"
            >
              <option>2+</option>
              <option>4+</option>
              <option>6+</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>
        </div>
        <button 
          onClick={handleSearch}
          className="editorial-gradient h-14 w-14 rounded-lg flex items-center justify-center text-on-primary transition-transform active:scale-95 shadow-lg"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>
    </section>
  );
};

export default RealEstateFilter;
