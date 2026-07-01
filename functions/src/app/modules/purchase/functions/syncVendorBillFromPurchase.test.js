import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteMock, existingDocs, failingGetPaths, getDocRef, loggerWarnMock, setMock } =
  vi.hoisted(() => {
  const hoistedDeleteMock = vi.fn(async () => undefined);
  const hoistedExistingDocs = new Map();
  const hoistedFailingGetPaths = new Set();
  const hoistedSetMock = vi.fn(async () => undefined);
  const hoistedLoggerWarnMock = vi.fn();

  const hoistedToSnapshot = (path, data) => ({
    exists: data != null,
    id: path.split('/').at(-1) ?? null,
    data: () => data,
  });

  const hoistedGetDocRef = (path) => ({
    path,
    id: path.split('/').at(-1) ?? null,
    get: vi.fn(async () => {
      if (hoistedFailingGetPaths.has(path)) {
        throw new Error('transient read failure');
      }
      return hoistedToSnapshot(path, hoistedExistingDocs.get(path));
    }),
    set: hoistedSetMock,
    delete: hoistedDeleteMock,
  });

  return {
    deleteMock: hoistedDeleteMock,
    existingDocs: hoistedExistingDocs,
    failingGetPaths: hoistedFailingGetPaths,
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
    existingDocs.clear();
    failingGetPaths.clear();
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
        paymentControl: {
          canRegisterPayment: true,
          label: 'Aprobada',
          reason: null,
          status: 'payable',
          tone: 'success',
        },
        totals: {
          total: 150,
          paid: 50,
          balance: 100,
        },
      }),
      { merge: true },
    );
  });

  it('deletes stale canonical vendor bill while receipt inventory is pending', async () => {
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
            receiptInventoryState: {
              status: 'pending',
              operationId: 'receipt-1',
              warehouseId: 'warehouse-1',
            },
            paymentState: {
              total: 150,
              paid: 0,
              balance: 150,
              paymentCount: 0,
            },
          }),
        },
      },
    });

    expect(setMock).not.toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });

  it('builds initial payment state from legacy purchase totals', async () => {
    await syncVendorBillFromPurchase({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-legacy-totals',
      },
      data: {
        after: {
          data: () => ({
            providerId: 'supplier-legacy',
            numberId: 121,
            workflowStatus: 'completed',
            completedAt: '2026-04-12T12:00:00.000Z',
            totals: {
              total: 275.25,
            },
            paymentTerms: {
              expectedPaymentAt: '2026-04-25T12:00:00.000Z',
            },
          }),
        },
      },
    });

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceDocumentId: 'purchase-legacy-totals',
        status: 'approved',
        supplierId: 'supplier-legacy',
        totals: {
          total: 275.25,
          paid: 0,
          balance: 275.25,
        },
        paymentState: expect.objectContaining({
          total: 275.25,
          paid: 0,
          balance: 275.25,
          paymentCount: 0,
        }),
      }),
      { merge: true },
    );
  });

  it('preserves purchase AP control state in the vendor bill projection', async () => {
    existingDocs.set('businesses/business-1/vendorBills/purchase:purchase-held', {
      paymentHold: {
        active: true,
        status: 'active',
        reason: 'Pendiente de validar factura física',
        evidenceNote: 'Factura física retenida por compras',
      },
    });

    await syncVendorBillFromPurchase({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-held',
      },
      data: {
        after: {
          data: () => ({
            providerId: 'supplier-held',
            numberId: 122,
            workflowStatus: 'completed',
            completedAt: '2026-04-12T12:00:00.000Z',
            totalAmount: 180,
            paymentState: {
              total: 180,
              paid: 0,
              balance: 180,
              paymentCount: 0,
            },
            accountsPayable: {
              approvalStatus: 'approved',
              paymentHold: {
                active: true,
                status: 'active',
                reason: null,
                evidenceNote: null,
                evidenceUrls: [],
              },
            },
          }),
        },
      },
    });

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceDocumentId: 'purchase-held',
        status: 'on_hold',
        approvalStatus: 'approved',
        paymentControl: {
          canRegisterPayment: false,
          label: 'Retenida',
          reason: 'Pendiente de validar factura física',
          status: 'on_hold',
          tone: 'warning',
        },
        paymentHold: expect.objectContaining({
          active: true,
          status: 'active',
          reason: 'Pendiente de validar factura física',
          evidenceNote: 'Factura física retenida por compras',
        }),
      }),
      { merge: true },
    );
  });

  it('does not overwrite protected control details when reading the vendor bill fails', async () => {
    failingGetPaths.add(
      'businesses/business-1/vendorBills/purchase:purchase-read-fails',
    );

    await expect(
      syncVendorBillFromPurchase({
        params: {
          businessId: 'business-1',
          purchaseId: 'purchase-read-fails',
        },
        data: {
          after: {
            data: () => ({
              providerId: 'supplier-held',
              numberId: 122,
              workflowStatus: 'completed',
              completedAt: '2026-04-12T12:00:00.000Z',
              totalAmount: 180,
              paymentState: {
                total: 180,
                paid: 0,
                balance: 180,
                paymentCount: 0,
              },
              accountsPayable: {
                approvalStatus: 'approved',
                paymentHold: {
                  active: true,
                  status: 'active',
                  reason: null,
                  evidenceNote: null,
                  evidenceUrls: [],
                },
              },
            }),
          },
        },
      }),
    ).rejects.toThrow('transient read failure');

    expect(setMock).not.toHaveBeenCalled();
  });

  it('projects AP void control as a closed vendor bill without canceling the purchase', async () => {
    await syncVendorBillFromPurchase({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-voided-ap',
      },
      data: {
        after: {
          data: () => ({
            providerId: 'supplier-voided',
            numberId: 123,
            workflowStatus: 'completed',
            completedAt: '2026-04-12T12:00:00.000Z',
            totalAmount: 180,
            paymentState: {
              total: 180,
              paid: 0,
              balance: 180,
              paymentCount: 0,
            },
            accountsPayable: {
              approvalStatus: 'voided',
              status: 'voided',
              voidedAt: '2026-04-13T12:00:00.000Z',
              voidedBy: 'user-1',
              voidReason: 'Factura duplicada por suplidor',
              voidEvidenceNote: 'Ticket AP-VOID-1',
              voidEvidenceUrls: ['https://files.example/void.pdf'],
            },
          }),
        },
      },
    });

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceDocumentId: 'purchase-voided-ap',
        status: 'voided',
        approvalStatus: 'voided',
        voidedBy: 'user-1',
        voidReason: 'Factura duplicada por suplidor',
        voidEvidenceNote: 'Ticket AP-VOID-1',
        voidEvidenceUrls: ['https://files.example/void.pdf'],
        paymentControl: {
          canRegisterPayment: false,
          label: 'Cerrada',
          reason: null,
          status: 'closed',
          tone: 'neutral',
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
