import { beforeEach, describe, expect, it, vi } from 'vitest';

const getStoredSessionMock = vi.fn();
const createFirebaseCallableMock = vi.fn();
const completePurchaseReceiptCallableMock = vi.fn();
const resolveMonetarySnapshotForBusinessMock = vi.fn();
const resolvePurchaseMonetaryTotalsMock = vi.fn();
const resolvePurchasePaymentStateMock = vi.fn();
const resolvePurchasePaymentTermsMock = vi.fn();
const syncPurchaseAttachmentsMock = vi.fn();

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: (...args: unknown[]) => getStoredSessionMock(...args),
}));

vi.mock('@/firebase/functions/callable', () => ({
  createFirebaseCallable: (...args: unknown[]) =>
    createFirebaseCallableMock(...args),
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

vi.mock('./attachmentService', () => ({
  syncPurchaseAttachments: (...args: unknown[]) =>
    syncPurchaseAttachmentsMock(...args),
}));

describe('fbCompletePurchase', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createFirebaseCallableMock.mockReturnValue(
      completePurchaseReceiptCallableMock,
    );
    completePurchaseReceiptCallableMock.mockResolvedValue({
      ok: true,
      purchase: {
        id: 'purchase-1',
        workflowStatus: 'completed',
        receiptInventoryState: {
          status: 'applied',
          operationId: 'receipt-1',
        },
      },
    });
    getStoredSessionMock.mockReturnValue({ sessionToken: 'session-1' });
    resolvePurchaseMonetaryTotalsMock.mockReturnValue({
      subtotal: 100,
      taxes: 18,
      total: 118,
    });
    resolvePurchasePaymentTermsMock.mockReturnValue({
      condition: 'cash',
    });
    resolvePurchasePaymentStateMock.mockReturnValue({
      total: 118,
      paid: 0,
      balance: 118,
    });
    resolveMonetarySnapshotForBusinessMock.mockResolvedValue({
      documentTotals: {
        total: 118,
      },
    });
    syncPurchaseAttachmentsMock.mockResolvedValue([
      {
        id: 'file-1',
        url: 'https://files.example/receipt.pdf',
      },
    ]);
  });

  it('delegates purchase receipt completion to the backend callable', async () => {
    const { fbCompletePurchase } = await import('./fbCompletePurchase');
    const setLoading = vi.fn();

    await expect(
      fbCompletePurchase({
        user: {
          uid: 'user-1',
          businessID: 'business-1',
        },
        purchase: {
          id: 'purchase-1',
          replenishments: [
            {
              id: 'product-1',
              receivedQuantity: 2,
              orderedQuantity: 2,
            },
          ],
        },
        localFiles: [
          {
            id: 'local-1',
            location: 'local',
          },
        ],
        setLoading,
        warehouseId: 'warehouse-1',
      }),
    ).resolves.toMatchObject({
      id: 'purchase-1',
      workflowStatus: 'completed',
      receiptInventoryState: {
        status: 'applied',
      },
    });

    expect(createFirebaseCallableMock).toHaveBeenCalledWith(
      'completePurchaseReceipt',
    );
    expect(syncPurchaseAttachmentsMock).toHaveBeenCalledWith({
      user: {
        uid: 'user-1',
        businessID: 'business-1',
      },
      purchaseId: 'purchase-1',
      currentAttachments: undefined,
      localFiles: [
        {
          id: 'local-1',
          location: 'local',
        },
      ],
    });
    expect(completePurchaseReceiptCallableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        warehouseId: 'warehouse-1',
        sessionToken: 'session-1',
        attachmentUrls: [
          {
            id: 'file-1',
            url: 'https://files.example/receipt.pdf',
          },
        ],
        paymentTerms: {
          condition: 'cash',
        },
        paymentState: {
          total: 118,
          paid: 0,
          balance: 118,
        },
        monetary: {
          documentTotals: {
            total: 118,
          },
        },
      }),
    );
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it('does not call the backend when attachment sync fails', async () => {
    const { fbCompletePurchase } = await import('./fbCompletePurchase');
    syncPurchaseAttachmentsMock.mockRejectedValue(new Error('upload failed'));

    await expect(
      fbCompletePurchase({
        user: {
          uid: 'user-1',
          businessID: 'business-1',
        },
        purchase: {
          id: 'purchase-1',
        },
      }),
    ).rejects.toThrow('upload failed');

    expect(completePurchaseReceiptCallableMock).not.toHaveBeenCalled();
  });
});
