import { describe, expect, it } from 'vitest';
import { formatBlogCategories, getBlogCategories } from './blogCategories';

describe('blog categories', () => {
  it('uses all supplied categories in their normalized form', () => {
    expect(getBlogCategories({ categories: ['Dubaj', ' Inwestycje ', 'Dubaj'] }))
      .toEqual(['DUBAJ', 'INWESTYCJE']);
  });

  it('formats every category for article metadata', () => {
    expect(formatBlogCategories({ categories: ['Hiszpania', 'Inwestycje'] }))
      .toBe('HISZPANIA · INWESTYCJE');
  });
});
