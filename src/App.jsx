import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import RealEstateFilter from './components/RealEstateFilter';
import FeaturedProperties from './components/FeaturedProperties';
import Ethos from './components/Ethos';
import Footer from './components/Footer';
import { useOffers } from './hooks/useOffers';

function App() {
  const { filteredOffers, filters, setFilters, loading } = useOffers();

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-24">
        <Hero />
        <RealEstateFilter filters={filters} setFilters={setFilters} />
        {loading ? (
          <div className="text-center py-24 text-primary font-headline text-2xl">Loading Collection...</div>
        ) : (
          <FeaturedProperties properties={filteredOffers.slice(0, 6)} />
        )}
        <Ethos />
      </main>
      <Footer />
    </div>
  );
}

export default App;
