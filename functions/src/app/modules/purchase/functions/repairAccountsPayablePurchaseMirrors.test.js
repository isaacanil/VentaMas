import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  batchCommitMock,
  batchSetMock,
  collectionDocs,
  documentRefs,
  documentSnapshots,
  getDocRef,
  MockHttpsError,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedCollectionDocs = new Map();
  const hoistedBatchSetMock = vi.fn();
  const hoistedBatchCommitMock = vi.fn(async () => undefined);
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      const ref = {
        path,
        id: path.split('/').at(-1) ?? null,
        get: vi.fn(async () => ({
          exists: hoistedDocumentSnapshots.has(path),
          id: path.split('/').at(-1) ?? null,
          ref,
          data: () => hoistedDocumentSnapshots.get(path),
        })),
      };
      hoistedDocumentRefs.set(path, ref);
    }

    return hoistedDocumentRefs.get(path);
  };

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    batchCommitMock: hoistedBatchCommitMock,
    batchSetMock: hoistedBatchSetMock,
    collectionDocs: hoistedCollectionDocs,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => {
  const buildQuery = (path, options = {}) => ({
    orderBy: vi.fn(() => buildQuery(path, options)),
    limit: vi.fn((limit) => buildQuery(path, { ...options, limit })),
    startAfter: vi.fn((startAfter) =>
      buildQuery(path, { ...options, startAfter }),
    ),
    get: vi.fn(async () => {
      const docs = (collectionDocs.get(path) ?? [])
        .filter((entry) =>
          options.startAfter ? entry.id > options.startAfter : true,
        )
        .slice(0, options.limit ?? 100)
        .map((entry) => ({
          id: entry.id,
          ref: getDocRef(`${path}/${entry.id}`),
          data: () => entry.data,
        }));

      return { docs };
    }),
  });

  return {
    FieldPath: {
      documentId: () => '__name__',
    },
    Timestamp: class MockTimestamp {
      static now() {
        return 'now-ts';
      }
    },
    db: {
      batch: () => ({
        set: batchSetMock,
        commit: batchCommitMock,
      }),
      collection: (path) => buildQuery(path),
      doc: (path) => getDocRef(path),
    },
  };
});

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    ACCOUNTING_ADMIN: new Set(['owner', 'admin', 'controller', 'dev']),
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

import { repairAccountsPayablePurchaseMirrors } from './repairAccountsPayablePurchaseMirrors.js';

const buildCompletedPurchase = (overrides = {}) => ({
  providerId: 'supplier-1',
  workflowStatus: 'completed',
  completedAt: '2026-04-12T12:00:00.000Z',
  totalAmount: 100,
  paymentState: {
    total: 100,
    paid: 0,
    balance: 100,
    paymentCount: 0,
  },
  paymentTerms: {},
  accountsPayable: {
    approvalStatus: 'approved',
    approvedAt: '2026-04-12T13:00:00.000Z',
    approvedBy: 'approver-1',
    approvalReason: 'Factura validada por contabilidad',
    approvalEvidenceNote: 'Soporte AP-1',
    approvalEvidenceUrls: ['https://files.example/ap-1.pdf'],
  },
  ...overrides,
});

