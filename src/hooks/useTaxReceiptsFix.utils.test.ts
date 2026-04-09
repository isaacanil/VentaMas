import { describe, expect, it } from 'vitest';

import {
  buildTaxReceiptNormalizationUpdates,
  defaultTaxReceiptLength,
} from './useTaxReceiptsFix.utils';

describe('buildTaxReceiptNormalizationUpdates', () => {
  it('does not rewrite receipts that are already normalized', () => {
    expect(
      buildTaxReceiptNormalizationUpdates('B01', {
        id: 'B01',
        serie: 'B',
        sequence: 12,
        sequenceLength: 8,
        disabled: false,
      }),
    ).toEqual({});
  });

  it('adds only the missing defaults and converts numeric strings once', () => {
    expect(
      buildTaxReceiptNormalizationUpdates('E31', {
        serie: 'E',
        sequence: '42',
      }),
    ).toEqual({
      'data.id': 'E31',
      'data.disabled': false,
      'data.sequenceLength': 10,
      'data.sequence': 42,
    });
  });

  it('keeps invalid or empty sequences out of the write payload', () => {
    expect(
      buildTaxReceiptNormalizationUpdates('B02', {
        id: 'B02',
        serie: 'B',
        sequence: '',
        sequenceLength: 8,
        disabled: true,
      }),
    ).toEqual({});

    expect(
      buildTaxReceiptNormalizationUpdates('B03', {
        id: 'B03',
        serie: 'B',
        sequence: 'ABC',
        sequenceLength: 8,
        disabled: true,
      }),
    ).toEqual({});
  });
});

describe('defaultTaxReceiptLength', () => {
  it('uses 8 digits for serie B and 10 for the rest', () => {
    expect(defaultTaxReceiptLength('B')).toBe(8);
    expect(defaultTaxReceiptLength('E')).toBe(10);
    expect(defaultTaxReceiptLength(undefined)).toBe(10);
  });
});
