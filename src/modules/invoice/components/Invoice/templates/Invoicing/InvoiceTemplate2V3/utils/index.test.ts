import { describe, expect, it } from 'vitest';

import { resolveQuantity } from './index';

describe('InvoiceTemplate2V3 product print helpers', () => {
  it('uses sold weight instead of amountToBuy for weighted invoice lines', () => {
    expect(
      resolveQuantity({
        amountToBuy: 1,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2.5,
          weightUnit: 'kg',
        },
      } as never),
    ).toBe(2.5);
  });
});
