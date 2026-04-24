import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();
const deleteDocMock = vi.fn();
const getDocMock = vi.fn();
const runTransactionMock = vi.fn();
const serverTimestampMock = vi.fn();
const setDocMock = vi.fn();
const updateDocMock = vi.fn();
const writeBatchCommitMock = vi.fn();
const writeBatchUpdateMock = vi.fn();
const getNextIDMock = vi.fn();
const createBatchMock = vi.fn();
const getAllBatchesMock = vi.fn();
const updateBatchMock = vi.fn();
const createProductStockMock = vi.fn();
const getProductStockByBatchMock = vi.fn();
const updateProductStockMock = vi.fn();
const getDefaultWarehouseMock = vi.fn();
const getWarehouseMock = vi.fn();
const safeTimestampMock = vi.fn();
const resolveMonetarySnapshotForBusinessMock = vi.fn();
const resolvePurchaseMonetaryTotalsMock = vi.fn();
const resolvePurchaseDisplayNextPaymentAtMock = vi.fn();
const resolvePurchasePaymentStateMock = vi.fn();
const resolvePurchasePaymentTermsMock = vi.fn();
const canCompletePurchaseMock = vi.fn();
const resolveLegacyPurchaseStatusMock = vi.fn();
const resolvePurchaseReceiptChangesMock = vi.fn();
const resolvePurchaseWorkflowStatusMock = vi.fn();
const buildPurchaseReceiptHistoryMock = vi.fn();
const syncPurchaseAttachmentsMock = vi.fn();
const assertPurchaseCompletionAccountingPeriodOpenMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  serverTimestamp: () => serverTimestampMock(),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  writeBatch: () => ({
    update: (...args: unknown[]) => writeBatchUpdateMock(...args),
    commit: (...args: unknown[]) => writeBatchCommitMock(...args),
  }),
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'movement-1',
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: { __name: 'db' },
}));

vi.mock('@/firebase/Tools/getNextID', () => ({
  getNextID: (...args: unknown[]) => getNextIDMock(...args),
}));

vi.mock('@/firebase/warehouse/batchService', () => ({
  createBatch: (...args: unknown[]) => createBatchMock(...args),
  getAllBatches: (...args: unknown[]) => getAllBatchesMock(...args),
  updateBatch: (...args: unknown[]) => updateBatchMock(...args),
}));

vi.mock('@/firebase/warehouse/productStockService', () => ({
  createProductStock: (...args: unknown[]) => createProductStockMock(...args),
  getProductStockByBatch: (...args: unknown[]) =>
    getProductStockByBatchMock(...args),
  updateProductStock: (...args: unknown[]) => updateProductStockMock(...args),
}));

vi.mock('@/firebase/warehouse/warehouseService', () => ({
  getDefaultWarehouse: (...args: unknown[]) =>
    getDefaultWarehouseMock(...args),
  getWarehouse: (...args: unknown[]) => getWarehouseMock(...args),
}));

vi.mock('@/firebase/utils/firestoreDates', () => ({
  safeTimestamp: (...args: unknown[]) => safeTimestampMock(...args),
}));

vi.mock('@/utils/accounting/monetary', () => ({
  resolveMonetarySnapshotForBusiness: (...args: unknown[]) =>
    resolveMonetarySnapshotForBusinessMock(...args),
}));

vi.mock('@/utils/purchase/financials', () => ({
  resolvePurchaseDisplayNextPaymentAt: (...args: unknown[]) =>
    resolvePurchaseDisplayNextPaymentAtMock(...args),
  resolvePurchaseMonetaryTotals: (...args: unknown[]) =>
    resolvePurchaseMonetaryTotalsMock(...args),
  resolvePurchasePaymentState: (...args: unknown[]) =>
    resolvePurchasePaymentStateMock(...args),
  resolvePurchasePaymentTerms: (...args: unknown[]) =>
    resolvePurchasePaymentTermsMock(...args),
}));

vi.mock('@/utils/purchase/workflow', () => ({
  canCompletePurchase: (...args: unknown[]) => canCompletePurchaseMock(...args),
  resolveLegacyPurchaseStatus: (...args: unknown[]) =>
    resolveLegacyPurchaseStatusMock(...args),
  resolvePurchaseReceiptChanges: (...args: unknown[]) =>
    resolvePurchaseReceiptChangesMock(...args),
  resolvePurchaseWorkflowStatus: (...args: unknown[]) =>
    resolvePurchaseWorkflowStatusMock(...args),
}));

vi.mock('@/utils/purchase/receiptHistory', () => ({
  buildPurchaseReceiptHistory: (...args: unknown[]) =>
    buildPurchaseReceiptHistoryMock(...args),
}));

vi.mock('./attachmentService', () => ({
  syncPurchaseAttachments: (...args: unknown[]) =>
    syncPurchaseAttachmentsMock(...args),
}));

