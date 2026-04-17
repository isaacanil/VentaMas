import { describe, expect, it } from 'vitest';

import {
  assertValidDgii607Header,
  buildDgii607Draft,
  serializeDgii607Draft,
  validateDgii607Draft,
  validateDgii607Header,
} from './dgii607ValidationEngine.service.js';

describe('dgii607ValidationEngine.service', () => {
  it('valida encabezado 607 con RNC, periodo y cantidad de registros', () => {
    const result = validateDgii607Header({
      businessRnc: '101010101',
      periodKey: '2026-04',
      rowCount: 3,
    });

    expect(result.ok).toBe(true);
    expect(result.normalizedBusinessRnc).toBe('101010101');
  });

  it('rechaza encabezado sin RNC valido', () => {
    expect(() =>
      assertValidDgii607Header({
        businessRnc: '',
        periodKey: '2026-04',
        rowCount: 1,
      }),
    ).toThrow('RNC o cédula del emisor requerido.');
  });

  it('construye draft valido y serializable para una factura fiscal', () => {
    const draft = buildDgii607Draft({
      record: {
        counterparty: {
          identification: {
            number: '001-2345678-9',
          },
        },
        data: {
          NCF: 'B01000000015',
        },
        issuedAt: '2026-04-07T10:00:00.000Z',
        totals: {
          total: 1180,
          tax: 180,
        },
      },
      firestoreDoc: {},
    });

    const validation = validateDgii607Draft(draft);

    expect(validation.ok).toBe(true);
    expect(serializeDgii607Draft(draft).split('|')).toHaveLength(23);
  });

  it('detecta desfase entre formas de pago y total del comprobante', () => {
    const draft = buildDgii607Draft({
      record: {
        counterparty: {
          identification: {
            number: '101010101',
          },
        },
        data: {
          NCF: 'B01000000015',
        },
        issuedAt: '2026-04-07T10:00:00.000Z',
        totals: {
          total: 1180,
          tax: 180,
        },
      },
      firestoreDoc: {},
    });

    draft.fields.otherSales = '1000.00';

    const validation = validateDgii607Draft(draft);

    expect(validation.ok).toBe(false);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'payment-total-mismatch',
        }),
      ]),
    );
  });

  it('rechaza nota de credito sin NCF modificado', () => {
    const draft = buildDgii607Draft({
      record: {
        counterparty: {
          identification: {
            number: '101010101',
          },
        },
        data: {
          NCF: 'B04000000009',
        },
        issuedAt: '2026-04-10T09:30:00.000Z',
        totals: {
          total: 350,
          tax: 0,
        },
      },
      firestoreDoc: {},
      isCredit: true,
      originalNcf: '',
    });

    const validation = validateDgii607Draft(draft);

    expect(validation.ok).toBe(false);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldKey: 'modifiedNcf',
          code: 'missing-modified-ncf',
        }),
      ]),
    );
  });
});
