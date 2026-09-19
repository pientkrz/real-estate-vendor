import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FilterSelect from './FilterSelect';

const COUNTRY_OPTIONS = [
  { value: 'Cyprus', label: 'Cyprus' },
  { value: 'Greece', label: 'Greece' },
];

describe('FilterSelect', () => {
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
});
