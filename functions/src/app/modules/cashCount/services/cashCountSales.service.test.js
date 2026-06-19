import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => {
  const refs = new Map();
  const doc = vi.fn((path) => {
    if (!refs.has(path)) {
      refs.set(path, {
        id: path.split('/').pop(),
        path,
      });
    }
    return refs.get(path);
  });
  const runTransaction = vi.fn();
  const serverTimestamp = vi.fn(() => ({ __op: 'serverTimestamp' }));
  const arrayUnion = vi.fn((...values) => ({
    __op: 'arrayUnion',
    values,
  }));
  const arrayRemove = vi.fn((...values) => ({
    __op: 'arrayRemove',
    values,
  }));

  return {
    arrayRemove,
    arrayUnion,
    doc,
    refs,
    runTransaction,
    serverTimestamp,
  };
});

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => firebaseMock.doc(...args),
    runTransaction: (...args) => firebaseMock.runTransaction(...args),
  },
  FieldValue: {
    arrayRemove: (...args) => firebaseMock.arrayRemove(...args),
    arrayUnion: (...args) => firebaseMock.arrayUnion(...args),
    serverTimestamp: (...args) => firebaseMock.serverTimestamp(...args),
  },
}));

import {
  buildCashCountSaleReadModelId,
  linkSaleToCashCount,
  linkSaleToCashCountInTransaction,
  unlinkSaleFromCashCountInTransaction,
  upsertSaleToCashCountInTransaction,
} from './cashCountSales.service.js';

