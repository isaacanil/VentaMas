export const ACCOUNTING_CURRENCY_CODES = ['DOP', 'USD', 'EUR'] as const;

export type SupportedDocumentCurrency =
  (typeof ACCOUNTING_CURRENCY_CODES)[number];

export const DEFAULT_FUNCTIONAL_CURRENCY: SupportedDocumentCurrency = 'DOP';

const CURRENCY_LABELS: Record<SupportedDocumentCurrency, string> = {
  DOP: 'Peso dominicano',
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
};

export const isSupportedDocumentCurrency = (
  value: unknown,
): value is SupportedDocumentCurrency =>
  typeof value === 'string' &&
  (ACCOUNTING_CURRENCY_CODES as readonly string[]).includes(value.toUpperCase());

export const normalizeSupportedDocumentCurrency = (
  value: unknown,
  fallback: SupportedDocumentCurrency = DEFAULT_FUNCTIONAL_CURRENCY,
): SupportedDocumentCurrency => {
  if (typeof value !== 'string') return fallback;

  const normalized = value.trim().toUpperCase();
  return isSupportedDocumentCurrency(normalized) ? normalized : fallback;
};

export const getCurrencyLabel = (currency: SupportedDocumentCurrency): string =>
  CURRENCY_LABELS[currency] ?? currency;

export const getCurrencyOptionLabel = (
  currency: SupportedDocumentCurrency,
): string => `${currency} - ${getCurrencyLabel(currency)}`;
