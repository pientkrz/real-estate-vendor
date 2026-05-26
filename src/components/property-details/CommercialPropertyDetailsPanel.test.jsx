import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CommercialPropertyDetailsPanel from './CommercialPropertyDetailsPanel';

const baseDetails = {
  buildingType: 'w kamienicy',
  floor: 'parter',
  constructionStatus: 'gotowy',
  buildYear: 2000,
  terrainArea: null,
  freeFrom: '2024-07-01',
  furnished: false,
  use: ['usługowy', 'handlowy'],
  extras: ['witryna', 'klimatyzacja'],
  media: ['prąd', 'internet'],
  security: ['domofon / wideofon'],
};

describe('CommercialPropertyDetailsPanel', () => {
  it('renders without crashing', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('w kamienicy')).toBeInTheDocument();
  });

  it('renders building type', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('w kamienicy')).toBeInTheDocument();
  });

  it('renders floor', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('parter')).toBeInTheDocument();
  });

  it('renders construction status', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('gotowy')).toBeInTheDocument();
  });

  it('renders build year', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('renders free from date', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('2024-07-01')).toBeInTheDocument();
  });

  it('renders furnished as "Nie" when false', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('Nie')).toBeInTheDocument();
  });

  it('renders use chips', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('usługowy')).toBeInTheDocument();
    expect(screen.getByText('handlowy')).toBeInTheDocument();
  });

  it('renders extras chips', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('witryna')).toBeInTheDocument();
    expect(screen.getByText('klimatyzacja')).toBeInTheDocument();
  });

  it('renders security chips', () => {
    render(<CommercialPropertyDetailsPanel details={baseDetails} />);
    expect(screen.getByText('domofon / wideofon')).toBeInTheDocument();
  });

  it('does not render Przeznaczenie when use is empty', () => {
    render(<CommercialPropertyDetailsPanel details={{ ...baseDetails, use: [] }} />);
    expect(screen.queryByText('Przeznaczenie')).not.toBeInTheDocument();
  });

  it('renders terrain area when provided', () => {
    render(<CommercialPropertyDetailsPanel details={{ ...baseDetails, terrainArea: 500 }} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders null gracefully', () => {
    const { container } = render(<CommercialPropertyDetailsPanel details={null} />);
    expect(container.firstChild).toBeNull();
  });
});
