import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PropertyInquiryForm from './PropertyInquiryForm';

describe('PropertyInquiryForm', () => {
  it('expands and collapses the full consent wording without changing checkbox state', () => {
    render(<PropertyInquiryForm />);

    const consent = screen.getByRole('checkbox');
    const preview = 'Akceptuję. Dane osobowe ulegające przetwarzaniu ...';
    expect(screen.getByText(preview)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Polityka Prywatności' })).not.toBeInTheDocument();
    const expandButton = screen.getByRole('button', { name: 'Czytaj więcej' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(expandButton.parentElement.textContent).toMatch(/Akceptuję\. Dane osobowe ulegające przetwarzaniu \.\.\.\s*Czytaj więcej\.\.\./);
    expect(consent).not.toBeChecked();

    fireEvent.click(expandButton);
    expect(screen.queryByText(preview)).not.toBeInTheDocument();
    expect(screen.getByText(/Akceptuję\. Dane osobowe ulegające przetwarzaniu: imię i nazwisko, adres e-mail, numer telefonu\./)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Polityka Prywatności' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Zwiń' })).toHaveAttribute('aria-expanded', 'true');
    expect(consent).not.toBeChecked();

    fireEvent.click(consent);
    expect(consent).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Zwiń' }));
    expect(screen.getByText(preview)).toBeInTheDocument();
    expect(screen.queryByText(/Akceptuję\. Dane osobowe ulegające przetwarzaniu: imię i nazwisko, adres e-mail, numer telefonu\./)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Polityka Prywatności' })).not.toBeInTheDocument();
    expect(consent).toBeChecked();
  });
});
