import { describe, expect, it } from 'vitest';

import { resolveProductForCartDocumentCurrency } from './documentPricing';

const buildProduct = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'product-1',
    name: 'Producto demo',
    amountToBuy: 1,
    pricing: {
      currency: 'USD',
      price: 10,
      tax: 18,
    },
    ...overrides,
  }) as never;

describe('resolveProductForCartDocumentCurrency', () => {
  it('adopts the first product currency when the cart starts in functional currency', () => {
    const result = resolveProductForCartDocumentCurrency(
      buildProduct(),
      'DOP',
      {
        functionalCurrency: 'DOP',
        manualRatesByCurrency: {
          USD: { sale: 60, purchase: 58 },
        },
      },
    );

    expect(result.eligible).toBe(true);
    expect(result.documentCurrency).toBe('USD');
    expect(result.resolvedCurrency).toBe('USD');
    expect(result.resolvedFrom).toBe('product');
    expect(result.mixedCurrencySale).toBe(false);
    expect(result.product?.pricingSource).toEqual(
      expect.objectContaining({
        mode: 'direct-price',
        baseCurrency: 'USD',
        functionalCurrency: 'DOP',
      }),
    );
  });

  it('forces the functional currency when the cart becomes mixed-currency', () => {
    const result = resolveProductForCartDocumentCurrency(
      buildProduct(),
      'DOP',
      {
        hasCartProducts: true,
        functionalCurrency: 'DOP',
        currentCartCurrencies: ['DOP'],
        manualRatesByCurrency: {
          USD: { sale: 60, purchase: 58 },
        },
      },
    );

    expect(result.eligible).toBe(true);
    expect(result.documentCurrency).toBe('DOP');
    expect(result.mixedCurrencySale).toBe(true);
    expect(result.product?.pricingSource).toEqual(
      expect.objectContaining({
        mode: 'mixed-currency',
        baseCurrency: 'USD',
        functionalCurrency: 'DOP',
      }),
    );
  });

  it('prefers selected sale unit pricing over base product pricing', () => {
    const result = resolveProductForCartDocumentCurrency(
      buildProduct({
        pricing: {
          currency: 'DOP',
          price: 500,
          tax: 18,
        },
        selectedSaleUnit: {
          pricing: {
            currency: 'EUR',
            price: 5,
          },
        },
      }),
      'DOP',
      {
        functionalCurrency: 'DOP',
        manualRatesByCurrency: {
          EUR: { sale: 70, purchase: 68 },
        },
      },
    );

    expect(result.eligible).toBe(true);
    expect(result.resolvedFrom).toBe('saleUnit');
    expect(result.resolvedCurrency).toBe('EUR');
    expect(result.product?.selectedSaleUnit?.pricing?.currency).toBe('EUR');
  });

  it('returns an ineligible result when a foreign currency is missing a sale rate', () => {
    const result = resolveProductForCartDocumentCurrency(
      buildProduct(),
      'DOP',
      {
        functionalCurrency: 'DOP',
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        eligible: false,
        product: null,
        resolvedCurrency: 'USD',
        mixedCurrencySale: false,
      }),
    );
    expect(result.reason).toContain('No hay tasa de venta USD -> DOP');
  });

  it('returns an ineligible result when the product price is not valid in the functional currency', () => {
    const result = resolveProductForCartDocumentCurrency(
      buildProduct({
        pricing: {
          currency: 'DOP',
          price: 0,
          tax: 18,
        },
      }),
      'DOP',
    );

    expect(result).toEqual(
      expect.objectContaining({
        eligible: false,
        product: null,
        resolvedCurrency: 'DOP',
      }),
    );
    expect(result.reason).toContain('no tiene un precio valido');
  });
});
