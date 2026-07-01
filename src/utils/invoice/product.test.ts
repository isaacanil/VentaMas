import { describe, expect, it } from 'vitest';

import {
  resolveInvoiceProductQuantity,
  resolveInvoiceProductsQuantity,
  resolveInvoiceProductTaxRate,
  resolveInvoiceProductUnitPrice,
} from './product';

describe('invoice product resolvers', () => {
  it('uses active canonical pricing for unit price and tax', () => {
    expect(
      resolveInvoiceProductUnitPrice({
        pricing: { price: 120, tax: { tax: 18 } },
      }),
    ).toBe(120);
    expect(
      resolveInvoiceProductTaxRate({
        pricing: { price: 120, tax: { tax: 18 } },
      }),
    ).toBe(18);
  });

  it('ignores legacy price.unit when canonical pricing is missing', () => {
    expect(
      resolveInvoiceProductUnitPrice({
        price: { unit: 999 },
      }),
    ).toBe(0);
  });

  it('uses weight as the visible invoice quantity for products sold by weight', () => {
    expect(
      resolveInvoiceProductQuantity({
        amountToBuy: 1,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2.5,
          weightUnit: 'kg',
        },
      }),
    ).toBe(2.5);
  });

  it('keeps the sold weight as visible quantity even when inventory base converts units', () => {
    expect(
      resolveInvoiceProductQuantity({
        amountToBuy: 1,
        baseQuantity: 0.907185,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2,
          weightUnit: 'lb',
        },
      }),
    ).toBe(2);
  });

  it('keeps sale unit quantities commercial while allowing base inventory elsewhere', () => {
    expect(
      resolveInvoiceProductQuantity({
        amountToBuy: 2,
        baseQuantity: 24,
        selectedSaleUnit: {
          id: 'box-12',
          name: 'Caja',
          quantity: 12,
          conversionFactorToBase: 12,
        },
      }),
    ).toBe(2);
  });

  it('uses sale-unit commercial quantity from structured amount before base total', () => {
    expect(
      resolveInvoiceProductQuantity({
        amountToBuy: { unit: 2, total: 24 },
        selectedSaleUnit: {
          id: 'box-12',
          name: 'Caja',
          quantity: 12,
          conversionFactorToBase: 12,
        },
      }),
    ).toBe(2);
  });

  it('aggregates visible quantities across weighted and presentation lines', () => {
    expect(
      resolveInvoiceProductsQuantity([
        {
          amountToBuy: 1,
          weightDetail: {
            isSoldByWeight: true,
            weight: 2.5,
          },
        },
        {
          amountToBuy: { quantity: 3 },
        },
      ]),
    ).toBe(5.5);
  });
});
