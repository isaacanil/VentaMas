export const sanitizeNcf = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim().toUpperCase();
  }
  return '';
};

// Build a canonical key using the alphanumeric prefix and numeric suffix without leading zeros.
export const canonicalizeNcf = (raw: unknown): string => {
  const ncf = sanitizeNcf(raw);
  if (!ncf) return '';
  const match = ncf.match(/^([A-Z]+)?(\d+)$/);
  if (match) {
    const prefix = match[1] || '';
    const digits = match[2] || '';
    const normalizedNumber = digits.replace(/^0+/, '') || '0';
    return `${prefix}${normalizedNumber}`;
  }
  const compact = ncf.replace(/[^A-Z0-9]/g, '');
  const match2 = compact.match(/^([A-Z]+)?(\d+)$/);
  if (match2) {
    const prefix = match2[1] || '';
    const digits = match2[2] || '';
    const normalizedNumber = digits.replace(/^0+/, '') || '0';
    return `${prefix}${normalizedNumber}`;
  }
  return ncf;
};

export const looseCanonicalizeNcf = (raw: unknown): string => {
  const ncf = sanitizeNcf(raw);
  if (!ncf) return '';
  const alphanumeric = ncf.replace(/[^A-Z0-9]/g, '');
  if (!alphanumeric) return '';
  return alphanumeric.replace(/0{2,}/g, '0');
};

interface FirestoreTimestampLike {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

export const parseInvoiceDate = (rawDate: unknown): Date | null => {
  if (!rawDate) {
    return null;
  }
  const timestamp = rawDate as FirestoreTimestampLike;
  if (typeof timestamp.toDate === 'function') {
    try {
      const parsed = timestamp.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch (err) {
      console.error('parseInvoiceDate: error usando toDate()', err);
      return null;
    }
  }
  if (
    typeof rawDate === 'object' &&
    rawDate !== null &&
    typeof timestamp.seconds === 'number'
  ) {
    const milliseconds =
      timestamp.seconds * 1000 +
      Math.floor((timestamp.nanoseconds || 0) / 1e6);
    const parsed = new Date(milliseconds);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (rawDate instanceof Date) {
    return Number.isNaN(rawDate.getTime()) ? null : rawDate;
  }
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
