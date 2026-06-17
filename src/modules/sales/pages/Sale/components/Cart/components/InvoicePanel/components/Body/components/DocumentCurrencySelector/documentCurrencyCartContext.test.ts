import { describe, expect, it } from 'vitest';

import {
  areCartManualRatesByCurrencyEqual,
  buildCartAccountingContext,
  isFreshDocumentCurrencyRate,
  normalizeCartRateValue,
  resolveDocumentCurrencyExchangeRate,
} from './documentCurrencyCartContext';
import type { DocumentCurrencyConfig } from './types';

const today = new Date(2026, 5, 17, 10, 30, 0, 0);
const todayLater = new Date(2026, 5, 17, 18, 45, 0, 0);
const yesterday = new Date(2026, 5, 16, 10, 30, 0, 0);

const config: DocumentCurrencyConfig = {
  functionalCurrency: 'DOP',
  documentCurrencies: ['DOP', 'USD', 'EUR'],
  manualRatesByCurrency: {
    USD: {
      purchase: 58.25,
      sale: 60.5,
      effectiveAt: today,
    },
    EUR: {
      purchase: 'bad-value' as never,
      sale: 0,
      effectiveAt: '',
    },
  },
};

describe('documentCurrencyCartContext', () => {
  it('normaliza valores de tasa positivos para el carrito', () => {
    expect(normalizeCartRateValue(10)).toBe(10);
    expect(normalizeCartRateValue('12.5')).toBe(12.5);
    expect(normalizeCartRateValue(0)).toBeNull();
    expect(normalizeCartRateValue(-1)).toBeNull();
    expect(normalizeCartRateValue('nope')).toBeNull();
  });

  it('construye el contexto contable del carrito desde la configuracion', () => {
    expect(buildCartAccountingContext(config)).toEqual({
      functionalCurrency: 'DOP',
      manualRatesByCurrency: {
        USD: {
          buyRate: 58.25,
          sellRate: 60.5,
          effectiveAt: today,
        },
        EUR: {
          buyRate: null,
          sellRate: null,
        },
      },
    });
  });

  it('compara tasas manuales normalizando fechas y valores invalidos', () => {
    expect(
      areCartManualRatesByCurrencyEqual(
        {
          USD: {
            buyRate: 58.25,
            sellRate: 60.5,
            effectiveAt: today.getTime(),
          },
          EUR: {
            buyRate: null,
            sellRate: null,
          },
        },
        buildCartAccountingContext(config).manualRatesByCurrency,
      ),
    ).toBe(true);

    expect(
      areCartManualRatesByCurrencyEqual(
        {
          USD: {
            buyRate: 58.25,
            sellRate: 61,
            effectiveAt: today.getTime(),
          },
        },
        buildCartAccountingContext(config).manualRatesByCurrency,
      ),
    ).toBe(false);
  });

  it('detecta vigencia diaria de la tasa del documento', () => {
    expect(isFreshDocumentCurrencyRate(todayLater, today)).toBe(true);
    expect(isFreshDocumentCurrencyRate(yesterday, today)).toBe(false);
    expect(isFreshDocumentCurrencyRate(null, today)).toBe(false);
  });

  it('resuelve la tasa de cambio que debe persistirse en el carrito', () => {
    expect(
      resolveDocumentCurrencyExchangeRate({
        functionalCurrency: 'DOP',
        rateConfig: config.manualRatesByCurrency.USD,
        selectedCurrency: 'DOP',
      }),
    ).toBe(1);

    expect(
      resolveDocumentCurrencyExchangeRate({
        functionalCurrency: 'DOP',
        now: today,
        rateConfig: config.manualRatesByCurrency.USD,
        selectedCurrency: 'USD',
      }),
    ).toBe(60.5);

    expect(
      resolveDocumentCurrencyExchangeRate({
        functionalCurrency: 'DOP',
        now: today,
        rateConfig: {
          sale: 60.5,
          purchase: 58.25,
          effectiveAt: yesterday,
        },
        selectedCurrency: 'USD',
      }),
    ).toBeNull();

    expect(
      resolveDocumentCurrencyExchangeRate({
        functionalCurrency: 'DOP',
        now: today,
        rateConfig: {
          sale: 0,
          purchase: 58.25,
          effectiveAt: today,
        },
        selectedCurrency: 'USD',
      }),
    ).toBeNull();
  });
});
