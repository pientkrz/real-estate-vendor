import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HouseDetailsPanel from './HouseDetailsPanel';

const baseDetails = {
  buildingType: 'wolnostojący',
  buildingMaterial: 'cegła',
  terrainArea: 800,
  constructionStatus: 'do zamieszkania',
  buildYear: 2010,
  roofType: 'skośny',
  type: 'mieszkalny',
  floorsNum: '1 piętro',
  roomsNum: 5,
  garretType: 'użytkowe',
  windowsType: 'drewniane',
  location: 'pod miastem',
  roofing: 'dachówka',
  heating: ['gazowe', 'kominkowe'],
  media: ['prąd', 'woda', 'gaz'],
  fence: ['metalowe'],
  extras: ['piwnica', 'garaż'],
  vicinity: ['las', 'jezioro'],
  access: ['asfaltowy'],
  security: [],
  freeFrom: null,
  furnished: null,
  rent: null,
  rentCurrency: null,
  priceIncludeRent: null,
};

describe('HouseDetailsPanel', () => {
  it('renders without crashing', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('wolnostojący')).toBeInTheDocument();
  });

  it('renders building type', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('wolnostojący')).toBeInTheDocument();
  });

  it('renders terrain area', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('800')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('pod miastem')).toBeInTheDocument();
  });

  it('renders rooms count', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders heating chips', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('gazowe')).toBeInTheDocument();
    expect(screen.getByText('kominkowe')).toBeInTheDocument();
  });

  it('renders media chips', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('prąd')).toBeInTheDocument();
    expect(screen.getByText('woda')).toBeInTheDocument();
  });

  it('renders fence chips', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('metalowe')).toBeInTheDocument();
  });

  it('renders vicinity chips', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.getByText('las')).toBeInTheDocument();
    expect(screen.getByText('jezioro')).toBeInTheDocument();
  });

  it('does not render rental section when no rental data', () => {
    render(<HouseDetailsPanel details={baseDetails} />);
    expect(screen.queryByText('Warunki najmu')).not.toBeInTheDocument();
  });

  it('renders rental section when rent is provided', () => {
    render(<HouseDetailsPanel details={{ ...baseDetails, rent: 3000, rentCurrency: 'PLN' }} />);
    expect(screen.getByText('Warunki najmu')).toBeInTheDocument();
    expect(screen.getByText('3000 PLN')).toBeInTheDocument();
  });

  it('does not render empty security section', () => {
    render(<HouseDetailsPanel details={{ ...baseDetails, security: [] }} />);
    expect(screen.queryByText('Zabezpieczenia')).not.toBeInTheDocument();
  });

  it('renders null gracefully', () => {
    const { container } = render(<HouseDetailsPanel details={null} />);
    expect(container.firstChild).toBeNull();
  });
});
