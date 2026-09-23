import { fireEvent, render, screen } from '@testing-library/react';
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

  it('shows pipe-separated Oferty.net tags on the property photo', () => {
    render(<FeaturedProperties properties={[createProperty({ opis_ang: 'Sea view | Private pool | ' })]} />);

    expect(screen.getByText('Sea view')).toBeInTheDocument();
    expect(screen.getByText('Private pool')).toBeInTheDocument();
  });

  it('prioritizes only the first card image and defers the rest', () => {
    render(
      <FeaturedProperties
        properties={[
          createProperty({ id: 'first', zdjecie1: '/first.jpg' }),
          createProperty({ id: 'second', zdjecie1: '/second.jpg' }),
        ]}
      />,
    );

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('loading', 'eager');
    expect(images[0]).toHaveAttribute('fetchpriority', 'high');
    expect(images[1]).toHaveAttribute('loading', 'lazy');
    expect(images[1]).toHaveAttribute('fetchpriority', 'auto');
    images.forEach((image) => {
      expect(image).toHaveAttribute('decoding', 'async');
      expect(image).toHaveAttribute('sizes', '(min-width: 1024px) 31vw, (min-width: 768px) 45vw, 100vw');
      expect(image).toHaveAttribute('width', '1200');
      expect(image).toHaveAttribute('height', '750');
    });
  });

  it('uses generated photo variants for responsive card images', () => {
    render(
      <FeaturedProperties
        properties={[{
          ...createProperty({ zdjecie1: '/photos/hash-1200.webp' }),
          photoVariants: {
            zdjecie1: [
              { width: 400, url: '/photos/hash-400.webp' },
              { width: 800, url: '/photos/hash-800.webp' },
              { width: 1200, url: '/photos/hash-1200.webp' },
            ],
          },
        }]}
      />,
    );

    expect(screen.getByRole('img')).toHaveAttribute(
      'srcset',
      '/photos/hash-400.webp 400w, /photos/hash-800.webp 800w, /photos/hash-1200.webp 1200w',
    );
  });

  it('uses the local placeholder when a card has no photo or the photo fails', () => {
    render(<FeaturedProperties properties={[createProperty({ zdjecie1: undefined })]} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/assets/placeholder.svg');

    fireEvent.error(image);
    expect(image).toHaveAttribute('src', '/assets/placeholder.svg');
    expect(image).toHaveAttribute('data-fallback-applied', 'true');
    expect(image).not.toHaveAttribute('srcset');
  });
});
