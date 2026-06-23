import { describe, expect, it } from 'vitest';

import {
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
});
