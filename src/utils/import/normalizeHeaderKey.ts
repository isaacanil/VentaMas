import { stripDiacritics } from '../text';

export const normalizeHeaderKey = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return stripDiacritics(value.toString().trim().toLowerCase())
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const normalizeCompactHeaderKey = (value: unknown): string =>
  normalizeHeaderKey(value).replace(/[^a-z0-9]+/g, '');
