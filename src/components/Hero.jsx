import React from 'react';

const Hero = ({ children }) => {
  return (
    <section className="relative min-h-screen flex items-center px-12 pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          alt="Mediterranean Villa" 
          className="w-full h-full object-cover scale-105" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwoiiUg_yp6JJq7ohgwkFMSTUhe-baEspqPvomUgWoMamnyO7DtlqzyBYNUDcxBZumx9i3BqVwa860a2sERxTlg3MrlZo2WWycjcYE1I35m6x9pmD61loRCfiqufNcme-lB_emBKwLHazY0nl_XzZV17jlSiyKJXr5rUrTC_ZyrnyXaiMk7UIWdNSacYDxJfld4CWOjiZfF588eIR8yvOllVE_D-nNLWNzDSm809JbONFlOAOH2mjS2IkDnVjntDKjnOuQBJ1xzIc8"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/40"></div>
      </div>
      <div className="relative z-10 max-w-6xl w-full mx-auto">
        <div className="max-w-4xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <span className="text-primary-fixed-dim font-label text-sm tracking-[0.3em] uppercase mb-6 block">Editorial Collection 2024</span>
          <h1 className="text-white font-headline font-extrabold text-6xl md:text-8xl tracking-tighter leading-[0.9] mb-8">
            Living as an <br/><span className="text-primary-fixed italic font-light">Architectural</span> Statement.
          </h1>
          <p className="text-white/80 text-xl max-w-xl leading-relaxed mb-16">
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
