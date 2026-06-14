import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-stone-100 w-full py-16 px-12">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start font-body text-sm tracking-wide">
        <div>
          <div className="text-lg font-bold text-stone-900 mb-6 font-headline">Global S Home</div>
          <p className="text-stone-500 mb-8 max-w-xs leading-relaxed">Pomagamy znaleźć i nabyć wyjątkowe nieruchomości w Polsce i za granicą.</p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-amber-800 cursor-pointer">public</span>
            <span className="material-symbols-outlined text-amber-800 cursor-pointer">camera</span>
            <span className="material-symbols-outlined text-amber-800 cursor-pointer">mail</span>
          </div>
        </div>
        <div>
          <h4 className="text-amber-800 font-bold mb-6 uppercase tracking-widest text-xs font-label">Dane firmowe</h4>
          <p className="text-stone-500 mb-4 leading-relaxed">
            Smart Trade Sp. z o.o.<br />
            ul. Agnieszki Osieckiej 18<br />
            45-807 Opole
          </p>
          <p className="text-stone-500 underline underline-offset-4 decoration-amber-700/30">info@globalshome.com</p>
        </div>
      </div>
      <div className="max-w-screen-2xl mx-auto mt-24 pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between gap-6 font-body text-xs">
        <p className="text-stone-500">© 2026 Global S Home | Smart Trade Sp. z o.o.</p>
        <div className="flex gap-8">
          <a className="text-stone-500 hover:text-amber-700 transition-all" href={`${import.meta.env.BASE_URL}privacy-policy`}>Polityka Prywatności</a>
          <a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Ustawienia cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
