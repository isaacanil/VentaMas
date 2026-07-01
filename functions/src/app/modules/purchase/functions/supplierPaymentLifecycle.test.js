import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  collectionMock,
  documentRefs,
  documentSnapshots,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
  resolvePilotMonetarySnapshotForBusinessMock,
  runTransactionMock,
  toSnapshot,
  transactionGetMock,
  transactionSetMock,
  transactionSnapshots,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedTransactionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();

  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedAssertBusinessSubscriptionAccessMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedResolvePilotMonetarySnapshotForBusinessMock = vi.fn();
  const hoistedCollectionMock = vi.fn();
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
    get: (field) =>
      field.split('.').reduce((current, key) => current?.[key], data ?? null),
  });

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        path,
        get: vi.fn(async () =>
          hoistedToSnapshot(path, hoistedDocumentSnapshots.get(path)),
        ),
      });
    }

    return hoistedDocumentRefs.get(path);
  };

  return {
    assertBusinessSubscriptionAccessMock:
      hoistedAssertBusinessSubscriptionAccessMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    collectionMock: hoistedCollectionMock,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    resolvePilotMonetarySnapshotForBusinessMock:
      hoistedResolvePilotMonetarySnapshotForBusinessMock,
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

    static fromMillis(millis) {
      return new MockTimestamp(millis);
    }

    toMillis() {
      return this.millis;
    }

    toDate() {
      return new Date(this.millis);
    }
  },
  db: {
    doc: (path) => getDocRef(path),
    collection: (...args) => collectionMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    AUDIT: ['audit'],
    FINANCIAL_DOCUMENT_VOID: ['financial-document-void'],
    INVOICE_OPERATOR: ['invoice-operator'],
    TREASURY_OPERATOR: ['treasury-operator'],
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

vi.mock(
  '../../../versions/v2/accounting/utils/accountingRollout.util.js',
  () => ({
    getPilotAccountingSettingsForBusiness: (...args) =>
      getPilotAccountingSettingsForBusinessMock(...args),
    isAccountingRolloutEnabledForBusiness: (...args) =>
      isAccountingRolloutEnabledForBusinessMock(...args),
    resolvePilotMonetarySnapshotForBusiness: (...args) =>
      resolvePilotMonetarySnapshotForBusinessMock(...args),
  }),
);

vi.mock('nanoid', () => ({
  nanoid: () => 'payment-fixed-id',
}));

import { addSupplierPayment } from './addSupplierPayment.js';
import { sanitizeForResponse } from './payablePayments.shared.js';
import { voidSupplierPayment } from './voidSupplierPayment.js';

const buildApprovedAccountsPayable = (overrides = {}) => ({
  approvalStatus: 'approved',
  approvedAt: '2026-04-11T10:00:00.000Z',
  approvedBy: 'approver-1',
  ...overrides,
});

const buildApprovedPaymentRun = (overrides = {}) => ({
  status: 'approved',
  approvalStatus: 'approved',
  approvedAt: '2026-04-11T11:00:00.000Z',
  approvedBy: 'controller-1',
  executionStatus: 'not_started',
  eligibleVendorBillIds: ['purchase:purchase-1'],
  lines: [
    {
      vendorBillId: 'purchase:purchase-1',
      purchaseId: 'purchase-1',
      supplierId: 'supplier-1',
      dueAt: '2026-04-20T12:00:00.000Z',
      dueAtMillis: Date.parse('2026-04-20T12:00:00.000Z'),
      balanceAmount: 100,
      cashRequirementAmount: 100,
      withholdingAmount: 0,
    },
  ],
  ...overrides,
});

const seedSupplierPaymentRunScenario = ({
  idempotencyKey = 'idem-payment-run',
  paymentRun = buildApprovedPaymentRun(),
} = {}) => {
  documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
    cashCount: { state: 'open' },
    cashAccountId: 'cash-account-1',
  });
  transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
    providerId: 'supplier-1',
    workflowStatus: 'completed',
    completedAt: '2026-04-10T12:00:00.000Z',
    totalAmount: 100,
    accountsPayable: buildApprovedAccountsPayable(),
    paymentState: {
      total: 100,
      paid: 0,
      balance: 100,
      paymentCount: 0,
      nextPaymentAt: '2026-04-20T12:00:00.000Z',
    },
    paymentTerms: {
      nextPaymentAt: '2026-04-20T12:00:00.000Z',
    },
  });
  transactionSnapshots.set(
    'businesses/business-1/vendorBills/purchase:purchase-1',
    {
      id: 'purchase:purchase-1',
      sourceDocumentType: 'purchase',
      sourceDocumentId: 'purchase-1',
      status: 'approved',
      approvalStatus: 'approved',
      paymentControl: {
        canRegisterPayment: true,
        status: 'payable',
      },
    },
  );
  transactionSnapshots.set(
    `businesses/business-1/accountsPayablePaymentIdempotency/${idempotencyKey}`,
    null,
  );
  transactionSnapshots.set(
    'businesses/business-1/accountingPeriodClosures/2026-04',
    null,
  );
  transactionSnapshots.set(
    'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
    buildApprovedPaymentRun(paymentRun),
  );
};

