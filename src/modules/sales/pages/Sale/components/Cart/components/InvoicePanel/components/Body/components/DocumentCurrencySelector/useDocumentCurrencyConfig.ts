import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import {
  ACCOUNTING_CURRENCY_CODES,
  DEFAULT_FUNCTIONAL_CURRENCY,
  normalizeSupportedDocumentCurrency,
} from '@/utils/accounting/currencies';

import type { DocumentCurrencyConfig, SupportedDocumentCurrency } from './types';

const normalizeCurrency = (value: unknown): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(value, DEFAULT_FUNCTIONAL_CURRENCY);

const DEFAULT_CONFIG: DocumentCurrencyConfig = {
  functionalCurrency: DEFAULT_FUNCTIONAL_CURRENCY,
  documentCurrencies: [DEFAULT_FUNCTIONAL_CURRENCY],
  manualRatesByCurrency: {},
};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const normalizeDocumentCurrencies = (
  value: unknown,
  functionalCurrency: SupportedDocumentCurrency,
): SupportedDocumentCurrency[] => {
  const source = Array.isArray(value) ? value : [];
  const normalized = source
    .map((item) =>
      typeof item === 'string' ? (item.trim().toUpperCase() as string) : null,
    )
    .filter(
      (item): item is SupportedDocumentCurrency =>
        (ACCOUNTING_CURRENCY_CODES as readonly string[]).includes(item),
    );

  return normalized.includes(functionalCurrency)
    ? normalized
    : [functionalCurrency, ...normalized];
};

const normalizeManualRatesByCurrency = (
  value: unknown,
  functionalCurrency: SupportedDocumentCurrency,
  documentCurrencies: SupportedDocumentCurrency[],
): DocumentCurrencyConfig['manualRatesByCurrency'] => {
  const record = asRecord(value);
  const nestedRates = Object.entries(record).reduce<
    DocumentCurrencyConfig['manualRatesByCurrency']
  >((accumulator, [currencyKey, nestedValue]) => {
    if (!(ACCOUNTING_CURRENCY_CODES as readonly string[]).includes(currencyKey)) {
      return accumulator;
    }

    const normalizedCurrency = currencyKey as SupportedDocumentCurrency;
    if (normalizedCurrency === functionalCurrency) {
      return accumulator;
    }

    const nestedRecord = asRecord(nestedValue);
    accumulator[normalizedCurrency] = {
      purchase: safeNumber(
        nestedRecord.purchase ?? nestedRecord.purchaseRate ?? nestedRecord.buy,
      ),
      sale: safeNumber(
        nestedRecord.sale ?? nestedRecord.saleRate ?? nestedRecord.sell,
      ),
    };
    return accumulator;
  }, {});

  const sourceRates =
    Object.keys(nestedRates).length > 0
      ? nestedRates
      : (() => {
          const legacyForeignCurrency = normalizeCurrency(record.foreignCurrency);
          const legacyUsdRate = safeNumber(record.USD);
          if (legacyForeignCurrency === functionalCurrency) {
            return {};
          }

          return {
            [legacyForeignCurrency]: {
              purchase:
                safeNumber(
                  record.purchase ?? record.purchaseRate ?? record.buy,
                ) ?? legacyUsdRate,
              sale:
                safeNumber(record.sale ?? record.saleRate ?? record.sell) ??
                legacyUsdRate,
            },
          };
        })();

  return documentCurrencies.reduce<DocumentCurrencyConfig['manualRatesByCurrency']>(
    (accumulator, currency) => {
      if (currency === functionalCurrency) return accumulator;
      accumulator[currency] = sourceRates[currency] ?? {
        purchase: null,
        sale: null,
      };
      return accumulator;
    },
    {},
  );
};

interface UseDocumentCurrencyConfigResult {
  enabled: boolean;
  config: DocumentCurrencyConfig;
  loading: boolean;
  error: string | null;
}

export const useDocumentCurrencyConfig = (
  businessId: string | null,
): UseDocumentCurrencyConfigResult => {
  const isRolloutEnabled = useAccountingRolloutEnabled(
    businessId,
    Boolean(businessId),
  );
  const [config, setConfig] = useState<DocumentCurrencyConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(isRolloutEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRolloutEnabled || !businessId) return;

    const settingsRef = doc(
      db,
      'businesses',
      businessId,
      'settings',
      'accounting',
    );

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setConfig(DEFAULT_CONFIG);
          setLoading(false);
          return;
        }

        const data = asRecord(snapshot.data());
        const functionalCurrency = normalizeCurrency(data.functionalCurrency);
        const documentCurrencies = normalizeDocumentCurrencies(
          data.documentCurrencies,
          functionalCurrency,
        );

        setConfig({
          functionalCurrency,
          documentCurrencies,
          manualRatesByCurrency: normalizeManualRatesByCurrency(
            data.manualRatesByCurrency ?? data.manualRates,
            functionalCurrency,
            documentCurrencies,
          ),
        });
        setLoading(false);
        setError(null);
      },
      (cause) => {
        setLoading(false);
        setError(cause.message || 'Error al cargar configuración monetaria.');
      },
    );

    return unsubscribe;
  }, [businessId, isRolloutEnabled]);

  if (!isRolloutEnabled) {
    return { enabled: false, config: DEFAULT_CONFIG, loading: false, error: null };
  }

  return { enabled: true, config, loading, error };
};
