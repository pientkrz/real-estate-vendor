import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PropertyDetailsPanel from './PropertyDetailsPanel';

/**
 * Builds a minimal offer object that contains enough rawDetails
 * to render the panel for the given objectName.
 */
const makeOffer = (objectName, rawDetails = {}) => ({ objectName, rawDetails });

describe('PropertyDetailsPanel', () => {
  it('renders null when offer is null', () => {
    const { container } = render(<PropertyDetailsPanel offer={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null for an unknown objectName', () => {
    const { container } = render(<PropertyDetailsPanel offer={makeOffer(99)} />);
    expect(container.firstChild).toBeNull();
  });

  // ── Flat (0) ──────────────────────────────────────────────────────────────

  it('renders FlatDetailsPanel for objectName=0', () => {
    const offer = makeOffer(0, { BuildingType: 0, RoomsNum: 3 });
    render(<PropertyDetailsPanel offer={offer} />);
    // FlatDetailsPanel always renders its "Dane budynku" heading
    expect(screen.getByText('Dane budynku')).toBeInTheDocument();
    // "blok" comes from BuildingType=0 via resolver
    expect(screen.getByText('blok')).toBeInTheDocument();
  });

  it('resolves FlatDetails RoomsNum', () => {
    const offer = makeOffer(0, { RoomsNum: 4 });
    render(<PropertyDetailsPanel offer={offer} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  // ── House (1) ─────────────────────────────────────────────────────────────

  it('renders HouseDetailsPanel for objectName=1', () => {
    const offer = makeOffer(1, { BuildingType: 0, RoomsNum: 5 });
    render(<PropertyDetailsPanel offer={offer} />);
    expect(screen.getByText('Dane posesji')).toBeInTheDocument();
    expect(screen.getByText('wolnostojący')).toBeInTheDocument();
  });

  // ── Terrain (2) ───────────────────────────────────────────────────────────

  it('renders TerrainDetailsPanel for objectName=2', () => {
    const offer = makeOffer(2, { Type: 0, Dimensions: '30x50' });
    render(<PropertyDetailsPanel offer={offer} />);
    expect(screen.getByText('Dane działki')).toBeInTheDocument();
    expect(screen.getByText('budowlana')).toBeInTheDocument();
    expect(screen.getByText('30x50')).toBeInTheDocument();
  });

  // ── Room (3) ──────────────────────────────────────────────────────────────

  it('renders RoomDetailsPanel for objectName=3', () => {
    const offer = makeOffer(3, { BuildingType: 0, RoomsNum: 2 });
    render(<PropertyDetailsPanel offer={offer} />);
    expect(screen.getByText('Dane pokoju')).toBeInTheDocument();
    expect(screen.getByText('blok')).toBeInTheDocument();
  });

  // ── CommercialProperty (4) ────────────────────────────────────────────────

  it('renders CommercialPropertyDetailsPanel for objectName=4', () => {
    const offer = makeOffer(4, { BuildingType: 3, Floor: 1 });
    render(<PropertyDetailsPanel offer={offer} />);
    expect(screen.getByText('Dane lokalu')).toBeInTheDocument();
    expect(screen.getByText('w kamienicy')).toBeInTheDocument();
    expect(screen.getByText('parter')).toBeInTheDocument();
  });

  // ── Hall (5) ──────────────────────────────────────────────────────────────

  it('renders HallDetailsPanel for objectName=5', () => {
    const offer = makeOffer(5, { Structure: 0, Height: 10 });
    render(<PropertyDetailsPanel offer={offer} />);
    expect(screen.getByText('Dane obiektu')).toBeInTheDocument();
    expect(screen.getByText('stalowa')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  // ── Garage (6) ────────────────────────────────────────────────────────────

  it('renders GarageDetailsPanel for objectName=6', () => {
    const offer = makeOffer(6, { Localization: 1, Structure: 0 });
    render(<PropertyDetailsPanel offer={offer} />);
    expect(screen.getByText('Dane garażu')).toBeInTheDocument();
    expect(screen.getByText('samodzielny')).toBeInTheDocument();
    expect(screen.getByText('murowany')).toBeInTheDocument();
  });

  // ── rawDetails = null ─────────────────────────────────────────────────────

  it('renders gracefully when rawDetails is null', () => {
    const offer = makeOffer(0, null);
    render(<PropertyDetailsPanel offer={offer} />);
    // Should render the FlatDetailsPanel skeleton with empty fields, no crash
    expect(screen.getByText('Dane budynku')).toBeInTheDocument();
  });
});
