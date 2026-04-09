const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const PAYMENT_METHOD_ALIASES = {
  cash: 'cash',
  open_cash: 'cash',
  card: 'card',
  credit_card: 'card',
  debit_card: 'card',
  transfer: 'transfer',
  bank_transfer: 'transfer',
  check: 'transfer',
  creditnote: 'creditNote',
  credit_note: 'creditNote',
  suppliercreditnote: 'creditNote',
  supplier_credit_note: 'creditNote',
  supplier_creditnote: 'creditNote',
  supplier_credit: 'creditNote',
  suppliercredit: 'creditNote',
};

export const CANONICAL_PAYMENT_METHOD_CODES = new Set([
  'cash',
  'card',
  'transfer',
  'creditNote',
]);

export const ACCOUNTING_RATE_TYPE_ALIASES = {
  buy: 'buy',
  purchase: 'buy',
  sell: 'sell',
  sale: 'sell',
};

export const normalizePaymentMethodCode = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.length) return null;
  const normalized = trimmed.toLowerCase();
  return PAYMENT_METHOD_ALIASES[normalized] || trimmed;
};

export const normalizeAccountingRateType = (value, fallback = 'sell') => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return ACCOUNTING_RATE_TYPE_ALIASES[normalized] || fallback;
};

export const resolveAccountingRateTypeForOperation = (
  operationType = 'sale',
) =>
  operationType === 'purchase' ||
  operationType === 'expense' ||
  operationType === 'payable-payment'
    ? 'buy'
    : 'sell';

export const normalizeAccountingRateConfig = (value) => {
  const record = asRecord(value);
  return {
    buyRate: safeNumber(
      record.buyRate ?? record.purchase ?? record.purchaseRate ?? record.buy,
    ),
    sellRate: safeNumber(
      record.sellRate ?? record.sale ?? record.saleRate ?? record.sell,
    ),
  };
};

export const buildManualRatesByCurrency = (
  functionalCurrency,
  documentCurrencies,
  currentRates = {},
) =>
  Array.from(new Set([functionalCurrency, ...(documentCurrencies || [])]))
    .filter((currency) => currency && currency !== functionalCurrency)
    .reduce((accumulator, currency) => {
      accumulator[currency] = normalizeAccountingRateConfig(currentRates[currency]);
      return accumulator;
    }, {});

export const getAccountingRateValue = (value, rateType) => {
  const normalized = normalizeAccountingRateConfig(value);
  return rateType === 'buy' ? normalized.buyRate : normalized.sellRate;
};
