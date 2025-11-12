const CANCELLED_STATUSES = new Set([
  'cancelled',
  'canceled',
  'void',
  'voided',
  'annulled',
  'annulado',
  'deleted',
  'inactive',
  'disabled',
]);

const ENTRY_ID_PAD = 18;

export const sanitizePart = (value) => (value ?? '').toString().trim();

export const collapseWhitespace = (value) =>
  sanitizePart(value).replace(/\s+/g, '');

export const toDigits = (value) => collapseWhitespace(value).replace(/\D/g, '');

export const normalizeDigits = (digits) => {
  if (!digits) return '';
  const trimmed = digits.replace(/^0+/, '');
  return trimmed.length ? trimmed : '0';
};

export const sanitizePrefix = (rawPrefix) => {
  if (!rawPrefix) return '';
  return rawPrefix.replace(/[^0-9A-Z]/gi, '').toUpperCase();
};

export const canonicalizeNcf = (value) => {
  if (typeof value !== 'string') return null;
  const sanitized = collapseWhitespace(value).toUpperCase();
  if (!sanitized) return null;

  const seriePart = sanitized.slice(0, 1);
  const typePart = sanitized.slice(1, 3);
  const sequencePart = sanitized.slice(3);

  if (!seriePart || !sequencePart) {
    return null;
  }

  const rawPrefix = `${seriePart}${typePart}`;
  const prefix = sanitizePrefix(rawPrefix);
  if (!prefix) return null;

  const digitsRaw = toDigits(sequencePart);
  if (!digitsRaw) {
    return null;
  }
  const normalizedDigits = normalizeDigits(digitsRaw);
  const digitsLength = digitsRaw.length;

  let sequenceNumber = null;
  try {
    const numeric = Number(normalizedDigits);
    if (Number.isFinite(numeric)) {
      sequenceNumber = numeric;
    }
  } catch {
    sequenceNumber = null;
  }

  let sequenceBigInt = null;
  try {
    sequenceBigInt = BigInt(normalizedDigits || '0');
  } catch {
    sequenceBigInt = null;
  }

  const serie = sanitizePrefix(seriePart) || null;
  const type = sanitizePrefix(typePart) || null;

  return {
    prefix,
    rawPrefix,
    serie,
    type,
    digitsRaw,
    normalizedDigits,
    digitsLength,
    sequenceNumber,
    sequenceBigInt,
    ncf: sanitized,
  };
};

export const buildEntryId = (normalizedDigits) => {
  const safe = normalizeDigits(normalizedDigits ?? '');
  return safe.padStart(ENTRY_ID_PAD, '0');
};

export const isActiveInvoiceRecord = (record) => {
  if (!record) return false;
  if (record.removedAt) return false;
  const status = (record.status ?? '').toString().toLowerCase();
  if (!status) return true;
  return !CANCELLED_STATUSES.has(status);
};

export const countActiveInvoices = (records) => {
  if (!Array.isArray(records)) return 0;
  return records.reduce(
    (count, record) => count + (isActiveInvoiceRecord(record) ? 1 : 0),
    0,
  );
};

export const compareBigInts = (a, b) => {
  if (a === null && b === null) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  if (a === b) return 0;
  return a > b ? 1 : -1;
};
