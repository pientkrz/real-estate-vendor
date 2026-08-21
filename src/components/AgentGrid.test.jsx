import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AgentGrid from './AgentGrid';

const mockAgents = [
  {
    id: '174162',
    name: 'Anna Nowak',
    phone: '+48 500 100 200',
    email: 'anna@globalshome.com',
  },
  {
    id: '189360',
    name: 'Piotr Wiśniewski',
    email: 'piotr@globalshome.com',
  },
];

// ── section header ─────────────────────────────────────────────────────────────

describe('AgentGrid — nagłówek sekcji', () => {
  it('renders the section heading', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Skontaktuj się z naszymi specjalistami');
  });

  it('renders the "Nasi eksperci" label', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getByText('Nasi eksperci')).toBeInTheDocument();
  });
});

// ── empty state ────────────────────────────────────────────────────────────────

describe('AgentGrid — pusta lista', () => {
  it('renders no agent cards when agents prop is empty', () => {
    render(<AgentGrid agents={[]} />);
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });

  it('renders no agent cards when agents prop is omitted', () => {
    render(<AgentGrid />);
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });
});

// ── agent cards ────────────────────────────────────────────────────────────────

describe('AgentGrid — karty agentów', () => {
  it('renders one card per agent', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(mockAgents.length);
  });

  it('renders each agent name', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByText('Piotr Wiśniewski')).toBeInTheDocument();
  });

  it('uses a clear fallback role when the provider does not supply one', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getAllByText('Doradca nieruchomości')).toHaveLength(mockAgents.length);
  });

  it('renders the placeholder image when the provider sends no photo', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getByAltText('Domyślne zdjęcie agenta: Anna Nowak')).toHaveAttribute('src', '/assets/agent-placeholder.svg');
    expect(screen.getByAltText('Domyślne zdjęcie agenta: Piotr Wiśniewski')).toHaveAttribute('src', '/assets/agent-placeholder.svg');
  });

  it('renders a provider photo when one is supplied', () => {
    render(<AgentGrid agents={[{ ...mockAgents[0], image: 'https://example.com/anna.jpg' }]} />);
    expect(screen.getByAltText('Anna Nowak')).toHaveAttribute('src', 'https://example.com/anna.jpg');
  });
});

// ── contact links ──────────────────────────────────────────────────────────────

describe('AgentGrid — linki kontaktowe', () => {
  it('renders a mailto link for each agent', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getByRole('link', { name: /anna@globalshome\.com/ })).toHaveAttribute('href', 'mailto:anna@globalshome.com');
    expect(screen.getByRole('link', { name: /piotr@globalshome\.com/ })).toHaveAttribute('href', 'mailto:piotr@globalshome.com');
  });

  it('renders a tel link for an agent with a phone number', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getByRole('link', { name: /\+48 500 100 200/ })).toHaveAttribute('href', 'tel:+48 500 100 200');
  });

  it('does not render an invalid tel link when the provider omits a phone number', () => {
    const { container } = render(<AgentGrid agents={[mockAgents[1]]} />);
    const telLink = container.querySelector('a[href="tel:undefined"]');
    expect(telLink).not.toBeInTheDocument();
  });
});