describe('cashCountSales.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseMock.refs.clear();
    firebaseMock.serverTimestamp.mockReturnValue({
      __op: 'serverTimestamp',
    });
    firebaseMock.arrayUnion.mockImplementation((...values) => ({
      __op: 'arrayUnion',
      values,
    }));
    firebaseMock.arrayRemove.mockImplementation((...values) => ({
      __op: 'arrayRemove',
      values,
    }));
  });

  it('builds a stable read model id from cash count and invoice ids', () => {
    expect(
      buildCashCountSaleReadModelId({
        cashCountId: 'cash-1',
        invoiceId: 'invoice-1',
      }),
    ).toBe('cash-1__invoice-1');
  });

  it('dual-writes the sale documents and patches the legacy sales array', async () => {
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/cashCounts/cash-1') {
          return {
            exists: true,
            data: () => ({
              cashCount: {
                id: 'cash-1',
                sales: [],
              },
            }),
            get: (field) => {
              if (field === 'cashCount.sales') return [];
              return null;
            },
          };
        }
        if (
          ref.path ===
            'businesses/business-1/cashCounts/cash-1/sales/invoice-1' ||
          ref.path === 'businesses/business-1/cashCountSales/cash-1__invoice-1'
        ) {
          return {
            exists: false,
          };
        }
        throw new Error(`Unexpected tx.get for ${ref.path}`);
      }),
      set: vi.fn(),
      update: vi.fn(),
    };

    const result = await linkSaleToCashCountInTransaction({
      tx,
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
      createdBy: 'user-1',
      source: {
        type: 'invoice-outbox',
        taskId: 'task-1',
      },
    });

    const cashCountRef = firebaseMock.refs.get(
      'businesses/business-1/cashCounts/cash-1',
    );
    const invoiceRef = firebaseMock.refs.get(
      'businesses/business-1/invoices/invoice-1',
    );
    const saleRef = firebaseMock.refs.get(
      'businesses/business-1/cashCounts/cash-1/sales/invoice-1',
    );
    const readModelRef = firebaseMock.refs.get(
      'businesses/business-1/cashCountSales/cash-1__invoice-1',
    );

    expect(tx.get.mock.calls.map(([ref]) => ref.path)).toEqual([
      cashCountRef.path,
      saleRef.path,
      readModelRef.path,
    ]);
    expect(tx.update).toHaveBeenCalledWith(cashCountRef, {
      'cashCount.sales': {
        __op: 'arrayUnion',
        values: [invoiceRef],
      },
    });
    expect(tx.set).toHaveBeenCalledWith(
      saleRef,
      expect.objectContaining({
        schemaVersion: 1,
        businessId: 'business-1',
        cashCountId: 'cash-1',
        invoiceId: 'invoice-1',
        cashCountRef,
        invoiceRef,
        saleRef,
        salePath: saleRef.path,
        readModelId: 'cash-1__invoice-1',
        createdBy: 'user-1',
        source: {
          type: 'invoice-outbox',
          taskId: 'task-1',
          attemptId: null,
        },
      }),
      { merge: false },
    );
    expect(tx.set).toHaveBeenCalledWith(
      readModelRef,
      expect.objectContaining({
        id: 'cash-1__invoice-1',
        invoiceRef,
        saleRef,
      }),
      { merge: false },
    );
    expect(result).toEqual({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
      salePath: saleRef.path,
      readModelId: 'cash-1__invoice-1',
      readModelPath: readModelRef.path,
      legacyPatched: true,
      saleCreated: true,
      readModelCreated: true,
      alreadyLinked: false,
    });
  });

  it('does not write again when all cash count sale surfaces already exist', async () => {
    const invoiceRef = firebaseMock.doc(
      'businesses/business-1/invoices/invoice-1',
    );
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/cashCounts/cash-1') {
          return {
            exists: true,
            data: () => ({
              cashCount: {
                id: 'cash-1',
                sales: [invoiceRef],
              },
            }),
          };
        }
        return {
          exists: true,
        };
      }),
      set: vi.fn(),
      update: vi.fn(),
    };

    const result = await linkSaleToCashCountInTransaction({
      tx,
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
      invoiceRef,
    });

    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      legacyPatched: false,
      saleCreated: false,
      readModelCreated: false,
      alreadyLinked: true,
    });
  });

  it('repairs missing legacy and read model writes without duplicating the sale doc', async () => {
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/cashCounts/cash-1') {
          return {
            exists: true,
            data: () => ({
              cashCount: {
                id: 'cash-1',
                sales: [],
              },
            }),
          };
        }
        if (
          ref.path === 'businesses/business-1/cashCounts/cash-1/sales/invoice-1'
        ) {
          return {
            exists: true,
          };
        }
        if (
          ref.path === 'businesses/business-1/cashCountSales/cash-1__invoice-1'
        ) {
          return {
            exists: false,
          };
        }
        throw new Error(`Unexpected tx.get for ${ref.path}`);
      }),
      set: vi.fn(),
      update: vi.fn(),
    };

    const result = await linkSaleToCashCountInTransaction({
      tx,
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
    });

    const cashCountRef = firebaseMock.refs.get(
      'businesses/business-1/cashCounts/cash-1',
    );
    const readModelRef = firebaseMock.refs.get(
      'businesses/business-1/cashCountSales/cash-1__invoice-1',
    );

    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(tx.update.mock.calls[0][0]).toBe(cashCountRef);
    expect(tx.set).toHaveBeenCalledTimes(1);
    expect(tx.set.mock.calls[0][0]).toBe(readModelRef);
    expect(result).toMatchObject({
      legacyPatched: true,
      saleCreated: false,
      readModelCreated: true,
      alreadyLinked: false,
    });
  });

  it('can skip the read model when the caller requests only the subcollection write', async () => {
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/cashCounts/cash-1') {
          return {
            exists: true,
            data: () => ({
              cashCount: {
                sales: [],
              },
            }),
          };
        }
        if (
          ref.path === 'businesses/business-1/cashCounts/cash-1/sales/invoice-1'
        ) {
          return {
            exists: false,
          };
        }
        throw new Error(`Unexpected tx.get for ${ref.path}`);
      }),
      set: vi.fn(),
      update: vi.fn(),
    };

    const result = await linkSaleToCashCountInTransaction({
      tx,
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
      writeReadModel: false,
    });

    expect(tx.get.mock.calls.map(([ref]) => ref.path)).toEqual([
      'businesses/business-1/cashCounts/cash-1',
      'businesses/business-1/cashCounts/cash-1/sales/invoice-1',
    ]);
    expect(tx.set).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      readModelId: null,
      readModelPath: null,
      readModelCreated: false,
    });
  });

  it('opens a Firestore transaction in the wrapper helper', async () => {
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/cashCounts/cash-1') {
          return {
            exists: true,
            data: () => ({ cashCount: { sales: [] } }),
          };
        }
        return {
          exists: false,
        };
      }),
      set: vi.fn(),
      update: vi.fn(),
    };
    firebaseMock.runTransaction.mockImplementation(async (callback) =>
      callback(tx),
    );

    await linkSaleToCashCount({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
    });

    expect(firebaseMock.runTransaction).toHaveBeenCalledTimes(1);
    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(tx.set).toHaveBeenCalledTimes(2);
  });

  it('throws not-found without writing when the cash count is missing', async () => {
    const tx = {
      get: vi.fn(async () => ({ exists: false })),
      set: vi.fn(),
      update: vi.fn(),
    };

    await expect(
      linkSaleToCashCountInTransaction({
        tx,
        businessId: 'business-1',
        cashCountId: 'cash-1',
        invoiceId: 'invoice-1',
      }),
    ).rejects.toMatchObject({
      code: 'not-found',
      message: 'CashCount cash-1 no existe',
    });
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
  });

  it('upserts sale surfaces without transactional reads after previous writes', () => {
    const cashCountRef = firebaseMock.doc(
      'businesses/business-1/cashCounts/cash-1',
    );
    const invoiceRef = firebaseMock.doc(
      'businesses/business-1/invoices/invoice-1',
    );
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const cashCountSnap = {
      exists: true,
      data: () => ({
        cashCount: {
          id: 'cash-1',
          sales: [],
        },
      }),
      get: (field) => {
        if (field === 'cashCount.sales') return [];
        return null;
      },
    };

    const result = upsertSaleToCashCountInTransaction({
      tx,
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
      cashCountRef,
      invoiceRef,
      cashCountSnap,
      createdBy: 'user-1',
    });

    const saleRef = firebaseMock.refs.get(
      'businesses/business-1/cashCounts/cash-1/sales/invoice-1',
    );
    const readModelRef = firebaseMock.refs.get(
      'businesses/business-1/cashCountSales/cash-1__invoice-1',
    );

    expect(tx.get).not.toHaveBeenCalled();
    expect(tx.update).toHaveBeenCalledWith(cashCountRef, {
      'cashCount.sales': {
        __op: 'arrayUnion',
        values: [invoiceRef],
      },
    });
    expect(tx.set).toHaveBeenCalledWith(
      saleRef,
      expect.objectContaining({
        businessId: 'business-1',
        cashCountId: 'cash-1',
        invoiceId: 'invoice-1',
      }),
      { merge: true },
    );
    expect(tx.set).toHaveBeenCalledWith(
      readModelRef,
      expect.objectContaining({
        id: 'cash-1__invoice-1',
      }),
      { merge: true },
    );
    expect(result).toMatchObject({
      legacyPatched: true,
      saleUpserted: true,
      readModelUpserted: true,
    });
  });

  it('removes sale subdoc, read model and legacy array in a transaction', () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const result = unlinkSaleFromCashCountInTransaction({
      tx,
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
    });

    const cashCountRef = firebaseMock.refs.get(
      'businesses/business-1/cashCounts/cash-1',
    );
    const invoiceRef = firebaseMock.refs.get(
      'businesses/business-1/invoices/invoice-1',
    );
    const saleRef = firebaseMock.refs.get(
      'businesses/business-1/cashCounts/cash-1/sales/invoice-1',
    );
    const readModelRef = firebaseMock.refs.get(
      'businesses/business-1/cashCountSales/cash-1__invoice-1',
    );

    expect(tx.update).toHaveBeenCalledWith(cashCountRef, {
      'cashCount.sales': {
        __op: 'arrayRemove',
        values: [invoiceRef],
      },
    });
    expect(tx.delete).toHaveBeenCalledWith(saleRef);
    expect(tx.delete).toHaveBeenCalledWith(readModelRef);
    expect(result).toEqual({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
      salePath: saleRef.path,
      readModelId: 'cash-1__invoice-1',
      readModelPath: readModelRef.path,
      legacyRemoved: true,
      saleRemoved: true,
      readModelRemoved: true,
    });
  });
});
