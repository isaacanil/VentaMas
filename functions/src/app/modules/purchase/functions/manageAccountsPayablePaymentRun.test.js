import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  documentRefs,
  getDocRef,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  transactionGetMock,
  transactionSetMock,
  transactionSnapshots,
  toSnapshot,
} = vi.hoisted(() => {
  const hoistedTransactionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedAssertBusinessSubscriptionAccessMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransactionGetMock = vi.fn();
  const hoistedTransactionSetMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const hoistedToSnapshot = (path, data) => ({
    exists: data != null,
    id: path.split('/').at(-1) ?? null,
    data: () => data,
  });

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, { path });
    }

    return hoistedDocumentRefs.get(path);
  };

  return {
    assertBusinessSubscriptionAccessMock:
      hoistedAssertBusinessSubscriptionAccessMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    documentRefs: hoistedDocumentRefs,
    getDocRef: hoistedGetDocRef,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    toSnapshot: hoistedToSnapshot,
    transactionGetMock: hoistedTransactionGetMock,
    transactionSetMock: hoistedTransactionSetMock,
    transactionSnapshots: hoistedTransactionSnapshots,
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

    toMillis() {
      return this.millis;
    }
  },
  db: {
    doc: (path) => getDocRef(path),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    ACCOUNTING_ADMIN: new Set(['owner', 'admin', 'controller']),
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
  nanoid: () => 'payment-run-event-fixed-id',
}));

import { manageAccountsPayablePaymentRun } from './manageAccountsPayablePaymentRun.js';

const buildPaymentRun = (overrides = {}) => ({
  id: 'payment-run-1',
  businessId: 'business-1',
  status: 'draft',
  approvalStatus: 'pending_review',
  executionStatus: 'not_started',
  createdBy: 'creator-1',
  eligibleVendorBillIds: ['purchase:purchase-1'],
  lines: [
    {
      vendorBillId: 'purchase:purchase-1',
      purchaseId: 'purchase-1',
      supplierId: null,
      supplierName: null,
      reference: 'PO-001',
      status: 'approved',
      approvalStatus: 'approved',
      paymentControlStatus: 'payable',
      dueAt: '2026-04-20T00:00:00.000Z',
      dueAtMillis: Date.parse('2026-04-20T00:00:00.000Z'),
      totalAmount: 1180,
      paidAmount: 0,
      balanceAmount: 1180,
      cashRequirementAmount: 1106,
      withholdingAmount: 74,
      fiscalSnapshot: {
        netPayableAmount: 1106,
        withholdingITBISAmount: 54,
        withholdingISRAmount: 20,
      },
      eligible: true,
      exclusionCode: null,
      exclusionReason: null,
    },
  ],
  totals: {
    eligibleAmount: 1180,
    eligibleCashRequirementAmount: 1106,
    eligibleCount: 1,
    eligibleWithholdingAmount: 74,
  },
  ...overrides,
});

const buildPayableVendorBill = (overrides = {}) => ({
  id: 'purchase:purchase-1',
  reference: 'PO-001',
  status: 'approved',
  approvalStatus: 'approved',
  approvedAt: '2026-04-11T10:00:00.000Z',
  approvedBy: 'approver-1',
  dueAt: '2026-04-20T00:00:00.000Z',
  paymentControl: {
    canRegisterPayment: true,
    status: 'payable',
  },
  monetary: {
    documentTotals: {
      netPayableAmount: 1106,
      withholdingITBISAmount: 54,
      withholdingISRAmount: 20,
    },
  },
  paymentState: {
    total: 1180,
    paid: 0,
    balance: 1180,
  },
  totals: {
    total: 1180,
    paid: 0,
    balance: 1180,
  },
  ...overrides,
});

