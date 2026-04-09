import { describe, expect, it } from 'vitest';

import {
  buildExchangeRateHistoryEntryId,
  buildRatesByCurrency,
  toExchangeRateHistoryDateKey,
} from './exchangeRateReference.util.js';

describe('exchangeRateReference.util', () => {
  it('builds cross rates from a USD-based provider payload', () => {
    const result = buildRatesByCurrency({
      settings: {
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP', 'USD', 'EUR'],
      },
      providerPayload: {
        providerBaseCurrency: 'USD',
        rates: {
          DOP: 60,
          EUR: 0.9,
        },
      },
    });

    expect(result).toEqual({
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
    });
  });

  it('formats history ids per execution in the configured timezone', () => {
    const sourceDate = new Date('2026-03-17T17:05:30-04:00');

    expect(
      toExchangeRateHistoryDateKey(sourceDate, 'America/Santo_Domingo'),
    ).toBe('2026-03-17');
    expect(
      buildExchangeRateHistoryEntryId(sourceDate, 'America/Santo_Domingo'),
    ).toBe('2026-03-17T17-05-30');
  });
});
