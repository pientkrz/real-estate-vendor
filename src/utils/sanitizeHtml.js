import DOMPurify from 'isomorphic-dompurify';

export const sanitizeOpisHtml = (html) => html ? DOMPurify.sanitize(html) : '';
export const stripHtml = (html) => html ? DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }) : '';
