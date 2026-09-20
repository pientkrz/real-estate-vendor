import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FilterSelect from './FilterSelect';

const COUNTRY_OPTIONS = [
  { value: 'Cyprus', label: 'Cyprus' },
  { value: 'Greece', label: 'Greece' },
];

const originalMatchMedia = window.matchMedia;
const setViewport = (isMobile) => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === '(max-width: 767px)' ? isMobile : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
};

describe('FilterSelect', () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.body.style.overflow = '';
  });

  it('keeps a multi-select draft local until the visitor applies it', () => {
    const onApply = vi.fn();
    render(<FilterSelect label="Lokalizacja" value={[]} options={COUNTRY_OPTIONS} multiple summary="Wszystkie kraje" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: /wszystkie kraje/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cyprus' }));

    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'Cyprus' })).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Zastosuj' }));
    expect(onApply).toHaveBeenCalledWith(['Cyprus']);
  });

  it('discards an unconfirmed selection when cancelled', () => {
    const onApply = vi.fn();
    render(<FilterSelect label="Lokalizacja" value={[]} options={COUNTRY_OPTIONS} multiple summary="Wszystkie kraje" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: /wszystkie kraje/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cyprus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
    fireEvent.click(screen.getByRole('button', { name: /wszystkie kraje/i }));

    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'Cyprus' })).not.toBeChecked();
  });

  it('uses radios for a single-select filter and closes on Escape', () => {
    const onApply = vi.fn();
    render(<FilterSelect label="Pokoje" value="" options={[{ value: '', label: 'Dowolna' }, { value: '3', label: '3+' }]} summary="Dowolna" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: /dowolna/i }));
    fireEvent.click(screen.getByRole('radio', { name: '3+' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Pokoje' })).not.toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('uses non-modal popover semantics on desktop and restores trigger focus', () => {
    setViewport(false);
    render(<FilterSelect label="Sortuj według" value="price-desc" options={[{ value: 'price-desc', label: 'Cena: malejąco' }]} summary="Cena: malejąco" onApply={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /cena: malejąco/i });
    fireEvent.click(trigger);
    const panel = screen.getByRole('dialog', { name: 'Sortuj według' });

    expect(panel).not.toHaveAttribute('aria-modal');
    expect(panel).toHaveAttribute('data-filter-mode', 'desktop');
    expect(document.body.style.overflow).toBe('');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });

  it('renders every desktop popover in the body portal and keeps inside clicks open', () => {
    setViewport(false);
    render(<FilterSelect label="Typ nieruchomości" value={[]} options={COUNTRY_OPTIONS} multiple summary="Wszystkie typy" onApply={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /wszystkie typy/i });
    fireEvent.click(trigger);
    const panel = screen.getByRole('dialog', { name: 'Typ nieruchomości' });

    expect(panel.parentElement).toBe(document.body);
    expect(panel).toHaveStyle({ visibility: 'visible' });
    expect(panel.style.top).toMatch(/px$/);
    expect(panel.style.left).toMatch(/px$/);

    fireEvent.pointerDown(panel);
    expect(screen.getByRole('dialog', { name: 'Typ nieruchomości' })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'Typ nieruchomości' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('uses modal semantics, traps focus, and locks scrolling on mobile', () => {
    setViewport(true);
    render(<FilterSelect label="Lokalizacja" value={[]} options={COUNTRY_OPTIONS} multiple summary="Wszystkie kraje" onApply={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /wszystkie kraje/i });
    fireEvent.click(trigger);
    const panel = screen.getByRole('dialog', { name: 'Lokalizacja' });
    const closeButton = screen.getByRole('button', { name: 'Zamknij: Lokalizacja' });
    const applyButton = screen.getByRole('button', { name: 'Zastosuj' });

    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(panel).toHaveAttribute('aria-labelledby');
    expect(panel).toHaveAttribute('data-filter-mode', 'mobile');
    expect(document.body.style.overflow).toBe('hidden');
    expect(closeButton).toHaveFocus();

    applyButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(applyButton).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Zamknij filtr: Lokalizacja' }));
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
  });
});
