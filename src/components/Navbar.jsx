import React from 'react';

const Navbar = () => {
  // z-[9999], not z-50: Leaflet's own panes/markers/tiles use z-index
  // values up to ~1300 and aren't isolated into their own stacking
  // context, so once the page scrolls they can visually paint over a
  // merely-z-50 fixed header.
  return (
    <header className="fixed top-0 w-full z-[9999] bg-surface">
      <nav className="flex justify-between items-center px-12 py-6 max-w-screen-2xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter text-amber-800 font-headline">
          Global S Home
        </div>
        <div className="hidden md:flex items-center space-x-12">
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href={import.meta.env.BASE_URL}>Nieruchomości</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href={`${import.meta.env.BASE_URL}blog`}>Blog</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href={`${import.meta.env.BASE_URL}o-nas`}>O Nas</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href={`${import.meta.env.BASE_URL}contact`}>Kontakt</a>
        </div>
        <div className="flex items-center gap-6">
          <button className="editorial-gradient text-on-primary px-8 py-3 rounded-lg font-semibold tracking-tight transition-transform active:scale-95">
            Zapytaj Teraz
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
