import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer branding', () => {
  it('renders the accessible Global S Home logo asset', () => {
    render(<Footer />);

    expect(screen.getByRole('img', { name: 'Global S Home' })).toHaveAttribute(
      'src',
      '/assets/global-s-home-logo.svg',
    );
  });
});
