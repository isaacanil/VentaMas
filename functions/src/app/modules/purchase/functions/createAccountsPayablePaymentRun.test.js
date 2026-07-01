import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  documentRefs,
  documentSnapshots,
  getCollectionRef,
  getDocRef,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  transactionGetMock,
  transactionSetMock,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransactionGetMock = vi.fn();
  const hoistedTransactionSetMock = vi.fn();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedAssertBusinessSubscriptionAccessMock = vi.fn();

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
  const hoistedGetCollectionRef = (path) => ({
    path,
    where: (field, operator, value) => ({
      path: `${path}|where:${field}:${operator}:${value}`,
      queryField: field,
      queryOperator: operator,
      queryValue: value,
    }),
  });

  return {
    assertBusinessSubscriptionAccessMock:
      hoistedAssertBusinessSubscriptionAccessMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getCollectionRef: hoistedGetCollectionRef,
    getDocRef: hoistedGetDocRef,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    transactionGetMock: hoistedTransactionGetMock,
    transactionSetMock: hoistedTransactionSetMock,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-12T12:00:00.000Z'));
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
    }

    toMillis() {
      return this.millis;
    }
  },
  db: {
    collection: (path) => getCollectionRef(path),
    doc: (path) => getDocRef(path),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    TREASURY_OPERATOR: new Set(['owner', 'admin', 'manager']),
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock(
  '../../../versions/v2/billing/utils/subscriptionAccess.util.js',
  () => ({
    assertBusinessSubscriptionAccess: (...args) =>
      assertBusinessSubscriptionAccessMock(...args),
  }),
);

vi.mock('nanoid', () => ({
  nanoid: () => 'payment-run-fixed-id',
}));

import { Timestamp } from '../../../core/config/firebase.js';
import { createAccountsPayablePaymentRun } from './createAccountsPayablePaymentRun.js';

const buildVendorBill = (overrides = {}) => ({
  id: 'purchase:purchase-1',
  reference: 'PO-001',
  vendorReference: 'SUP-INV-001',
  status: 'approved',
  approvalStatus: 'approved',
  sourceDocumentType: 'purchase',
  sourceDocumentId: 'purchase-1',
  supplierId: 'supplier-1',
  supplierName: 'Proveedor Uno',
  dueAt: Timestamp.fromMillis(Date.parse('2026-04-20T12:00:00.000Z')),
  paymentControl: {
    canRegisterPayment: true,
    label: 'Aprobada',
    status: 'payable',
  },
  paymentState: {
    total: 1180,
    paid: 0,
    balance: 1180,
  },
  monetary: {
    documentTotals: {
      total: 1180,
      gross: 1180,
      withholdingITBISAmount: 54,
      withholdingISRAmount: 20,
      netPayableAmount: 1106,
    },
  },
  purchase: {
    providerId: 'supplier-1',
    vendorReference: 'SUP-INV-001',
    taxReceipt: {
      ncf: 'B0100000001',
    },
  },
  ...overrides,
});

const vendorBillsBySupplierQueryPath =
  'businesses/business-1/vendorBills|where:supplierId:==:supplier-1';
const activePaymentRunByVendorBillQueryPath =
  'businesses/business-1/accountsPayablePaymentRuns|where:eligibleVendorBillIds:array-contains:purchase:purchase-1';

describe('createAccountsPayablePaymentRun', () => {
  beforeEach(() => {
    documentRefs.clear();
    documentSnapshots.clear();
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('treasury-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    runTransactionMock.mockImplementation(async (handler) =>
      handler({
        get: transactionGetMock,
        set: transactionSetMock,
      }),
    );
    transactionGetMock.mockImplementation(async (ref) => {
      if (ref.queryField) {
        const entries = Array.isArray(documentSnapshots.get(ref.path))
          ? documentSnapshots.get(ref.path)
          : [];

        return {
          docs: entries.map((entry, index) => ({
            exists: true,
            id:
              entry && typeof entry === 'object' && !Array.isArray(entry)
                ? (entry.id ?? `doc-${index}`)
                : `doc-${index}`,
            ref,
            data: () => entry,
          })),
        };
      }

      return {
        exists: documentSnapshots.has(ref.path),
        id: ref.id,
        ref,
        data: () => documentSnapshots.get(ref.path),
      };
    });
  });

  it('persists a draft payment run recalculated from vendor bills', async () => {
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      buildVendorBill(),
    );
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-2',
      buildVendorBill({
        id: 'purchase:purchase-2',
        reference: 'PO-002',
        sourceDocumentId: 'purchase-2',
        supplierId: 'supplier-2',
        supplierName: 'Proveedor Dos',
        dueAt: null,
        monetary: { documentTotals: { total: 500 } },
        paymentState: { total: 500, paid: 0, balance: 500 },
      }),
    );
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-3',
      buildVendorBill({
        id: 'purchase:purchase-3',
        reference: 'PO-003',
        sourceDocumentId: 'purchase-3',
        status: 'on_hold',
        monetary: { documentTotals: { total: 250 } },
        paymentState: { total: 250, paid: 0, balance: 250 },
      }),
    );

    const result = await createAccountsPayablePaymentRun({
      data: {
        businessId: 'business-1',
        vendorBillIds: [
          'purchase:purchase-1',
          'purchase:purchase-2',
          'purchase:purchase-3',
        ],
        scope: {
          label: 'Lote visible',
          description: '3 cuentas visibles.',
          queryLimit: 500,
          rawDocCount: 3,
        },
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        authUid: 'treasury-1',
        businessId: 'business-1',
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      paymentRunId: 'payment-run-fixed-id',
      paymentRun: {
        status: 'draft',
        approvalStatus: 'pending_review',
        totals: {
          requestedCount: 3,
          eligibleCount: 1,
          excludedCount: 2,
          eligibleAmount: 1180,
          eligibleCashRequirementAmount: 1106,
          eligibleWithholdingAmount: 74,
          excludedAmount: 750,
        },
      },
    });
    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/vendorBills/purchase:purchase-1',
      }),
    );
    expect(
      documentRefs.get('businesses/business-1/vendorBills/purchase:purchase-1')
        .get,
    ).not.toHaveBeenCalled();
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRuns/payment-run-fixed-id',
      }),
      expect.objectContaining({
        eligibleVendorBillIds: ['purchase:purchase-1'],
        excludedVendorBillIds: ['purchase:purchase-2', 'purchase:purchase-3'],
        lines: [
          expect.objectContaining({
            vendorBillId: 'purchase:purchase-1',
            cashRequirementAmount: 1106,
            withholdingAmount: 74,
            eligible: true,
          }),
        ],
        excludedLines: expect.arrayContaining([
          expect.objectContaining({
            vendorBillId: 'purchase:purchase-2',
            exclusionCode: 'missing_due_date',
          }),
          expect.objectContaining({
            vendorBillId: 'purchase:purchase-3',
            exclusionCode: 'vendor-bill-status',
          }),
        ]),
      }),
    );
  });

  it('rejects payment runs that include duplicated supplier documents', async () => {
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      buildVendorBill(),
    );
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-2',
      buildVendorBill({
        id: 'purchase:purchase-2',
        reference: 'PO-002',
        sourceDocumentId: 'purchase-2',
      }),
    );

    await expect(
      createAccountsPayablePaymentRun({
        data: {
          businessId: 'business-1',
          vendorBillIds: ['purchase:purchase-1', 'purchase:purchase-2'],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La corrida CxP incluye cuentas duplicadas del mismo suplidor (NCF B0100000001). Revise purchase:purchase-1 y purchase:purchase-2 antes de guardar la corrida.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects payment runs when an eligible payable matches another active supplier document', async () => {
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      buildVendorBill(),
    );
    documentSnapshots.set(vendorBillsBySupplierQueryPath, [
      buildVendorBill({
        id: 'purchase:purchase-9',
        reference: 'PO-009',
        sourceDocumentId: 'purchase-9',
      }),
    ]);

    await expect(
      createAccountsPayablePaymentRun({
        data: {
          businessId: 'business-1',
          vendorBillIds: ['purchase:purchase-1'],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No se puede guardar la corrida CxP porque purchase:purchase-1 coincide con la CxP purchase:purchase-9 del mismo suplidor (NCF B0100000001). Revise duplicados antes de pagar.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: vendorBillsBySupplierQueryPath,
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects payment runs when an eligible payable is already in an active payment run', async () => {
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      buildVendorBill(),
    );
    documentSnapshots.set(activePaymentRunByVendorBillQueryPath, [
      {
        id: 'payment-run-open',
        status: 'approved',
        executionStatus: 'not_started',
        eligibleVendorBillIds: ['purchase:purchase-1'],
      },
    ]);

    await expect(
      createAccountsPayablePaymentRun({
        data: {
          businessId: 'business-1',
          vendorBillIds: ['purchase:purchase-1'],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar purchase:purchase-1 ya está incluida en la corrida CxP payment-run-open. Cancele, ejecute o regenere esa corrida antes de crear otra propuesta de pago.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: activePaymentRunByVendorBillQueryPath,
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects runs without eligible vendor bills', async () => {
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      buildVendorBill({
        dueAt: null,
        paymentState: { total: 100, paid: 0, balance: 100 },
      }),
    );

    await expect(
      createAccountsPayablePaymentRun({
        data: {
          businessId: 'business-1',
          vendorBillIds: ['purchase:purchase-1'],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La corrida no tiene cuentas por pagar elegibles para pago.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('requires an authenticated treasury operator', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      createAccountsPayablePaymentRun({
        data: {
          businessId: 'business-1',
          vendorBillIds: ['purchase:purchase-1'],
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Usuario no autenticado',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
  });
});
