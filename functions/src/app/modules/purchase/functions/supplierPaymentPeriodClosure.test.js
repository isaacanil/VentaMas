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
      return new MockTimestamp(Date.parse('2026-04-01T00:00:00.000Z'));
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

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
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
  nanoid: () => 'payment-12345678',
}));

import { addSupplierPayment } from './addSupplierPayment.js';
import { voidSupplierPayment } from './voidSupplierPayment.js';

describe('supplier payment accounting period validation', () => {
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
    collectionMock.mockImplementation(() => {
      throw new Error('Unexpected collection lookup in this test.');
    });
    transactionGetMock.mockImplementation(async (ref) =>
      toSnapshot(ref.path, transactionSnapshots.get(ref.path)),
    );
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: transactionGetMock,
        set: vi.fn(),
      }),
    );
  });

  it('rejects registering a supplier payment in a closed accounting period', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      status: 'posted',
      totalAmount: 100,
      paymentState: {
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
    });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-03',
      { closedAt: '2026-03-31T23:59:59.000Z' },
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-1',
          occurredAt: '2026-03-10T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              amount: 50,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No puedes registrar este pago a suplidor con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingPeriodClosures/2026-03',
      }),
    );
    expect(resolvePilotMonetarySnapshotForBusinessMock).not.toHaveBeenCalled();
  });

  it('rejects registering a supplier payment when the business has not enabled rollout', async () => {
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue(null);
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(false);

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-rollout-disabled',
          occurredAt: '2026-03-10T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              amount: 50,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'El registro de pagos a suplidor no está habilitado para este negocio.',
    });
  });

  it('reuses an idempotent supplier payment even if the period is now closed', async () => {
    documentSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
    });
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      providerId: 'supplier-1',
      status: 'posted',
      totalAmount: 100,
      paymentState: {
        paid: 50,
        balance: 50,
        paymentCount: 1,
      },
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePaymentIdempotency/idem-1',
      {
        paymentId: 'payment-existing',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-existing',
      {
        purchaseId: 'purchase-1',
        receiptNumber: 'CPP-EXISTING',
        metadata: {
          appliedCreditNotes: [],
        },
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-03',
      { closedAt: '2026-03-31T23:59:59.000Z' },
    );

    await expect(
      addSupplierPayment({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          idempotencyKey: 'idem-1',
          occurredAt: '2026-03-10T12:00:00.000Z',
          paymentMethods: [
            {
              method: 'cash',
              amount: 50,
              cashCountId: 'cash-1',
            },
          ],
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
      reused: true,
      paymentId: 'payment-existing',
    });
  });

  it('rejects voiding a supplier payment that belongs to a closed accounting period', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-1',
      {
        purchaseId: 'purchase-1',
        status: 'posted',
        occurredAt: '2026-03-10T12:00:00.000Z',
        metadata: {},
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      paymentState: {
        paid: 50,
        balance: 50,
      },
    });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-03',
      { closedAt: '2026-03-31T23:59:59.000Z' },
    );

    await expect(
      voidSupplierPayment({
        data: {
          businessId: 'business-1',
          paymentId: 'payment-1',
          reason: 'error de captura',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No puedes anular este pago a suplidor con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    });

    expect(collectionMock).not.toHaveBeenCalled();
  });

  it('returns the existing voided payment without revalidating a closed period', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountsPayablePayments/payment-1',
      {
        purchaseId: 'purchase-1',
        status: 'void',
        metadata: {
          appliedCreditNotes: [],
        },
      },
    );
    transactionSnapshots.set('businesses/business-1/purchases/purchase-1', {
      paymentState: {
        paid: 0,
        balance: 100,
      },
    });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-03',
      { closedAt: '2026-03-31T23:59:59.000Z' },
    );

    await expect(
      voidSupplierPayment({
        data: {
          businessId: 'business-1',
          paymentId: 'payment-1',
          reason: 'ya estaba anulado',
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
      alreadyVoided: true,
      paymentId: 'payment-1',
    });

    expect(collectionMock).not.toHaveBeenCalled();
  });
});
