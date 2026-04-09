import {
  isSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';

export interface ExchangeRateReferenceValue {
  quoteCurrency: SupportedDocumentCurrency;
  baseCurrency: SupportedDocumentCurrency;
  providerRate: number | null;
  referenceRate: number | null;
}

export interface ExchangeRateProviderSnapshot {
  provider: string | null;
  sourceType: 'scheduled' | 'manual' | string | null;
  providerBaseCurrency: string | null;
  fetchedAt: unknown;
  marketUpdatedAt: unknown;
  nextUpdateAt: unknown;
  historyDate: string | null;
  rateCount: number | null;
  rates: Record<string, number>;
}

export interface ExchangeRateReferenceSnapshot {
  provider: string | null;
  sourceType: 'scheduled' | 'manual' | string | null;
  providerBaseCurrency: string | null;
  baseCurrency: SupportedDocumentCurrency | null;
  fetchedAt: unknown;
  marketUpdatedAt: unknown;
  nextUpdateAt: unknown;
  historyDate: string | null;
  documentCurrencies: SupportedDocumentCurrency[];
  ratesByCurrency: Partial<
    Record<SupportedDocumentCurrency, ExchangeRateReferenceValue>
  >;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundRate = (value: number): number =>
  Math.round(value * 1_000_000) / 1_000_000;

const normalizeCurrency = (
  value: unknown,
): SupportedDocumentCurrency | null =>
  typeof value === 'string' && isSupportedDocumentCurrency(value)
    ? value.trim().toUpperCase()
    : null;

const normalizeDocumentCurrencies = (
  value: unknown,
): SupportedDocumentCurrency[] => {
  const source = Array.isArray(value) ? value : [];
  return source
    .map((item) => normalizeCurrency(item))
    .filter((item): item is SupportedDocumentCurrency => item != null);
};

const normalizeRates = (value: unknown): ExchangeRateProviderSnapshot['rates'] => {
  const record = asRecord(value);

  return Object.entries(record).reduce<ExchangeRateProviderSnapshot['rates']>(
    (accumulator, [currencyKey, nestedValue]) => {
      const normalizedKey = toCleanString(currencyKey)?.toUpperCase();
      const rate = safeNumber(nestedValue);

      if (!normalizedKey || rate == null || rate <= 0) {
        return accumulator;
      }

      accumulator[normalizedKey] = rate;
      return accumulator;
    },
    {},
  );
};

const resolveProviderRate = ({
  providerBaseCurrency,
  rates,
  currency,
}: {
  providerBaseCurrency: string | null;
  rates: ExchangeRateProviderSnapshot['rates'];
  currency: SupportedDocumentCurrency;
}): number | null => {
  if (providerBaseCurrency === currency) {
    return 1;
  }

  return safeNumber(rates[currency]);
};

export const normalizeExchangeRateProviderSnapshot = (
  value: unknown,
): ExchangeRateProviderSnapshot | null => {
  const record = asRecord(value);
  if (!Object.keys(record).length) {
    return null;
  }

  const rates = normalizeRates(record.rates);

  return {
    provider: toCleanString(record.provider),
    sourceType: toCleanString(record.sourceType),
    providerBaseCurrency:
      toCleanString(record.providerBaseCurrency)?.toUpperCase() ?? null,
    fetchedAt: record.fetchedAt ?? null,
    marketUpdatedAt: record.marketUpdatedAt ?? null,
    nextUpdateAt: record.nextUpdateAt ?? null,
    historyDate: toCleanString(record.historyDate),
    rateCount: safeNumber(record.rateCount),
    rates,
  };
};

export const deriveExchangeRateReferenceSnapshot = ({
  providerSnapshot,
  functionalCurrency,
  documentCurrencies,
}: {
  providerSnapshot: ExchangeRateProviderSnapshot | null;
  functionalCurrency: SupportedDocumentCurrency;
  documentCurrencies: SupportedDocumentCurrency[];
}): ExchangeRateReferenceSnapshot | null => {
  if (!providerSnapshot) {
    return null;
  }

  const normalizedFunctionalCurrency = normalizeCurrency(functionalCurrency);
  if (!normalizedFunctionalCurrency) {
    return null;
  }

  const normalizedDocumentCurrencies = Array.from(
    new Set([
      normalizedFunctionalCurrency,
      ...normalizeDocumentCurrencies(documentCurrencies),
    ]),
  );

  const functionalRate = resolveProviderRate({
    providerBaseCurrency: providerSnapshot.providerBaseCurrency,
    rates: providerSnapshot.rates,
    currency: normalizedFunctionalCurrency,
  });

  if (functionalRate == null || functionalRate <= 0) {
    return null;
  }

  const ratesByCurrency = normalizedDocumentCurrencies
    .filter((currency) => currency !== normalizedFunctionalCurrency)
    .reduce<ExchangeRateReferenceSnapshot['ratesByCurrency']>(
      (accumulator, currency) => {
        const quoteRate = resolveProviderRate({
          providerBaseCurrency: providerSnapshot.providerBaseCurrency,
          rates: providerSnapshot.rates,
          currency,
        });

        if (quoteRate == null || quoteRate <= 0) {
          return accumulator;
        }

        accumulator[currency] = {
          quoteCurrency: currency,
          baseCurrency: normalizedFunctionalCurrency,
          providerRate: roundRate(quoteRate / functionalRate),
          referenceRate: roundRate(functionalRate / quoteRate),
        };
        return accumulator;
      },
      {},
    );

  return {
    provider: providerSnapshot.provider,
    sourceType: providerSnapshot.sourceType,
    providerBaseCurrency: providerSnapshot.providerBaseCurrency,
    baseCurrency: normalizedFunctionalCurrency,
    fetchedAt: providerSnapshot.fetchedAt,
    marketUpdatedAt: providerSnapshot.marketUpdatedAt,
    nextUpdateAt: providerSnapshot.nextUpdateAt,
    historyDate: providerSnapshot.historyDate,
    documentCurrencies: normalizedDocumentCurrencies,
    ratesByCurrency,
  };
};
