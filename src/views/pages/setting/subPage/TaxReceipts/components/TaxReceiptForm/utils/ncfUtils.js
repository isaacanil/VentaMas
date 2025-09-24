export const MAX_IN_QUERY_VALUES = 10;
export const MAX_VARIATIONS = 30;

export const sanitizePart = (value) => (value ?? "").toString().trim();

export const collapseWhitespace = (value) => sanitizePart(value).replace(/\s+/g, "");

export const toDigits = (value) => collapseWhitespace(value).replace(/\D/g, "");

export const normalizeDigits = (digits) => {
  if (!digits) return "";
  const trimmed = digits.replace(/^0+/, "");
  return trimmed.length ? trimmed : "0";
};

export const resolveIncrement = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 1;
  }
  return numeric;
};

export const buildPrefix = (type, serie) => {
  const seriePart = sanitizePart(type).toUpperCase();
  const typePart = sanitizePart(serie).toUpperCase();
  const prefix = `${seriePart}${typePart}`;
  return prefix;
};

export const chunkArray = (array, size) => {
  if (!Array.isArray(array) || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk = array.slice(i, i + size);
    if (chunk.length) chunks.push(chunk);
  }
  return chunks;
};

export const canonicalizeInvoiceNcf = (ncf, prefix) => {
  if (typeof ncf !== "string" || !prefix) return null;
  const sanitized = collapseWhitespace(ncf).toUpperCase();
  if (!sanitized.startsWith(prefix)) return null;
  const sequenceDigits = sanitized.slice(prefix.length).replace(/\D/g, "");
  if (!sequenceDigits) return { prefix, sequence: "" };
  return { prefix, sequence: normalizeDigits(sequenceDigits) };
};

export const buildCandidateCodes = ({
  prefix,
  rawDigits,
  normalizedDigits,
  sequenceLengthEstimate,
}) => {
  if (!prefix || !rawDigits || !normalizedDigits) return [];

  const codes = new Set();
  const addWithLength = (length) => {
    if (!Number.isFinite(length) || length <= 0) return;
    const padded = normalizedDigits.padStart(length, "0");
    codes.add(prefix + padded);
  };

  // Include the raw digits exactly as provided (without trimming leading zeros)
  codes.add(prefix + rawDigits);

  const minLength = Math.max(1, normalizedDigits.length);
  const targetLength = Number.isFinite(sequenceLengthEstimate)
    ? Math.max(minLength, sequenceLengthEstimate)
    : Math.max(minLength, rawDigits.length);

  for (let length = minLength; length <= targetLength && codes.size < MAX_VARIATIONS; length += 1) {
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

export const calculateSequenceNumber = ({ digits, increment = 1, steps = 0 }) => {
  const normalizedDigits = normalizeDigits(toDigits(digits ?? ""));
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
