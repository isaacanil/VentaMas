import { describe, expect, it } from 'vitest';

import { isCanonicalInvoiceReadyForFrontend } from './electronicInvoiceReadiness';

describe('isCanonicalInvoiceReadyForFrontend', () => {
  it('permite facturas legacy aunque no tengan proyeccion e-CF', () => {
    expect(
      isCanonicalInvoiceReadyForFrontend({
        invoiceMeta: { status: 'frontend_ready' },
        canonicalInvoice: { id: 'invoice-1' },
      }),
    ).toBe(true);
  });

  it('retiene una factura e-CF hasta que la proyeccion electronica exista', () => {
    expect(
      isCanonicalInvoiceReadyForFrontend({
        invoiceMeta: {
          snapshot: {
            fiscalMode: 'electronic_ecf',
            documentFormat: 'electronic',
          },
        },
        canonicalInvoice: { id: 'invoice-1' },
      }),
    ).toBe(false);
  });

  it('permite una factura e-CF cuando el canonico ya tiene snapshot electronico', () => {
    expect(
      isCanonicalInvoiceReadyForFrontend({
        invoiceMeta: {
          snapshot: {
            fiscalMode: 'electronic_ecf',
          },
        },
        canonicalInvoice: {
          id: 'invoice-1',
          electronicTaxReceipt: {
            status: 'issued',
            documentType: 'E32',
            eNcf: 'E320000000001',
          },
        },
      }),
    ).toBe(true);
  });
});
