import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();
const getDocMock = vi.fn();
const serverTimestampMock = vi.fn();
const setDocMock = vi.fn();
const updateDocMock = vi.fn();
const writeBatchCommitMock = vi.fn();
const writeBatchUpdateMock = vi.fn();
const fbUploadFilesMock = vi.fn();
const getNextIDMock = vi.fn();
const safeTimestampMock = vi.fn();
const toMillisMock = vi.fn();
const resolveMonetarySnapshotForBusinessMock = vi.fn();
const resolvePurchaseMonetaryTotalsMock = vi.fn();
const resolvePurchasePaymentStateMock = vi.fn();
const resolvePurchasePaymentTermsMock = vi.fn();
const updateLocalAttachmentsWithRemoteURLsMock = vi.fn();
const normalizePurchaseReplenishmentsMock = vi.fn();
const resolveLegacyPurchaseStatusMock = vi.fn();
const resolvePurchaseWorkflowStatusMock = vi.fn();
const syncVendorBillFromPurchaseMock = vi.fn();
const fbUpdateProdStockForReplenishMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromMillis: (value: unknown) => ({ kind: 'timestamp', value }),
  },
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  writeBatch: () => ({
    update: (...args: unknown[]) => writeBatchUpdateMock(...args),
    commit: (...args: unknown[]) => writeBatchCommitMock(...args),
  }),
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'purchase-1',
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: { __name: 'db' },
}));

vi.mock('@/firebase/img/fbUploadFileAndGetURL', () => ({
  fbUploadFiles: (...args: unknown[]) => fbUploadFilesMock(...args),
}));

vi.mock('@/firebase/Tools/getNextID', () => ({
  getNextID: (...args: unknown[]) => getNextIDMock(...args),
}));

vi.mock('@/firebase/utils/firestoreDates', () => ({
  safeTimestamp: (...args: unknown[]) => safeTimestampMock(...args),
}));

vi.mock('@/utils/date/toMillis', () => ({
  toMillis: (...args: unknown[]) => toMillisMock(...args),
}));

vi.mock('@/utils/accounting/monetary', () => ({
  resolveMonetarySnapshotForBusiness: (...args: unknown[]) =>
    resolveMonetarySnapshotForBusinessMock(...args),
}));

vi.mock('@/utils/purchase/financials', () => ({
  resolvePurchaseMonetaryTotals: (...args: unknown[]) =>
    resolvePurchaseMonetaryTotalsMock(...args),
  resolvePurchasePaymentState: (...args: unknown[]) =>
    resolvePurchasePaymentStateMock(...args),
  resolvePurchasePaymentTerms: (...args: unknown[]) =>
    resolvePurchasePaymentTermsMock(...args),
}));

vi.mock('@/utils/purchase/attachments', () => ({
  updateLocalAttachmentsWithRemoteURLs: (...args: unknown[]) =>
    updateLocalAttachmentsWithRemoteURLsMock(...args),
}));

vi.mock('@/utils/order/status', () => ({
  buildOrderStatusPatch: () => ({}),
}));

vi.mock('@/utils/purchase/workflow', () => ({
  normalizePurchaseReplenishments: (...args: unknown[]) =>
    normalizePurchaseReplenishmentsMock(...args),
  resolveLegacyPurchaseStatus: (...args: unknown[]) =>
    resolveLegacyPurchaseStatusMock(...args),
  resolvePurchaseWorkflowStatus: (...args: unknown[]) =>
    resolvePurchaseWorkflowStatusMock(...args),
}));

vi.mock('./syncVendorBillFromPurchase', () => ({
  syncVendorBillFromPurchase: (...args: unknown[]) =>
    syncVendorBillFromPurchaseMock(...args),
}));

vi.mock('./fbUpdateProdStockForReplenish', () => ({
  fbUpdateProdStockForReplenish: (...args: unknown[]) =>
    fbUpdateProdStockForReplenishMock(...args),
}));

import { addPurchase } from './fbAddPurchase';

describe('addPurchase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docMock.mockImplementation((...args: unknown[]) => ({
      path: args.slice(1).join('/'),
    }));
    serverTimestampMock.mockReturnValue({ kind: 'serverTimestamp' });
    setDocMock.mockResolvedValue(undefined);
    updateDocMock.mockResolvedValue(undefined);
    writeBatchCommitMock.mockResolvedValue(undefined);
    getNextIDMock.mockResolvedValue(12);
    safeTimestampMock.mockImplementation((value: unknown) => ({
      kind: 'safeTimestamp',
      value,
    }));
    toMillisMock.mockReturnValue(null);
    resolvePurchaseMonetaryTotalsMock.mockReturnValue({ total: 150 });
    resolvePurchasePaymentStateMock.mockReturnValue({
      paid: 0,
      balance: 150,
    });
    resolvePurchasePaymentTermsMock.mockReturnValue({});
    resolveMonetarySnapshotForBusinessMock.mockResolvedValue(null);
    updateLocalAttachmentsWithRemoteURLsMock.mockReturnValue([]);
    normalizePurchaseReplenishmentsMock.mockImplementation(
      (items: unknown) => items ?? [],
    );
    resolvePurchaseWorkflowStatusMock.mockReturnValue('pending_receipt');
    resolveLegacyPurchaseStatusMock.mockReturnValue('pending');
    syncVendorBillFromPurchaseMock.mockResolvedValue(undefined);
  });

  it('does not persist completedAt on a new pending purchase when it is empty', async () => {
    await addPurchase({
      user: {
        uid: 'user-1',
        businessID: 'business-1',
      },
      purchase: {
        providerId: 'provider-1',
        deliveryAt: 1782864000000,
        paymentAt: 1782950400000,
        replenishments: [
          {
            id: 'product-1',
            quantity: 2,
          },
        ],
      },
    });

    const payload = setDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(payload, 'completedAt')).toBe(
      false,
    );
    expect(payload).toMatchObject({
      id: 'purchase-1',
      numberId: 12,
      status: 'pending',
      workflowStatus: 'pending_receipt',
    });
  });
});
