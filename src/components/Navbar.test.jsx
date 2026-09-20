import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import Navbar from './Navbar';

describe('Navbar', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    document.body.style.overflow = '';
  });

  it('exposes the home link and opens the mobile navigation with all routes', () => {
    render(<Navbar />);

    expect(screen.getAllByRole('link', { name: 'Global S Home' })[0]).toHaveAttribute('href', '/');
    const menuButton = screen.getByRole('button', { name: 'Otwórz menu nawigacji' });
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('dialog', { name: 'Menu' });
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByRole('navigation', { name: 'Nawigacja mobilna' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Nieruchomości' })).toHaveAttribute('href', '/');
    expect(within(panel).getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(within(panel).getByRole('link', { name: 'O Nas' })).toHaveAttribute('href', '/o-nas');
    expect(within(panel).getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/contact');
  });

  it('closes with Escape, backdrop click, and a navigation link', () => {
    render(<Navbar />);
    const menuButton = screen.getByRole('button', { name: 'Otwórz menu nawigacji' });

    fireEvent.click(menuButton);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(menuButton).toHaveFocus();

    fireEvent.click(menuButton);
    fireEvent.click(screen.getAllByRole('button', { name: 'Zamknij menu nawigacji' }).at(-1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(menuButton);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('link', { name: 'Blog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks the current section, including property details, as active', () => {
    window.history.replaceState({}, '', '/property/191-2');
    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Otwórz menu nawigacji' }));
    const panel = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(panel).getByRole('link', { name: 'Nieruchomości' })).toHaveAttribute('aria-current', 'page');
    expect(within(panel).getByRole('link', { name: 'Blog' })).not.toHaveAttribute('aria-current', 'page');
  });

  it('keeps focus inside the open mobile panel when tabbing', () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Otwórz menu nawigacji' }));
    const panel = screen.getByRole('dialog', { name: 'Menu' });
    const closeButton = screen.getAllByRole('button', { name: 'Zamknij menu nawigacji' }).at(-1);

    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(panel).toContainElement(document.activeElement);

    panel.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(panel).toContainElement(document.activeElement);
  });
});
