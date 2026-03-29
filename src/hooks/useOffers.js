import { useState, useEffect, useMemo } from 'react';
import { parseOffersXml } from '../utils/xmlParser';

export const useOffers = () => {
  const [allOffers, setAllOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    country: '',
    priceRange: '',
    bedrooms: '',
    bathrooms: '',
  });

  useEffect(() => {
    fetch('/offers.xml')
      .then(res => res.text())
      .then(xml => {
        const parsed = parseOffersXml(xml);
        setAllOffers(parsed);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load offers.xml', err);
        setError(err);
        setLoading(false);
      });
  }, []);

  const filteredOffers = useMemo(() => {
    return allOffers.filter(offer => {
      // Country Filter (miasto in params in my generator)
      if (filters.country && offer.params.miasto !== filters.country) return false;

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
        if (offer.params.liczbapokoi < minRooms) return false;
      }

      // Bathrooms
      if (filters.bathrooms) {
        const minBaths = parseInt(filters.bathrooms);
        if (offer.params.liczbalazienek < minBaths) return false;
      }

      return true;
    });
  }, [allOffers, filters]);

  return {
    allOffers,
    filteredOffers,
    loading,
    error,
    filters,
    setFilters
  };
};
