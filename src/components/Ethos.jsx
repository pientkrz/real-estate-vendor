import React from 'react';

const Ethos = () => {
  return (
    <section className="bg-surface-container-low py-32 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-12 grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
        <div className="lg:col-span-7 relative">
          <div className="grid grid-cols-2 gap-8">
            <div className="pt-24">
              <img
                alt="Lifestyle 1"
                className="w-full aspect-[3/4] object-cover rounded-sm shadow-xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDq6EDcxRG4792EuDbnvYynxw6oSlciTByJ6waZZ71kPu7mdSvC_7AdkJemF0ew75aGnYGjF_IIjQ7jsbSC5KPBz2RpE4FEXreJ96nSeCIewqtDVaYwm8-_7AeK_QdkdGBlFPx5LbYMVZZC5GQP-0pVUQItuoIS7ZW7Z-uxkD17nZ7DPf9Qg9T1HajzEOO3QbofNWjhxpIkI0gpyxnsS75cnioaN9et19LIhXW333E2pAW5aEqIfIVboriXeYKjzvwsWm3lx5pUqy3G"
              />
            </div>
            <div>
              <img
                alt="Lifestyle 2"
                className="w-full aspect-[3/4] object-cover rounded-sm shadow-xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF_Kt9D8nK3bcrR5BmgD0fmxpcngmvoxNcKCBiCpGZJVZPFtO2AlMwFdvyaHhLtGbe--spuAL8xAVrAg-HggwBYkVQCanBRsl3Bceh6FMIPQ4SX_TlFlG1eAYOBRzqQW2_hvakwyGV3peEMKBIBGIuYpNKadnXsoT7ZQiDOJ72Y_VrXbjfjAd-tiFftHhg7Me6SU2gpksD1KsuGt023oKku-1ayTJymsR8s665AkF0h7k99C_1BMVnYV5v41s7_K_3Lg1E2P-n7vSG"
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5">
          <span className="text-primary font-label text-sm tracking-[0.2em] uppercase mb-6 block">Our Ethos</span>
          <h2 className="text-5xl font-headline font-bold leading-tight mb-8">Refined Service, Global Reach, Architectural Eye.</h2>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
            Global S Home isn't just a brokerage; we are curators of environments. We understand that a luxury residence is an asset of both capital and soul. Our team specializes in off-market acquisitions and bespoke architectural consultancy.
          </p>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-12">
            We bridge the gap between Mediterranean heritage and contemporary lifestyle, ensuring every destination in our portfolio meets the "S" standard of excellence.
          </p>
          <div className="flex gap-12 border-t border-outline-variant/30 pt-10">
            <div>
              <p className="text-3xl font-headline font-bold text-primary">€2.4B</p>
              <p className="text-xs font-label uppercase tracking-widest text-outline">Portfolio Value</p>
            </div>
            <div>
              <p className="text-3xl font-headline font-bold text-primary">12</p>
              <p className="text-xs font-label uppercase tracking-widest text-outline">Global Offices</p>
            </div>
            <div>
              <p className="text-3xl font-headline font-bold text-primary">150+</p>
              <p className="text-xs font-label uppercase tracking-widest text-outline">Elite Estates</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ethos;
