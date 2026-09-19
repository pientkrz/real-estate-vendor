import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PhoneInput from './PhoneInput';

describe('PhoneInput', () => {
  it('renders national phone digits without formatting spaces while emitting E.164', () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} label="Numer telefonu" />);

    const input = screen.getByRole('textbox', { name: /numer telefonu/i });
    fireEvent.change(input, { target: { value: '333 333 333' } });

    expect(input).toHaveValue('333333333');
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'phone', value: '+48333333333' } });
  });

  it('does not duplicate the country calling code when a full number is pasted', () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} label="Numer telefonu" />);

    const input = screen.getByRole('textbox', { name: /numer telefonu/i });
    fireEvent.change(input, { target: { value: '+48 333 333 333' } });

    expect(input).toHaveValue('333333333');
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'phone', value: '+48333333333' } });
  });

  it('does not remove a national number that happens to start with the calling code', () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} label="Numer telefonu" />);

    const input = screen.getByRole('textbox', { name: /numer telefonu/i });
    fireEvent.change(input, { target: { value: '483333333' } });

    expect(input).toHaveValue('483333333');
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'phone', value: '+48483333333' } });
  });
});
