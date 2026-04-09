import { describe, expect, it } from 'vitest';

import {
  buildAccountingManualRatesByCurrency,
  getAccountingRateValue,
  normalizeAccountingCurrencyRateConfig,
  normalizeAccountingRateType,
  resolveAccountingRateTypeForOperation,
} from '@/utils/accounting/contracts';

describe('accounting contracts', () => {
  it('normaliza aliases legacy de tasa a buyRate y sellRate', () => {
    expect(
      normalizeAccountingCurrencyRateConfig({
        purchase: '58.5',
        sale: '59.25',
      }),
    ).toEqual({
      buyRate: 58.5,
      sellRate: 59.25,
    });
  });

  it('resuelve el tipo de tasa correcto por operacion', () => {
    expect(resolveAccountingRateTypeForOperation('sale')).toBe('sell');
    expect(resolveAccountingRateTypeForOperation('receivable-payment')).toBe(
      'sell',
    );
    expect(resolveAccountingRateTypeForOperation('purchase')).toBe('buy');
    expect(resolveAccountingRateTypeForOperation('expense')).toBe('buy');
    expect(resolveAccountingRateTypeForOperation('payable-payment')).toBe(
      'buy',
    );
  });

  it('construye manualRatesByCurrency solo con naming canonico', () => {
    expect(
      buildAccountingManualRatesByCurrency('DOP', ['DOP', 'USD'], {
        USD: {
          purchase: 59,
          sellRate: 60,
        } as never,
      }),
    ).toEqual({
      USD: {
        buyRate: 59,
        sellRate: 60,
      },
    });
  });

  it('normaliza rateType legacy a naming canonico', () => {
    expect(normalizeAccountingRateType('purchase')).toBe('buy');
    expect(normalizeAccountingRateType('sale')).toBe('sell');
  });

  it('lee el valor correcto segun el tipo de tasa', () => {
    const config = {
      buyRate: 58.5,
      sellRate: 59.25,
    };

    expect(getAccountingRateValue(config, 'buy')).toBe(58.5);
    expect(getAccountingRateValue(config, 'sell')).toBe(59.25);
  });
});
