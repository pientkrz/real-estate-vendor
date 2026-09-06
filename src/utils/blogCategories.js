const normaliseCategory = (value) => String(value || '').trim().toUpperCase();

/** Returns the canonical categories supplied by a validated blog entry. */
export function getBlogCategories(data) {
  const supplied = Array.isArray(data?.categories) ? data.categories : [];

  return [...new Set(supplied.map(normaliseCategory).filter(Boolean))];
}

export function formatBlogCategories(data) {
  return getBlogCategories(data).join(' · ');
}
