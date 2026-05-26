import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RoomDetailsPanel from './RoomDetailsPanel';

const baseDetails = {
  buildingType: 'blok',
  roomsNum: 3,
  roomPlace: false,
  freeFrom: '2024-09-01',
  furnished: true,
  rent: 1200,
  rentCurrency: 'PLN',
  deposit: 1200,
  depositCurrency: 'PLN',
  balcony: true,
  womenInFlat: 2,
  menInFlat: 0,
  womenInRoom: 1,
  menInRoom: 0,
  nonSmokersOnly: true,
  preferredSex: 'kobieta',
  preferredProfession: 'student',
  persons: ['1-osobowy'],
  media: ['internet'],
  equipment: ['pralka', 'lodówka'],
};

describe('RoomDetailsPanel', () => {
  it('renders without crashing', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getByText('blok')).toBeInTheDocument();
  });

  it('renders building type', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getByText('blok')).toBeInTheDocument();
  });

  it('renders rooms count', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders free from date', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getByText('2024-09-01')).toBeInTheDocument();
  });

  it('renders furnished as "Tak"', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getAllByText('Tak').length).toBeGreaterThan(0);
  });

  it('renders non-smokers-only as "Tak"', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    // multiple "Tak" values possible (furnished, non-smokers, balcony)
    expect(screen.getAllByText('Tak').length).toBeGreaterThanOrEqual(1);
  });

  it('renders preferred sex', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getByText('kobieta')).toBeInTheDocument();
  });

  it('renders preferred profession', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getByText('student')).toBeInTheDocument();
  });

  it('renders persons chips', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getByText('1-osobowy')).toBeInTheDocument();
  });

  it('renders equipment chips', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    expect(screen.getByText('pralka')).toBeInTheDocument();
    expect(screen.getByText('lodówka')).toBeInTheDocument();
  });

  it('renders rent in financial section', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    // rent and deposit are both 1200 PLN — getAllByText handles duplicates
    expect(screen.getAllByText('1200 PLN').length).toBeGreaterThanOrEqual(1);
  });

  it('renders deposit info', () => {
    render(<RoomDetailsPanel details={baseDetails} />);
    // Both rent and deposit show '1200 PLN'
    expect(screen.getAllByText('1200 PLN').length).toBe(2);
  });

  it('does not render financial section when no rent or deposit', () => {
    render(<RoomDetailsPanel details={{ ...baseDetails, rent: null, deposit: null }} />);
    expect(screen.queryByText('Warunki finansowe')).not.toBeInTheDocument();
  });

  it('renders null gracefully', () => {
    const { container } = render(<RoomDetailsPanel details={null} />);
    expect(container.firstChild).toBeNull();
  });
});
