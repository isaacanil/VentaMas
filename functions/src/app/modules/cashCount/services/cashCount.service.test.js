import { describe, expect, it, vi } from 'vitest';

const firebaseMocks = vi.hoisted(() => ({
  doc: vi.fn((path) => ({
    id: path.split('/').pop(),
    path,
  })),
  serverTimestamp: vi.fn(() => ({ __op: 'serverTimestamp' })),
  arrayUnion: vi.fn((value) => ({ arrayUnion: value })),
}));

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => firebaseMocks.doc(...args),
  },
  FieldValue: {
    serverTimestamp: (...args) => firebaseMocks.serverTimestamp(...args),
    arrayUnion: (...args) => firebaseMocks.arrayUnion(...args),
  },
}));

import { addBillToCashCountById } from './cashCount.service.js';

describe('addBillToCashCountById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws not-found before reading data from a missing cash count snapshot', async () => {
    const tx = {
      update: vi.fn(),
    };
    const cashCountSnap = {
      id: 'cash-missing',
      exists: false,
      ref: { id: 'cash-missing-ref' },
      data: vi.fn(() => {
        throw new Error('data should not be read');
      }),
    };

    await expect(
      addBillToCashCountById(
        tx,
        { uid: 'user-1', businessID: 'business-1' },
        { id: 'invoice-1', path: 'invoices/invoice-1' },
        cashCountSnap,
      ),
    ).rejects.toMatchObject({
      code: 'not-found',
      message: 'CashCount cash-missing no existe',
    });

    expect(cashCountSnap.data).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('dual-writes the cash count sale link and preserves the legacy sales array', async () => {
    const invoiceRef = {
      id: 'invoice-1',
      path: 'businesses/business-1/invoices/invoice-1',
    };
    const cashCountRef = {
      id: 'cash-1',
      path: 'businesses/business-1/cashCounts/cash-1',
    };
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const cashCountSnap = {
      id: 'cash-1',
      exists: true,
      ref: cashCountRef,
      get: vi.fn((field) => {
        if (field === 'cashCount.sales') return [];
        return undefined;
      }),
      data: vi.fn(() => ({
        cashCount: {
          id: 'cash-1',
          state: 'open',
          sales: [],
        },
      })),
    };

    await addBillToCashCountById(
      tx,
      { uid: 'user-1', businessID: 'business-1' },
      invoiceRef,
      cashCountSnap,
    );

    expect(tx.update).toHaveBeenCalledWith(cashCountRef, {
      'cashCount.sales': { arrayUnion: invoiceRef },
    });
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashCounts/cash-1/sales/invoice-1',
      }),
      expect.objectContaining({
        businessId: 'business-1',
        cashCountId: 'cash-1',
        invoiceId: 'invoice-1',
        invoiceRef,
        cashCountRef,
      }),
      { merge: true },
    );
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashCountSales/cash-1__invoice-1',
      }),
      expect.objectContaining({
        id: 'cash-1__invoice-1',
        businessId: 'business-1',
        cashCountId: 'cash-1',
        invoiceId: 'invoice-1',
      }),
      { merge: true },
    );
  });

  it('keeps duplicate legacy sales links rejected before writing read models', async () => {
    const invoiceRef = {
      id: 'invoice-1',
      path: 'businesses/business-1/invoices/invoice-1',
    };
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const cashCountSnap = {
      id: 'cash-1',
      exists: true,
      ref: {
        id: 'cash-1',
        path: 'businesses/business-1/cashCounts/cash-1',
      },
      data: vi.fn(() => ({
        cashCount: {
          id: 'cash-1',
          state: 'open',
          sales: [invoiceRef],
        },
      })),
    };

    await expect(
      addBillToCashCountById(
        tx,
        { uid: 'user-1', businessID: 'business-1' },
        invoiceRef,
        cashCountSnap,
      ),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'Factura ya registrada en el cuadre de caja cash-1',
    });

    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
  });
});
