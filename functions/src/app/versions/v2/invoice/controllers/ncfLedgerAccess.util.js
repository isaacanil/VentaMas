import { sanitizePrefix } from '../utils/ncfLedger.util.js';

export const normalizePrefixes = (prefixes) => {
  if (!Array.isArray(prefixes)) return null;
  const normalized = prefixes
    .filter((item) => typeof item === 'string')
    .map((item) => sanitizePrefix(item))
    .filter((item) => !!item);
  return normalized.length ? Array.from(new Set(normalized)) : null;
};
