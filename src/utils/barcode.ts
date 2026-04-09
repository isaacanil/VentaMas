const AIM_PREFIX_PATTERN = /^\][A-Za-z0-9]{2}/;
const WHITESPACE_PATTERN = /\s+/g;
const NON_DIGIT_PATTERN = /\D/g;

export const DEFAULT_VARIABLE_WEIGHT_PREFIXES = [
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
] as const;

const pushUnique = (candidates: string[], value: string) => {
  if (!value || candidates.includes(value)) return;
  candidates.push(value);
};

const removeControlChars = (value: string): string => {
  let output = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if ((code >= 32 && code !== 127) || code === 9 || code === 10 || code === 13) {
      output += char;
    }
  }
  return output;
};

export const normalizeBarcodeValue = (barcode: unknown): string => {
  const value =
    typeof barcode === 'string'
      ? barcode
      : typeof barcode === 'number' && Number.isFinite(barcode)
        ? String(barcode)
        : '';

  if (!value) return '';

  const compact = removeControlChars(value)
    .replace(WHITESPACE_PATTERN, '')
    .trim();

  if (!compact) return '';
  return compact.replace(AIM_PREFIX_PATTERN, '');
};

export const normalizeBarcodeDigits = (barcode: string): string =>
  normalizeBarcodeValue(barcode).replace(NON_DIGIT_PATTERN, '');

export const getBarcodeLookupCandidates = (barcode: string): string[] => {
  const normalized = normalizeBarcodeValue(barcode);
  if (!normalized) return [];

  const candidates: string[] = [];
  pushUnique(candidates, normalized);

  const digits = normalized.replace(NON_DIGIT_PATTERN, '');
  pushUnique(candidates, digits);

  if (digits.length === 12) {
    pushUnique(candidates, `0${digits}`);
  }

  if (digits.length === 13 && digits.startsWith('0')) {
    pushUnique(candidates, digits.slice(1));
  }

  if (digits.length === 14 && digits.startsWith('0')) {
    pushUnique(candidates, digits.slice(1));
  }

  if (isVariableWeightBarcode(digits) && digits.length >= 7) {
    pushUnique(candidates, extractProductInfo(digits));
  }

  return candidates;
};

export const extractProductInfo = (barcode: string): string => {
  const digits = normalizeBarcodeDigits(barcode);
  if (digits.length < 7) return '';
  return digits.slice(2, 7);
};

export const extractWeightInfo = (barcode: string): string => {
  const digits = normalizeBarcodeDigits(barcode);
  if (digits.length < 6) return '';
  return digits.slice(-6);
};

export const isVariableWeightBarcode = (
  barcode: string,
  prefixes: ReadonlyArray<string> = DEFAULT_VARIABLE_WEIGHT_PREFIXES,
): boolean => {
  const digits = normalizeBarcodeDigits(barcode);
  if (digits.length !== 13) return false;
  return prefixes.some((prefix) => digits.startsWith(prefix));
};

export const formatWeight = (weightString: string): number => {
  if (!weightString || weightString.length < 6) return 0;

  const integerPart = parseInt(weightString.slice(0, 2), 10);
  const decimalPart = parseInt(weightString.slice(2), 10);

  if (Number.isNaN(integerPart) || Number.isNaN(decimalPart)) return 0;

  const weight = integerPart + decimalPart / 10000;
  return parseFloat(weight.toFixed(3));
};
