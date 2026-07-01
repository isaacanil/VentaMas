export type DominicanTaxIdKind = 'rnc' | 'cedula';

export type DominicanTaxIdInvalidReason =
  | 'missing'
  | 'invalid-length'
  | 'invalid-checksum';

export type DominicanTaxIdValidationResult =
  | {
      digitCount: number;
      digits: string;
      isValid: true;
      kind: DominicanTaxIdKind;
      reason: null;
    }
  | {
      digitCount: number | null;
      digits: string | null;
      isValid: false;
      kind: DominicanTaxIdKind | null;
      reason: DominicanTaxIdInvalidReason;
    };

const RNC_DIGIT_COUNT = 9;
const CEDULA_DIGIT_COUNT = 11;
const RNC_CHECKSUM_WEIGHTS = [7, 9, 8, 6, 5, 4, 3, 2] as const;
const CEDULA_CHECKSUM_WEIGHTS = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2] as const;

const normalizeRawValue = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed || null;
};

export const normalizeDominicanTaxIdDigits = (
  value: unknown,
): string | null => {
  const rawValue = normalizeRawValue(value);
  if (!rawValue) return null;

  const digits = rawValue.replace(/\D/g, '');
  return digits || null;
};

const resolveKindFromDigitCount = (
  digitCount: number,
): DominicanTaxIdKind | null => {
  if (digitCount === RNC_DIGIT_COUNT) return 'rnc';
  if (digitCount === CEDULA_DIGIT_COUNT) return 'cedula';
  return null;
};

const calculateCedulaCheckDigit = (digits: string) => {
  const sum = CEDULA_CHECKSUM_WEIGHTS.reduce((total, weight, index) => {
    const product = Number(digits[index]) * weight;
    return total + (product > 9 ? product - 9 : product);
  }, 0);

  return (10 - (sum % 10)) % 10;
};

const calculateRncCheckDigit = (digits: string) => {
  const sum = RNC_CHECKSUM_WEIGHTS.reduce(
    (total, weight, index) => total + Number(digits[index]) * weight,
    0,
  );
  const remainder = sum % 11;
  const checkDigit = 11 - remainder;

  if (checkDigit === 10) return 1;
  if (checkDigit === 11) return 0;
  return checkDigit;
};

const hasValidCheckDigit = (digits: string, kind: DominicanTaxIdKind) => {
  const expected =
    kind === 'rnc'
      ? calculateRncCheckDigit(digits)
      : calculateCedulaCheckDigit(digits);
  const actual = Number(digits.at(-1));

  return expected === actual;
};

export const validateDominicanTaxId = (
  value: unknown,
): DominicanTaxIdValidationResult => {
  const digits = normalizeDominicanTaxIdDigits(value);
  if (!digits) {
    return {
      digitCount: null,
      digits: null,
      isValid: false,
      kind: null,
      reason: 'missing',
    };
  }

  const kind = resolveKindFromDigitCount(digits.length);
  if (!kind) {
    return {
      digitCount: digits.length,
      digits,
      isValid: false,
      kind: null,
      reason: 'invalid-length',
    };
  }

  if (!hasValidCheckDigit(digits, kind)) {
    return {
      digitCount: digits.length,
      digits,
      isValid: false,
      kind,
      reason: 'invalid-checksum',
    };
  }

  return {
    digitCount: digits.length,
    digits,
    isValid: true,
    kind,
    reason: null,
  };
};

export const normalizeValidDominicanTaxId = (
  value: unknown,
): string | null => {
  const result = validateDominicanTaxId(value);
  return result.isValid ? result.digits : null;
};
