import React, { useState, useRef, useEffect } from 'react';

const GlassSelect = ({ label, value, options, onChange, name, placeholder, widthClass = "flex-1 min-w-[200px]" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => (opt.value || opt) === value)?.label || value || placeholder;

  return (
    <div className={`${widthClass} relative`} ref={containerRef}>
      <label className="block text-on-surface/50 font-label text-[10px] uppercase tracking-[0.2em] mb-3">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent border-b border-outline/20 text-on-surface py-3 cursor-pointer font-body text-sm flex justify-between items-center group transition-colors hover:border-primary/40"
      >
        <span className={!value ? "text-on-surface/30" : "text-on-surface"}>{selectedLabel}</span>
        <span className={`material-symbols-outlined text-outline text-[18px] transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-4 bg-surface border border-outline/10 rounded-2xl overflow-hidden z-50 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-300 backdrop-blur-2xl">
          <div className="py-2 max-h-64 overflow-y-auto custom-scrollbar">
            {options.map((option, idx) => {
              const optValue = option.value || option;
              const optLabel = option.label || option;
              const isSelected = optValue === value;
              
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onChange(name, optValue);
                    setIsOpen(false);
                  }}
                  className={`px-6 py-4 text-sm transition-all duration-200 cursor-pointer flex items-center justify-between
                    ${isSelected ? 'bg-primary/5 text-primary font-semibold' : 'text-on-surface/80 hover:bg-surface-container-low hover:text-on-surface'}`}
                >
                  <span>{optLabel}</span>
                  {isSelected && <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const RealEstateFilter = ({ filters, setFilters }) => {
  const handleSelectChange = (name, value) => {
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
    <section className="relative z-20 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 px-4 md:px-0">
      <div className="bg-surface border border-outline/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-8 md:p-12 rounded-3xl max-w-7xl flex flex-wrap lg:flex-nowrap items-end gap-10 mx-auto">
        <GlassSelect 
          label="Location" 
          name="country"
          value={filters.country}
          placeholder="All Destinations"
          options={['Spain (Costa del Sol)', 'Greece (Mykonos)', 'Italy (Lake Como)', 'France (French Riviera)']}
          onChange={handleSelectChange}
        />
        <GlassSelect 
          label="Investment" 
          name="priceRange"
          value={filters.priceRange}
          placeholder="Any Price"
          options={['€2,000,000 - €5,000,000', '€5,000,000 - €10,000,000', '€10,000,000+']}
          onChange={handleSelectChange}
        />
        <GlassSelect 
          label="Bedrooms" 
          name="bedrooms"
          value={filters.bedrooms}
          placeholder="Any"
          options={['3+', '5+', '8+']}
          onChange={handleSelectChange}
          widthClass="w-full md:w-32"
        />
        <GlassSelect 
          label="Baths" 
          name="bathrooms"
          value={filters.bathrooms}
          placeholder="Any"
          options={['2+', '4+', '6+']}
          onChange={handleSelectChange}
          widthClass="w-full md:w-32"
        />
        
        <div className="flex gap-4 w-full lg:w-auto justify-end">
          <button 
            onClick={handleReset}
            className="h-14 px-8 rounded-xl text-outline hover:text-primary transition-all font-label text-[10px] uppercase tracking-[0.3em]"
          >
            Reset
          </button>
          <button 
            onClick={handleSearch}
            className="editorial-gradient h-16 w-16 md:h-20 md:w-20 rounded-2xl flex items-center justify-center text-on-primary transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(122,89,12,0.3)] group"
          >
            <span className="material-symbols-outlined text-[28px] group-hover:rotate-12 transition-transform">search</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default RealEstateFilter;
