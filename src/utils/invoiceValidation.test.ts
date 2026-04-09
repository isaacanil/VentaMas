import { describe, expect, it } from 'vitest';

import { validateInvoiceCart } from './invoiceValidation';

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
});
