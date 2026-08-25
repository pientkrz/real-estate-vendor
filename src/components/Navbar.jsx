import React from 'react';

const Navbar = () => {
  // z-[9999], not z-50: Leaflet's own panes/markers/tiles use z-index
  // values up to ~1300 and aren't isolated into their own stacking
  // context, so once the page scrolls they can visually paint over a
  // merely-z-50 fixed header.
  return (
    <header className="fixed inset-x-0 top-0 z-[9999] overflow-x-hidden bg-surface">
      <nav className="flex min-w-0 items-center justify-between px-5 py-4 sm:px-8 sm:py-5 lg:px-12 lg:py-6 max-w-screen-2xl mx-auto">
        <div className="whitespace-nowrap text-xl font-bold tracking-tighter text-amber-800 font-headline sm:text-2xl">
          Global S Home
        </div>
        <div className="hidden md:flex items-center space-x-12">
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href={import.meta.env.BASE_URL}>Nieruchomości</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href={`${import.meta.env.BASE_URL}blog`}>Blog</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href={`${import.meta.env.BASE_URL}o-nas`}>O Nas</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href={`${import.meta.env.BASE_URL}contact`}>Kontakt</a>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <a
            href={`${import.meta.env.BASE_URL}contact`}
            className="editorial-gradient inline-block rounded-lg px-4 py-2 text-sm font-semibold tracking-tight text-on-primary transition-transform active:scale-95 text-center sm:px-8 sm:py-3 sm:text-base"
          >
            Zapytaj Teraz
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
