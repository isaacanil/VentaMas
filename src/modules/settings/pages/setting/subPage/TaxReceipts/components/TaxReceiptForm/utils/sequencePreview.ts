// @ts-nocheck
import {
  buildPrefix,
  calculateSequenceNumber,
  normalizeDigits,
  resolveIncrement,
  toDigits,
} from './ncfUtils';

const EMPTY_PREVIEW = {
  current: '',
  next: '',
  last: '',
  prefix: '',
  sequenceLength: 0,
};

export const buildSequencePreview = ({
  serieValue,
  tipoValue,
  sequenceValue,
  sequenceLengthValue,
  increaseValue,
  quantityValue,
  resolveSequenceLength,
} = {}) => {
  const prefix = buildPrefix(serieValue, tipoValue);
  const digits = toDigits(sequenceValue ?? '');
  const quantityNumeric = Number(quantityValue);

  if (!prefix && !digits) {
    return EMPTY_PREVIEW;
  }

  const resolver =
    typeof resolveSequenceLength === 'function'
      ? resolveSequenceLength
      : (length) => length;

  const normalizedCurrent = normalizeDigits(digits);
  const baseLengthCandidate =
    normalizedCurrent.length || Number(sequenceLengthValue) || 0;
  const resolvedLengthBase = resolver(baseLengthCandidate, sequenceLengthValue);

  if (!digits) {
    return {
      current: prefix || '',
      next: prefix || '',
      last: '',
      prefix: prefix || '',
      sequenceLength: resolvedLengthBase || 0,
    };
  }

  const baseNumber = Number(normalizedCurrent);

  const fallbackLength = resolvedLengthBase;
  const fallbackCurrent = prefix
    ? `${prefix}${normalizedCurrent.padStart(fallbackLength, '0')}`
    : '';

  if (!Number.isFinite(baseNumber)) {
    return {
      current: fallbackCurrent,
      next: fallbackCurrent,
      last: '',
      prefix: prefix || '',
      sequenceLength: resolvedLengthBase || 0,
    };
  }

  const increment = resolveIncrement(increaseValue);
  const nextSequence = calculateSequenceNumber({
    digits: normalizedCurrent,
    increment,
    steps: 1,
  });

  const quantityInt = Number.isFinite(quantityNumeric)
    ? Math.max(Math.floor(quantityNumeric), 0)
    : null;

  const lastSequence =
    quantityInt && quantityInt > 0
      ? calculateSequenceNumber({
          digits: normalizedCurrent,
          increment,
          steps: quantityInt,
        })
      : null;

  const resolvedLength = resolver(
    Math.max(
      normalizedCurrent.length,
      nextSequence?.normalizedDigits?.length ?? 0,
      lastSequence?.normalizedDigits?.length ?? 0,
    ),
    sequenceLengthValue,
  );

  const paddedCurrent = normalizedCurrent.padStart(resolvedLength, '0');
  const paddedNext = nextSequence?.normalizedDigits
    ? nextSequence.normalizedDigits.padStart(resolvedLength, '0')
    : paddedCurrent;
  const paddedLast = lastSequence?.normalizedDigits
    ? lastSequence.normalizedDigits.padStart(resolvedLength, '0')
    : '';

  return {
    current: prefix ? `${prefix}${paddedCurrent}` : '',
    next: prefix ? `${prefix}${paddedNext}` : '',
    last: prefix && paddedLast ? `${prefix}${paddedLast}` : '',
    prefix: prefix || '',
    sequenceLength: resolvedLength || 0,
  };
};
