import { describe, expect, it } from 'vitest';

import { deriveExchangeRateReferenceSnapshot } from './exchangeRateReference';

describe('exchangeRateReference', () => {
  it('derives business-specific references from a global provider snapshot', () => {
    const result = deriveExchangeRateReferenceSnapshot({
      providerSnapshot: {
        provider: 'open-exchange-rates',
        sourceType: 'scheduled',
        providerBaseCurrency: 'USD',
        fetchedAt: null,
        marketUpdatedAt: null,
        nextUpdateAt: null,
        historyDate: '2026-03-17',
        rateCount: 3,
        rates: {
          USD: 1,
          DOP: 60,
          EUR: 0.9,
        },
      },
      functionalCurrency: 'DOP',
      documentCurrencies: ['DOP', 'USD', 'EUR'],
    });

    expect(result).toEqual({
      provider: 'open-exchange-rates',
      sourceType: 'scheduled',
      providerBaseCurrency: 'USD',
      baseCurrency: 'DOP',
      fetchedAt: null,
      marketUpdatedAt: null,
      nextUpdateAt: null,
      historyDate: '2026-03-17',
      documentCurrencies: ['DOP', 'USD', 'EUR'],
      ratesByCurrency: {
        USD: {
          quoteCurrency: 'USD',
          baseCurrency: 'DOP',
          providerRate: 0.016667,
          referenceRate: 60,
        },
        EUR: {
          quoteCurrency: 'EUR',
          baseCurrency: 'DOP',
          providerRate: 0.015,
          referenceRate: 66.666667,
        },
      },
    });
  });
});
