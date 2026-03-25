import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import RealEstateFilter from './components/RealEstateFilter';
import FeaturedProperties from './components/FeaturedProperties';
import Ethos from './components/Ethos';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-24">
        <Hero />
        <RealEstateFilter />
        <FeaturedProperties />
        <Ethos />
      </main>
      <Footer />
    </div>
  );
}

export default App;
