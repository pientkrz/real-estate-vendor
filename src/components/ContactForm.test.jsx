import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import ContactForm from './ContactForm';

afterEach(() => vi.unstubAllGlobals());

describe('ContactForm', () => {
  it('renders form fields correctly', () => {
    render(<ContactForm />);
    expect(screen.getByPlaceholderText(/Opisz nieruchomość/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wyślij zapytanie/i })).toBeInTheDocument();
  });

  it('submit button is available initially', () => {
    render(<ContactForm />);
    const button = screen.getByRole('button', { name: /Wyślij zapytanie/i });
    expect(button).toBeEnabled();
  });

  it('enables submit button when RODO checkbox is checked', () => {
    render(<ContactForm />);
    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByRole('button', { name: /Wyślij zapytanie/i });

    expect(button).toBeEnabled();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(button).toBeEnabled();
  });

  it('explains missing consent, focuses the checkbox, and clears the error when checked', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<ContactForm />);
    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByRole('button', { name: /Wyślij zapytanie/i });

    fireEvent.click(button);

    expect(screen.getByRole('alert')).toHaveTextContent('Zaznacz zgodę, aby wysłać zapytanie.');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(document.activeElement).toBe(checkbox);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
