import { describe, expect, it } from 'vitest';

import {
  buildTaxReceiptDocument,
  comprobantesOptions,
  getTaxReceiptAvailability,
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

describe('taxReceipt availability', () => {
  it('returns the selected receipt when enough quantity remains', () => {
    const receipt = {
      data: {
        name: 'Factura de Crédito Fiscal',
        type: 'B',
        serie: '01',
        quantity: '10',
        increase: 2,
      },
    };

    expect(
      getTaxReceiptAvailability([receipt], 'Factura de Crédito Fiscal'),
    ).toEqual({
      receipt,
      depleted: false,
    });
  });

  it('marks the selected receipt as depleted when quantity is below increase', () => {
    const receipt = {
      name: 'Factura de Consumo',
      type: 'B',
      serie: '02',
      quantity: 0,
      increase: 1,
    };

    expect(
      getTaxReceiptAvailability([receipt], 'Factura de Consumo'),
    ).toEqual({
      receipt,
      depleted: true,
    });
  });

  it('treats missing receipt selections as depleted', () => {
    expect(getTaxReceiptAvailability([], 'Factura de Consumo')).toEqual({
      receipt: null,
      depleted: true,
    });

    expect(getTaxReceiptAvailability(null, null)).toEqual({
      receipt: null,
      depleted: true,
    });
  });
});

describe('comprobantesOptions', () => {
  it('exposes provider voucher options from the fiscal util', () => {
    expect(comprobantesOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: '01',
          label: 'Factura de Crédito Fiscal',
        }),
        expect.objectContaining({
          value: 'e-CF',
          label: 'Comprobante Fiscal Electrónico',
        }),
      ]),
    );
  });
});
