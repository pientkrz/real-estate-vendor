import { describe, expect, it } from 'vitest';
import { formatBlogCategories, getBlogCategories } from './blogCategories';

describe('blog categories', () => {
  it('uses all supplied categories in their normalized form', () => {
    expect(getBlogCategories({ categories: ['Dubaj', ' Inwestycje ', 'Dubaj'] }))
      .toEqual(['DUBAJ', 'INWESTYCJE']);
  });

  it('keeps articles with the former single category format compatible', () => {
    expect(getBlogCategories({ category: 'Cypr' })).toEqual(['CYPR']);
  });

  it('formats every category for article metadata', () => {
    expect(formatBlogCategories({ categories: ['Hiszpania', 'Inwestycje'] }))
      .toBe('HISZPANIA · INWESTYCJE');
  });
});
