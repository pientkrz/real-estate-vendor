const normaliseCategory = (value) => String(value || '').trim().toUpperCase();

/**
 * Returns the canonical categories for a blog entry.
 * `category` is supported only for articles written before `categories` was introduced.
 */
export function getBlogCategories(data, fallback = 'JOURNAL') {
  const supplied = Array.isArray(data?.categories) && data.categories.length > 0
    ? data.categories
    : data?.category
      ? [data.category]
      : [fallback];

  return [...new Set(supplied.map(normaliseCategory).filter(Boolean))];
}

export function formatBlogCategories(data, fallback) {
  return getBlogCategories(data, fallback).join(' · ');
}
