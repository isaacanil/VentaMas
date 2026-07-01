import { describe, expect, it } from 'vitest';

import {
  buildCreditNotePrintDocumentModel,
  buildDebitNotePrintDocumentModel,
  buildInvoicePrintDocumentModel,
} from './documentModel';

const business = {
  address: 'Av. Independencia 45',
  email: 'facturacion@ventamas.test',
  fiscal: {
    branchName: 'Sucursal Central',
    countryCode: 'DO',
    municipalityName: 'Santo Domingo',
    provinceName: 'Distrito Nacional',
    sectorName: 'Piantini',
  },
  invoice: {
    signatureAssets: {
      enabled: true,
      signature: { offsetX: 4, offsetY: -3, scale: 1.1 },
      signatureUrl: 'data:image/png;base64,signature',
      stamp: { offsetX: -5, offsetY: 2, opacity: 0.75, scale: 0.9 },
      stampUrl: 'data:image/png;base64,stamp',
    },
  },
  logoUrl: 'data:image/png;base64,logo',
  name: 'VentaMas Demo SRL',
  rnc: '132000001',
  tel: '809-555-0101',
};

describe('invoice print pagination document model', () => {
  it('normalizes a fiscal invoice into atomic printable body blocks', () => {
    const model = buildInvoicePrintDocumentModel({
      business,
      data: {
        id: 'invoice-1',
        numberID: 1042,
        NCF: 'E310000000123',
        date: '2026-06-21',
        dueDate: '2026-07-21',
        copyType: 'ORIGINAL',
        client: {
          address: 'Calle Principal 2',
          countryCode: 'DO',
          municipalityName: 'Santo Domingo Este',
          name: 'GI SYS SRL',
          provinceName: 'Santo Domingo',
          rnc: '132619201',
          sectorName: 'Alma Rosa',
          tel: '809-555-2222',
          tel2: '809-555-3333',
        },
        seller: { name: 'Ana Ventas' },
        preorderDetails: { date: '2026-06-20' },
        products: [
          {
            id: 'product-1',
            name: 'Producto gravado',
            amountToBuy: 2,
            barcode: 'P001',
            pricing: { price: 100, tax: { tax: 18 } },
          },
          {
            id: 'product-2',
            name: 'Producto exento',
            amountToBuy: 1,
            barcode: 'P002',
            pricing: { price: 50, tax: { tax: 0 } },
          },
        ],
        paymentMethod: [
          { method: 'cash', status: true, value: 274 },
          { method: 'card', status: false, value: 0 },
        ],
        creditNotePayment: [
          { id: 'credit-payment-1', ncf: 'E340000000555', amountUsed: 12 },
        ],
        totalPurchaseWithoutTaxes: { value: 250 },
        totalTaxes: { value: 36 },
        totalPurchase: { value: 286 },
        electronicTaxReceipt: {
          documentType: 'E31',
          eNcf: 'E310000000123',
          qr: { url: 'https://ecf.dgii.gov.do/testecf/consulta?id=1' },
          securityCode: 'ABC123',
          signedAt: '2026-06-21',
          sequenceExpirationDate: '2026-12-31',
          dgiiTrackId: 'TRACK-123',
          officialVerifyUrl: 'https://ecf.dgii.gov.do/testecf/consulta?id=1',
          dgiiValidationStatus: 'accepted',
        },
      },
    });

    expect(model.kind).toBe('invoice');
    expect(model.documentTitle).toBe('FACTURA DE CRÉDITO FISCAL ELECTRÓNICA');
    expect(model.documentNumberLine).toBe('Factura #1042');
    expect(model.issueDate).toBe('21/06/2026');
    expect(model.dueDate).toBe('21/07/2026');
    expect(model.copyType).toBe('ORIGINAL');
    expect(model.preorderDate).toBe('20/06/2026');
    expect(model.sellerName).toBe('Ana Ventas');
    expect(model.business).toMatchObject({
      fiscalId: '132000001',
      fiscalLines: [
        'Sucursal: Sucursal Central',
        'Sector: Piantini',
        'Municipio/Provincia: Santo Domingo, Distrito Nacional',
        'Pais: DO',
      ],
      logoUrl: 'data:image/png;base64,logo',
      name: 'VentaMas Demo SRL',
    });
    expect(model.client).toMatchObject({
      fiscalId: '132619201',
      phone: '809-555-2222',
      secondaryPhone: '809-555-3333',
      fiscalLines: [
        'Sector: Alma Rosa',
        'Municipio/Provincia: Santo Domingo Este, Santo Domingo',
        'Pais: DO',
      ],
    });
    expect(model.lines.map((line) => line.id)).toEqual([
      'product-line-1-product-1',
      'product-line-2-product-2',
    ]);
    expect(model.lines).toMatchObject([
      {
        billingIndicator: '1',
        code: 'P001',
        descriptionLines: ['Producto gravado'],
        discount: null,
        id: 'product-line-1-product-1',
        quantity: 2,
        tax: 'RD$18.00',
        taxRate: 18,
        total: 'RD$236.00',
        unitPrice: 'RD$100.00',
      },
      {
        billingIndicator: '4',
        code: 'P002',
        descriptionLines: ['Producto exento'],
        discount: null,
        id: 'product-line-2-product-2',
        quantity: 1,
        tax: 'RD$0.00',
        taxRate: 0,
        total: 'RD$50.00',
        unitPrice: 'RD$50.00',
      },
    ]);
    expect(model.bodyBlocks.map((block) => block.role)).toEqual([
      'product-line',
      'product-line',
      'summary',
    ]);
    expect(model.paymentLines).toEqual([
      'Efectivo: RD$274.00',
      'NCF E340000000555: RD$12.00',
    ]);
    expect(model.paymentLines.join(' ')).not.toContain('Tarjeta');
    expect(model.paymentLines.join(' ')).not.toContain('RD$0.00');
    expect(model.signatureAssets).toEqual({
      enabled: true,
      signature: { offsetX: 4, offsetY: -3, scale: 1.1 },
      signatureUrl: 'data:image/png;base64,signature',
      stamp: { offsetX: -5, offsetY: 2, opacity: 0.75, scale: 0.9 },
      stampUrl: 'data:image/png;base64,stamp',
    });
    expect(model.summaryRows).toEqual([
      { label: 'Sub-total', value: 'RD$250.00' },
      { label: 'Monto gravado', value: 'RD$200.00' },
      { label: 'Monto exento', value: 'RD$50.00' },
      { label: 'ITBIS 18%', value: 'RD$36.00' },
      { label: 'ITBIS', value: 'RD$36.00' },
      { emphasis: true, label: 'Total', value: 'RD$286.00' },
    ]);
    expect(model.summaryRows.at(-1)).toEqual({
      emphasis: true,
      label: 'Total',
      value: 'RD$286.00',
    });
    expect(model.electronic).toMatchObject({
      documentType: 'E31',
      eNcf: 'E310000000123',
      qrUrl: 'https://ecf.dgii.gov.do/testecf/consulta?id=1',
      securityCode: 'ABC123',
      sequenceExpirationDate: '31/12/2026',
      signatureDate: '21/06/2026',
      statusKey: 'accepted',
      statusNote: 'Consulte la validez fiscal escaneando el QR.',
      trackId: 'TRACK-123',
      verifyUrl: 'https://ecf.dgii.gov.do/testecf/consulta?id=1',
    });
  });

  it('keeps fiscal indicator semantics from pricing tax metadata', () => {
    const model = buildInvoicePrintDocumentModel({
      business,
      data: {
        id: 'invoice-indicators',
        numberID: 1043,
        NCF: 'B010000000123',
        date: '2026-06-21',
        products: [
          {
            id: 'product-rate-zero',
            name: 'Producto tasa cero',
            amountToBuy: 1,
            pricing: {
              price: 100,
              tax: { billingIndicator: 'ITBIS 3', tax: 0 },
            },
          },
          {
            id: 'product-exempt',
            name: 'Producto exento',
            amountToBuy: 1,
            pricing: {
              price: 50,
              tax: { label: 'Exento', tax: 0 },
            },
          },
        ],
        totalPurchaseWithoutTaxes: { value: 150 },
        totalTaxes: { value: 0 },
        totalPurchase: { value: 150 },
      },
    });

    expect(
      model.lines.map(({ billingIndicator, tax, taxRate }) => ({
        billingIndicator,
        tax,
        taxRate,
      })),
    ).toEqual([
      { billingIndicator: '3', tax: 'RD$0.00', taxRate: 0 },
      { billingIndicator: '4', tax: 'RD$0.00', taxRate: 0 },
    ]);
    expect(model.summaryRows).toContainEqual({
      label: 'Monto gravado',
      value: 'RD$100.00',
    });
    expect(model.summaryRows).toContainEqual({
      label: 'Monto exento',
      value: 'RD$50.00',
    });
  });

  it('uses product weight as printable quantity when the sale quantity is empty', () => {
    const model = buildInvoicePrintDocumentModel({
      business,
      data: {
        id: 'invoice-weighted-product',
        numberID: 1045,
        NCF: 'B010000000125',
        date: '2026-06-21',
        products: [
          {
            id: 'product-weighted',
            name: 'Producto pesado',
            amountToBuy: 0,
            pricing: { price: 100, tax: { tax: 0 } },
            weightDetail: {
              isSoldByWeight: true,
              weight: 2.5,
              weightUnit: 'lb',
            },
          },
        ],
        totalPurchaseWithoutTaxes: { value: 250 },
        totalTaxes: { value: 0 },
        totalPurchase: { value: 250 },
      },
    });

    expect(model.lines[0]).toMatchObject({
      descriptionLines: ['Producto pesado', 'Unidad: Libras (lb)'],
      quantity: 2.5,
    });
  });

  it('uses product weight as printable quantity even when amountToBuy is the legacy unit', () => {
    const model = buildInvoicePrintDocumentModel({
      business,
      data: {
        id: 'invoice-weighted-product-legacy-amount',
        numberID: 1047,
        NCF: 'B010000000127',
        date: '2026-06-21',
        products: [
          {
            id: 'product-weighted-legacy-amount',
            name: 'Producto pesado con unidad legacy',
            amountToBuy: 1,
            pricing: { price: 100, tax: { tax: 0 } },
            weightDetail: {
              isSoldByWeight: true,
              weight: 2.5,
              weightUnit: 'lb',
            },
          },
        ],
        totalPurchaseWithoutTaxes: { value: 250 },
        totalTaxes: { value: 0 },
        totalPurchase: { value: 250 },
      },
    });

    expect(model.lines[0]).toMatchObject({
      descriptionLines: [
        'Producto pesado con unidad legacy',
        'Unidad: Libras (lb)',
      ],
      quantity: 2.5,
    });
  });

  it('omits unit text when a product is not sold by weight or lacks a weight unit', () => {
    const model = buildInvoicePrintDocumentModel({
      business,
      data: {
        id: 'invoice-non-weighted-units',
        numberID: 1046,
        NCF: 'B010000000126',
        date: '2026-06-21',
        products: [
          {
            id: 'product-measurement-only',
            name: 'Producto con medida interna',
            amountToBuy: 1,
            measurement: '45 mg',
            pricing: { price: 100, tax: { tax: 0 } },
            weightDetail: {
              isSoldByWeight: false,
              weightUnit: 'lb',
            },
          },
          {
            id: 'product-weighted-without-unit',
            name: 'Producto pesado sin unidad',
            amountToBuy: 0,
            pricing: { price: 100, tax: { tax: 0 } },
            weightDetail: {
              isSoldByWeight: true,
              weight: 3,
            },
          },
        ],
        totalPurchaseWithoutTaxes: { value: 400 },
        totalTaxes: { value: 0 },
        totalPurchase: { value: 400 },
      },
    });

    expect(model.lines.map((line) => line.descriptionLines)).toEqual([
      ['Producto con medida interna'],
      ['Producto pesado sin unidad'],
    ]);
  });

  it('lets preview signature assets override persisted business assets', () => {
    const model = buildInvoicePrintDocumentModel({
      business,
      data: {
        id: 'invoice-preview-signature',
        numberID: 1044,
        NCF: 'B010000000124',
        date: '2026-06-21',
        products: [],
        totalPurchaseWithoutTaxes: { value: 0 },
        totalTaxes: { value: 0 },
        totalPurchase: { value: 0 },
      },
      previewSignatureAssets: {
        enabled: true,
        signatureUrl: 'data:image/png;base64,preview-signature',
        stampUrl: 'data:image/png;base64,preview-stamp',
      },
    });

    expect(model.signatureAssets).toMatchObject({
      enabled: true,
      signatureUrl: 'data:image/png;base64,preview-signature',
      stampUrl: 'data:image/png;base64,preview-stamp',
    });
  });

  it('normalizes credit notes through the shared adjustment print shape', () => {
    const model = buildCreditNotePrintDocumentModel({
      business,
      note: {
        id: 'credit-1',
        numberID: 12,
        eNcf: 'E340000000001',
        client: { name: 'GI SYS SRL', rnc: '132619201' },
        invoiceNcf: 'E310000000001',
        modificationCode: '3',
        reason: 'Devolucion parcial',
        totalAmount: 118,
        items: [
          {
            id: 'line-1',
            name: 'Producto devuelto',
            amountToBuy: 1,
            pricing: { price: 100, tax: 18 },
          },
        ],
        electronicTaxReceipt: {
          documentType: 'E34',
          eNcf: 'E340000000001',
          securityCode: 'ABC123',
        },
      },
    });

    expect(model.kind).toBe('creditNote');
    expect(model.documentTitle).toBe('NOTA DE CRÉDITO ELECTRÓNICA');
    expect(model.documentNumberLine).toBe('Nota de crédito #12');
    expect(model.affectedDocument).toBe('Documento afectado: E310000000001');
    expect(model.notes.join('\n')).toContain('Motivo: Devolucion parcial');
    expect(model.lines).toHaveLength(1);
    expect(model.summaryRows.at(-1)?.value).toBe('RD$118.00');
  });

  it('normalizes debit notes without items into a synthetic printable line', () => {
    const model = buildDebitNotePrintDocumentModel({
      business,
      note: {
        id: 'debit-1',
        numberID: 15,
        invoiceNumber: 720,
        reason: 'Ajuste de precio',
        taxAmount: 18,
        totalAmount: 118,
        electronicTaxReceipt: {
          documentType: 'E33',
          eNcf: 'E330000000001',
        },
        items: [],
      },
    });

    expect(model.kind).toBe('debitNote');
    expect(model.documentTitle).toBe('NOTA DE DÉBITO ELECTRÓNICA');
    expect(model.documentNumberLine).toBe('Nota de débito #15');
    expect(model.lines).toHaveLength(1);
    expect(model.lines[0]).toMatchObject({
      descriptionLines: ['Nota de débito: Ajuste de precio'],
      quantity: 1,
      total: 'RD$118.00',
    });
    expect(model.bodyBlocks.map((block) => block.id)).toEqual([
      'product-line-1-debitnote-debit-1',
      'document-summary',
      'document-notes',
    ]);
  });

  it('keeps the model isolated from renderers and PDF engines', () => {
    expect(buildInvoicePrintDocumentModel.toString()).not.toContain(
      'Vivliostyle',
    );
    expect(buildInvoicePrintDocumentModel.toString()).not.toContain('pdfmake');
    expect(buildInvoicePrintDocumentModel.toString()).not.toContain(
      'react-to-print',
    );
  });
});
