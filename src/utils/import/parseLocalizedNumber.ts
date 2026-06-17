export interface ParseLocalizedNumberOptions {
  allowAccountingNegative?: boolean;
  mode?: 'strict' | 'prefix';
  removeWhitespace?: boolean;
  stripCurrencySymbols?: boolean;
  stripPercent?: boolean;
}

const CURRENCY_SYMBOL_PATTERN = /[$\u20ac\u00a3\u00a5\u20a9\u20b9\u20bd]/g;
const CURRENCY_CODE_PATTERN =
  /(^|[\s(+-])(?:RD\$?|DOP|USD|EUR)(?=\s|[$\u20ac\u00a3\u00a5\u20a9\u20b9\u20bd.,]|\d|$)/gi;
const NUMBER_PATTERN = /^[+-]?[0-9.,]+$/;
const NUMBER_PREFIX_PATTERN = /^[+-]?[0-9.,]+/;

const normalizeSeparatorCandidate = (value: string) => {
  const sign = value.startsWith('-') ? '-' : '';
  const unsigned = value.replace(/^[+-]/, '');

  if (!/\d/.test(unsigned)) return null;

  const commaCount = (unsigned.match(/,/g) ?? []).length;
  const dotCount = (unsigned.match(/\./g) ?? []).length;

  let normalized = unsigned;
  if (commaCount > 0 && dotCount > 0) {
    const commaIsDecimal =
      unsigned.lastIndexOf(',') > unsigned.lastIndexOf('.');
    normalized = commaIsDecimal
      ? unsigned.replace(/\./g, '').replace(',', '.')
      : unsigned.replace(/,/g, '');
  } else if (commaCount > 0) {
    normalized = unsigned.replace(/,/g, '.');
  }

  return `${sign}${normalized}`;
};

export const parseLocalizedNumber = (
  value: unknown,
  options: ParseLocalizedNumberOptions = {},
): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const {
    allowAccountingNegative = true,
    mode = 'strict',
    removeWhitespace = true,
    stripCurrencySymbols = false,
    stripPercent = false,
  } = options;

  let normalized = String(value).trim();
  if (!normalized) return null;

  let accountingNegative = false;
  if (allowAccountingNegative) {
    const accountingMatch = normalized.match(/^\((.*)\)$/);
    if (accountingMatch) {
      accountingNegative = true;
      normalized = accountingMatch[1] ?? '';
    }
  }

  if (stripCurrencySymbols) {
    normalized = normalized
      .replace(CURRENCY_CODE_PATTERN, '$1')
      .replace(CURRENCY_SYMBOL_PATTERN, '')
      .replace(CURRENCY_CODE_PATTERN, '$1');
  }

  if (stripPercent) {
    normalized = normalized.replace(/%/g, '');
  }

  normalized = removeWhitespace
    ? normalized.replace(/\s/g, '')
    : normalized.trim();

  if (accountingNegative) {
    normalized = `-${normalized}`;
  }

  const token =
    mode === 'prefix'
      ? normalized.match(NUMBER_PREFIX_PATTERN)?.[0]
      : normalized;

  if (!token || !NUMBER_PATTERN.test(token)) return null;

  const candidate = normalizeSeparatorCandidate(token);
  if (!candidate) return null;

  const parsed = mode === 'prefix'
    ? Number.parseFloat(candidate)
    : Number(candidate);

  return Number.isFinite(parsed) ? parsed : null;
};
