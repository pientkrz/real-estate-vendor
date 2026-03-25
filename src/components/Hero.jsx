import React from 'react';

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center px-12 py-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          alt="Mediterranean Villa" 
          className="w-full h-full object-cover brightness-90" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwoiiUg_yp6JJq7ohgwkFMSTUhe-baEspqPvomUgWoMamnyO7DtlqzyBYNUDcxBZumx9i3BqVwa860a2sERxTlg3MrlZo2WWycjcYE1I35m6x9pmD61loRCfiqufNcme-lB_emBKwLHazY0nl_XzZV17jlSiyKJXr5rUrTC_ZyrnyXaiMk7UIWdNSacYDxJfld4CWOjiZfF588eIR8yvOllVE_D-nNLWNzDSm809JbONFlOAOH2mjS2IkDnVjntDKjnOuQBJ1xzIc8"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/60 to-transparent"></div>
      </div>
      <div className="relative z-10 max-w-4xl">
        <span className="text-primary font-label text-sm tracking-[0.2em] uppercase mb-6 block">Editorial Collection 2024</span>
        <h1 className="text-on-surface font-headline font-extrabold text-6xl md:text-8xl tracking-tighter leading-[0.9] mb-8">
          Living as an <br/><span className="text-primary italic font-light">Architectural</span> Statement.
        </h1>
        <p className="text-on-surface-variant text-xl max-w-xl leading-relaxed mb-10">
          A curated portfolio of ultra-prime Mediterranean estates where traditional craftsmanship meets avant-garde luxury living.
        </p>
      </div>
    </section>
  );
};

export default Hero;
