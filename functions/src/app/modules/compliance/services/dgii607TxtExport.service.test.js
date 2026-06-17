import { describe, expect, it } from 'vitest';

import {
  buildDgii607TxtRow,
  resolveIdentType,
  shouldExcludeDgii607TxtRecord,
} from './dgii607TxtExport.service.js';

describe('dgii607TxtExport.service', () => {
  it('serializa filas 607 con 23 campos y cédula sin guiones', () => {
    const row = buildDgii607TxtRow({
      record: {
        counterparty: {
          identification: {
            number: '001-2345678-9',
          },
        },
        data: {
          NCF: 'B0200000500',
        },
        issuedAt: '2026-04-07T10:00:00.000Z',
        totals: {
          total: 250000,
          tax: 38135.59,
        },
      },
      firestoreDoc: {},
    });

    const columns = row.split('|');

    expect(columns).toHaveLength(23);
    expect(columns[0]).toBe('00123456789');
    expect(columns[1]).toBe('2');
    expect(columns[2]).toBe('B0200000500');
    expect(columns[10]).toBe('0.00');
    expect(columns[11]).toBe('0.00');
    expect(columns[12]).toBe('0.00');
    expect(columns[15]).toBe('0.00');
    expect(columns[22]).toBe('250000.00');
  });

  it('marca pasaporte o id tributaria como tipo 3', () => {
    expect(resolveIdentType('A12345678')).toBe('3');
  });

  it('excluye facturas B02 menores a 250,000 del TXT detallado', () => {
    expect(
      shouldExcludeDgii607TxtRecord({
        isCredit: false,
        record: {
          data: {
            NCF: 'B0200000771',
          },
          totals: {
            total: 189.98,
          },
        },
      }),
    ).toBe(true);

    expect(
      shouldExcludeDgii607TxtRecord({
        isCredit: false,
        record: {
          data: {
            NCF: 'B0200000772',
          },
          totals: {
            total: 250000,
          },
        },
      }),
    ).toBe(false);
  });

  it('serializa notas de debito con NCF modificado y forma de venta', () => {
    const row = buildDgii607TxtRow({
      record: {
        counterparty: {
          identification: {
            number: '101010101',
          },
        },
        data: {
          NCF: 'E330000000001',
        },
        issuedAt: '2026-04-07T10:00:00.000Z',
        totals: {
          total: 118,
          tax: 18,
        },
        paymentBreakdown: {
          creditSale: 118,
        },
      },
      firestoreDoc: {
        paymentBreakdown: {
          creditSale: 118,
        },
      },
      isDebit: true,
      originalNcf: 'E310000000008',
    });

    const columns = row.split('|');

    expect(columns).toHaveLength(23);
    expect(columns[2]).toBe('E330000000001');
    expect(columns[3]).toBe('E310000000008');
    expect(columns[19]).toBe('118.00');
  });

  it('rechaza facturas detalladas sin identificación válida', () => {
    expect(() =>
      buildDgii607TxtRow({
        record: {
          counterparty: {
            identification: {
              number: '',
            },
          },
          data: {
            NCF: 'B0100000015',
          },
          issuedAt: '2026-04-07T10:00:00.000Z',
          totals: {
            total: 1180,
            tax: 180,
          },
        },
        firestoreDoc: {},
      }),
    ).toThrow('Falta identificación del cliente');
  });
});
