import type { CartAccountingContext, CartData } from '@/features/cart/types';

import { resolveTimestampMillis } from './documentCurrencyDates';
import type {
  DocumentCurrencyConfig,
  DocumentCurrencyRateConfig,
  SupportedDocumentCurrency,
} from './types';

type CartManualRatesByCurrency = NonNullable<CartData['manualRatesByCurrency']>;
type CartManualRateConfig = NonNullable<
  CartManualRatesByCurrency[SupportedDocumentCurrency]
>;

export const normalizeCartRateValue = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeCartEffectiveAt = (
  value: unknown,
): CartManualRateConfig['effectiveAt'] => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) return value.trim();
  if (value instanceof Date) return value;
  return null;
};

const toComparableEffectiveAt = (value: unknown): number | string | null => {
  const normalized = normalizeCartEffectiveAt(value);
  return normalized instanceof Date ? normalized.getTime() : normalized;
};

export const buildCartManualRatesByCurrency = (
  manualRatesByCurrency: DocumentCurrencyConfig['manualRatesByCurrency'],
): CartManualRatesByCurrency =>
  Object.entries(manualRatesByCurrency).reduce<CartManualRatesByCurrency>(
    (accumulator, [currency, rateConfig]) => {
      const nextRateConfig: CartManualRateConfig = {
        buyRate: normalizeCartRateValue(rateConfig?.purchase),
        sellRate: normalizeCartRateValue(rateConfig?.sale),
      };
      const effectiveAt = normalizeCartEffectiveAt(rateConfig?.effectiveAt);
      if (effectiveAt != null) {
        nextRateConfig.effectiveAt = effectiveAt;
      }
      accumulator[currency as SupportedDocumentCurrency] = nextRateConfig;
      return accumulator;
    },
    {},
  );

const areCartManualRateConfigsEqual = (
  current: CartManualRateConfig | null | undefined,
  next: CartManualRateConfig | null | undefined,
): boolean => {
  if (current == null || next == null) return current == null && next == null;

  return (
    normalizeCartRateValue(current.buyRate) ===
      normalizeCartRateValue(next.buyRate) &&
    normalizeCartRateValue(current.sellRate) ===
      normalizeCartRateValue(next.sellRate) &&
    Object.is(
      toComparableEffectiveAt(current.effectiveAt),
      toComparableEffectiveAt(next.effectiveAt),
    )
  );
};

export const areCartManualRatesByCurrencyEqual = (
  current: CartManualRatesByCurrency | null | undefined,
  next: CartManualRatesByCurrency,
): boolean => {
  const currencies = new Set([
    ...Object.keys(current ?? {}),
    ...Object.keys(next),
  ]);

  for (const currency of currencies) {
    const normalizedCurrency = currency as SupportedDocumentCurrency;
    if (
      !areCartManualRateConfigsEqual(
        current?.[normalizedCurrency],
        next[normalizedCurrency],
      )
    ) {
      return false;
    }
  }

  return true;
};

const isSameLocalDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const isFreshDocumentCurrencyRate = (
  effectiveAt: unknown,
  now: Date = new Date(),
): boolean => {
  const millis = resolveTimestampMillis(effectiveAt);
  if (millis == null) return false;
  return isSameLocalDay(new Date(millis), now);
};

export const buildCartAccountingContext = (
  config: DocumentCurrencyConfig,
): CartAccountingContext => ({
  functionalCurrency: config.functionalCurrency,
  manualRatesByCurrency: buildCartManualRatesByCurrency(
    config.manualRatesByCurrency,
  ),
});

export const resolveDocumentCurrencyExchangeRate = ({
  functionalCurrency,
  now,
  rateConfig,
  selectedCurrency,
}: {
  functionalCurrency: SupportedDocumentCurrency;
  now?: Date;
  rateConfig: DocumentCurrencyRateConfig | null | undefined;
  selectedCurrency: SupportedDocumentCurrency;
}): number | null => {
  if (selectedCurrency === functionalCurrency) return 1;

  return isFreshDocumentCurrencyRate(rateConfig?.effectiveAt, now)
    ? normalizeCartRateValue(rateConfig?.sale)
    : null;
};
