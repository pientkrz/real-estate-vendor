import React, { useState } from 'react';

const RealEstateFilter = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    console.log('Searching for properties with filters:', filters);
  };

  const handleReset = () => {
    setFilters({
      country: '',
      priceRange: '',
      bedrooms: '',
      bathrooms: '',
    });
  };

  return (
    <section className="relative z-20 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
      <div className="glass-effect bg-white/5 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-8 rounded-2xl max-w-6xl flex flex-wrap lg:flex-nowrap items-end gap-8 mx-auto">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-white/70 font-label text-[10px] uppercase tracking-[0.2em] mb-3">Country</label>
          <div className="relative group">
            <select 
              name="country"
              value={filters.country}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-white/20 text-white focus:border-primary-fixed focus:ring-0 py-3 appearance-none cursor-pointer font-body text-sm"
            >
              <option value="">All Regions</option>
              <option>Spain (Costa del Sol)</option>
              <option>Greece (Mykonos)</option>
              <option>Italy (Lake Como)</option>
              <option>France (French Riviera)</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-sm">expand_more</span>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-white/70 font-label text-[10px] uppercase tracking-[0.2em] mb-3">Price Range</label>
          <div className="relative group">
            <select 
              name="priceRange"
              value={filters.priceRange}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-white/20 text-white focus:border-primary-fixed focus:ring-0 py-3 appearance-none cursor-pointer font-body text-sm"
            >
              <option value="">Any Price</option>
              <option>€2,000,000 - €5,000,000</option>
              <option>€5,000,000 - €10,000,000</option>
              <option>€10,000,000+</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>
        </div>
        <div className="w-32">
          <label className="block text-white/70 font-label text-[10px] uppercase tracking-[0.2em] mb-3">Bedrooms</label>
          <div className="relative group">
            <select 
              name="bedrooms"
              value={filters.bedrooms}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-white/20 text-white focus:border-primary-fixed focus:ring-0 py-3 appearance-none cursor-pointer font-body text-sm"
            >
              <option value="">Any</option>
              <option value="3">3+</option>
              <option value="5">5+</option>
              <option value="8">8+</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>
        </div>
        <div className="w-32">
          <label className="block text-white/70 font-label text-[10px] uppercase tracking-[0.2em] mb-3">Bathrooms</label>
          <div className="relative group">
            <select 
              name="bathrooms"
              value={filters.bathrooms}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-white/20 text-white focus:border-primary-fixed focus:ring-0 py-3 appearance-none cursor-pointer font-body text-sm"
            >
              <option value="">Any</option>
              <option value="2">2+</option>
              <option value="4">4+</option>
              <option value="6">6+</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleReset}
            className="h-14 px-6 rounded-lg text-white/60 hover:text-white transition-colors font-label text-[10px] uppercase tracking-[0.2em]"
          >
            Clear
          </button>
          <button 
            onClick={handleSearch}
            className="editorial-gradient h-14 w-14 rounded-lg flex items-center justify-center text-on-primary transition-transform active:scale-95 shadow-lg"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default RealEstateFilter;
