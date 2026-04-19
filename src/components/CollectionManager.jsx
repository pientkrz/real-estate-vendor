import React, { useState, useMemo } from 'react';
import RealEstateFilter from './RealEstateFilter';
import FeaturedProperties from './FeaturedProperties';

const CollectionManager = ({ initialOffers = [] }) => {
  const [filters, setFilters] = useState({
    country: '',
    priceRange: '',
    bedrooms: '',
    bathrooms: '',
  });

  const filteredOffers = useMemo(() => {
    return initialOffers.filter(offer => {
      // Country Filter (miasto in params)
      if (filters.country) {
        // Find if any location level or param miasto matches
        const matchesCountry = 
          offer.params?.miasto?.includes(filters.country.split(' ')[0]) ||
          Object.values(offer.location || {}).some(loc => loc.includes(filters.country.split(' ')[0]));
        if (!matchesCountry) return false;
      }

      // Price Filter
      if (filters.priceRange) {
        const price = offer.price;
        if (filters.priceRange === '€2,000,000 - €5,000,000' && (price < 2000000 || price > 5000000)) return false;
        if (filters.priceRange === '€5,000,000 - €10,000,000' && (price < 5000000 || price > 10000000)) return false;
        if (filters.priceRange === '€10,000,000+' && price < 10000000) return false;
      }

      // Bedrooms
      if (filters.bedrooms) {
        const minRooms = parseInt(filters.bedrooms);
        if ((offer.params?.liczbapokoi || 0) < minRooms) return false;
      }

      // Bathrooms
      if (filters.bathrooms) {
        const minBaths = parseInt(filters.bathrooms);
        if ((offer.params?.liczbalazienek || 0) < minBaths) return false;
      }

      return true;
    });
  }, [initialOffers, filters]);

  return (
    <>
      <RealEstateFilter filters={filters} setFilters={setFilters} />
      <FeaturedProperties properties={filteredOffers} />
    </>
  );
};

export default CollectionManager;
