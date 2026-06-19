import { describe, expect, it } from 'vitest';

import {
  buildPreviewProducts,
  resolveBillingIndicator,
  resolveBusinessFiscalLines,
  resolveClientFiscalLines,
  resolveElectronicPrintInfo,
  resolveInvoiceTotals,
  resolvePageSummary,
} from './index';

describe('InvoiceTemplate2V3_1 electronic print helpers', () => {
  it('resolves QR, security code and signature date from the electronic snapshot', () => {
    const result = resolveElectronicPrintInfo({
      NCF: 'E310000000002',
      electronicTaxReceipt: {
        documentType: 'E31',
        eNcf: 'E310000000002',
        securityCode: 'HeMfOO',
        qr: { url: 'https://ecf.dgii.gov.do/testecf/consultatimbre?id=1' },
        issuedAt: '2026-06-16T10:30:00-04:00',
        dgiiValidationStatus: 'accepted',
        dgiiTrackId: 'track-1',
      },
    });

    expect(result).toMatchObject({
      documentType: 'E31',
      eNcf: 'E310000000002',
      qrUrl: 'https://ecf.dgii.gov.do/testecf/consultatimbre?id=1',
      securityCode: 'HeMfOO',
      signatureDate: '16/06/2026',
      statusKey: 'accepted',
      statusNote: 'Consulte la validez fiscal escaneando el QR.',
      trackId: 'track-1',
    });
  });

  it('uses printData and invoice e-NCF fallbacks when provider fields are sparse', () => {
    const result = resolveElectronicPrintInfo({
      eNcf: 'E320000000001',
      fiscal: {
        electronic: {
          documentType: 'E32',
          status: 'issued',
          printData: {
            qrUrl: 'https://ecf.dgii.gov.do/testecf/consultatimbre?id=2',
            codigoSeguridad: 'ABCD12',
            fechaFirma: '2026-06-17T09:00:00-04:00',
            fechaVencimientoSecuencia: '2026-12-31',
          },
        },
      },
    });

    expect(result).toMatchObject({
      documentType: 'E32',
      eNcf: 'E320000000001',
      qrUrl: 'https://ecf.dgii.gov.do/testecf/consultatimbre?id=2',
      securityCode: 'ABCD12',
      signatureDate: '17/06/2026',
      sequenceExpirationDate: '31/12/2026',
      statusNote:
        'e-CF emitido en envío diferido. Consulte la validez fiscal dentro de las 24 horas.',
    });
  });

  it('does not render fiscal info without an electronic snapshot', () => {
    expect(resolveElectronicPrintInfo({ NCF: 'B0100000001' })).toBeNull();
  });
});

describe('InvoiceTemplate2V3_1 product print helpers', () => {
  it('does not duplicate invoice products by default', () => {
    const products = [
      { id: 'product-1', name: 'Producto 1' },
      { id: 'product-2', name: 'Producto 2' },
    ];

    expect(buildPreviewProducts(products as never)).toBe(products);
  });

  it('only duplicates products when a preview repeat count is explicitly provided', () => {
    const products = [
      { id: 'product-1', name: 'Producto 1' },
      { id: 'product-2', name: 'Producto 2' },
    ];

    const result = buildPreviewProducts(products as never, 2);

    expect(result).toHaveLength(4);
    expect(result.map((product) => product.name)).toEqual([
      'Producto 1',
      'Producto 2',
      'Producto 1',
      'Producto 2',
    ]);
  });

  it('prints fiscal indicators from nested tax metadata', () => {
    expect(
      resolveBillingIndicator({
        name: 'Producto gravado',
        pricing: { price: 100, tax: { tax: 18, billingIndicator: '1' } },
      } as never),
    ).toBe('1');
    expect(
      resolveBillingIndicator({
        name: 'Producto exento',
        pricing: { price: 100, tax: { tax: 0, label: 'Exento' } },
      } as never),
    ).toBe('4');
    expect(
      resolveBillingIndicator({
        name: 'Producto tasa cero',
        selectedSaleUnit: {
          pricing: { price: 100, tax: { tax: 0, indicator: 'ITBIS 3' } },
        },
      } as never),
    ).toBe('3');
  });

  it('summarizes page and fiscal totals using the printed product rows', () => {
    const products = [
      {
        name: 'Producto gravado',
        amountToBuy: 2,
        pricing: { price: 100, tax: { tax: 18, billingIndicator: '1' } },
      },
      {
        name: 'Producto exento',
        amountToBuy: 1,
        pricing: { price: 50, tax: { tax: 0, billingIndicator: '4' } },
      },
      {
        name: 'Producto tasa cero',
        amountToBuy: 1,
        pricing: { price: 25, tax: { tax: 0, billingIndicator: '3' } },
      },
    ];

    expect(resolvePageSummary(products as never, 'DOP')).toEqual({
      subtotal: 'RD$275.00',
      tax: 'RD$36.00',
      total: 'RD$311.00',
    });

    expect(
      resolveInvoiceTotals({
        products: products as never,
        totalPurchaseWithoutTaxes: { value: 275 },
        totalTaxes: { value: 36 },
        totalPurchase: { value: 311 },
      }),
    ).toEqual([
      ['Sub-total', 'RD$275.00'],
      ['Monto gravado', 'RD$225.00'],
      ['Monto exento', 'RD$50.00'],
      ['ITBIS 18%', 'RD$36.00'],
      ['ITBIS', 'RD$36.00'],
      ['Total', 'RD$311.00'],
    ]);
  });
});

describe('InvoiceTemplate2V3_1 fiscal party helpers', () => {
  it('prints issuer and buyer municipality, province and country codes when available', () => {
    expect(
      resolveBusinessFiscalLines({
        name: 'VentaMax',
        branchName: 'Principal',
        sector: 'Gazcue',
        municipalityName: 'Santo Domingo de Guzman',
        municipalityCode: '0101',
        provinceName: 'Distrito Nacional',
        provinceCode: '01',
        country: 'do',
      } as never),
    ).toEqual([
      'Sucursal: Principal',
      'Sector: Gazcue',
      'Municipio/Provincia: Santo Domingo de Guzman (0101), Distrito Nacional (01)',
      'Pais: DO',
    ]);

    expect(
      resolveClientFiscalLines({
        name: 'GI SYS SRL',
        sector: 'Ensanche Naco',
        municipio: 'Santo Domingo de Guzman',
        codigoMunicipio: '0101',
        provincia: 'Distrito Nacional',
        codigoProvincia: '01',
      } as never),
    ).toEqual([
      'Sector: Ensanche Naco',
      'Municipio/Provincia: Santo Domingo de Guzman (0101), Distrito Nacional (01)',
    ]);
  });
});
