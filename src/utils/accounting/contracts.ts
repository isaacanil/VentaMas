import type {
  AccountingCurrencyRateConfig,
  AccountingManualRatesByCurrency,
  AccountingOperationType,
  AccountingRateType,
} from '@/types/accounting';
import type { SupportedDocumentCurrency } from '@/utils/accounting/currencies';

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const ACCOUNTING_RATE_TYPE_ALIASES: Record<string, AccountingRateType> = {
  buy: 'buy',
  purchase: 'buy',
  sell: 'sell',
  sale: 'sell',
};

export const normalizeAccountingRateType = (
  value: unknown,
  fallback: AccountingRateType = 'sell',
): AccountingRateType => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return ACCOUNTING_RATE_TYPE_ALIASES[normalized] ?? fallback;
};

export const resolveAccountingRateTypeForOperation = (
  operationType: AccountingOperationType = 'sale',
): AccountingRateType =>
  operationType === 'purchase' ||
  operationType === 'expense' ||
  operationType === 'payable-payment'
    ? 'buy'
    : 'sell';

export const createEmptyAccountingRateConfig =
  (): AccountingCurrencyRateConfig => ({
    buyRate: null,
    sellRate: null,
  });

export const normalizeAccountingCurrencyRateConfig = (
  value: unknown,
): AccountingCurrencyRateConfig => {
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

export const buildAccountingManualRatesByCurrency = (
  functionalCurrency: SupportedDocumentCurrency,
  documentCurrencies: SupportedDocumentCurrency[],
  currentRates: AccountingManualRatesByCurrency = {},
): AccountingManualRatesByCurrency =>
  Array.from(new Set([functionalCurrency, ...documentCurrencies]))
    .filter((currency) => currency !== functionalCurrency)
    .reduce<AccountingManualRatesByCurrency>((accumulator, currency) => {
      accumulator[currency] = normalizeAccountingCurrencyRateConfig(
        currentRates[currency],
      );
      return accumulator;
    }, {});

export const getAccountingRateValue = (
  value: AccountingCurrencyRateConfig | null | undefined,
  rateType: AccountingRateType,
): number | null => {
  const normalized = normalizeAccountingCurrencyRateConfig(value);
  return rateType === 'buy' ? normalized.buyRate : normalized.sellRate;
};
