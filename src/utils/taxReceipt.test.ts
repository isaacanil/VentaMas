import { describe, expect, it } from 'vitest';

import {
  buildTaxReceiptDocument,
  hydrateTaxReceiptData,
  normalizeTaxReceiptData,
} from '@/utils/taxReceipt';

describe('taxReceipt normalization', () => {
  it('hydrates legacy taxReceipt data with additive fiscal fields', () => {
    expect(
      hydrateTaxReceiptData({
        name: 'CONSUMIDOR FINAL',
        type: 'B',
        serie: '02',
        sequence: '0000000000',
        increase: 1,
        quantity: 2000,
      }),
    ).toMatchObject({
      documentFormat: 'traditional',
      fiscalSeries: '02',
      fiscalType: 'B02',
      authorityStatus: 'not_applicable',
      trackId: null,
      series: '02',
    });
  });

  it('preserves electronic metadata when already provided', () => {
    expect(
      normalizeTaxReceiptData({
        name: 'E-CF CRÉDITO FISCAL',
        type: 'E',
        serie: '31',
        documentFormat: 'electronic',
        fiscalSeries: '31',
        fiscalType: 'E31',
        authorityStatus: 'pending',
        trackId: 'trk_123',
      }),
    ).toMatchObject({
      documentFormat: 'electronic',
      fiscalSeries: '31',
      fiscalType: 'E31',
      authorityStatus: 'pending',
      trackId: 'trk_123',
    });
  });

  it('infers electronic format from legacy E-series data', () => {
    expect(
      hydrateTaxReceiptData({
        name: 'E-CF CRÉDITO FISCAL',
        type: 'E',
        serie: '31',
        sequence: 0,
        increase: 1,
        quantity: 100,
      }),
    ).toMatchObject({
      documentFormat: 'electronic',
      fiscalSeries: '31',
      fiscalType: 'E31',
      authorityStatus: null,
      trackId: null,
    });
  });

  it('builds taxReceipt documents with normalized fiscal metadata', () => {
    expect(
      buildTaxReceiptDocument({
        name: 'CRÉDITO FISCAL',
        type: 'B',
        serie: '01',
        sequence: 0,
        increase: 1,
        quantity: 2000,
      }).data,
    ).toMatchObject({
      id: '01',
      documentFormat: 'traditional',
      fiscalSeries: '01',
      fiscalType: 'B01',
      authorityStatus: 'not_applicable',
      trackId: null,
    });
  });
});
