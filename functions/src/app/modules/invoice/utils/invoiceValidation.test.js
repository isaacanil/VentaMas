import { describe, expect, it } from 'vitest';

import {
  validateInvoiceCart,
  validateInvoiceMonetaryConsistency,
} from './invoiceValidation.js';

const baseCart = () => ({
  products: [
    {
      id: 'product-1',
      amountToBuy: 2,
      pricing: {
        price: 100,
        tax: 18,
      },
    },
  ],
  totalPurchaseWithoutTaxes: { value: 200 },
  totalTaxes: { value: 36 },
  totalPurchase: { value: 236 },
  paymentMethod: [{ method: 'cash', status: true, value: 236 }],
  payment: { value: 236 },
});

describe('invoiceValidation monetary consistency', () => {
  it('accepts a cart whose totals match calculable product lines', () => {
    expect(validateInvoiceCart(baseCart())).toEqual({
      isValid: true,
      message: 'Cart validation passed.',
    });
  });

  it('rejects a cart whose declared total is lower than backend math', () => {
    const cart = {
      ...baseCart(),
      totalPurchase: { value: 118 },
    };

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      message: expect.stringContaining('Total inconsistente'),
    });
  });

  it('rejects a cart whose payment snapshot differs from active methods', () => {
    const cart = {
      ...baseCart(),
      payment: { value: 100 },
    };

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      message: expect.stringContaining('Pago inconsistente'),
    });
  });

  it('skips monetary enforcement for complex legacy carts', () => {
    const cart = {
      ...baseCart(),
      discount: { value: 10 },
      totalPurchase: { value: 200 },
    };

    expect(validateInvoiceMonetaryConsistency(cart)).toEqual({
      isValid: true,
      skipped: true,
    });
  });

  it('uses selected sale unit pricing when it is the active product price', () => {
    const cart = {
      ...baseCart(),
      products: [
        {
          id: 'product-1',
          amountToBuy: 2,
          pricing: {
            price: 100,
            tax: 18,
          },
          selectedSaleUnit: {
            pricing: {
              price: 150,
              tax: 18,
            },
          },
        },
      ],
      totalPurchaseWithoutTaxes: { value: 300 },
      totalTaxes: { value: 54 },
      totalPurchase: { value: 354 },
      paymentMethod: [{ method: 'cash', status: true, value: 354 }],
      payment: { value: 354 },
    };

    expect(validateInvoiceCart(cart)).toEqual({
      isValid: true,
      message: 'Cart validation passed.',
    });
  });

  it('skips monetary enforcement instead of reading legacy product aliases', () => {
    const cart = {
      products: [
        {
          id: 'product-1',
          amount: 2,
          price: 100,
          unitPrice: 100,
          taxRate: 18,
          itbisRate: 18,
        },
      ],
      totalPurchaseWithoutTaxes: { value: 200 },
      totalTaxes: { value: 36 },
      totalPurchase: { value: 236 },
      paymentMethod: [{ method: 'cash', status: true, value: 236 }],
      payment: { value: 236 },
    };

    expect(validateInvoiceMonetaryConsistency(cart)).toEqual({
      isValid: true,
      skipped: true,
    });
  });

  it('skips unsupported tax object shapes instead of guessing rate aliases', () => {
    const cart = {
      ...baseCart(),
      products: [
        {
          id: 'product-1',
          amountToBuy: 2,
          pricing: {
            price: 100,
            tax: { value: 18 },
          },
        },
      ],
    };

    expect(validateInvoiceMonetaryConsistency(cart)).toEqual({
      isValid: true,
      skipped: true,
    });
  });

  it('skips unsupported amount object value aliases instead of guessing quantity', () => {
    const cart = {
      ...baseCart(),
      products: [
        {
          id: 'product-1',
          amountToBuy: { value: 2 },
          pricing: {
            price: 100,
            tax: 18,
          },
        },
      ],
    };

    expect(validateInvoiceMonetaryConsistency(cart)).toEqual({
      isValid: true,
      skipped: true,
    });
  });

  it('skips raw monetary totals instead of accepting non-canonical snapshots', () => {
    const cart = {
      ...baseCart(),
      totalPurchaseWithoutTaxes: 200,
      totalTaxes: 36,
      totalPurchase: 236,
      payment: 236,
    };

    expect(validateInvoiceMonetaryConsistency(cart)).toEqual({
      isValid: true,
      skipped: true,
    });
  });
});
