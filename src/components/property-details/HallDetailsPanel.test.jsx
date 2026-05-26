import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HallDetailsPanel from './HallDetailsPanel';

const baseDetails = {
  structure: 'stalowa',
  constructionStatus: 'gotowe',
  height: 8,
  heating: true,
  officeSpace: true,
  socialFacilities: false,
  ramp: true,
  fence: 'tak',
  parking: 'asfaltowy',
  flooring: 'niepylna',
  access: ['asfalt'],
  use: ['magazynowe', 'produkcyjne'],
  media: ['prąd', 'woda'],
  security: ['monitoring / ochrona'],
};

describe('HallDetailsPanel', () => {
  it('renders without crashing', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('stalowa')).toBeInTheDocument();
  });

  it('renders structure', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('stalowa')).toBeInTheDocument();
  });

  it('renders construction status', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('gotowe')).toBeInTheDocument();
  });

  it('renders height', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders heating as "Tak"', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getAllByText('Tak').length).toBeGreaterThan(0);
  });

  it('renders social facilities as "Nie"', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getAllByText('Nie').length).toBeGreaterThan(0);
  });

  it('renders parking type', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('asfaltowy')).toBeInTheDocument();
  });

  it('renders flooring type', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('niepylna')).toBeInTheDocument();
  });

  it('renders use chips', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('magazynowe')).toBeInTheDocument();
    expect(screen.getByText('produkcyjne')).toBeInTheDocument();
  });

  it('renders access chips', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('asfalt')).toBeInTheDocument();
  });

  it('renders security chips', () => {
    render(<HallDetailsPanel details={baseDetails} />);
    expect(screen.getByText('monitoring / ochrona')).toBeInTheDocument();
  });

  it('does not render media section when empty', () => {
    render(<HallDetailsPanel details={{ ...baseDetails, media: [] }} />);
    expect(screen.queryByText('Media')).not.toBeInTheDocument();
  });

  it('renders null gracefully', () => {
    const { container } = render(<HallDetailsPanel details={null} />);
    expect(container.firstChild).toBeNull();
  });
});