describe('repairAccountsPayablePurchaseMirrors', () => {
  beforeEach(() => {
    collectionDocs.clear();
    documentRefs.clear();
    documentSnapshots.clear();
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('admin-1');
    assertUserAccessMock.mockResolvedValue(undefined);
  });

  it('dry-runs sensitive purchase AP mirrors without writing', async () => {
    collectionDocs.set('businesses/business-1/purchases', [
      {
        id: 'purchase-1',
        data: buildCompletedPurchase(),
      },
    ]);

    const result = await repairAccountsPayablePurchaseMirrors({
      data: {
        businessId: 'business-1',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      dryRun: true,
      scanned: 1,
      sensitiveMirrors: 1,
      patchedPurchases: 0,
      protectedVendorBills: 0,
      skipped: 0,
      samples: [
        {
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-1',
        },
      ],
    });
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'admin-1',
      businessId: 'business-1',
      allowedRoles: new Set(['owner', 'admin', 'controller', 'dev']),
    });
    expect(batchSetMock).not.toHaveBeenCalled();
    expect(batchCommitMock).not.toHaveBeenCalled();
  });

  it('writes protected vendor bill details before sanitizing the purchase mirror', async () => {
    collectionDocs.set('businesses/business-1/purchases', [
      {
        id: 'purchase-1',
        data: buildCompletedPurchase({
          accountsPayable: {
            approvalStatus: 'approved',
            approvedAt: '2026-04-12T13:00:00.000Z',
            approvedBy: { uid: 'approver-1' },
            approvalReason: 'Factura validada por contabilidad',
            approvalEvidenceNote: 'Soporte AP-1',
            approvalEvidenceUrls: ['https://files.example/ap-1.pdf'],
            paymentHold: {
              active: true,
              status: 'active',
              reason: 'Documento fiscal pendiente',
              evidenceNote: 'Ticket AP-HOLD',
            },
          },
        }),
      },
    ]);

    const result = await repairAccountsPayablePurchaseMirrors({
      data: {
        businessId: 'business-1',
        dryRun: false,
      },
    });

    expect(result).toMatchObject({
      dryRun: false,
      sensitiveMirrors: 1,
      patchedPurchases: 1,
      protectedVendorBills: 1,
    });
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/vendorBills/purchase:purchase-1',
      }),
      expect.objectContaining({
        sourceDocumentId: 'purchase-1',
        approvalReason: 'Factura validada por contabilidad',
        approvalEvidenceNote: 'Soporte AP-1',
        approvalEvidenceUrls: ['https://files.example/ap-1.pdf'],
        paymentControl: expect.objectContaining({
          canRegisterPayment: false,
          reason: 'Documento fiscal pendiente',
          status: 'on_hold',
        }),
        paymentHold: expect.objectContaining({
          reason: 'Documento fiscal pendiente',
          evidenceNote: 'Ticket AP-HOLD',
        }),
        purchase: expect.objectContaining({
          id: 'purchase-1',
          accountsPayable: expect.objectContaining({
            approvalReason: 'Factura validada por contabilidad',
          }),
        }),
      }),
      { merge: true },
    );
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/purchases/purchase-1',
      }),
      {
        accountsPayable: expect.objectContaining({
          approvalStatus: 'approved',
          approvedBy: 'approver-1',
          approvalReason: null,
          approvalEvidenceNote: null,
          approvalEvidenceUrls: [],
          paymentHold: expect.objectContaining({
            reason: null,
            evidenceNote: null,
            evidenceUrls: [],
          }),
          mirrorSanitizedAt: 'now-ts',
          mirrorSanitizedBy: 'admin-1',
          mirrorSanitizedSource: 'repairAccountsPayablePurchaseMirrors',
        }),
      },
      { merge: true },
    );
    expect(batchCommitMock).toHaveBeenCalledTimes(1);
  });

  it('skips sensitive mirrors when the protected vendor bill cannot be projected', async () => {
    collectionDocs.set('businesses/business-1/purchases', [
      {
        id: 'purchase-pending',
        data: buildCompletedPurchase({
          workflowStatus: 'pending_receipt',
          completedAt: null,
          paymentState: {
            total: 100,
            paid: 0,
            balance: 100,
            paymentCount: 0,
          },
        }),
      },
    ]);

    const result = await repairAccountsPayablePurchaseMirrors({
      data: {
        businessId: 'business-1',
        dryRun: false,
      },
    });

    expect(result).toMatchObject({
      sensitiveMirrors: 1,
      patchedPurchases: 0,
      protectedVendorBills: 0,
      skipped: 1,
      findings: [
        {
          purchaseId: 'purchase-pending',
          type: 'manual_review',
          reason: 'vendor_bill_projection_unavailable',
        },
      ],
    });
    expect(batchSetMock).not.toHaveBeenCalled();
    expect(batchCommitMock).not.toHaveBeenCalled();
  });

  it('reports legacy sensitive aliases without mutating them implicitly', async () => {
    collectionDocs.set('businesses/business-1/purchases', [
      {
        id: 'purchase-legacy',
        data: buildCompletedPurchase({
          accountsPayable: {
            approvalStatus: 'approved',
            approvedAt: '2026-04-12T13:00:00.000Z',
            approvedBy: 'approver-1',
          },
          payables: {
            approvalReason: 'Razón legacy sensible',
          },
          data: {
            vendorBill: {
              voidReason: 'Anulación legacy sensible',
            },
          },
          purchase: {
            accountsPayable: {
              rejectionReason: 'Rechazo legacy sensible',
            },
          },
        }),
      },
    ]);

    const result = await repairAccountsPayablePurchaseMirrors({
      data: {
        businessId: 'business-1',
        dryRun: true,
      },
    });

    expect(result).toMatchObject({
      sensitiveMirrors: 0,
      findings: [
        {
          purchaseId: 'purchase-legacy',
          type: 'legacy_sensitive_alias',
          fields: ['payables', 'data.vendorBill', 'purchase.accountsPayable'],
        },
      ],
    });
  });

  it('requires an authenticated accounting admin', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      repairAccountsPayablePurchaseMirrors({
        data: {
          businessId: 'business-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Usuario no autenticado',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
  });
});
