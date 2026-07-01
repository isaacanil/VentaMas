import { describe, expect, it } from 'vitest';

import { buildGisysIssuePayload } from './gisysIssuePayload.mapper.js';

const buildBaseInput = (invoiceId) => ({
  businessId: 'business-1',
  invoiceId,
  invoice: {
    snapshot: {
      cart: {
        products: [
          {
            id: 'product-1',
            name: 'Servicio',
            price: 100,
            amountToBuy: 1,
          },
        ],
        totalPurchase: { value: 118 },
        totalPurchaseWithoutTaxes: { value: 100 },
        totalTaxes: { value: 18 },
      },
      ncf: {
        type: 'B02',
        code: 'E320000000001',
      },
    },
  },
  taskPayload: {
    ncfType: 'B02',
  },
  providerConfig: {
    integrationInstanceCode: 'gisys-instance',
    taxpayerCode: 'taxpayer-1',
  },
  business: {
    name: 'VentaMas Test',
  },
});

describe('gisysIssuePayload.mapper', () => {
  it('uses a fixed 20-character GISYS internal invoice id for short invoice ids', () => {
    const input = buildBaseInput('invoice-1');

    const first = buildGisysIssuePayload(input).payload.invoiceInternalId;
    const second = buildGisysIssuePayload(input).payload.invoiceInternalId;

    expect(first).toBe(second);
    expect(first).not.toBe(input.invoiceId);
    expect(first).toHaveLength(20);
    expect(first).toMatch(/^VM[A-F0-9]{18}$/);
  });

  it('uses a fixed 20-character GISYS internal invoice id for long invoice ids', () => {
    const input = buildBaseInput('8sLy9MNng4pFm1CWJm-rG');

    const first = buildGisysIssuePayload(input).payload.invoiceInternalId;
    const second = buildGisysIssuePayload(input).payload.invoiceInternalId;

    expect(first).toBe(second);
    expect(first).not.toBe(input.invoiceId);
    expect(first).toHaveLength(20);
    expect(first).toMatch(/^VM[A-F0-9]{18}$/);
  });

  it('omits invalid issuer and buyer location/contact values before GISYS XML validation', () => {
    const input = buildBaseInput('AELtPPOmRP5-wRKTGP7Jd');
    input.business = {
      name: 'VentaMas Test',
      fiscalIssuer: {
        legalName: 'VentaMas Fiscal Test',
        province: 'prueba',
        municipality: 'municipio inventado',
        phone: '12345678901234567890',
      },
    };
    input.invoice.snapshot.client = {
      name: 'Cliente Prueba',
      province: 'inventada',
      municipality: 'Santo Domingo de Guzmán',
      tel: 'teléfono-no-válido',
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer.province).toBeUndefined();
    expect(payload.issuer.municipality).toBeUndefined();
    expect(payload.issuer.phones).toBeUndefined();
    expect(payload.buyer.province).toBeUndefined();
    expect(payload.buyer.municipality).toBeUndefined();
    expect(payload.buyer.phone).toBeUndefined();
  });

  it('normalizes valid Dominican province names to DGII codes and phone values', () => {
    const input = buildBaseInput('invoice-valid-contact');
    input.business = {
      name: 'VentaMas Test',
      fiscalIssuer: {
        legalName: 'VentaMas Fiscal Test',
        province: 'Santo Domingo',
        municipality: '320100',
        phone: '(809) 555-1234',
      },
    };
    input.invoice.snapshot.client = {
      name: 'Cliente Prueba',
      province: 'Distrito Nacional',
      municipality: '010100',
      tel: '+1 (829) 555-6677',
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer.province).toBe('320000');
    expect(payload.issuer.municipality).toBe('320100');
    expect(payload.issuer.phones).toEqual(['809-555-1234']);
    expect(payload.buyer.province).toBe('010000');
    expect(payload.buyer.municipality).toBe('010100');
    expect(payload.buyer.phone).toBe('829-555-6677');
  });

  it('omits unknown numeric DGII location codes before GISYS validation', () => {
    const input = buildBaseInput('invoice-unknown-location-codes');
    input.business = {
      name: 'VentaMas Test',
      fiscalIssuer: {
        legalName: 'VentaMas Fiscal Test',
        province: '990000',
        municipality: '320999',
      },
    };
    input.invoice.snapshot.client = {
      name: 'Cliente Prueba',
      province: '999999',
      municipality: '010999',
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer.province).toBeUndefined();
    expect(payload.issuer.municipality).toBeUndefined();
    expect(payload.buyer.province).toBeUndefined();
    expect(payload.buyer.municipality).toBeUndefined();
  });

  it('does not emit buyer country fields for E31 credit fiscal documents', () => {
    const input = buildBaseInput('invoice-e31-country-not-applicable');
    input.invoice.snapshot.ncf = {
      type: 'CREDITO FISCAL',
      documentType: 'E31',
      code: null,
    };
    input.invoice.snapshot.client = {
      name: 'GI SYS SRL',
      personalID: '132619201',
      country: 'DO',
      pais: 'Republica Dominicana',
    };
    input.taskPayload = {
      ncfType: 'CREDITO FISCAL',
    };

    const { documentType, payload } = buildGisysIssuePayload(input);

    expect(documentType).toBe('E31');
    expect(payload.buyer).not.toHaveProperty('country');
    expect(payload.buyer).not.toHaveProperty('pais');
  });

  it('maps POS personalID clients to buyer.rncCedula for E31 documents', () => {
    const input = buildBaseInput('invoice-e31-personal-id-client');
    input.invoice.snapshot.ncf = {
      type: 'CREDITO FISCAL',
      documentType: 'E31',
      code: null,
    };
    input.invoice.snapshot.client = {
      id: 'bjGp6Z19',
      name: 'GI SYS SRL',
      personalID: '132619201',
    };
    input.taskPayload = {
      ncfType: 'CREDITO FISCAL',
      client: {
        id: 'bjGp6Z19',
        name: 'GI SYS SRL',
        personalID: '132619201',
      },
    };

    const { documentType, payload } = buildGisysIssuePayload(input);

    expect(documentType).toBe('E31');
    expect(payload.buyer).toMatchObject({
      internalCode: 'bjGp6Z19',
      name: 'GI SYS SRL',
      rncCedula: '132619201',
    });
  });

  it('omits invalid buyer RNC or cedula for low-value E32 documents', () => {
    const input = buildBaseInput('invoice-e32-invalid-optional-buyer-id');
    input.invoice.snapshot.client = {
      id: '0zuSiyyv',
      name: 'Alanna Perez  2',
      personalID: '00201660332',
    };
    input.taskPayload = {
      ncfType: 'CONSUMIDOR FINAL',
      client: {
        id: '0zuSiyyv',
        name: 'Alanna Perez  2',
        personalID: '00201660332',
      },
    };

    const { documentType, payload } = buildGisysIssuePayload(input);

    expect(documentType).toBe('E32');
    expect(payload.totals.grandTotal).toBeLessThan(250000);
    expect(payload.buyer).toMatchObject({
      internalCode: '0zuSiyyv',
      name: 'Alanna Perez  2',
    });
    expect(payload.buyer).not.toHaveProperty('rncCedula');
  });

  it('keeps valid cedula values for low-value E32 documents when supplied', () => {
    const input = buildBaseInput('invoice-e32-valid-optional-buyer-id');
    input.invoice.snapshot.client = {
      id: '0zuSiyyv',
      name: 'Alanna Perez 2',
      personalID: '00201660339',
    };
    input.taskPayload = {
      ncfType: 'CONSUMIDOR FINAL',
      client: {
        id: '0zuSiyyv',
        name: 'Alanna Perez 2',
        personalID: '00201660339',
      },
    };

    const { documentType, payload } = buildGisysIssuePayload(input);

    expect(documentType).toBe('E32');
    expect(payload.totals.grandTotal).toBeLessThan(250000);
    expect(payload.buyer).toMatchObject({
      internalCode: '0zuSiyyv',
      name: 'Alanna Perez 2',
      rncCedula: '00201660339',
    });
  });

  it('sends the net taxed amount indicator for taxable E31 documents', () => {
    const input = buildBaseInput('invoice-e31-taxed-amount-indicator');
    input.invoice.snapshot.ncf = {
      type: 'CREDITO FISCAL',
      documentType: 'E31',
      code: null,
    };
    input.invoice.snapshot.client = {
      name: 'GI SYS SRL',
      personalID: '132619201',
    };
    input.taskPayload = {
      ncfType: 'CREDITO FISCAL',
    };

    const { documentType, payload } = buildGisysIssuePayload(input);

    expect(documentType).toBe('E31');
    expect(payload.taxedAmountIndicator).toBe('0');
  });

  it('sends the net taxed amount indicator for taxable E32 documents', () => {
    const input = buildBaseInput('invoice-e32-taxed-amount-indicator');
    input.invoice.snapshot.ncf = {
      type: 'CONSUMIDOR FINAL',
      documentType: 'E32',
      code: null,
    };
    input.invoice.snapshot.client = {
      name: 'YAJAIRA CONTRERAS CONTRERAS',
      personalID: '00201441797',
    };
    input.invoice.snapshot.cart.products = [
      {
        id: 'product-exempt',
        name: 'Producto exento',
        pricing: { price: 36757, tax: { label: 'Exento', value: 0 } },
        amountToBuy: 1,
      },
      {
        id: 'product-itbis-18',
        name: 'Producto ITBIS 18',
        pricing: { price: 162488, tax: 18 },
        amountToBuy: 1,
      },
      {
        id: 'product-itbis-16',
        name: 'Producto ITBIS 16',
        pricing: { price: 103647, tax: 16 },
        amountToBuy: 1,
      },
    ];
    input.taskPayload = {
      ncfType: 'CONSUMIDOR FINAL',
      client: input.invoice.snapshot.client,
    };

    const { documentType, payload } = buildGisysIssuePayload(input);

    expect(documentType).toBe('E32');
    expect(payload.taxedAmountIndicator).toBe('0');
    expect(payload.totals).toMatchObject({
      taxableAmountTotal: 266135,
      taxableAmount1: 162488,
      taxableAmount2: 103647,
      exemptAmount: 36757,
      taxAmount: 45831.36,
      grandTotal: 348723.36,
    });
  });

  it('sends DGII reference data for E34 credit notes', () => {
    const input = buildBaseInput('credit-note-e34-reference');
    input.invoice.snapshot.cart.date = '2026-06-16T18:45:00.000Z';
    input.invoice.snapshot.ncf = {
      type: 'NOTAS DE CRÉDITO',
      documentType: 'E34',
      code: null,
    };
    input.invoice.snapshot.client = {
      name: 'GI SYS SRL',
      personalID: '132619201',
    };
    input.taskPayload = {
      documentType: 'E34',
      ncfType: 'NOTAS DE CRÉDITO',
      reference: {
        modifiedENcf: 'E310000000007',
        modifiedDocumentDate: '2026-06-16T18:40:42.000Z',
        modificationCode: '3',
        reason: 'Devolucion parcial',
      },
    };

    const { documentType, payload } = buildGisysIssuePayload(input);

    expect(documentType).toBe('E34');
    expect(payload.reference).toEqual({
      modifiedENcf: 'E310000000007',
      modifiedDocumentDate: '2026-06-16T18:40:42.000Z',
      modificationCode: '3',
      reason: 'Devolucion parcial',
    });
    expect(payload.taxedAmountIndicator).toBe('0');
    expect(payload.creditNoteIndicator).toBe('0');
  });

  it('sets E34 credit note indicator to 1 when the affected e-CF is older than 30 calendar days', () => {
    const input = buildBaseInput('credit-note-e34-over-30-days');
    input.invoice.snapshot.cart.date = '2026-06-16T12:00:00.000Z';
    input.invoice.snapshot.ncf = {
      type: 'NOTAS DE CRÉDITO',
      documentType: 'E34',
      code: null,
    };
    input.invoice.snapshot.client = {
      name: 'GI SYS SRL',
      personalID: '132619201',
    };
    input.taskPayload = {
      documentType: 'E34',
      ncfType: 'NOTAS DE CRÉDITO',
      reference: {
        modifiedENcf: 'E310000000007',
        modifiedDocumentDate: '2026-05-16T12:00:00.000Z',
        modificationCode: '3',
        reason: 'Devolucion parcial',
      },
    };

    const { payload } = buildGisysIssuePayload(input);

    expect(payload.creditNoteIndicator).toBe('1');
  });

  it('keeps E34 credit note indicator at 0 through the first 30 calendar days', () => {
    const input = buildBaseInput('credit-note-e34-within-30-days');
    input.invoice.snapshot.cart.date = '2026-06-16T12:00:00.000Z';
    input.invoice.snapshot.ncf = {
      type: 'NOTAS DE CRÉDITO',
      documentType: 'E34',
      code: null,
    };
    input.invoice.snapshot.client = {
      name: 'GI SYS SRL',
      personalID: '132619201',
    };
    input.taskPayload = {
      documentType: 'E34',
      ncfType: 'NOTAS DE CRÉDITO',
      reference: {
        modifiedENcf: 'E310000000007',
        modifiedDocumentDate: '2026-05-17T12:00:00.000Z',
        modificationCode: '3',
        reason: 'Devolucion parcial',
      },
    };

    const { payload } = buildGisysIssuePayload(input);

    expect(payload.creditNoteIndicator).toBe('0');
  });

  it('uses an explicit valid E34 credit note indicator when provided', () => {
    const input = buildBaseInput('credit-note-e34-explicit-indicator');
    input.invoice.snapshot.cart.date = '2026-06-16T12:00:00.000Z';
    input.invoice.snapshot.ncf = {
      type: 'NOTAS DE CRÉDITO',
      documentType: 'E34',
      code: null,
    };
    input.invoice.snapshot.client = {
      name: 'GI SYS SRL',
      personalID: '132619201',
    };
    input.taskPayload = {
      documentType: 'E34',
      ncfType: 'NOTAS DE CRÉDITO',
      creditNoteIndicator: '0',
      reference: {
        modifiedENcf: 'E310000000007',
        modifiedDocumentDate: '2026-05-16T12:00:00.000Z',
        modificationCode: '3',
        reason: 'Devolucion parcial',
      },
    };

    const { payload } = buildGisysIssuePayload(input);

    expect(payload.creditNoteIndicator).toBe('0');
  });

  it('sends DGII reference data for E33 debit notes without credit note indicator', () => {
    const input = buildBaseInput('debit-note-e33-reference');
    input.invoice.snapshot.cart.date = '2026-06-16T19:00:00.000Z';
    input.invoice.snapshot.ncf = {
      type: 'NOTAS DE DÉBITO',
      documentType: 'E33',
      code: null,
    };
    input.invoice.snapshot.client = {
      name: 'GI SYS SRL',
      personalID: '132619201',
    };
    input.taskPayload = {
      documentType: 'E33',
      ncfType: 'NOTAS DE DÉBITO',
      reference: {
        modifiedENcf: 'E310000000008',
        modifiedDocumentDate: '2026-06-16T18:47:42.000Z',
        modificationCode: '3',
        reason: 'Diferencia de precio',
      },
    };

    const { documentType, payload } = buildGisysIssuePayload(input);

    expect(documentType).toBe('E33');
    expect(payload.reference).toEqual({
      modifiedENcf: 'E310000000008',
      modifiedDocumentDate: '2026-06-16T18:47:42.000Z',
      modificationCode: '3',
      reason: 'Diferencia de precio',
    });
    expect(payload.taxedAmountIndicator).toBe('0');
    expect(payload.creditNoteIndicator).toBeUndefined();
  });

  it('does not send requestedENcf to the GISYS issue_api contract', () => {
    const input = buildBaseInput('invoice-issue-api-no-requested-encf');
    input.invoice.snapshot.ncf = {
      type: 'CREDITO FISCAL',
      documentType: 'E31',
      code: 'E310000000001',
    };
    input.taskPayload = {
      ncfType: 'CREDITO FISCAL',
    };

    const { payload } = buildGisysIssuePayload(input);

    expect(payload.meta).toMatchObject({
      source: 'issue_api',
      sourceTraceId: 'business-1:invoice-issue-api-no-requested-encf',
    });
    expect(payload.meta).not.toHaveProperty('requestedENcf');
  });

  it('fails E33 and E34 payloads when reference data is missing', () => {
    const input = buildBaseInput('debit-note-e33-missing-reference');
    input.invoice.snapshot.ncf = {
      type: 'NOTAS DE DÉBITO',
      documentType: 'E33',
      code: null,
    };
    input.taskPayload = {
      documentType: 'E33',
      ncfType: 'NOTAS DE DÉBITO',
    };

    expect(() => buildGisysIssuePayload(input)).toThrow(
      'gisys_payload_requires_reference_for_adjustment',
    );
  });

  it('accepts province aliases that are stored as user-facing text', () => {
    const input = buildBaseInput('invoice-province-alias');
    input.invoice.snapshot.client = {
      name: 'Cliente Prueba',
      province: 'San Cristobal',
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.buyer.province).toBe('210000');
  });

  it('uses the first valid phone from business values with multiple numbers', () => {
    const input = buildBaseInput('invoice-multiple-phone-values');
    input.business = {
      name: 'VentaMas Test',
      fiscalIssuer: {
        legalName: 'VentaMas Fiscal Test',
        phone: '8496503586 / 8094333332',
      },
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer.phones).toEqual(['849-650-3586']);
  });

  it('does not override GISYS taxpayer issuer profile with display business fields', () => {
    const input = buildBaseInput('invoice-display-business-fields');
    input.business = {
      business: {
        name: 'Negocio de Distribución Prueba',
        address: 'H esquina 6, residencial marisol, villa marina',
        province: 'San Cristobal',
        tel: '8494073538 - 8093455678',
      },
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer).toBeUndefined();
  });

  it('sends explicit fiscal issuer profile fields when configured', () => {
    const input = buildBaseInput('invoice-explicit-fiscal-issuer');
    input.business = {
      business: {
        name: 'Negocio de Distribución Prueba',
        fiscalIssuer: {
          legalName: 'VENTAMAX FISCAL SRL',
          commercialName: 'VentaMax',
          address: 'Av. Fiscal 123',
          province: 'Santo Domingo',
          municipality: '320100',
          phone: '(809) 555-1234',
        },
      },
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer).toMatchObject({
      legalName: 'VENTAMAX FISCAL SRL',
      commercialName: 'VentaMax',
      address: 'Av. Fiscal 123',
      province: '320000',
      municipality: '320100',
      phones: ['809-555-1234'],
    });
  });

  it('maps the product tax rate to the DGII billing indicator', () => {
    const input = buildBaseInput('invoice-tax-rate-indicators');
    input.invoice.snapshot.cart.products = [
      {
        id: 'product-itbis-1',
        name: 'Producto ITBIS 18',
        pricing: { price: 100, tax: 18 },
        amountToBuy: 1,
      },
      {
        id: 'product-itbis-2',
        name: 'Producto ITBIS 16',
        pricing: { price: 100, tax: 16 },
        amountToBuy: 1,
      },
      {
        id: 'product-exempt',
        name: 'Producto exento',
        pricing: { price: 100, tax: 0 },
        amountToBuy: 1,
      },
    ];

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.items.map((item) => item.billingIndicator)).toEqual([
      '1',
      '2',
      '4',
    ]);
    expect(payload.items.map((item) => item.itemKind)).toEqual([
      '1',
      '1',
      '1',
    ]);
    expect(payload.items[0]).toMatchObject({ taxRate: 18, taxAmount: 18 });
    expect(payload.items[1]).toMatchObject({ taxRate: 16, taxAmount: 16 });
    expect(payload.items[2].taxRate).toBeUndefined();
    expect(payload.items[2].taxAmount).toBe(0);
    expect(payload.totals).toMatchObject({
      netAmount: 200,
      taxableAmountTotal: 200,
      taxableAmount1: 100,
      taxableAmount2: 100,
      exemptAmount: 100,
      itbisRate1: 18,
      itbisRate2: 16,
      taxAmount: 34,
      totalItbis1: 18,
      totalItbis2: 16,
      grandTotal: 334,
      payableAmount: 334,
    });
    expect(payload.totals.taxableAmount3).toBeUndefined();
  });

  it('sends exempt event service sales with a numeric zero ITBIS total', () => {
    const input = buildBaseInput('invoice-exempt-event-service');
    input.invoice.snapshot.cart.products = [
      {
        id: 'event-ticket-exempt',
        name: 'Entrada evento exenta',
        itemType: 'service',
        type: 'Eventos',
        pricing: { price: 250, tax: { label: 'Exento', value: 0 } },
        amountToBuy: 2,
      },
    ];

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.items[0]).toMatchObject({
      billingIndicator: '4',
      itemKind: '2',
      quantity: 2,
      unitPrice: 250,
      lineAmount: 500,
    });
    expect(payload.items[0].taxRate).toBeUndefined();
    expect(payload.items[0].taxAmount).toBe(0);
    expect(payload.totals).toMatchObject({
      netAmount: 0,
      exemptAmount: 500,
      taxAmount: 0,
      grandTotal: 500,
      payableAmount: 500,
    });
    expect(payload.totals.taxableAmountTotal).toBeUndefined();
  });

  it('uses the real weight as fiscal quantity for products sold by weight', () => {
    const input = buildBaseInput('invoice-weighted-product');
    input.invoice.snapshot.cart.products = [
      {
        id: 'weighted-1',
        name: 'Queso vendido por peso',
        amountToBuy: 1,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2.5,
          weightUnit: 'lb',
        },
        pricing: {
          price: 30,
          tax: 18,
        },
      },
    ];

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.items[0]).toMatchObject({
      quantity: 2.5,
      unitPrice: 30,
      taxAmount: 13.5,
      lineAmount: 75,
    });
    expect(payload.totals).toMatchObject({
      netAmount: 75,
      taxableAmountTotal: 75,
      taxableAmount1: 75,
      taxAmount: 13.5,
      grandTotal: 88.5,
      payableAmount: 88.5,
    });
  });

  it('uses explicit DGII tax type values before falling back to tax rate', () => {
    const input = buildBaseInput('invoice-explicit-tax-type-indicators');
    input.invoice.snapshot.cart.products = [
      {
        id: 'product-itbis-3',
        name: 'Producto gravado tasa cero',
        pricing: { price: 100, tax: { ref: 'ITBIS 3', value: 0 } },
        amountToBuy: 1,
      },
      {
        id: 'product-not-billable',
        name: 'Producto no facturable',
        pricing: { price: 100, tax: 18 },
        billingIndicator: '0',
        amountToBuy: 1,
      },
    ];

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.items[0]).toMatchObject({
      billingIndicator: '3',
      taxRate: 0,
      taxAmount: 0,
    });
    expect(payload.items[1].billingIndicator).toBe('0');
    expect(payload.items[1].taxRate).toBeUndefined();
    expect(payload.items[1].taxAmount).toBeUndefined();
    expect(payload.totals).toMatchObject({
      netAmount: 100,
      taxableAmountTotal: 100,
      taxableAmount3: 100,
      itbisRate3: 0,
      taxAmount: 0,
      totalItbis3: 0,
      grandTotal: 100,
      payableAmount: 100,
      nonBillableAmount: 100,
      periodAmount: 200,
    });
  });

  it('keeps monetary amounts numeric for the GISYS issue API contract', () => {
    const input = buildBaseInput('invoice-rfce-decimal-format');
    input.invoice.snapshot.cart.products[0].price = 94.5;
    input.invoice.snapshot.cart.totalPurchase = { value: 111.51 };
    input.invoice.snapshot.cart.totalPurchaseWithoutTaxes = { value: 94.5 };
    input.invoice.snapshot.cart.totalTaxes = { value: 17.01 };
    input.invoice.snapshot.cart.payment = { value: 111.51 };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.items[0]).toMatchObject({
      quantity: 1,
      unitPrice: 94.5,
      taxRate: 18,
      taxAmount: 17.01,
      lineAmount: 94.5,
    });
    expect(payload.totals).toMatchObject({
      netAmount: 94.5,
      taxableAmountTotal: 94.5,
      taxableAmount1: 94.5,
      itbisRate1: 18,
      taxAmount: 17.01,
      totalItbis1: 17.01,
      grandTotal: 111.51,
      payableAmount: 111.51,
    });
    expect(payload.payments).toEqual([{ form: '1', amount: 111.51 }]);
  });
});
