import React from 'react';

const Hero = ({ children }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center px-12 pt-40 pb-32 overflow-hidden bg-surface">
      {/* Background with tonal depth consistent with editorial style */}
      <div className="absolute inset-0 z-0 bg-surface"></div>
      <div className="relative z-10 max-w-7xl w-full mx-auto">
        <div className="max-w-4xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <span className="text-primary font-label text-sm tracking-[0.4em] uppercase mb-8 block">Editorial Collection 2024</span>
          <h1 className="text-on-surface font-headline font-extrabold text-6xl md:text-9xl tracking-tighter leading-[0.85] mb-12">
            Living as an <br/><span className="text-primary italic font-light">Architectural</span> Statement.
          </h1>
          <p className="text-on-surface-variant text-xl max-w-xl leading-relaxed mb-20 opacity-80">
            A curated portfolio of ultra-prime Mediterranean estates where traditional craftsmanship meets avant-garde luxury living.
          </p>
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </section>
  );
};

export default Hero;
