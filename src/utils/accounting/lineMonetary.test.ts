import { describe, expect, it } from 'vitest';

import {
  buildProductMonetarySnapshot,
  getCartProductCurrencies,
  resolveDisplayTotalForCurrency,
  resolveDisplayUnitPriceForCurrency,
} from './lineMonetary';

describe('lineMonetary', () => {
  it('builds a functional snapshot for products already in the functional currency', () => {
    const snapshot = buildProductMonetarySnapshot(
      {
        pricing: {
          currency: 'DOP',
          price: 250,
        },
      },
      {
        functionalCurrency: 'DOP',
        effectiveAt: 123,
      },
    );

    expect(snapshot).toEqual({
      documentCurrency: 'DOP',
      functionalCurrency: 'DOP',
      exchangeRate: 1,
      originalUnitPrice: 250,
      functionalUnitPrice: 250,
      source: 'functional',
      effectiveAt: 123,
    });
  });

  it('uses manual sale rates for foreign-currency products', () => {
    const snapshot = buildProductMonetarySnapshot(
      {
        pricing: {
          currency: 'USD',
          price: 10,
        },
      },
      {
        functionalCurrency: 'DOP',
        operationType: 'sale',
        manualRatesByCurrency: {
          USD: { sale: 60, purchase: 58 },
        },
        effectiveAt: 456,
      },
    );

    expect(snapshot).toEqual({
      documentCurrency: 'USD',
      functionalCurrency: 'DOP',
      exchangeRate: 60,
      originalUnitPrice: 10,
      functionalUnitPrice: 600,
      source: 'settings-manual-sale',
      effectiveAt: 456,
    });
  });

  it('returns null when a foreign-currency product has no usable exchange rate', () => {
    const snapshot = buildProductMonetarySnapshot(
      {
        pricing: {
          currency: 'USD',
          price: 10,
        },
      },
      {
        functionalCurrency: 'DOP',
      },
    );

    expect(snapshot).toBeNull();
  });

  it('deduplicates currencies in the current cart', () => {
    expect(
      getCartProductCurrencies([
        { pricing: { currency: 'DOP' } },
        { pricing: { currency: 'USD' } },
        { pricing: { currency: 'DOP' } },
        { pricing: { currency: 'USD' } },
      ]),
    ).toEqual(['DOP', 'USD']);
  });

  it('uses functional display amounts when the document is shown in the functional currency', () => {
    const product = {
      amountToBuy: 2,
      pricing: {
        currency: 'USD',
        price: 10,
        tax: 18,
      },
      monetary: {
        documentCurrency: 'USD',
        functionalCurrency: 'DOP',
        exchangeRate: 60,
        originalUnitPrice: 10,
        functionalUnitPrice: 600,
        source: 'settings-manual-sale' as const,
        effectiveAt: 1,
      },
    };

    expect(resolveDisplayUnitPriceForCurrency(product, 'DOP')).toBe(600);
    expect(resolveDisplayTotalForCurrency(product, 'DOP')).toBe(1416);
  });
});
