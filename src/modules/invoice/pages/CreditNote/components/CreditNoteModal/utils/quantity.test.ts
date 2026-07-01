import { describe, expect, it } from 'vitest';

import {
  applyCreditNoteLineQuantity,
  getCreditNoteQuantityInputConfig,
  resolveCreditNoteLineQuantity,
  resolveQuantity,
} from './quantity';

import type { InvoiceProduct } from '@/types/invoice';

describe('CreditNoteModal resolveQuantity', () => {
  it('returns finite numeric quantities as-is', () => {
    expect(resolveQuantity(3)).toBe(3);
    expect(resolveQuantity(0)).toBe(0);
  });

  it('prefers finite total over unit for structured amounts', () => {
    expect(resolveQuantity({ unit: 2, total: 5 })).toBe(5);
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
    expect(resolveQuantity(undefined)).toBe(0);
    expect(resolveQuantity(Number.NaN)).toBe(0);
    expect(resolveQuantity({ unit: Number.NaN, total: Number.NaN })).toBe(0);
  });

  it('resolves line quantity from sold weight', () => {
    expect(
      resolveCreditNoteLineQuantity({
        amountToBuy: 1,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2.5,
        },
      }),
    ).toBe(2.5);
  });

  it('applies partial quantity to weight instead of amountToBuy', () => {
    expect(
      applyCreditNoteLineQuantity(
        {
          amountToBuy: 1,
          weightDetail: {
            isSoldByWeight: true,
            weight: 2.5,
          },
        },
        0.75,
      ),
    ).toMatchObject({
      amountToBuy: 1,
      baseQuantity: 0.75,
      weightDetail: {
        isSoldByWeight: true,
        weight: 0.75,
      },
    });
  });

  it('applies partial sale unit quantity as commercial amount and base quantity', () => {
    expect(
      applyCreditNoteLineQuantity(
        {
          amountToBuy: 1,
          selectedSaleUnit: {
            id: 'box-12',
            allowFractional: true,
            conversionFactorToBase: 12,
          },
        },
        0.5,
      ),
    ).toMatchObject({
      amountToBuy: 0.5,
      baseQuantity: 6,
    });
  });

  it('allows fractional controls for weight and fractional sale units', () => {
    expect(
      getCreditNoteQuantityInputConfig({
        weightDetail: { isSoldByWeight: true, weight: 1 },
      }),
    ).toEqual({ min: 0.01, step: 0.01 });
    expect(
      getCreditNoteQuantityInputConfig({
        selectedSaleUnit: { id: 'box', allowFractional: true },
      }),
    ).toEqual({ min: 0.01, step: 0.01 });
    expect(getCreditNoteQuantityInputConfig({ amountToBuy: 1 })).toEqual({
      min: 1,
      step: 1,
    });
  });
});