vi.mock('./utils/purchaseAccountingPeriod', () => ({
  assertPurchaseCompletionAccountingPeriodOpen: (...args: unknown[]) =>
    assertPurchaseCompletionAccountingPeriodOpenMock(...args),
}));

import { fbCompletePurchase } from './fbCompletePurchase';

describe('fbCompletePurchase', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    deleteDocMock.mockResolvedValue(undefined);
    docMock.mockImplementation((...args: unknown[]) => ({
      path: args.slice(1).join('/'),
    }));
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        id: 'purchase-1',
        replenishments: [],
        receiptHistory: [],
      }),
    });
    runTransactionMock.mockResolvedValue(undefined);
    serverTimestampMock.mockReturnValue({ kind: 'serverTimestamp' });
    writeBatchCommitMock.mockResolvedValue(undefined);
    getNextIDMock.mockResolvedValue(1);
    createBatchMock.mockResolvedValue({ id: 'batch-1', numberId: 1 });
    getAllBatchesMock.mockResolvedValue([]);
    updateBatchMock.mockResolvedValue({ id: 'batch-1', numberId: 1 });
    createProductStockMock.mockResolvedValue(undefined);
    getProductStockByBatchMock.mockResolvedValue([]);
    updateProductStockMock.mockResolvedValue(undefined);
    getDefaultWarehouseMock.mockResolvedValue({
      id: 'warehouse-1',
      name: 'Principal',
    });
    getWarehouseMock.mockResolvedValue({
      id: 'warehouse-1',
      name: 'Principal',
    });
    safeTimestampMock.mockImplementation((value: unknown) => value);
    resolveMonetarySnapshotForBusinessMock.mockResolvedValue(null);
    resolvePurchaseDisplayNextPaymentAtMock.mockReturnValue(null);
    resolvePurchaseMonetaryTotalsMock.mockReturnValue({ total: 150 });
    resolvePurchasePaymentStateMock.mockReturnValue({
      paid: 0,
      balance: 150,
    });
    resolvePurchasePaymentTermsMock.mockReturnValue({});
    canCompletePurchaseMock.mockReturnValue(true);
    resolveLegacyPurchaseStatusMock.mockReturnValue('completed');
    resolvePurchaseReceiptChangesMock.mockReturnValue({
      nextReplenishments: [
        {
          id: 'prod-1',
          quantity: 1,
        },
      ],
      receiptReplenishments: [
        {
          id: 'prod-1',
          quantity: 1,
        },
      ],
      completedBackOrderIds: [],
    });
    resolvePurchaseWorkflowStatusMock.mockReturnValue('completed');
    buildPurchaseReceiptHistoryMock.mockReturnValue([]);
    syncPurchaseAttachmentsMock.mockResolvedValue([]);
    assertPurchaseCompletionAccountingPeriodOpenMock.mockResolvedValue(
      '2026-03',
    );
  });

  it('blocks the purchase before syncing attachments or persisting when the period is closed', async () => {
    const setLoading = vi.fn();
    assertPurchaseCompletionAccountingPeriodOpenMock.mockRejectedValue(
      new Error(
        'No puedes completar esta compra con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
      ),
    );

    await expect(
      fbCompletePurchase({
        user: {
          uid: 'user-1',
          businessID: 'business-1',
        },
        setLoading,
        purchase: {
          id: 'purchase-1',
          deliveryAt: 1710115200000,
          replenishments: [
            {
              id: 'prod-1',
              quantity: 1,
            },
          ],
        },
      }),
    ).rejects.toThrow(
      'No puedes completar esta compra con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    );

    expect(assertPurchaseCompletionAccountingPeriodOpenMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      purchase: expect.objectContaining({
        id: 'purchase-1',
        workflowStatus: 'completed',
      }),
    });
    expect(syncPurchaseAttachmentsMock).not.toHaveBeenCalled();
    expect(updateDocMock).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it('validates completion against the stored purchase instead of the submitted draft', async () => {
    const setLoading = vi.fn();

    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        id: 'purchase-1',
        workflowStatus: 'pending_receipt',
        replenishments: [
          {
            id: 'prod-1',
            orderedQuantity: 10,
            receivedQuantity: 0,
            pendingQuantity: 10,
          },
        ],
        receiptHistory: [],
      }),
    });
    canCompletePurchaseMock
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    await expect(
      fbCompletePurchase({
        user: {
          uid: 'user-1',
          businessID: 'business-1',
        },
        setLoading,
        purchase: {
          id: 'purchase-1',
          deliveryAt: 1710115200000,
          replenishments: [
            {
              id: 'prod-1',
              orderedQuantity: 10,
              receivedQuantity: 10,
              pendingQuantity: 0,
            },
          ],
        },
      }),
    ).resolves.toBeTruthy();

    expect(canCompletePurchaseMock).toHaveBeenCalledTimes(1);
    expect(canCompletePurchaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'purchase-1',
        workflowStatus: 'pending_receipt',
      }),
    );
    expect(updateDocMock).toHaveBeenCalledTimes(1);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
