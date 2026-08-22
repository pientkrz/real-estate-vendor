import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeaturedProperties from './FeaturedProperties';

const createProperty = (params) => ({
  id: 'example-offer',
  price: 1250000,
  currency: 'EUR',
  typ: 'sprzedaz',
  location: { city: 'Mykonos', country: 'Grecja' },
  params: {
    miasto: 'Mykonos',
    powierzchnia: 120,
    liczbapokoi: 4,
    zdjecie1: '/example.jpg',
    ...params,
  },
});

describe('FeaturedProperties — metryki karty oferty', () => {
  it('shows bedrooms and bathrooms when the aggregate provides them', () => {
    render(
      <FeaturedProperties
        properties={[createProperty({ liczbasypialni: 3, liczbalazienek: 2 })]}
      />,
    );

    expect(screen.getByText('3 Sypialni')).toBeInTheDocument();
    expect(screen.getByText('2 Łazienek')).toBeInTheDocument();
  });

  it('omits bedrooms and bathrooms when the aggregate does not provide them', () => {
    render(<FeaturedProperties properties={[createProperty({})]} />);

    expect(screen.queryByText(/Sypialni/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Łazienek/)).not.toBeInTheDocument();
  });
});
