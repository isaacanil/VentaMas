import { describe, expect, it } from 'vitest';

import { resolveQuantity } from './quantity';

import type { InvoiceProduct } from '@/types/invoice';

describe('CreditNoteModal resolveQuantity', () => {
  it('returns finite numeric quantities as-is', () => {
    expect(resolveQuantity(3)).toBe(3);
    expect(resolveQuantity(0)).toBe(0);
  });

  it('prefers finite unit over total for structured amounts', () => {
    expect(resolveQuantity({ unit: 2, total: 5 })).toBe(2);
  });

  it('uses total when unit is missing or not finite', () => {
    expect(resolveQuantity({ total: 4 })).toBe(4);
    expect(
      resolveQuantity({
        unit: Number.NaN,
        total: 6,
      } as InvoiceProduct['amountToBuy']),
    ).toBe(6);
  });

  it('falls back to one for missing or invalid amounts', () => {
    expect(resolveQuantity(undefined)).toBe(1);
    expect(resolveQuantity(Number.NaN)).toBe(1);
    expect(resolveQuantity({ unit: Number.NaN, total: Number.NaN })).toBe(1);
  });
});
