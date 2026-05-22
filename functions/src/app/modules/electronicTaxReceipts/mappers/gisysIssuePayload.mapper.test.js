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
      phone: '12345678901234567890',
    };
    input.invoice.snapshot.client = {
      name: 'Cliente Prueba',
      province: 'inventada',
      tel: 'telefono-no-valido',
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer.province).toBeUndefined();
    expect(payload.issuer.phones).toBeUndefined();
    expect(payload.buyer.province).toBeUndefined();
    expect(payload.buyer.phone).toBeUndefined();
  });

  it('normalizes valid Dominican province names and phone values', () => {
    const input = buildBaseInput('invoice-valid-contact');
    input.business = {
      name: 'VentaMas Test',
      province: 'Santo Domingo',
      phone: '(809) 555-1234',
    };
    input.invoice.snapshot.client = {
      name: 'Cliente Prueba',
      province: 'San Cristóbal',
      tel: '+1 (829) 555-6677',
    };

    const payload = buildGisysIssuePayload(input).payload;

    expect(payload.issuer.province).toBe('Santo Domingo');
    expect(payload.issuer.phones).toEqual(['809-555-1234']);
    expect(payload.buyer.province).toBe('San Cristobal');
    expect(payload.buyer.phone).toBe('829-555-6677');
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
});
