import { beforeEach, describe, expect, it, vi } from 'vitest';

const getTaxReceiptDocFromTxMock = vi.hoisted(() => vi.fn());
const serverTimestampMock = vi.hoisted(() => vi.fn(() => ({ __op: 'serverTimestamp' })));

let usageRefCounter = 0;

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    collection: vi.fn((collectionName) => {
      if (collectionName !== 'businesses') {
        throw new Error(`Unexpected collection: ${collectionName}`);
      }

      return {
        doc: vi.fn((businessId) => ({
          collection: vi.fn((subcollectionName) => {
            if (subcollectionName === 'invoices') {
              return {
                where: vi.fn((_field, _operator, code) => ({
                  limit: vi.fn(() => ({
                    kind: 'invoiceQuery',
                    businessId,
                    code,
                  })),
                })),
              };
            }

            if (subcollectionName === 'ncfUsage') {
              return {
                doc: vi.fn(() => {
                  usageRefCounter += 1;
                  return {
                    id: `usage-${usageRefCounter}`,
                    path: `businesses/${businessId}/ncfUsage/usage-${usageRefCounter}`,
                  };
                }),
              };
            }

            throw new Error(`Unexpected subcollection: ${subcollectionName}`);
          }),
        })),
      };
    }),
  },
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
  },
}));

vi.mock('../../../../modules/taxReceipt/services/getTaxReceipt.js', () => ({
  getTaxReceiptDocFromTx: (...args) => getTaxReceiptDocFromTxMock(...args),
}));

import { reserveNcf } from './ncf.service.js';

describe('ncf.service', () => {
  let tx;
  let receiptRef;

  beforeEach(() => {
    usageRefCounter = 0;
    serverTimestampMock.mockClear();
    getTaxReceiptDocFromTxMock.mockReset();

    receiptRef = { path: 'businesses/business-1/taxReceipt/fiscal-consumer' };

    tx = {
      get: vi.fn(async (query) => {
        if (query?.kind === 'invoiceQuery') {
          return {
            empty: query.code !== 'B0101101',
          };
        }

        throw new Error(`Unexpected tx.get query: ${JSON.stringify(query)}`);
      }),
      update: vi.fn(),
      set: vi.fn(),
    };
  });

  it('salta NCF duplicados y reserva el siguiente codigo disponible', async () => {
    getTaxReceiptDocFromTxMock.mockResolvedValue({
      ref: receiptRef,
      data: () => ({
        data: {
          type: 'B01',
          serie: '1',
          sequence: 100,
          increase: 1,
          quantity: 5,
          sequenceLength: 3,
        },
      }),
    });

    await expect(
      reserveNcf(tx, {
        businessId: 'business-1',
        userId: 'user-1',
        ncfType: 'fiscal-consumer',
      }),
    ).resolves.toEqual({
      ncfCode: 'B0101102',
      usageId: 'usage-1',
      taxReceiptRef: receiptRef,
    });

    expect(tx.update).toHaveBeenCalledWith(receiptRef, {
      data: expect.objectContaining({
        sequence: 102,
        quantity: 4,
        sequenceLength: 3,
      }),
    });
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'usage-1',
      }),
      {
        id: 'usage-1',
        ncfCode: 'B0101102',
        taxReceiptName: 'fiscal-consumer',
        generatedAt: { __op: 'serverTimestamp' },
        userId: 'user-1',
        status: 'pending',
      },
    );
  });

  it('rechaza cuando la configuracion no tiene cantidad suficiente', async () => {
    getTaxReceiptDocFromTxMock.mockResolvedValue({
      ref: receiptRef,
      data: () => ({
        data: {
          type: 'B01',
          serie: '1',
          sequence: 100,
          increase: 2,
          quantity: 1,
          sequenceLength: 3,
        },
      }),
    });

    await expect(
      reserveNcf(tx, {
        businessId: 'business-1',
        userId: 'user-1',
        ncfType: 'fiscal-consumer',
      }),
    ).rejects.toThrow('Cantidad insuficiente para generar NCF');
  });

  it('rechaza cuando falta la serie o el tipo configurado', async () => {
    getTaxReceiptDocFromTxMock.mockResolvedValue({
      ref: receiptRef,
      data: () => ({
        data: {
          type: '',
          serie: '',
          sequence: 100,
          increase: 1,
          quantity: 5,
          sequenceLength: 3,
        },
      }),
    });

    await expect(
      reserveNcf(tx, {
        businessId: 'business-1',
        userId: 'user-1',
        ncfType: 'fiscal-consumer',
      }),
    ).rejects.toThrow('Tipo de NCF no configurado');
  });
});
