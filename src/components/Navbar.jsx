import React from 'react';

const Navbar = () => {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 glass-effect">
      <nav className="flex justify-between items-center px-12 py-6 max-w-screen-2xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter text-amber-800 font-headline">
          Local P Home
        </div>
        <div className="hidden md:flex items-center space-x-12">
          <a className="text-amber-900 font-semibold border-b-2 border-amber-700 font-headline transition-colors duration-300 ease-in-out" href="#">Portfolio</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href="#">Destinations</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href="#">Services</a>
          <a className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out" href="#">Journal</a>
        </div>
        <div className="flex items-center gap-6">
          <button className="editorial-gradient text-on-primary px-8 py-3 rounded-lg font-semibold tracking-tight transition-transform active:scale-95">
            Enquire Now
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
