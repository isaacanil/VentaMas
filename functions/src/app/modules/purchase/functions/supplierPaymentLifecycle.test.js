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
      field
        .split('.')
        .reduce((current, key) => current?.[key], data ?? null),
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
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/billing/utils/subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: (...args) =>
    assertBusinessSubscriptionAccessMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: (...args) =>
    getPilotAccountingSettingsForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
  resolvePilotMonetarySnapshotForBusiness: (...args) =>
    resolvePilotMonetarySnapshotForBusinessMock(...args),
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'payment-fixed-id',
}));

import { addSupplierPayment } from './addSupplierPayment.js';
import { sanitizeForResponse } from './payablePayments.shared.js';
import { voidSupplierPayment } from './voidSupplierPayment.js';

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
      if (ref?.kind === 'cash-movements-by-source') {
        const docs = (
          transactionSnapshots.get(`cashMovements:${ref.sourceId}`) || []
        ).map((entry) => ({
          id: entry.id,
          data: () => entry,
        }));
        return { docs };
      }

      return toSnapshot(ref.path, transactionSnapshots.get(ref.path));
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
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      paymentTerms: {},
    });
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
            method: 'cash',
            amount: 40,
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
          sourceDocumentType: 'vendorBill',
          sourceDocumentId: 'purchase:purchase-1',
        }),
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
          paid: 40,
          balance: 60,
        },
      }),
      { merge: true },
    );
  });

  it('records supplier credit note applications without creating a separate posting event', async () => {
    const applicationId =
      'supplier_credit_note_application__payment-fixed-id__scn-1';
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
            amount: 40,
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
    transactionSnapshots.set('query:purchase-1', []);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await voidSupplierPayment({
      data: {
        businessId: 'business-1',
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
        totals: {
          total: 100,
          paid: 0,
          balance: 100,
        },
      }),
      { merge: true },
    );
  });

  it('voids supplier credit note applications and restores the operational trace', async () => {
    const applicationId =
      'supplier_credit_note_application__payment-1__scn-1';
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
              amount: 10,
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
              amount: 10,
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
