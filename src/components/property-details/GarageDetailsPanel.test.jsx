import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GarageDetailsPanel from './GarageDetailsPanel';

describe('GarageDetailsPanel', () => {
  it('renders without crashing', () => {
    render(<GarageDetailsPanel details={{ localization: 'samodzielny', structure: 'murowany', heating: true, lighting: true }} />);
    expect(screen.getByText('samodzielny')).toBeInTheDocument();
  });

  it('renders localization', () => {
    render(<GarageDetailsPanel details={{ localization: 'w budynku', structure: null, heating: null, lighting: null }} />);
    expect(screen.getByText('w budynku')).toBeInTheDocument();
  });

  it('renders structure', () => {
    render(<GarageDetailsPanel details={{ localization: null, structure: 'drewniany', heating: null, lighting: null }} />);
    expect(screen.getByText('drewniany')).toBeInTheDocument();
  });

  it('renders heating as "Tak" when true', () => {
    render(<GarageDetailsPanel details={{ localization: null, structure: null, heating: true, lighting: null }} />);
    expect(screen.getByText('Tak')).toBeInTheDocument();
  });

  it('renders heating as "Nie" when false', () => {
    render(<GarageDetailsPanel details={{ localization: null, structure: null, heating: false, lighting: null }} />);
    expect(screen.getByText('Nie')).toBeInTheDocument();
  });

  it('renders lighting as "Tak" when true', () => {
    render(<GarageDetailsPanel details={{ localization: null, structure: null, heating: null, lighting: true }} />);
    expect(screen.getByText('Tak')).toBeInTheDocument();
  });

  it('does not render localization row when null', () => {
    render(<GarageDetailsPanel details={{ localization: null, structure: 'murowany', heating: null, lighting: null }} />);
    expect(screen.queryByText('Lokalizacja')).not.toBeInTheDocument();
  });

  it('renders null gracefully', () => {
    const { container } = render(<GarageDetailsPanel details={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty object gracefully (no rows, no crash)', () => {
    render(<GarageDetailsPanel details={{}} />);
    // section heading present, no rows
    expect(screen.getByText('Dane garażu')).toBeInTheDocument();
  });
});
