import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PropertyInquiryForm from './PropertyInquiryForm';

describe('PropertyInquiryForm', () => {
  it('shows the full consent wording beside the required checkbox', () => {
    render(<PropertyInquiryForm />);

    const consent = screen.getByRole('checkbox');
    expect(screen.getByText(/Akceptuję\. Dane osobowe ulegające przetwarzaniu: imię i nazwisko, adres e-mail, numer telefonu\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Polityka Prywatności' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Czytaj więcej' })).not.toBeInTheDocument();
    expect(consent).not.toBeChecked();

    fireEvent.click(consent);
    expect(consent).toBeChecked();
  });
});
