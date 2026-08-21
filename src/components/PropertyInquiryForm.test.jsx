import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PropertyInquiryForm from './PropertyInquiryForm';

describe('PropertyInquiryForm', () => {
  it('identifies the assigned agent when one is provided', () => {
    render(<PropertyInquiryForm agentName="Wojciech Danielak" />);

    expect(screen.getByText(/twoje zapytanie trafi bezpośrednio do/i)).toHaveTextContent('Wojciech Danielak');
  });

  it('does not render an assignment message without an agent', () => {
    render(<PropertyInquiryForm />);

    expect(screen.queryByText(/twoje zapytanie trafi bezpośrednio do/i)).not.toBeInTheDocument();
  });
});
