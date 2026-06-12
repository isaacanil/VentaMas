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
      province: 'prueba',
      municipality: 'municipio inventado',
      phone: '12345678901234567890',
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
      province: 'Santo Domingo',
      municipality: '320100',
      phone: '(809) 555-1234',
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
      phone: '8496503586 / 8094333332',
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer.phones).toEqual(['849-650-3586']);
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
