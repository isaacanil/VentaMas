type IdempotencyFingerprintInput = {
  accountsReceivable?: unknown;
  businessId?: string | null;
  cart?: unknown;
  client?: unknown;
  dueDate?: number | null;
  hasDueDate?: boolean;
  insuranceAR?: unknown;
  insuranceAuth?: unknown;
  insuranceEnabled?: boolean;
  invoiceComment?: string | null;
  isTestMode?: boolean;
  monetaryContext?: unknown;
  ncfType?: string | null;
  seed: string;
  serviceCommissions?: unknown;
  taxReceiptEnabled?: boolean;
  userId?: string | null;
};

const normalizeForFingerprint = (
  value: unknown,
  seen = new WeakSet<object>(),
): unknown => {
  if (value === null || value === undefined) return null;

  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return Number.isFinite(value as number) || typeof value !== 'number'
      ? value
      : null;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForFingerprint(item, seen));
  }

  if (typeof value !== 'object') {
    return null;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  const record = value as Record<string, unknown>;
  if (typeof record.path === 'string') {
    return { path: record.path };
  }

  const normalized = Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((accumulator, key) => {
      const item = record[key];
      if (typeof item === 'function' || item === undefined) {
        return accumulator;
      }
      accumulator[key] = normalizeForFingerprint(item, seen);
      return accumulator;
    }, {});

  seen.delete(value);
  return normalized;
};

const stableSerialize = (value: unknown): string => {
  try {
    return JSON.stringify(normalizeForFingerprint(value));
  } catch {
    return JSON.stringify({ fallback: Date.now() });
  }
};

const hashText = (text: string): string => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const high = (h2 >>> 0).toString(36).padStart(7, '0');
  const low = (h1 >>> 0).toString(36).padStart(7, '0');
  return `${high}${low}`;
};

const sanitizeKeySegment = (value: string): string =>
  value.replace(/[^A-Za-z0-9:_-]/g, '_').slice(0, 48);

export const buildInvoiceSubmissionIdempotencyKey = ({
  seed,
  ...input
}: IdempotencyFingerprintInput): string => {
  const fingerprint = hashText(stableSerialize(input));
  const safeSeed = sanitizeKeySegment(seed || 'submission');
  return `sale:${fingerprint}:${safeSeed}`;
};