describe('manageAccountsPayablePaymentRun', () => {
  beforeEach(() => {
    documentRefs.clear();
    transactionSnapshots.clear();
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('manager-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    runTransactionMock.mockImplementation(async (handler) =>
      handler({
        get: transactionGetMock,
        set: transactionSetMock,
      }),
    );
    transactionGetMock.mockImplementation(async (ref) =>
      toSnapshot(ref.path, transactionSnapshots.get(ref.path)),
    );
  });

  it('submits a draft payment run for approval', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      buildPaymentRun(),
    );

    const result = await manageAccountsPayablePaymentRun({
      data: {
        action: 'submit',
        businessId: 'business-1',
        paymentRunId: 'payment-run-1',
        reason: 'Lista para revisión',
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedRoles: new Set(['owner', 'admin', 'manager']),
      }),
    );
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'write',
        businessId: 'business-1',
        operation: 'accountsPayable.payment',
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      action: 'submit',
      approvalStatus: 'pending_approval',
      status: 'submitted',
    });
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      }),
      expect.objectContaining({
        approvalStatus: 'pending_approval',
        status: 'submitted',
        submittedBy: 'manager-1',
        submittedReason: 'Lista para revisión',
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRunEvents/payment-run-event-fixed-id',
      }),
      expect.objectContaining({
        action: 'submit',
        createdBy: 'manager-1',
        previousStatus: expect.objectContaining({ status: 'draft' }),
        nextStatus: expect.objectContaining({ status: 'submitted' }),
      }),
    );
  });

  it('approves a submitted payment run by a different accounting admin', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('controller-1');
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      buildPaymentRun({
        approvalStatus: 'pending_approval',
        status: 'submitted',
        submittedBy: 'manager-1',
      }),
    );
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      buildPayableVendorBill(),
    );

    const result = await manageAccountsPayablePaymentRun({
      data: {
        action: 'approve',
        businessId: 'business-1',
        evidenceNote: 'Revisión financiera OK',
        paymentRunId: 'payment-run-1',
        reason: 'Aprobada por tesorería',
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedRoles: new Set(['owner', 'admin', 'controller']),
      }),
    );
    expect(result).toMatchObject({
      approvalStatus: 'approved',
      status: 'approved',
    });
    expect(result.paymentRun.lines[0]).toMatchObject({
      vendorBillId: 'purchase:purchase-1',
      balanceAmount: 1180,
      cashRequirementAmount: 1106,
      withholdingAmount: 74,
    });
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      }),
      expect.objectContaining({
        approvalEvidenceNote: 'Revisión financiera OK',
        approvalReason: 'Aprobada por tesorería',
        approvalStatus: 'approved',
        approvedBy: 'controller-1',
        status: 'approved',
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRunEvents/payment-run-event-fixed-id',
      }),
      expect.objectContaining({
        action: 'approve',
        validation: {
          checkedVendorBillCount: 1,
        },
      }),
    );
  });

  it('enforces maker-checker for review decisions', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('manager-1');
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      buildPaymentRun({
        approvalStatus: 'pending_approval',
        status: 'submitted',
        submittedBy: 'manager-1',
      }),
    );

    await expect(
      manageAccountsPayablePaymentRun({
        data: {
          action: 'approve',
          businessId: 'business-1',
          evidenceNote: 'Intento propio',
          paymentRunId: 'payment-run-1',
          reason: 'Aprobar propia corrida',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La corrida debe ser aprobada o rechazada por un usuario distinto al creador o solicitante.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'paid vendor bill',
      vendorBill: buildPayableVendorBill({
        paymentState: {
          total: 1180,
          paid: 1180,
          balance: 0,
        },
        totals: {
          total: 1180,
          paid: 1180,
          balance: 0,
        },
      }),
      message:
        'La cuenta por pagar no tiene balance pendiente.',
    },
    {
      name: 'held vendor bill',
      vendorBill: buildPayableVendorBill({
        paymentControl: {
          canRegisterPayment: false,
          status: 'on_hold',
        },
      }),
      message:
        'La cuenta por pagar está retenida. Libérela antes de registrar pagos.',
    },
    {
      name: 'changed balance vendor bill',
      vendorBill: buildPayableVendorBill({
        paymentState: {
          total: 1180,
          paid: 500,
          balance: 680,
        },
        totals: {
          total: 1180,
          paid: 500,
          balance: 680,
        },
      }),
      message:
        'La cuenta por pagar purchase:purchase-1 cambió desde que se creó la corrida. Revise o regenere la corrida antes de aprobarla.',
    },
  ])('revalidates payable vendor bills before approval: $name', async ({
    message,
    vendorBill,
  }) => {
    resolveCallableAuthUidMock.mockResolvedValue('controller-1');
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      buildPaymentRun({
        approvalStatus: 'pending_approval',
        status: 'submitted',
        submittedBy: 'manager-1',
      }),
    );
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      vendorBill,
    );

    await expect(
      manageAccountsPayablePaymentRun({
        data: {
          action: 'approve',
          businessId: 'business-1',
          evidenceNote: 'Revisión financiera OK',
          paymentRunId: 'payment-run-1',
          reason: 'Aprobada por tesorería',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message,
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('enforces maker-checker when canceling a submitted run', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('manager-1');
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      buildPaymentRun({
        approvalStatus: 'pending_approval',
        status: 'submitted',
        submittedBy: 'manager-1',
      }),
    );

    await expect(
      manageAccountsPayablePaymentRun({
        data: {
          action: 'cancel',
          businessId: 'business-1',
          evidenceNote: 'Solicitud del proveedor',
          paymentRunId: 'payment-run-1',
          reason: 'Se cancela corrida',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La corrida enviada o aprobada debe ser cancelada por un usuario distinto al creador, solicitante o aprobador.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('requires evidence for canceling a payment run', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      buildPaymentRun(),
    );

    await expect(
      manageAccountsPayablePaymentRun({
        data: {
          action: 'cancel',
          businessId: 'business-1',
          paymentRunId: 'payment-run-1',
          reason: 'Se descarta corrida',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message:
        'Debe indicar una evidencia o referencia para esta acción de corrida CxP.',
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('requires an authenticated user', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      manageAccountsPayablePaymentRun({
        data: {
          action: 'submit',
          businessId: 'business-1',
          paymentRunId: 'payment-run-1',
          reason: 'Lista para revisión',
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Usuario no autenticado',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
  });
});
