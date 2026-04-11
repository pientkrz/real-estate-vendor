import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-stone-100 w-full py-16 px-12">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 items-start font-body text-sm tracking-wide">
        <div className="col-span-1 md:col-span-1">
          <div className="text-lg font-bold text-stone-900 mb-6 font-headline">Local P Home</div>
          <p className="text-stone-500 mb-8 max-w-xs leading-relaxed">Defining the next century of Mediterranean living through architectural authority and editorial precision.</p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-amber-800 cursor-pointer">public</span>
            <span className="material-symbols-outlined text-amber-800 cursor-pointer">camera</span>
            <span className="material-symbols-outlined text-amber-800 cursor-pointer">mail</span>
          </div>
        </div>
        <div>
          <h4 className="text-amber-800 font-bold mb-6 uppercase tracking-widest text-xs font-label">Destinations</h4>
          <ul className="space-y-4">
            <li><a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Costa del Sol, ES</a></li>
            <li><a className="text-stone-500 hover:text-amber-700 transition-all" href="#">The Cyclades, GR</a></li>
            <li><a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Tuscany, IT</a></li>
            <li><a className="text-stone-500 hover:text-amber-700 transition-all" href="#">French Riviera, FR</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-amber-800 font-bold mb-6 uppercase tracking-widest text-xs font-label">Inquiry</h4>
          <ul className="space-y-4">
            <li><a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Investment Advisory</a></li>
            <li><a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Management Services</a></li>
            <li><a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Press Kit</a></li>
            <li><a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Career Opportunities</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-amber-800 font-bold mb-6 uppercase tracking-widest text-xs font-label">Headquarters</h4>
          <p className="text-stone-500 mb-4 leading-relaxed">
            Avenida de la Ribera, 24<br />
            Puerto Banús, Marbella<br />
            Spain 29660
          </p>
          <p className="text-stone-500">+34 951 82 00 22</p>
          <p className="text-stone-500 underline underline-offset-4 decoration-amber-700/30">concierge@globals-home.com</p>
        </div>
      </div>
      <div className="max-w-screen-2xl mx-auto mt-24 pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between gap-6 font-body text-xs">
        <p className="text-stone-500">© 2024 Local P Home. Architectural Integrity & Editorial Authority.</p>
        <div className="flex gap-8">
          <a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Privacy Policy</a>
          <a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Terms of Service</a>
          <a className="text-stone-500 hover:text-amber-700 transition-all" href="#">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
