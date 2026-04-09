export type SequencePrefix = string;

export interface Sequence {
  prefix: SequencePrefix;
  sequence: string;
}

export interface Range<T> {
  start: T;
  end: T;
}

export interface Conflict {
  id?: string;
  ncf?: string;
}

export interface LedgerEntry {
  number?: number;
  ncf?: string;
  step?: number;
  normalizedDigits?: string;
  invoices?: Conflict[];
  prefix?: string;
}

export interface SequenceInsights {
  currentConflict: LedgerEntry | null;
  availableBefore: LedgerEntry[];
  availableAfter: LedgerEntry[];
  usedBefore: LedgerEntry[];
  usedAfter: LedgerEntry[];
  lastUsed: LedgerEntry | null;
}

export type SequenceConflictReason =
  | 'invalid-sequence'
  | 'current-sequence-used'
  | 'next-sequence-used'
  | string;

export interface SequenceConflictResult {
  ok: boolean;
  reason?: SequenceConflictReason;
  prefix?: string;
  nextNumber?: number;
  nextDigits?: string;
  nextDigitsLength?: number;
  sequenceLength?: number;
  conflicts?: Conflict[];
  insights?: SequenceInsights;
  hasCurrentConflict?: boolean;
  hasImmediateNextConflict?: boolean;
  source?: 'ledger';
  metadata?: Record<string, unknown> | null;
}

export interface Warning {
  accepted: boolean;
  warned: boolean;
}

export type SequenceWarning = Warning;

export type SequenceLengthResolver = (
  normalizedDigitsLength: number | null | undefined,
  explicitLength?: number | null,
) => number | null | undefined;

export type SequencePosition = 'current' | 'before' | 'after';

export interface SequenceMeta {
  number: number;
  step: number;
  position: SequencePosition;
  normalizedDigits: string;
  paddedDigits: string;
  rawDigits: string;
  ncf: string;
  invoices: Conflict[];
}

export interface LedgerInsightsPayload {
  businessId: string;
  userId: string;
  prefix: string;
  sequenceNumber: number;
  normalizedDigits: string;
  increment: number;
  windowBefore: number;
  windowAfter: number;
  quantitySteps: number;
  sequenceLength: number | null | undefined;
}

export interface LedgerInsightsResponse {
  source: 'ledger';
  ok?: boolean;
  reason?: string;
  prefix?: string;
  nextNumber?: number;
  nextDigits?: string;
  normalizedDigits?: string;
  hasCurrentConflict?: boolean;
  hasImmediateNextConflict?: boolean;
  conflicts?: Conflict[];
  insights?: SequenceInsights;
  metadata?: Record<string, unknown> | null;
}

export interface LedgerErrorResponse {
  source: 'ledger-error';
  error?: string;
}

export type LedgerResponse = LedgerInsightsResponse | LedgerErrorResponse;

export interface SequenceAnalysisStateLoose {
  status?: string;
  result?: unknown;
  error?: unknown;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isSequenceConflictResult = (
  value: unknown,
): value is SequenceConflictResult => {
  if (!isRecord(value)) return false;
  return typeof value.ok === 'boolean';
};

export const MAX_IN_QUERY_VALUES = 10;
export const MAX_VARIATIONS = 30;

export const sanitizePart = (value: unknown): string =>
  (value ?? '').toString().trim();

export const collapseWhitespace = (value: unknown): string =>
  sanitizePart(value).replace(/\s+/g, '');

export const toDigits = (value: unknown): string =>
  collapseWhitespace(value).replace(/\D/g, '');

export const normalizeDigits = (digits?: string | number | null): string => {
  if (!digits) return '';
  const trimmed = digits.toString().replace(/^0+/, '');
  return trimmed.length ? trimmed : '0';
};

export const resolveIncrement = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 1;
  }
  return numeric;
};

const isNumericSerie = (value: string): boolean => /^\d+$/.test(value);

export const buildPrefix = (type: unknown, serie: unknown): string => {
  const firstPart = sanitizePart(type).toUpperCase();
  const secondPart = sanitizePart(serie).toUpperCase();

  if (!firstPart && !secondPart) return '';

  const firstIsNumeric = isNumericSerie(firstPart);
  const secondIsNumeric = isNumericSerie(secondPart);

  const typePart = firstIsNumeric && !secondIsNumeric ? secondPart : firstPart;
  const seriePart = firstIsNumeric && !secondIsNumeric ? firstPart : secondPart;

  const normalizedSerie = isNumericSerie(seriePart)
    ? seriePart.padStart(2, '0')
    : seriePart;

  const prefix = `${typePart}${normalizedSerie}`;
  return prefix;
};

export const chunkArray = <T>(
  array: T[] | null | undefined,
  size: number,
): T[][] => {
  if (!Array.isArray(array) || size <= 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk = array.slice(i, i + size);
    if (chunk.length) chunks.push(chunk);
  }
  return chunks;
};

export const canonicalizeInvoiceNcf = (
  ncf: unknown,
  prefix: string,
): Sequence | null => {
  if (typeof ncf !== 'string' || !prefix) return null;
  const sanitized = collapseWhitespace(ncf).toUpperCase();
  if (!sanitized.startsWith(prefix)) return null;
  const sequenceDigits = sanitized.slice(prefix.length).replace(/\D/g, '');
  if (!sequenceDigits) return { prefix, sequence: '' };
  return { prefix, sequence: normalizeDigits(sequenceDigits) };
};

export const buildCandidateCodes = ({
  prefix,
  rawDigits,
  normalizedDigits,
  sequenceLengthEstimate,
}: {
  prefix: string;
  rawDigits: string;
  normalizedDigits: string;
  sequenceLengthEstimate?: number | null;
}): string[] => {
  if (!prefix || !rawDigits || !normalizedDigits) return [];

  const codes = new Set<string>();
  const addWithLength = (length: number) => {
    if (!Number.isFinite(length) || length <= 0) return;
    const padded = normalizedDigits.padStart(length, '0');
    codes.add(prefix + padded);
  };

  // Include the raw digits exactly as provided (without trimming leading zeros)
  codes.add(prefix + rawDigits);

  const minLength = Math.max(1, normalizedDigits.length);
  const targetLength = Number.isFinite(sequenceLengthEstimate)
    ? Math.max(minLength, sequenceLengthEstimate)
    : Math.max(minLength, rawDigits.length);

  for (
    let length = minLength;
    length <= targetLength && codes.size < MAX_VARIATIONS;
    length += 1
  ) {
    addWithLength(length);
  }

  let extraLength = targetLength + 1;
  const maxExtraLength = minLength + 10;
  while (codes.size < MAX_VARIATIONS && extraLength <= maxExtraLength) {
    addWithLength(extraLength);
    extraLength += 1;
  }

  return Array.from(codes);
};

export const calculateSequenceNumber = ({
  digits,
  increment = 1,
  steps = 0,
}: {
  digits: unknown;
  increment?: number;
  steps?: number;
}): { number: number; rawDigits: string; normalizedDigits: string } | null => {
  const normalizedDigits = normalizeDigits(toDigits(digits ?? ''));
  const baseNumber = Number(normalizedDigits);
  if (!Number.isFinite(baseNumber)) return null;

  const safeIncrement = resolveIncrement(increment);
  const resultNumber = baseNumber + safeIncrement * steps;

  if (!Number.isFinite(resultNumber)) return null;

  return {
    number: resultNumber,
    rawDigits: resultNumber.toString(),
    normalizedDigits: normalizeDigits(resultNumber.toString()),
  };
};
