import type { SupportedDocumentCurrency } from '@/types/products';

export type { SupportedDocumentCurrency };

export interface DocumentCurrencyRateConfig {
  purchase: number | null;
  sale: number | null;
  effectiveAt?: number | string | Date | null;
}

export interface DocumentCurrencyConfig {
  functionalCurrency: SupportedDocumentCurrency;
  documentCurrencies: SupportedDocumentCurrency[];
  manualRatesByCurrency: Partial<
    Record<SupportedDocumentCurrency, DocumentCurrencyRateConfig>
  >;
}

/**
 * Monetary context exposed by the selector and consumed by submit guards.
 * The cart now also persists this state explicitly in Redux.
 */
export interface DocumentCurrencyContext {
  documentCurrency: SupportedDocumentCurrency;
  exchangeRate?: number | null;
  rateType?: 'buy' | 'sell';
  blockedReason?: string;
}
