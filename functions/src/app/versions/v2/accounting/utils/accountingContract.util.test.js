import { describe, expect, it } from 'vitest';

import {
  getAccountingRateValue,
  normalizeAccountingRateConfig,
  normalizeAccountingRateType,
  normalizePaymentMethodCode,
  resolveAccountingRateTypeForOperation,
} from './accountingContract.util.js';

describe('accountingContract.util', () => {
  it('normaliza aliases de metodos de pago al canonico', () => {
    expect(normalizePaymentMethodCode('credit_card')).toBe('card');
    expect(normalizePaymentMethodCode('bank_transfer')).toBe('transfer');
    expect(normalizePaymentMethodCode('credit_note')).toBe('creditNote');
    expect(normalizePaymentMethodCode('supplierCreditNote')).toBe('creditNote');
  });

  it('normaliza aliases legacy de tasas al naming canonico', () => {
    expect(
      normalizeAccountingRateConfig({
        purchase: '58.5',
        sale: '59.25',
      }),
    ).toEqual({
      buyRate: 58.5,
      sellRate: 59.25,
    });
  });

  it('resuelve buy o sell segun la operacion', () => {
    expect(resolveAccountingRateTypeForOperation('sale')).toBe('sell');
    expect(resolveAccountingRateTypeForOperation('receivable-payment')).toBe(
      'sell',
    );
    expect(resolveAccountingRateTypeForOperation('purchase')).toBe('buy');
    expect(resolveAccountingRateTypeForOperation('expense')).toBe('buy');
  });

  it('normaliza rateType legacy', () => {
    expect(normalizeAccountingRateType('purchase')).toBe('buy');
    expect(normalizeAccountingRateType('sale')).toBe('sell');
  });

  it('lee el valor correcto segun rateType', () => {
    const config = { buyRate: 58.5, sellRate: 59.25 };
    expect(getAccountingRateValue(config, 'buy')).toBe(58.5);
    expect(getAccountingRateValue(config, 'sell')).toBe(59.25);
  });
});