describe('supplier payment lifecycle', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    transactionSnapshots.clear();
    documentRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
      bankAccountsEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    resolvePilotMonetarySnapshotForBusinessMock.mockResolvedValue(null);

    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/accountsPayablePayments') {
        return {
          where: vi.fn((_field, _operator, purchaseId) => ({
            kind: 'ap-payments-by-purchase',
            purchaseId,
          })),
        };
      }
      if (path === 'businesses/business-1/accountsPayablePaymentRuns') {
        return {
          where: vi.fn((_field, _operator, vendorBillId) => ({
            kind: 'ap-payment-runs-by-vendor-bill',
            vendorBillId,
          })),
        };
      }
      if (path === 'businesses/business-1/cashMovements') {
        return {
          where: vi.fn((_field, _operator, sourceId) => ({
            kind: 'cash-movements-by-source',
            sourceId,
          })),
        };
      }
      throw new Error(`Unexpected collection path: ${path}`);
    });

    transactionGetMock.mockImplementation(async (ref) => {
      if (ref?.kind === 'ap-payments-by-purchase') {
        const docs = (
          transactionSnapshots.get(`query:${ref.purchaseId}`) || []
        ).map((entry) => ({
          id: entry.id,
          data: () => entry,
        }));
        return { docs };
      }
      if (ref?.kind === 'ap-payment-runs-by-vendor-bill') {
        const docs = (
          transactionSnapshots.get(`paymentRuns:${ref.vendorBillId}`) || []
        ).map((entry) => ({
          id: entry.id,
          data: () => entry,
        }));
        return { docs };
      }
      if (ref?.kind === 'cash-movements-by-source') {
        const docs = (
          transactionSnapshots.get(`cashMovements:${ref.sourceId}`) || []
        ).map((entry) => ({
          id: entry.id,
          data: () => entry,
        }));
        return { docs };
      }

      return toSnapshot(
        ref.path,
        transactionSnapshots.has(ref.path)
          ? transactionSnapshots.get(ref.path)
          : documentSnapshots.get(ref.path),
      );
    });

    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: transactionGetMock,
        set: transactionSetMock,
      }),
    );
  });

  it('serializes supplier payment timestamp-like response fields through the shared serializer', () => {
    const invalidTimestampLike = {
      id: 'invalid-timestamp',
      toMillis: () => Number.NaN,
    };

    const result = sanitizeForResponse({
      occurredAt: {
        seconds: 1776080400,
        nanoseconds: 456000000,
      },
      legacyCreatedAt: {
        _seconds: 1776080401,
        _nanoseconds: 123456789,
      },
      invalidTimestampLike,
    });

    expect(result).toEqual({
      occurredAt: 1776080400456,
      legacyCreatedAt: 1776080401123,
      invalidTimestampLike,
    });
    expect(result.invalidTimestampLike).toBe(invalidTimestampLike);
  });

  it('rejects voiding a supplier payment without an audit reason before loading settings', async () => {
    await expect(
      voidSupplierPayment({
        data: {
          businessId: 'business-1',
          paymentId: 'payment-1',
          reason: '  ',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'Debe indicar un motivo de anulación con al menos 5 caracteres.',
    });

    expect(getPilotAccountingSettingsForBusinessMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('rejects voiding a supplier payment without audit evidence before loading settings', async () => {
    await expect(
      voidSupplierPayment({
        data: {
          businessId: 'business-1',
          paymentId: 'payment-1',
          reason: 'Pago duplicado',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message:
        'Debe indicar una evidencia o referencia para anular el pago al proveedor.',
    });

    expect(getPilotAccountingSettingsForBusinessMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('registers a supplier payment against the canonical vendor bill', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'approved',
        approvalStatus: 'approved',
        approvalReason: 'Factura validada por contabilidad',
        approvalEvidenceNote: 'Soporte AP-10',
        approvalEvidenceUrls: ['https://files.example/ap-10.pdf'],
        paymentControl: {
          canRegisterPayment: true,
          status: 'payable',
        },
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-1',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await addSupplierPayment({
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        idempotencyKey: 'idem-1',
        occurredAt: '2026-04-12T12:00:00.000Z',
        nextPaymentAt: '2026-04-20T12:00:00.000Z',
        note: 'Pago validado por tesorería',
        evidenceNote: 'Ticket AP-101',
        evidenceUrls: ['https://files.example/ap-101.pdf'],
        paymentMethods: [
          {
            method: 'cash',
            value: 40,
            cashCountId: 'cash-1',
          },
        ],
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        reused: false,
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        paymentState: expect.objectContaining({
          paid: 40,
          balance: 60,
        }),
        payment: expect.objectContaining({
          cashAccountId: 'cash-account-1',
          evidenceNote: 'Ticket AP-101',
          evidenceUrls: ['https://files.example/ap-101.pdf'],
          sourceDocumentType: 'vendorBill',
          sourceDocumentId: 'purchase:purchase-1',
          metadata: expect.objectContaining({
            note: 'Pago validado por tesorería',
            paymentEvidence: {
              note: 'Ticket AP-101',
              urls: ['https://files.example/ap-101.pdf'],
            },
          }),
        }),
      }),
    );
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['treasury-operator'],
    });
    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashCounts/cash-1',
      }),
    );
    expect(
      documentRefs.get('businesses/business-1/cashCounts/cash-1')?.get,
    ).not.toHaveBeenCalled();
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/vendorBills/purchase:purchase-1',
      }),
      expect.objectContaining({
        status: 'partially_paid',
        approvalReason: 'Factura validada por contabilidad',
        approvalEvidenceNote: 'Soporte AP-10',
        approvalEvidenceUrls: ['https://files.example/ap-10.pdf'],
        totals: {
          total: 100,
          paid: 40,
          balance: 60,
        },
      }),
      { merge: true },
    );
  });

  it('blocks direct supplier payments when the payable is already in an active payment run', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-direct-payment-active-run',
    });
    transactionSnapshots.set('paymentRuns:purchase:purchase-1', [
      {
        id: 'payment-run-1',
        ...buildApprovedPaymentRun(),
      },
    ]);

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-direct-payment-active-run',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          evidenceNote: 'Acta FIN-109',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar purchase:purchase-1 ya está incluida en la corrida CxP payment-run-1. Ejecute el pago desde esa corrida o cancélela antes de registrar un pago directo.',
    });

    expect(transactionSetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      }),
      expect.anything(),
    );
  });

  it('reuses an idempotent supplier payment even if the cash count closed after the original payment', async () => {
    transactionSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'closed' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-retry-closed-cash',
      {
        paymentId: 'payment-existing',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-existing',
      {
        id: 'payment-existing',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        supplierId: 'supplier-1',
        status: 'posted',
        totalAmount: 40,
        settlementAmount: 40,
        withholdingAmount: 0,
        paymentStateSnapshot: {
          total: 100,
          paid: 40,
          balance: 60,
        },
        paymentMethods: [
          {
            method: 'cash',
            status: true,
            value: 40,
            cashCountId: 'cash-1',
            cashAccountId: 'cash-account-1',
          },
        ],
        metadata: {
          appliedCreditNotes: [],
          withholdingApplications: [],
        },
      },
    );

    const result = await addSupplierPayment({
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        idempotencyKey: 'idem-retry-closed-cash',
        occurredAt: '2026-04-12T12:00:00.000Z',
        nextPaymentAt: '2026-04-20T12:00:00.000Z',
        note: 'Reintento por timeout',
        paymentMethods: [
          {
            method: 'cash',
            value: 40,
            cashCountId: 'cash-1',
          },
        ],
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        reused: true,
        paymentId: 'payment-existing',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        paymentState: expect.objectContaining({
          paid: 40,
          balance: 60,
        }),
      }),
    );
    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashCounts/cash-1',
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('registers a supplier payment against an approved payment run', async () => {
    seedSupplierPaymentRunScenario();

    const result = await addSupplierPayment({
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        paymentRunId: 'payment-run-1',
        idempotencyKey: 'idem-payment-run',
        occurredAt: '2026-04-12T12:00:00.000Z',
        nextPaymentAt: '2026-04-20T12:00:00.000Z',
        note: 'Pago desde corrida aprobada',
        evidenceNote: 'Acta FIN-108',
        evidenceUrls: ['https://files.example/ap-run-108.pdf'],
        paymentMethods: [
          {
            method: 'cash',
            value: 40,
            cashCountId: 'cash-1',
          },
        ],
      },
    });

    expect(result.payment).toEqual(
      expect.objectContaining({
        paymentRunId: 'payment-run-1',
        metadata: expect.objectContaining({
          paymentRunId: 'payment-run-1',
          paymentRunStatusSnapshot: {
            id: 'payment-run-1',
            approvalStatus: 'approved',
            approvedBy: 'controller-1',
            approvedLine: expect.objectContaining({
              balanceAmount: 100,
              cashRequirementAmount: 100,
              paidCashAmount: 0,
              vendorBillId: 'purchase:purchase-1',
              withholdingAmount: 0,
            }),
            executionStatus: 'not_started',
            status: 'approved',
          },
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      }),
      expect.objectContaining({
        paymentRunId: 'payment-run-1',
        metadata: expect.objectContaining({
          paymentRunId: 'payment-run-1',
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentIdempotency/idem-payment-run',
      }),
      expect.objectContaining({
        paymentRunId: 'payment-run-1',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      }),
      expect.objectContaining({
        executionStatus: 'in_progress',
        lines: [
          expect.objectContaining({
            executionStatus: 'partial',
            lastPaymentId: 'payment-fixed-id',
            paidCashAmount: 40,
            paidSettlementAmount: 40,
            paidWithholdingAmount: 0,
            paymentIds: ['payment-fixed-id'],
          }),
        ],
        executionSummary: expect.objectContaining({
          executedLineCount: 0,
          partialLineCount: 1,
          paidCashAmount: 40,
          paidSettlementAmount: 40,
          totalLineCount: 1,
        }),
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRunEvents/payment_run_payment__payment-fixed-id',
      }),
      expect.objectContaining({
        action: 'record_payment',
        evidenceNote: 'Acta FIN-108',
        evidenceUrls: ['https://files.example/ap-run-108.pdf'],
        paymentRunId: 'payment-run-1',
        reason: 'Pago desde corrida aprobada',
        sourceType: 'accountsPayablePayment',
        sourceId: 'payment-fixed-id',
        previousStatus: {
          approvalStatus: 'approved',
          executionStatus: 'not_started',
          status: 'approved',
        },
        nextStatus: {
          approvalStatus: 'approved',
          executionStatus: 'in_progress',
          status: 'approved',
        },
        payment: expect.objectContaining({
          paymentId: 'payment-fixed-id',
          purchaseId: 'purchase-1',
          settlementAmount: 40,
          totalAmount: 40,
          vendorBillId: 'purchase:purchase-1',
          withholdingAmount: 0,
        }),
      }),
    );
  });

  it('blocks supplier payments by the same user who approved the payment run', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-payment-run-same-approver',
      paymentRun: {
        approvedBy: 'user-1',
      },
    });

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          idempotencyKey: 'idem-payment-run-same-approver',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'El pago de una corrida CxP debe registrarlo un usuario distinto al que aprobó la corrida.',
    });
  });

  it('requires explicit payment run approval evidence before execution', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-payment-run-missing-approval-actor',
      paymentRun: {
        approvedAt: null,
        approvedBy: null,
      },
    });

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          idempotencyKey: 'idem-payment-run-missing-approval-actor',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La corrida CxP debe conservar una aprobación explícita antes de ejecutar pagos.',
    });
  });

  it('rejects supplier payment when the payment run is not approved', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-payment-run-pending',
      paymentRun: {
        status: 'submitted',
        approvalStatus: 'pending_approval',
        executionStatus: 'not_started',
        eligibleVendorBillIds: ['purchase:purchase-1'],
      },
    });

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          idempotencyKey: 'idem-payment-run-pending',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La corrida CxP debe estar aprobada antes de registrar pagos contra ella.',
    });
  });

  it('rejects supplier payment when the payment run is already executed', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-payment-run-executed',
      paymentRun: {
        status: 'approved',
        approvalStatus: 'approved',
        executionStatus: 'executed',
        eligibleVendorBillIds: ['purchase:purchase-1'],
      },
    });

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          idempotencyKey: 'idem-payment-run-executed',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La corrida CxP no está disponible para registrar pagos adicionales.',
    });
  });

  it('rejects supplier payment when the approved payment run line is stale', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-payment-run-stale-balance',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 40,
        balance: 60,
        paymentCount: 1,
        nextPaymentAt: '2026-04-20T12:00:00.000Z',
      },
      paymentTerms: {
        nextPaymentAt: '2026-04-20T12:00:00.000Z',
      },
    });

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          idempotencyKey: 'idem-payment-run-stale-balance',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar purchase:purchase-1 cambió desde que se aprobó la corrida. Revise o regenere la corrida antes de ejecutar el pago.',
    });

    expect(transactionSetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      }),
      expect.anything(),
    );
  });

  it('rejects supplier payment when paymentRunId and runId conflict', async () => {
    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          runId: 'payment-run-2',
          idempotencyKey: 'idem-payment-run-conflict',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message:
        'paymentRunId y runId no pueden apuntar a corridas CxP distintas.',
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('rejects supplier payment when cash exceeds the approved payment run line', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-payment-run-cash-overrun',
      paymentRun: {
        status: 'approved',
        approvalStatus: 'approved',
        executionStatus: 'not_started',
        eligibleVendorBillIds: ['purchase:purchase-1'],
        lines: [
          {
            vendorBillId: 'purchase:purchase-1',
            purchaseId: 'purchase-1',
            supplierId: 'supplier-1',
            balanceAmount: 30,
            cashRequirementAmount: 30,
            withholdingAmount: 0,
          },
        ],
      },
    });

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          idempotencyKey: 'idem-payment-run-cash-overrun',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'El efectivo del pago excede el monto aprobado en la corrida CxP.',
    });
  });

  it('rejects full supplier payment for a payment run line without its approved withholding', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-payment-run-missing-withholding',
      paymentRun: {
        status: 'approved',
        approvalStatus: 'approved',
        executionStatus: 'not_started',
        eligibleVendorBillIds: ['purchase:purchase-1'],
        lines: [
          {
            vendorBillId: 'purchase:purchase-1',
            purchaseId: 'purchase-1',
            supplierId: 'supplier-1',
            balanceAmount: 50,
            cashRequirementAmount: 40,
            withholdingAmount: 10,
          },
        ],
      },
    });

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          idempotencyKey: 'idem-payment-run-missing-withholding',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'El pago completo de una corrida con retenciones debe aplicar la retención aprobada.',
    });
  });

  it('rejects supplier payment when the vendor bill is outside the approved run', async () => {
    seedSupplierPaymentRunScenario({
      idempotencyKey: 'idem-payment-run-outside',
      paymentRun: {
        status: 'approved',
        approvalStatus: 'approved',
        executionStatus: 'not_started',
        eligibleVendorBillIds: ['purchase:other'],
        lines: [
          {
            vendorBillId: 'purchase:other',
            purchaseId: 'other',
            supplierId: 'supplier-2',
            balanceAmount: 100,
            cashRequirementAmount: 100,
            withholdingAmount: 0,
          },
        ],
      },
    });

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          paymentRunId: 'payment-run-1',
          idempotencyKey: 'idem-payment-run-outside',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar no pertenece al lote aprobado de la corrida CxP.',
    });
  });

  it('rejects a new supplier payment when the generated payment id already exists', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'approved',
        approvalStatus: 'approved',
        paymentControl: {
          canRegisterPayment: true,
          status: 'payable',
        },
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      {
        id: 'payment-fixed-id',
        purchaseId: 'another-purchase',
        status: 'posted',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-payment-id-collision',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-payment-id-collision',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'already-exists',
      message:
        'No fue posible registrar el pago porque el identificador generado ya existe. Intente nuevamente.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks supplier payments when AP approval was only inferred from the purchase state', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-inferred-approval',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-inferred-approval',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 100,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar debe tener una aprobación explícita antes de registrar pagos.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks supplier payments by the same user who approved the AP bill', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable({
        approvedBy: 'user-1',
      }),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-same-approver',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-same-approver',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 100,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'El pago de CxP debe registrarlo un usuario distinto al que aprobó la cuenta por pagar.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks supplier payments by the same user who originated the purchase', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      createdBy: 'user-1',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-same-originator',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-same-originator',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 100,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'El pago de CxP debe registrarlo un usuario distinto al que originó la compra.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects unsupported supplier AP withholding types before writing the payment', async () => {
    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-unsupported-withholding',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 100,
              cashCountId: 'cash-1',
            },
          ],
          withholdingApplications: [
            {
              type: 'other',
              amount: 10,
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'Solo se admiten retenciones ITBIS e ISR en pagos de CxP.',
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('settles supplier AP with payment methods plus fiscal withholding applications', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      accountsPayable: buildApprovedAccountsPayable(),
      monetary: {
        documentTotals: {
          total: 1180,
          gross: 1180,
          withholdingITBISAmount: 54,
          withholdingISRAmount: 20,
          netPayableAmount: 1106,
        },
      },
      paymentState: {
        total: 1180,
        paid: 0,
        balance: 1180,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-withholding',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await addSupplierPayment({
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        idempotencyKey: 'idem-withholding',
        occurredAt: '2026-04-12T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'cash',
            value: 1106,
            cashCountId: 'cash-1',
          },
        ],
        withholdingApplications: [
          {
            type: 'itbis',
            amount: 54,
            reference: 'RET-ITBIS-1',
            taxPeriod: '2026-04',
          },
          {
            type: 'isr',
            amount: 20,
            reference: 'RET-ISR-1',
            taxPeriod: '2026-04',
          },
        ],
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        paymentState: expect.objectContaining({
          paid: 1180,
          balance: 0,
        }),
        payment: expect.objectContaining({
          totalAmount: 1106,
          withholdingAmount: 74,
          settlementAmount: 1180,
          withholdingApplications: [
            expect.objectContaining({
              type: 'itbis',
              amount: 54,
              reference: 'RET-ITBIS-1',
              taxPeriod: '2026-04',
            }),
            expect.objectContaining({
              type: 'isr',
              amount: 20,
              reference: 'RET-ISR-1',
              taxPeriod: '2026-04',
            }),
          ],
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      }),
      expect.objectContaining({
        totalAmount: 1106,
        withholdingAmount: 74,
        settlementAmount: 1180,
        paymentStateSnapshot: expect.objectContaining({
          paid: 1180,
          balance: 0,
        }),
        metadata: expect.objectContaining({
          withholdingAmount: 74,
          withholdingApplications: expect.arrayContaining([
            expect.objectContaining({ type: 'itbis', amount: 54 }),
            expect.objectContaining({ type: 'isr', amount: 20 }),
          ]),
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/vendorBills/purchase:purchase-1',
      }),
      expect.objectContaining({
        status: 'paid',
        totals: {
          total: 1180,
          paid: 1180,
          balance: 0,
        },
      }),
      { merge: true },
    );
  });

  it('rejects supplier AP withholdings above the purchase fiscal cap', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      accountsPayable: buildApprovedAccountsPayable(),
      monetary: {
        documentTotals: {
          total: 1180,
          withholdingITBISAmount: 54,
          withholdingISRAmount: 20,
          netPayableAmount: 1106,
        },
      },
      paymentState: {
        total: 1180,
        paid: 0,
        balance: 1180,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-withholding-cap',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-withholding-cap',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 1125,
              cashCountId: 'cash-1',
            },
          ],
          withholdingApplications: [
            {
              type: 'itbis',
              amount: 55,
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La retención ITBIS aplicada excede el tope fiscal disponible de la compra.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects supplier AP withholdings above the remaining cap after previous payments', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      accountsPayable: buildApprovedAccountsPayable(),
      monetary: {
        documentTotals: {
          total: 1180,
          withholdingITBISAmount: 54,
          withholdingISRAmount: 20,
          netPayableAmount: 1106,
        },
      },
      paymentState: {
        total: 1180,
        paid: 50,
        balance: 1130,
        paymentCount: 1,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set('query:purchase-1', [
      {
        id: 'payment-previous',
        status: 'posted',
        withholdingApplications: [
          {
            type: 'itbis',
            amount: 50,
          },
        ],
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-withholding-remaining-cap',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-withholding-remaining-cap',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 1125,
              cashCountId: 'cash-1',
            },
          ],
          withholdingApplications: [
            {
              type: 'itbis',
              amount: 5,
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La retención ITBIS aplicada excede el tope fiscal disponible de la compra.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks new withholdings when previous AP payments have unclassified withholding totals', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      accountsPayable: buildApprovedAccountsPayable(),
      monetary: {
        documentTotals: {
          total: 1180,
          withholdingITBISAmount: 54,
          withholdingISRAmount: 20,
          netPayableAmount: 1106,
        },
      },
      paymentState: {
        total: 1180,
        paid: 10,
        balance: 1170,
        paymentCount: 1,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set('query:purchase-1', [
      {
        id: 'payment-legacy',
        status: 'posted',
        withholdingAmount: 10,
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-withholding-legacy',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-withholding-legacy',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              value: 1169,
              cashCountId: 'cash-1',
            },
          ],
          withholdingApplications: [
            {
              type: 'itbis',
              amount: 1,
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'Existen retenciones previas sin detalle fiscal. Regularícelas antes de aplicar nuevas retenciones.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('ignores inactive AP payments when validating withholding caps', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      accountsPayable: buildApprovedAccountsPayable(),
      monetary: {
        documentTotals: {
          total: 1180,
          withholdingITBISAmount: 54,
          withholdingISRAmount: 20,
          netPayableAmount: 1106,
        },
      },
      paymentState: {
        total: 1180,
        paid: 0,
        balance: 1180,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set('query:purchase-1', [
      {
        id: 'payment-voided',
        status: 'voided',
        withholdingAmount: 999,
      },
      {
        id: 'payment-canceled',
        status: 'canceled',
        withholdingApplications: [
          {
            type: 'itbis',
            amount: 999,
          },
        ],
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-withholding-inactive',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await addSupplierPayment({
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        idempotencyKey: 'idem-withholding-inactive',
        occurredAt: '2026-04-12T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'cash',
            value: 1106,
            cashCountId: 'cash-1',
          },
        ],
        withholdingApplications: [
          {
            type: 'itbis',
            amount: 54,
          },
          {
            type: 'isr',
            amount: 20,
          },
        ],
      },
    });

    expect(result.paymentState).toEqual(
      expect.objectContaining({
        paid: 1180,
        balance: 0,
        paymentCount: 1,
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      }),
      expect.objectContaining({
        withholdingAmount: 74,
        settlementAmount: 1180,
      }),
    );
  });

  it('defaults an omitted supplier payment date to now and validates that accounting period', async () => {
    const nowMillis = Date.parse('2026-04-12T12:00:00.000Z');
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
      cashAccountId: 'cash-account-1',
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-now',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await addSupplierPayment({
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        idempotencyKey: 'idem-now',
        paymentMethods: [
          {
            method: 'cash',
            value: 100,
            cashCountId: 'cash-1',
          },
        ],
      },
    });

    expect(result.payment).toEqual(
      expect.objectContaining({
        occurredAt: nowMillis,
        createdAt: nowMillis,
        updatedAt: nowMillis,
      }),
    );
    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingPeriodClosures/2026-04',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      }),
      expect.objectContaining({
        occurredAt: expect.objectContaining({ millis: nowMillis }),
        paymentStateSnapshot: expect.objectContaining({
          lastPaymentAt: expect.objectContaining({ millis: nowMillis }),
        }),
      }),
    );
  });

  it('blocks supplier payments while receipt inventory is still pending', async () => {
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      receiptInventoryState: {
        status: 'pending',
        operationId: 'receipt-1',
        warehouseId: 'warehouse-1',
      },
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-pending-inventory',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-pending-inventory',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La cuenta por pagar todavía no está materializada para pago.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks supplier payments when the vendor bill is on payment hold', async () => {
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'approved',
        approvalStatus: 'approved',
        paymentHold: {
          active: true,
          reason: 'Factura en revision de precio',
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-hold',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-1',
          idempotencyKey: 'idem-hold',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar está retenida o en disputa. Libérela antes de registrar pagos.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks supplier payments when the purchase carries an AP dispute', async () => {
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: {
        dispute: {
          status: 'open',
          reason: 'Diferencia contra factura recibida',
        },
      },
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-dispute',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-dispute',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar está en hold o disputa. Libérela antes de registrar pagos.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks supplier payments when persisted payment control is not payable', async () => {
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'approved',
        approvalStatus: 'approved',
        paymentControl: {
          canRegisterPayment: false,
          status: 'pending_approval',
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-control',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-1',
          idempotencyKey: 'idem-control',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar no está aprobada para pago. Complete la aprobación antes de registrar pagos.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks supplier payments when the fresh purchase AP control rejects a stale payable projection', async () => {
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'approved',
        approvalStatus: 'approved',
        paymentControl: {
          canRegisterPayment: true,
          status: 'payable',
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: {
        approvalStatus: 'rejected',
        rejectedBy: 'reviewer-1',
        rejectionReason: 'Factura no coincide con recepción',
      },
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-stale-approved',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-1',
          idempotencyKey: 'idem-stale-approved',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar no está aprobada para pago. Complete la aprobación antes de registrar pagos.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('loads the canonical vendor bill and blocks purchase-only payment requests', async () => {
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'approved',
        approvalStatus: 'approved',
        paymentControl: {
          canRegisterPayment: false,
          status: 'on_hold',
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-canonical-control',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-canonical-control',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar está retenida. Libérela antes de registrar pagos.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/vendorBills/purchase:purchase-1',
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects payments when purchaseId and vendorBillId point to different purchases', async () => {
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-2',
      {
        id: 'purchase:purchase-2',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-2',
        status: 'approved',
        approvalStatus: 'approved',
        paymentControl: {
          canRegisterPayment: true,
          status: 'payable',
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-mismatch',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-2',
          idempotencyKey: 'idem-mismatch',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La cuenta por pagar no corresponde a la compra indicada.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks supplier payments when the vendor bill is closed', async () => {
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'approved',
        approvalStatus: 'approved',
        paymentControl: {
          canRegisterPayment: false,
          status: 'closed',
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-closed',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-1',
          idempotencyKey: 'idem-closed',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La cuenta por pagar está cerrada. No admite nuevos pagos.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('records supplier credit note applications without creating a separate posting event', async () => {
    const applicationId =
      'supplier_credit_note_application__payment-fixed-id__scn-1';
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/supplierCreditNotes/scn-1',
      {
        supplierId: 'supplier-1',
        totalAmount: 50,
        appliedAmount: 0,
        remainingAmount: 50,
        status: 'open',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-1',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await addSupplierPayment({
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        idempotencyKey: 'idem-1',
        occurredAt: '2026-04-12T12:00:00.000Z',
        nextPaymentAt: '2026-04-20T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'supplierCreditNote',
            value: 40,
            supplierCreditNoteId: 'scn-1',
          },
        ],
      },
    });

    expect(result.appliedCreditNotes).toEqual([
      {
        id: 'scn-1',
        applicationId,
        appliedAmount: 40,
        remainingAmount: 10,
      },
    ]);
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `businesses/business-1/supplierCreditNoteApplications/${applicationId}`,
      }),
      expect.objectContaining({
        id: applicationId,
        supplierCreditNoteId: 'scn-1',
        paymentId: 'payment-fixed-id',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        supplierId: 'supplier-1',
        status: 'applied',
        amount: 40,
        previousRemainingAmount: 50,
        nextRemainingAmount: 10,
        sourceType: 'accountsPayablePayment',
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-fixed-id',
      }),
      expect.objectContaining({
        metadata: expect.objectContaining({
          appliedCreditNotes: [
            {
              id: 'scn-1',
              applicationId,
              appliedAmount: 40,
              remainingAmount: 10,
            },
          ],
        }),
      }),
    );
  });

  it('aggregates duplicate supplier credit note lines before applying them', async () => {
    const applicationId =
      'supplier_credit_note_application__payment-fixed-id__scn-1';
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/supplierCreditNotes/scn-1',
      {
        supplierId: 'supplier-1',
        totalAmount: 50,
        appliedAmount: 0,
        remainingAmount: 50,
        status: 'open',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-credit-duplicate',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await addSupplierPayment({
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        idempotencyKey: 'idem-credit-duplicate',
        occurredAt: '2026-04-12T12:00:00.000Z',
        nextPaymentAt: '2026-04-20T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'supplierCreditNote',
            value: 15,
            supplierCreditNoteId: 'scn-1',
          },
          {
            method: 'supplierCreditNote',
            value: 20,
            supplierCreditNoteId: 'scn-1',
          },
        ],
      },
    });

    expect(result.appliedCreditNotes).toEqual([
      {
        id: 'scn-1',
        applicationId,
        appliedAmount: 35,
        remainingAmount: 15,
      },
    ]);
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/supplierCreditNotes/scn-1',
      }),
      expect.objectContaining({
        appliedAmount: 35,
        remainingAmount: 15,
        status: 'open',
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `businesses/business-1/supplierCreditNoteApplications/${applicationId}`,
      }),
      expect.objectContaining({
        supplierCreditNoteId: 'scn-1',
        amount: 35,
        previousRemainingAmount: 50,
        nextRemainingAmount: 15,
      }),
      { merge: true },
    );
  });

  it('rejects supplier credit notes from another supplier', async () => {
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/supplierCreditNotes/scn-foreign',
      {
        supplierId: 'supplier-2',
        totalAmount: 50,
        appliedAmount: 0,
        remainingAmount: 50,
        status: 'open',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-credit-supplier',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-credit-supplier',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-foreign',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La nota de crédito no pertenece al suplidor de la compra.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects supplier credit note applications above the available balance', async () => {
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/supplierCreditNotes/scn-low-balance',
      {
        supplierId: 'supplier-1',
        totalAmount: 50,
        appliedAmount: 30,
        remainingAmount: 20,
        status: 'open',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-credit-insufficient',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-credit-insufficient',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 25,
              supplierCreditNoteId: 'scn-low-balance',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'El saldo a favor disponible no es suficiente para este pago.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects supplier credit notes that are not open for application', async () => {
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/supplierCreditNotes/scn-draft',
      {
        supplierId: 'supplier-1',
        totalAmount: 50,
        appliedAmount: 0,
        remainingAmount: 50,
        status: 'pending_approval',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-credit-status',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-credit-status',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-draft',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La nota de crédito seleccionada no está abierta para aplicar.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects supplier credit notes with inconsistent applied and remaining balances', async () => {
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      accountsPayable: buildApprovedAccountsPayable(),
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/supplierCreditNotes/scn-inconsistent',
      {
        supplierId: 'supplier-1',
        totalAmount: 50,
        appliedAmount: 20,
        remainingAmount: 50,
        status: 'open',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-credit-balance',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-credit-balance',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: '2026-04-20T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'supplierCreditNote',
              value: 40,
              supplierCreditNoteId: 'scn-inconsistent',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La nota de crédito seleccionada tiene saldos internos inconsistentes. Repárela antes de aplicarla.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects amount-only supplier payment method payloads on new writes', async () => {
    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-amount-only',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              amount: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'Debe indicar al menos un método de pago con monto válido.',
    });
  });

  it('rejects card or transfer supplier payments without reference evidence', async () => {
    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-missing-bank-reference',
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'transfer',
              value: 40,
              bankAccountId: 'bank-1',
              reference: '   ',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message:
        'Los pagos con tarjeta o transferencia requieren referencia o comprobante.',
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('voids a posted supplier payment and recalculates the vendor bill balance', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-1',
      {
        id: 'payment-1',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        supplierId: 'supplier-1',
        status: 'posted',
        occurredAt: '2026-04-12T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'cash',
            amount: 40,
            value: 40,
            status: true,
            cashCountId: 'cash-1',
          },
        ],
        metadata: {},
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 40,
        balance: 60,
        paymentCount: 1,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'partially_paid',
        approvalStatus: 'approved',
        approvalReason: 'Aprobación protegida',
        approvalEvidenceNote: 'Soporte protegido AP-104',
        approvalEvidenceUrls: ['https://files.example/ap-104.pdf'],
      },
    );
    transactionSnapshots.set('query:purchase-1', []);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await voidSupplierPayment({
      data: {
        businessId: 'business-1',
        evidenceNote: 'Ticket AP-104',
        paymentId: 'payment-1',
        reason: 'Pago duplicado',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        alreadyVoided: false,
        paymentId: 'payment-1',
        vendorBillId: 'purchase:purchase-1',
        paymentState: expect.objectContaining({
          paid: 0,
          balance: 100,
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/vendorBills/purchase:purchase-1',
      }),
      expect.objectContaining({
        status: 'approved',
        approvalReason: 'Aprobación protegida',
        approvalEvidenceNote: 'Soporte protegido AP-104',
        approvalEvidenceUrls: ['https://files.example/ap-104.pdf'],
        totals: {
          total: 100,
          paid: 0,
          balance: 100,
        },
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePayments/payment-1',
      }),
      expect.objectContaining({
        voidEvidenceNote: 'Ticket AP-104',
        voidEvidenceUrls: [],
        voidReason: 'Pago duplicado',
        metadata: expect.objectContaining({
          voidEvidence: {
            note: 'Ticket AP-104',
            urls: [],
          },
        }),
      }),
      { merge: true },
    );
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['financial-document-void'],
    });
  });

  it('reverts payment run execution when voiding a run-linked supplier payment', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-1',
      {
        id: 'payment-1',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        paymentRunId: 'payment-run-1',
        supplierId: 'supplier-1',
        status: 'posted',
        occurredAt: '2026-04-12T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'cash',
            amount: 40,
            value: 40,
            status: true,
            cashCountId: 'cash-1',
          },
        ],
        metadata: {
          paymentRunId: 'payment-run-1',
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 40,
        balance: 60,
        paymentCount: 1,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'partially_paid',
        approvalStatus: 'approved',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      {
        status: 'approved',
        approvalStatus: 'approved',
        executionStatus: 'in_progress',
        eligibleVendorBillIds: ['purchase:purchase-1'],
        lines: [
          {
            vendorBillId: 'purchase:purchase-1',
            purchaseId: 'purchase-1',
            supplierId: 'supplier-1',
            balanceAmount: 100,
            cashRequirementAmount: 100,
            withholdingAmount: 0,
            executionStatus: 'partial',
            lastPaymentAt: '2026-04-12T12:00:00.000Z',
            lastPaymentId: 'payment-1',
            paidCashAmount: 40,
            paidSettlementAmount: 40,
            paidWithholdingAmount: 0,
            paymentIds: ['payment-1'],
          },
        ],
        executionSummary: {
          executedLineCount: 0,
          partialLineCount: 1,
          pendingLineCount: 0,
          paidCashAmount: 40,
          paidSettlementAmount: 40,
          paidWithholdingAmount: 0,
          totalLineCount: 1,
        },
      },
    );
    transactionSnapshots.set('query:purchase-1', []);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await voidSupplierPayment({
      data: {
        businessId: 'business-1',
        evidenceNote: 'Ticket AP-109',
        paymentId: 'payment-1',
        reason: 'Pago duplicado',
      },
    });

    expect(result.paymentState).toEqual(
      expect.objectContaining({
        paid: 0,
        balance: 100,
        paymentCount: 0,
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRuns/payment-run-1',
      }),
      expect.objectContaining({
        executionStatus: 'not_started',
        status: 'approved',
        lastVoidedPaymentId: 'payment-1',
        lastVoidedPaymentReason: 'Pago duplicado',
        lines: [
          expect.objectContaining({
            executionStatus: 'not_started',
            lastPaymentAt: null,
            lastPaymentId: null,
            paidCashAmount: 0,
            paidSettlementAmount: 0,
            paidWithholdingAmount: 0,
            paymentIds: [],
          }),
        ],
        executionSummary: expect.objectContaining({
          executedLineCount: 0,
          partialLineCount: 0,
          pendingLineCount: 1,
          paidCashAmount: 0,
          paidSettlementAmount: 0,
          paidWithholdingAmount: 0,
          totalLineCount: 1,
        }),
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsPayablePaymentRunEvents/payment_run_void__payment-1',
      }),
      expect.objectContaining({
        action: 'void_payment',
        paymentRunId: 'payment-run-1',
        sourceType: 'accountsPayablePayment',
        sourceId: 'payment-1',
        reason: 'Pago duplicado',
        evidenceNote: 'Ticket AP-109',
        previousStatus: {
          approvalStatus: 'approved',
          executionStatus: 'in_progress',
          status: 'approved',
        },
        nextStatus: {
          approvalStatus: 'approved',
          executionStatus: 'not_started',
          status: 'approved',
        },
      }),
    );
  });

  it('excludes inactive sibling payments when voiding a supplier payment', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-1',
      {
        id: 'payment-1',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        supplierId: 'supplier-1',
        status: 'posted',
        occurredAt: '2026-04-12T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'cash',
            amount: 40,
            value: 40,
            status: true,
            cashCountId: 'cash-1',
          },
        ],
        metadata: {},
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 105,
        balance: 0,
        paymentCount: 4,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'paid',
        approvalStatus: 'approved',
      },
    );
    transactionSnapshots.set('query:purchase-1', [
      {
        id: 'payment-active',
        purchaseId: 'purchase-1',
        status: 'posted',
        totalAmount: 25,
        occurredAt: '2026-04-13T12:00:00.000Z',
      },
      {
        id: 'payment-voided',
        purchaseId: 'purchase-1',
        status: 'voided',
        totalAmount: 30,
        occurredAt: '2026-04-14T12:00:00.000Z',
      },
      {
        id: 'payment-canceled',
        purchaseId: 'purchase-1',
        status: 'canceled',
        totalAmount: 20,
        occurredAt: '2026-04-15T12:00:00.000Z',
      },
      {
        id: 'payment-draft',
        purchaseId: 'purchase-1',
        status: 'draft',
        totalAmount: 10,
        occurredAt: '2026-04-16T12:00:00.000Z',
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await voidSupplierPayment({
      data: {
        businessId: 'business-1',
        evidenceNote: 'Ticket AP-107',
        paymentId: 'payment-1',
        reason: 'Pago duplicado',
      },
    });

    expect(result.paymentState).toEqual(
      expect.objectContaining({
        paid: 25,
        balance: 75,
        paymentCount: 1,
        lastPaymentId: 'payment-active',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/vendorBills/purchase:purchase-1',
      }),
      expect.objectContaining({
        status: 'partially_paid',
        totals: {
          total: 100,
          paid: 25,
          balance: 75,
        },
      }),
      { merge: true },
    );
  });

  it.each(['void', 'voided', 'canceled', 'cancelled'])(
    'treats %s supplier payments as already voided',
    async (status) => {
      transactionSnapshots.set(
        'businesses/business-1/accountsPayablePayments/payment-1',
        {
          id: 'payment-1',
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-1',
          supplierId: 'supplier-1',
          status,
          occurredAt: '2026-04-12T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              amount: 40,
              value: 40,
              status: true,
              cashCountId: 'cash-1',
            },
          ],
          metadata: {
            restoredCreditNotes: [{ id: 'scn-1', restoredAmount: 40 }],
          },
        },
      );
      transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
        providerId: 'supplier-1',
        workflowStatus: 'completed',
        completedAt: '2026-04-10T12:00:00.000Z',
        totalAmount: 100,
        paymentState: {
          total: 100,
          paid: 0,
          balance: 100,
          paymentCount: 0,
        },
        paymentTerms: {},
      });

      const result = await voidSupplierPayment({
        data: {
          businessId: 'business-1',
          evidenceNote: 'Ticket AP-108',
          paymentId: 'payment-1',
          reason: 'Pago duplicado',
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          alreadyVoided: true,
          restoredCreditNotes: [{ id: 'scn-1', restoredAmount: 40 }],
        }),
      );
      expect(transactionSetMock).not.toHaveBeenCalled();
      expect(transactionGetMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'cash-movements-by-source' }),
      );
    },
  );

  it('blocks voiding a supplier payment by the same user who created it', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-1',
      {
        id: 'payment-1',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        supplierId: 'supplier-1',
        status: 'posted',
        occurredAt: '2026-04-12T12:00:00.000Z',
        createdBy: 'user-1',
        paymentMethods: [
          {
            method: 'cash',
            amount: 40,
            value: 40,
            status: true,
            cashCountId: 'cash-1',
          },
        ],
        metadata: {},
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 40,
        balance: 60,
        paymentCount: 1,
      },
      paymentTerms: {},
    });

    await expect(
      voidSupplierPayment({
        data: {
          businessId: 'business-1',
          evidenceNote: 'Ticket AP-104',
          paymentId: 'payment-1',
          reason: 'Pago duplicado',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La anulación del pago debe realizarla un usuario distinto al que lo registró.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
    expect(transactionGetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'cash-movements-by-source' }),
    );
  });

  it('voids supplier credit note applications and restores the operational trace', async () => {
    const applicationId = 'supplier_credit_note_application__payment-1__scn-1';
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-1',
      {
        id: 'payment-1',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        supplierId: 'supplier-1',
        status: 'posted',
        occurredAt: '2026-04-12T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'supplierCreditNote',
            amount: 40,
            value: 40,
            status: true,
            supplierCreditNoteId: 'scn-1',
          },
        ],
        metadata: {
          appliedCreditNotes: [
            {
              id: 'scn-1',
              applicationId,
              appliedAmount: 40,
              remainingAmount: 10,
            },
          ],
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 40,
        balance: 60,
        paymentCount: 1,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set(
      'businesses/business-1/supplierCreditNotes/scn-1',
      {
        supplierId: 'supplier-1',
        totalAmount: 50,
        appliedAmount: 40,
        remainingAmount: 10,
        status: 'open',
      },
    );
    transactionSnapshots.set('query:purchase-1', []);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await voidSupplierPayment({
      data: {
        businessId: 'business-1',
        evidenceNote: 'Ticket AP-105',
        paymentId: 'payment-1',
        reason: 'Pago duplicado',
      },
    });

    expect(result.restoredCreditNotes).toEqual([
      {
        id: 'scn-1',
        applicationId,
        restoredAmount: 40,
        remainingAmount: 50,
      },
    ]);
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `businesses/business-1/supplierCreditNoteApplications/${applicationId}`,
      }),
      expect.objectContaining({
        id: applicationId,
        supplierCreditNoteId: 'scn-1',
        paymentId: 'payment-1',
        status: 'voided',
        restoredAmount: 40,
        previousRemainingAmount: 10,
        nextRemainingAmount: 50,
        voidEvidenceNote: 'Ticket AP-105',
        voidEvidenceUrls: [],
        voidReason: 'Pago duplicado',
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/supplierCreditNotes/scn-1',
      }),
      expect.objectContaining({
        appliedAmount: 0,
        remainingAmount: 50,
        status: 'open',
      }),
      { merge: true },
    );
  });

  it('blocks voiding a supplier payment when treasury movements are reconciled', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-1',
      {
        id: 'payment-1',
        purchaseId: 'purchase-1',
        vendorBillId: 'purchase:purchase-1',
        supplierId: 'supplier-1',
        status: 'posted',
        occurredAt: '2026-04-12T12:00:00.000Z',
        paymentMethods: [
          {
            method: 'transfer',
            amount: 40,
            value: 40,
            status: true,
            bankAccountId: 'bank-1',
          },
        ],
        metadata: {},
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      workflowStatus: 'completed',
      completedAt: '2026-04-10T12:00:00.000Z',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 40,
        balance: 60,
        paymentCount: 1,
      },
      paymentTerms: {},
    });
    transactionSnapshots.set('cashMovements:payment-1', [
      {
        id: 'app_payment-1_transfer_1',
        sourceId: 'payment-1',
        reconciliationStatus: 'reconciled',
        reconciliationId: 'rec-1',
      },
    ]);

    await expect(
      voidSupplierPayment({
        data: {
          businessId: 'business-1',
          evidenceNote: 'Ticket AP-106',
          paymentId: 'payment-1',
          reason: 'Pago duplicado',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'El pago tiene movimientos de caja/banco conciliados. Debe revertirse mediante un flujo de conciliación/refund controlado.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects malformed occurredAt instead of silently using current time', async () => {
    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-invalid-occurred-at',
          occurredAt: 'not-a-date',
          paymentMethods: [
            {
              method: 'cash',
              value: 10,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'La fecha del pago es inválida.',
    });
  });

  it('rejects malformed nextPaymentAt instead of dropping the schedule', async () => {
    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-invalid-next-payment',
          occurredAt: '2026-04-12T12:00:00.000Z',
          nextPaymentAt: 'not-a-date',
          paymentMethods: [
            {
              method: 'cash',
              value: 10,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'La próxima fecha de pago es inválida.',
    });
  });
});
