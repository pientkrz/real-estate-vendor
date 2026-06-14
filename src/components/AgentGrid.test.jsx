import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AgentGrid from './AgentGrid';

const mockAgents = [
  {
    name: 'Anna Nowak',
    role: 'Dyrektor Sprzedaży',
    image: 'https://example.com/anna.jpg',
    languages: ['PL', 'EN'],
    phone: '+48 500 100 200',
    email: 'anna@globalshome.com',
  },
  {
    name: 'Piotr Wiśniewski',
    role: 'Doradca ds. Inwestycji',
    image: 'https://example.com/piotr.jpg',
    languages: ['PL', 'DE'],
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

  it('renders each agent role', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getByText('Dyrektor Sprzedaży')).toBeInTheDocument();
    expect(screen.getByText('Doradca ds. Inwestycji')).toBeInTheDocument();
  });

  it('renders agent photo with correct alt text', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getByAltText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByAltText('Piotr Wiśniewski')).toBeInTheDocument();
  });

  it('renders agent photo with correct src', () => {
    render(<AgentGrid agents={mockAgents} />);
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

  it('renders a tel link even when agent has no phone number', () => {
    const { container } = render(<AgentGrid agents={[mockAgents[1]]} />);
    const telLink = container.querySelector('a[href="tel:undefined"]');
    expect(telLink).toBeInTheDocument();
  });
});

// ── language badges ────────────────────────────────────────────────────────────

describe('AgentGrid — odznaki języków', () => {
  it('renders all language badges for an agent', () => {
    render(<AgentGrid agents={[mockAgents[0]]} />);
    expect(screen.getByText('PL')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('renders only the correct language badges for each agent', () => {
    render(<AgentGrid agents={mockAgents} />);
    // Anna has PL+EN, Piotr has PL+DE — PL appears twice, EN and DE once each
    expect(screen.getAllByText('PL')).toHaveLength(2);
    expect(screen.getAllByText('EN')).toHaveLength(1);
    expect(screen.getAllByText('DE')).toHaveLength(1);
  });
});

// ── action button ──────────────────────────────────────────────────────────────

describe('AgentGrid — przycisk akcji', () => {
  it('renders an "Umów spotkanie" button for each agent', () => {
    render(<AgentGrid agents={mockAgents} />);
    expect(screen.getAllByRole('button', { name: /umów spotkanie/i })).toHaveLength(mockAgents.length);
  });
});
