import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TerrainDetailsPanel from './TerrainDetailsPanel';

const baseDetails = {
  type: 'budowlana',
  dimensions: '30x50',
  access: 'asfaltowy',
  fence: true,
  media: ['prąd', 'woda'],
  vicinity: ['las'],
};

describe('TerrainDetailsPanel', () => {
  it('renders without crashing', () => {
    render(<TerrainDetailsPanel details={baseDetails} />);
    expect(screen.getByText('budowlana')).toBeInTheDocument();
  });

  it('renders plot type', () => {
    render(<TerrainDetailsPanel details={baseDetails} />);
    expect(screen.getByText('budowlana')).toBeInTheDocument();
  });

  it('renders dimensions', () => {
    render(<TerrainDetailsPanel details={baseDetails} />);
    expect(screen.getByText('30x50')).toBeInTheDocument();
  });

  it('renders access type', () => {
    render(<TerrainDetailsPanel details={baseDetails} />);
    expect(screen.getByText('asfaltowy')).toBeInTheDocument();
  });

  it('renders fence as "Tak" when true', () => {
    render(<TerrainDetailsPanel details={baseDetails} />);
    expect(screen.getByText('Tak')).toBeInTheDocument();
  });

  it('renders fence as "Nie" when false', () => {
    render(<TerrainDetailsPanel details={{ ...baseDetails, fence: false }} />);
    expect(screen.getByText('Nie')).toBeInTheDocument();
  });

  it('renders media chips', () => {
    render(<TerrainDetailsPanel details={baseDetails} />);
    expect(screen.getByText('prąd')).toBeInTheDocument();
    expect(screen.getByText('woda')).toBeInTheDocument();
  });

  it('renders vicinity chips', () => {
    render(<TerrainDetailsPanel details={baseDetails} />);
    expect(screen.getByText('las')).toBeInTheDocument();
  });

  it('does not render media section when empty', () => {
    render(<TerrainDetailsPanel details={{ ...baseDetails, media: [] }} />);
    expect(screen.queryByText('Media')).not.toBeInTheDocument();
  });

  it('renders null gracefully', () => {
    const { container } = render(<TerrainDetailsPanel details={null} />);
    expect(container.firstChild).toBeNull();
  });
});
