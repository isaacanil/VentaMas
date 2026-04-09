import { describe, expect, it } from 'vitest';

import { buildExchangeRateRecordsFromSettings } from '@/utils/accounting/exchangeRates';

describe('exchangeRates', () => {
  it('genera documentos formales y current ids desde settings', () => {
    const effectiveAt = 1_742_260_400_000;
    const result = buildExchangeRateRecordsFromSettings({
      businessId: 'business-1',
      functionalCurrency: 'DOP',
      manualRatesByCurrency: {
        USD: {
          buyRate: 58.5,
          sellRate: 59.25,
        },
        EUR: {
          buyRate: null,
          sellRate: null,
        },
      },
      effectiveAt,
      createdBy: 'user-1',
      historyId: 'history-1',
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      id: 'fx_USD_DOP_history-1',
      businessId: 'business-1',
      quoteCurrency: 'USD',
      baseCurrency: 'DOP',
      buyRate: 58.5,
      sellRate: 59.25,
      source: 'settings_manual',
      historyId: 'history-1',
    });
    expect(result.currentExchangeRateIdsByCurrency).toEqual({
      USD: 'fx_USD_DOP_history-1',
    });
  });
});
