import { describe, expect, it } from 'vitest';

import {
  buildDgii606TxtContent,
  buildDgii606TxtFileName,
  buildDgii606TxtRow,
  validateDgii606Draft,
  buildDgii606Draft,
} from './dgii606TxtExport.service.js';

const buildBaseRecord = (overrides = {}) => ({
  counterparty: {
    identification: {
      number: '101010101',
    },
  },
  classification: {
    dgii606ExpenseType: '09',
  },
  taxReceipt: {
    ncf: 'B0100000015',
  },
  issuedAt: '2026-04-05T13:20:00.000Z',
  paymentAt: '2026-04-10T13:20:00.000Z',
  fiscalAmounts: {
    serviceAmount: 0,
    goodsAmount: 1000,
    totalAmount: 1000,
    itbisToAdvance: 180,
  },
  taxBreakdown: {
    itbisTotal: 180,
  },
  paymentInfo: {
    formCode: '01',
  },
  ...overrides,
});

describe('dgii606TxtExport.service', () => {
  it('serializa fila 606 con 23 campos oficiales', () => {
    const row = buildDgii606TxtRow({
      record: buildBaseRecord(),
    });
    const columns = row.split('|');

    expect(columns).toHaveLength(23);
    expect(columns.slice(0, 10)).toEqual([
      '101010101',
      '1',
      '09',
      'B0100000015',
      '',
      '20260405',
      '20260410',
      '0.00',
      '1000.00',
      '1000.00',
    ]);
    expect(columns[14]).toBe('180.00');
    expect(columns[22]).toBe('01');
  });

  it('arma encabezado y nombre DGII_F_606 oficial', () => {
    const rows = [
      buildDgii606TxtRow({ record: buildBaseRecord() }),
      buildDgii606TxtRow({
        record: buildBaseRecord({
          counterparty: {
            identification: {
              number: '001-0088450-1',
            },
          },
          fiscalAmounts: {
            serviceAmount: 500,
            goodsAmount: 0,
            totalAmount: 500,
            itbisToAdvance: 90,
          },
          taxBreakdown: {
            itbisTotal: 90,
          },
          paymentInfo: {
            formCode: '02',
          },
        }),
      }),
    ];

    expect(
      buildDgii606TxtContent({
        businessRnc: '101010101',
        periodKey: '2026-04',
        rows,
      }).split('\r\n')[0],
    ).toBe('606|101010101|202604|000000000002');
    expect(
      buildDgii606TxtFileName({
        businessRnc: '101010101',
        periodKey: '2026-04',
      }),
    ).toBe('DGII_F_606_101010101_202604.TXT');
  });

  it('rechaza filas sin forma de pago o identificación de proveedor', () => {
    const missingPaymentDraft = buildDgii606Draft({
      record: buildBaseRecord({
        paymentInfo: {
          formCode: '',
        },
      }),
    });
    const missingIdentificationDraft = buildDgii606Draft({
      record: buildBaseRecord({
        counterparty: {
          identification: {
            number: '',
          },
        },
      }),
    });

    expect(validateDgii606Draft(missingPaymentDraft).issues).toContainEqual(
      expect.objectContaining({
        fieldKey: 'paymentForm',
        code: 'invalid-payment-form',
      }),
    );
    expect(
      validateDgii606Draft(missingIdentificationDraft).issues,
    ).toContainEqual(
      expect.objectContaining({
        fieldKey: 'identificationNumber',
        code: 'missing-identification',
      }),
    );
  });
});
