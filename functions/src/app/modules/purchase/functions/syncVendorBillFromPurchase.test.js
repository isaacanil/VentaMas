import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  deleteMock,
  getDocRef,
  loggerWarnMock,
  setMock,
} = vi.hoisted(() => {
  const hoistedDeleteMock = vi.fn(async () => undefined);
  const hoistedSetMock = vi.fn(async () => undefined);
  const hoistedLoggerWarnMock = vi.fn();

  const hoistedGetDocRef = (path) => ({
    path,
    id: path.split('/').at(-1) ?? null,
    set: hoistedSetMock,
    delete: hoistedDeleteMock,
  });

  return {
    deleteMock: hoistedDeleteMock,
    getDocRef: hoistedGetDocRef,
    loggerWarnMock: hoistedLoggerWarnMock,
    setMock: hoistedSetMock,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    warn: (...args) => loggerWarnMock(...args),
  },
}));

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
  },
}));

import { syncVendorBillFromPurchase } from './syncVendorBillFromPurchase.js';

describe('syncVendorBillFromPurchase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('materializes a canonical vendor bill from a completed purchase', async () => {
    await syncVendorBillFromPurchase({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        after: {
          data: () => ({
            providerId: 'supplier-1',
            numberId: 120,
            workflowStatus: 'completed',
            completedAt: '2026-04-10T12:00:00.000Z',
            totalAmount: 150,
            paymentState: {
              total: 150,
              paid: 50,
              balance: 100,
              paymentCount: 1,
            },
            paymentTerms: {
              nextPaymentAt: '2026-04-20T12:00:00.000Z',
            },
          }),
        },
      },
    });

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'purchase:purchase-1',
        sourceDocumentId: 'purchase-1',
        status: 'partially_paid',
        approvalStatus: 'approved',
        supplierId: 'supplier-1',
        totals: {
          total: 150,
          paid: 50,
          balance: 100,
        },
      }),
      { merge: true },
    );
  });

  it('deletes the canonical vendor bill when the purchase document is removed', async () => {
    await syncVendorBillFromPurchase({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        after: {
          data: () => null,
        },
      },
    });

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(setMock).not.toHaveBeenCalled();
  });
});
