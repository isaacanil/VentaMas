import { describe, expect, it } from 'vitest';

import {
  defaultAccountingSettings,
  getEnabledForeignCurrencies,
  normalizeAccountingHistoryEntry,
  normalizeAccountingSettings,
  serializeAccountingConfigForComparison,
} from './accountingConfig';

describe('accountingConfig', () => {
  it('builds the default accounting settings contract', () => {
    expect(defaultAccountingSettings('user-1')).toMatchObject({
      schemaVersion: 7,
      rolloutMode: 'pilot',
      generalAccountingEnabled: false,
      functionalCurrency: 'DOP',
      documentCurrencies: ['DOP'],
      exchangeRateMode: 'manual',
      manualRatesByCurrency: {},
      currentExchangeRateIdsByCurrency: {},
      bankAccountsEnabled: true,
      overridePolicy: 'settings-only',
      updatedBy: 'user-1',
    });
  });

  it('normalizes legacy settings without leaking unsupported currencies', () => {
    expect(
      normalizeAccountingSettings(
        {
          generalAccountingEnabled: true,
          functionalCurrency: 'usd',
          documentCurrencies: ['eur', 'USD', 'BTC', 'eur'],
          manualRates: {
            EUR: {
              purchase: '64.50',
              sale: '66.75',
            },
          },
          currentExchangeRateIdsByCurrency: {
            USD: 'base-rate',
            EUR: ' eur-rate ',
            BTC: 'ignored',
          },
          bankAccountsEnabled: false,
          bankPaymentPolicy: {
            defaultBankAccountId: 'bank-1',
            card: {
              selectionMode: 'default',
              defaultBankAccountId: 'bank-card',
            },
            moduleBankAccountIds: {
              purchases: 'bank-purchases',
            },
          },
          updatedBy: ' user-2 ',
        },
        'fallback-user',
      ),
    ).toMatchObject({
      schemaVersion: 7,
      rolloutMode: 'pilot',
      generalAccountingEnabled: true,
      functionalCurrency: 'USD',
      documentCurrencies: ['EUR', 'USD'],
      exchangeRateMode: 'manual',
      manualRatesByCurrency: {
        EUR: {
          buyRate: 64.5,
          sellRate: 66.75,
        },
      },
      currentExchangeRateIdsByCurrency: {
        EUR: 'EUR-RATE',
      },
      bankAccountsEnabled: false,
      bankPaymentPolicy: {
        defaultBankAccountId: 'bank-1',
        card: {
          selectionMode: 'default',
          defaultBankAccountId: 'bank-card',
        },
        transfer: {
          selectionMode: 'manual',
          defaultBankAccountId: null,
        },
        moduleOverrides: {
          purchases: {
            enabled: true,
            bankAccountId: 'bank-purchases',
          },
        },
      },
      overridePolicy: 'settings-only',
      updatedBy: 'USER-2',
    });
  });

  it('falls back to the updater when the persisted record has no updater', () => {
    expect(normalizeAccountingSettings({}, 'fallback-user').updatedBy).toBe(
      'fallback-user',
    );
  });

  it('normalizes history entries from current or legacy timestamp fields', () => {
    expect(
      normalizeAccountingHistoryEntry(
        'history-1',
        {
          updatedAt: 123,
          updatedBy: 'user-3',
        },
        null,
      ),
    ).toMatchObject({
      id: 'history-1',
      changedAt: 123,
      changedBy: 'USER-3',
      updatedBy: 'USER-3',
    });
  });

  it('derives enabled foreign currencies from the normalized document set', () => {
    expect(
      getEnabledForeignCurrencies({
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP', 'USD', 'EUR', 'USD'],
      }),
    ).toEqual(['USD', 'EUR']);
  });

  it('serializes settings in a stable order for comparisons', () => {
    const left = normalizeAccountingSettings({
      functionalCurrency: 'DOP',
      documentCurrencies: ['USD', 'DOP', 'EUR'],
      manualRatesByCurrency: {
        USD: { buyRate: 58, sellRate: 59 },
        EUR: { buyRate: 62, sellRate: 63 },
      },
    });
    const right = normalizeAccountingSettings({
      functionalCurrency: 'DOP',
      documentCurrencies: ['EUR', 'USD', 'DOP'],
      manualRatesByCurrency: {
        EUR: { sellRate: 63, buyRate: 62 },
        USD: { sellRate: 59, buyRate: 58 },
      },
    });

    expect(serializeAccountingConfigForComparison(left)).toBe(
      serializeAccountingConfigForComparison(right),
    );
  });
});
