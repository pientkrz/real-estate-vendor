import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ContactForm from './ContactForm';

describe('ContactForm', () => {
  it('renders form fields correctly', () => {
    render(<ContactForm />);
    expect(screen.getByPlaceholderText(/Opisz nieruchomość/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wyślij zapytanie/i })).toBeInTheDocument();
  });

  it('submit button is disabled initially', () => {
    render(<ContactForm />);
    const button = screen.getByRole('button', { name: /Wyślij zapytanie/i });
    expect(button).toBeDisabled();
  });

  it('enables submit button when RODO checkbox is checked', () => {
    render(<ContactForm />);
    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByRole('button', { name: /Wyślij zapytanie/i });

    expect(button).toBeDisabled();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(button).toBeEnabled();
  });
});
