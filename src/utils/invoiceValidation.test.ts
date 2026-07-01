import { describe, expect, it } from 'vitest';

import {
  meetsMinimumInvoiceRequirement,
  validateInvoiceCart,
} from './invoiceValidation';

describe('validateInvoiceCart', () => {
  it('rejects a missing cart payload', () => {
    expect(validateInvoiceCart(null)).toEqual({
      isValid: false,
      message: 'Cart data is missing.',
    });
  });

  it('rejects carts without a products array', () => {
    expect(validateInvoiceCart({})).toEqual({
      isValid: false,
      message: 'Cart products array is missing.',
    });
  });

  it('rejects carts with invalid product quantities', () => {
    expect(
      validateInvoiceCart({
        products: [{ amountToBuy: 0 }],
      }),
    ).toEqual({
      isValid: false,
      message: 'One or more products have an invalid quantity (must be > 0).',
    });
  });

  it('rejects weighted products without a positive weight', () => {
    expect(
      validateInvoiceCart({
        products: [
          {
            amountToBuy: 1,
            weightDetail: {
              isSoldByWeight: true,
              weight: 0,
            },
            pricing: { price: 30 },
          },
        ],
      }),
    ).toEqual({
      isValid: false,
      message:
        'One or more products sold by weight have an invalid weight (must be > 0).',
    });
  });

  it('rejects weighted products without a supported weight unit', () => {
    expect(
      validateInvoiceCart({
        products: [
          {
            amountToBuy: 1,
            weightDetail: {
              isSoldByWeight: true,
              weight: 2.5,
              weightUnit: 'unidad',
            },
            pricing: { price: 30 },
          },
        ],
      }),
    ).toEqual({
      isValid: false,
      message:
        'Uno o más productos vendidos por peso tienen una unidad de peso no soportada. Selecciona kg, lb, oz, g o mg antes de facturar.',
    });
  });

  it('accepts weighted products with a supported weight unit', () => {
    expect(
      validateInvoiceCart({
        products: [
          {
            amountToBuy: 1,
            weightDetail: {
              isSoldByWeight: true,
              weight: 2.5,
              weightUnit: 'lb',
            },
            pricing: { price: 30 },
          },
        ],
      }),
    ).toEqual({
      isValid: true,
      message: 'Cart validation passed.',
    });
  });

  it('rejects strict products without a selected physical stock', () => {
    expect(
      validateInvoiceCart({
        products: [
          {
            amountToBuy: 1,
            pricing: { price: 10 },
            restrictSaleWithoutStock: true,
            name: 'Jarabe infantil',
          },
        ],
      }),
    ).toEqual({
      isValid: false,
      message:
        'Debes seleccionar la ubicación o existencia física de "Jarabe infantil" antes de facturar.',
    });
  });

  it('accepts strict products when the physical stock is already selected', () => {
    expect(
      validateInvoiceCart({
        products: [
          {
            amountToBuy: 1,
            pricing: { price: 10 },
            restrictSaleWithoutStock: true,
            name: 'Jarabe infantil',
            productStockId: 'stock-1',
            batchId: 'batch-1',
          },
        ],
      }),
    ).toEqual({
      isValid: true,
      message: 'Cart validation passed.',
    });
  });

  it('accepts carts with at least one valid product', () => {
    expect(
      validateInvoiceCart({
        products: [{ amountToBuy: 2, pricing: { price: 10 } }],
      }),
    ).toEqual({
      isValid: true,
      message: 'Cart validation passed.',
    });
  });

  it('accepts structured sale-unit quantities', () => {
    expect(
      validateInvoiceCart({
        products: [
          {
            amountToBuy: { unit: 2, total: 24 },
            pricing: { price: 10 },
            selectedSaleUnit: {
              id: 'box-12',
              quantity: 12,
              pricing: { price: 120 },
            },
          },
        ],
      }),
    ).toEqual({
      isValid: true,
      message: 'Cart validation passed.',
    });
  });

  it('uses commercial sale-unit quantity for minimum invoice checks', () => {
    expect(
      meetsMinimumInvoiceRequirement(
        {
          products: [
            {
              amountToBuy: { unit: 2, total: 24 },
              pricing: { price: 10 },
              selectedSaleUnit: {
                id: 'box-12',
                quantity: 12,
                pricing: { price: 120 },
              },
            },
          ],
        },
        240,
      ),
    ).toBe(true);
  });
});
