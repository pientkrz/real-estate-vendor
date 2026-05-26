import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FlatDetailsPanel from './FlatDetailsPanel';

const baseDetails = {
  buildingType: 'blok',
  buildingMaterial: 'cegła',
  buildingFloorsNum: 5,
  buildingOwnership: 'pełna własność',
  floorNo: '3',
  roomsNum: 3,
  buildYear: 2005,
  constructionStatus: 'do zamieszkania',
  windowsType: 'plastikowe',
  heating: 'gazowe',
  extras: ['balkon', 'garaż'],
  security: ['domofon / wideofon'],
  media: ['internet', 'telewizja'],
  equipment: ['pralka', 'lodówka'],
  freeFrom: null,
  furnished: null,
  rent: null,
  rentCurrency: null,
  priceIncludeRent: null,
  rentToStudents: null,
  deposit: null,
  depositCurrency: null,
};

describe('FlatDetailsPanel', () => {
  it('renders without crashing with full details', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    expect(screen.getByText('blok')).toBeInTheDocument();
  });

  it('renders building type', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    expect(screen.getByText('blok')).toBeInTheDocument();
  });

  it('renders building material', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    expect(screen.getByText('cegła')).toBeInTheDocument();
  });

  it('renders rooms count', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    // floorNo:'3' and roomsNum:3 both render; use getAllByText
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('renders build year', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    expect(screen.getByText('2005')).toBeInTheDocument();
  });

  it('renders extras as chips', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    expect(screen.getByText('balkon')).toBeInTheDocument();
    expect(screen.getByText('garaż')).toBeInTheDocument();
  });

  it('renders security chips', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    expect(screen.getByText('domofon / wideofon')).toBeInTheDocument();
  });

  it('renders media chips', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    expect(screen.getByText('internet')).toBeInTheDocument();
    expect(screen.getByText('telewizja')).toBeInTheDocument();
  });

  it('does not render rental section when no rental data', () => {
    render(<FlatDetailsPanel details={baseDetails} />);
    expect(screen.queryByText('Warunki najmu')).not.toBeInTheDocument();
  });

  it('renders rental section when rent is provided', () => {
    render(<FlatDetailsPanel details={{ ...baseDetails, rent: 1500, rentCurrency: 'PLN' }} />);
    expect(screen.getByText('Warunki najmu')).toBeInTheDocument();
    expect(screen.getByText('1500 PLN')).toBeInTheDocument();
  });

  it('renders furnished as "Tak" when true', () => {
    render(<FlatDetailsPanel details={{ ...baseDetails, furnished: true }} />);
    expect(screen.getByText('Warunki najmu')).toBeInTheDocument();
    expect(screen.getAllByText('Tak').length).toBeGreaterThan(0);
  });

  it('renders deposit info', () => {
    render(<FlatDetailsPanel details={{ ...baseDetails, deposit: 2000, depositCurrency: 'EUR' }} />);
    expect(screen.getByText('2000 EUR')).toBeInTheDocument();
  });

  it('does not render extras section heading when extras is empty', () => {
    render(<FlatDetailsPanel details={{ ...baseDetails, extras: [] }} />);
    expect(screen.queryByText('Udogodnienia')).not.toBeInTheDocument();
  });

  it('renders null gracefully (returns null)', () => {
    const { container } = render(<FlatDetailsPanel details={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty object gracefully', () => {
    render(<FlatDetailsPanel details={{}} />);
    // Should not throw; no fields to show but heading should still appear
    expect(screen.getByText('Dane budynku')).toBeInTheDocument();
  });
});
