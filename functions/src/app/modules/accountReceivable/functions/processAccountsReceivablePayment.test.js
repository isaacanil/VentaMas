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
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
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
    ref: { path },
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
      return new MockTimestamp(Date.parse('2026-04-13T09:00:00.000Z'));
    }

    toMillis() {
      return this.millis;
    }

    toDate() {
      return new Date(this.millis);
    }
  },
  FieldValue: {
    arrayUnion: (...values) => ({
      kind: 'arrayUnion',
      values,
    }),
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

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', () => ({
  buildAccountingEvent: vi.fn((input) => ({
    id: `${input.eventType}__${input.sourceId}`,
    ...input,
  })),
  resolveAccountingPaymentChannel: vi.fn(() => 'cash'),
  resolvePrimaryBankAccountId: vi.fn(() => null),
}));

vi.mock('../../../versions/v2/accounting/utils/cashMovement.util.js', () => ({
  buildReceivablePaymentCashMovements: vi.fn(() => []),
}));

vi.mock('../utils/clientPendingBalance.util.js', () => ({
  buildClientPendingBalanceUpdate: vi.fn(() => ({ pendingBalance: 0 })),
}));

vi.mock('../utils/receivablePaymentPlan.util.js', () => ({
  applyReceivablePaymentToContext: vi.fn(() => ({
    remainingAmount: 0,
    accountUpdate: null,
    installmentUpdates: [],
    installmentPaymentWrites: [],
    invoiceAggregate: null,
    accountEntry: {
      arId: 'ar-1',
      invoiceId: 'invoice-1',
      accountType: 'normal',
      totalPaid: 100,
      historicalFunctionalSettled: 100,
      monetaryBefore: null,
      monetaryAfter: null,
    },
  })),
}));

vi.mock('../utils/receivableMonetary.util.js', () => ({
  allocateFunctionalAmountsByDocument: vi.fn(() => [100]),
  buildReceivableFxSettlementRecord: vi.fn(),
  resolvePaymentAppliedDocumentAmount: vi.fn(({ fallbackAmount }) => fallbackAmount),
  resolvePaymentCollectedFunctionalAmount: vi.fn(({ fallbackAmount }) => fallbackAmount),
  shouldTrackFxSettlement: vi.fn(() => false),
}));

vi.mock('nanoid', () => ({
  nanoid: vi
    .fn()
    .mockReturnValueOnce('payment-1')
    .mockReturnValueOnce('receipt-1'),
}));

import { processAccountsReceivablePayment } from './processAccountsReceivablePayment.js';

describe('processAccountsReceivablePayment', () => {
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
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    resolvePilotMonetarySnapshotForBusinessMock.mockResolvedValue(null);

    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/cashCounts') {
        return {
          where: vi.fn(() => ({
            get: vi.fn(async () => ({ empty: true, docs: [] })),
          })),
        };
      }
      throw new Error(`Unexpected collection path: ${path}`);
    });

    transactionGetMock.mockImplementation(async (ref) =>
      toSnapshot(ref.path, transactionSnapshots.get(ref.path)),
    );
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: transactionGetMock,
        set: transactionSetMock,
        update: vi.fn(),
      }),
    );
  });

  it('rejects bank-backed methods without bankAccountId in pilot businesses', async () => {
    await expect(
      processAccountsReceivablePayment({
        data: {
          businessId: 'business-1',
          idempotencyKey: 'idem-1',
          paymentDetails: {
            paymentScope: 'account',
            paymentOption: 'partial',
            clientId: 'client-1',
            arId: 'ar-1',
            totalPaid: 100,
            paymentMethods: [
              {
                method: 'transfer',
                value: 100,
                status: true,
              },
            ],
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message:
        'Los pagos con tarjeta o transferencia requieren una cuenta bancaria activa en este negocio piloto.',
    });
  });

  it('reuses an idempotent accounts receivable payment before rebuilding the flow', async () => {
    documentSnapshots.set('users/user-1', {
      displayName: 'Usuario Demo',
    });
    documentSnapshots.set('businesses/business-1/clients/client-1', {
      client: {
        id: 'client-1',
        name: 'Cliente Demo',
      },
    });
    transactionSnapshots.set(
      'businesses/business-1/accountsReceivablePaymentIdempotency/idem-1',
      {
        paymentId: 'payment-existing',
        receiptId: 'receipt-existing',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-existing',
      {
        id: 'payment-existing',
        totalApplied: 100,
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsReceivablePaymentReceipt/receipt-existing',
      {
        id: 'receipt-existing',
        totalAmount: 100,
      },
    );

    const result = await processAccountsReceivablePayment({
      data: {
        businessId: 'business-1',
        idempotencyKey: 'idem-1',
        paymentDetails: {
          paymentScope: 'account',
          paymentOption: 'partial',
          clientId: 'client-1',
          arId: 'ar-1',
          totalPaid: 100,
          paymentMethods: [
            {
              method: 'card',
              value: 100,
              status: true,
              bankAccountId: 'bank-1',
            },
          ],
        },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        paymentId: 'payment-existing',
        receipt: expect.objectContaining({
          id: 'receipt-existing',
          totalAmount: 100,
        }),
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
