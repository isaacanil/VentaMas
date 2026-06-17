import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  buildAccountingEventIdMock,
  collectionMock,
  documentRefs,
  documentSnapshots,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
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
  const hoistedBuildAccountingEventIdMock = vi.fn();
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
    buildAccountingEventIdMock: hoistedBuildAccountingEventIdMock,
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
      return new MockTimestamp(Date.parse('2026-04-15T00:00:00.000Z'));
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

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    AUDIT: ['audit'],
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
}));

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', () => ({
  buildAccountingEvent: vi.fn(),
  buildAccountingEventId: (...args) => buildAccountingEventIdMock(...args),
  resolveAccountingPaymentChannel: vi.fn(),
  resolvePrimaryBankAccountId: vi.fn(),
}));

vi.mock('../../../versions/v2/accounting/utils/cashMovement.util.js', () => ({
  buildReceivablePaymentVoidCashMovements: vi.fn(),
}));

vi.mock('../utils/clientPendingBalance.util.js', () => ({
  buildClientPendingBalanceUpdate: vi.fn(),
}));

vi.mock('../utils/receivablePaymentVoid.util.js', () => ({
  buildVoidReceivablePaymentPlan: vi.fn(),
}));

import { voidAccountsReceivablePayment } from './voidAccountsReceivablePayment.js';
import { Timestamp } from '../../../core/config/firebase.js';
import * as accountingEventUtil from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import * as cashMovementUtil from '../../../versions/v2/accounting/utils/cashMovement.util.js';
import * as receivablePaymentVoidUtil from '../utils/receivablePaymentVoid.util.js';

describe('voidAccountsReceivablePayment accounting period validation', () => {
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
    buildAccountingEventIdMock.mockReturnValue('event-recorded-1');
    accountingEventUtil.buildAccountingEvent.mockImplementation((input) => ({
      id: `${input.eventType}__${input.sourceId}`,
      ...input,
    }));
    cashMovementUtil.buildReceivablePaymentVoidCashMovements.mockReturnValue([]);
    receivablePaymentVoidUtil.buildVoidReceivablePaymentPlan.mockReturnValue({
      accountUpdate: {
        arId: 'ar-1',
        payload: {
          arBalance: 100,
          paymentState: {
            balance: 100,
          },
        },
      },
      installmentUpdates: [],
      installmentPaymentUpdates: [],
      invoiceAggregate: null,
      restoredAmount: 100,
    });
    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/cashMovements') {
        return {
          where: vi.fn((_field, _operator, sourceId) => ({
            kind: 'cash-movements-by-source',
            sourceId,
          })),
        };
      }
      if (path === 'businesses/business-1/accountsReceivableFxSettlements') {
        return {
          where: vi.fn((_field, _operator, paymentId) => ({
            kind: 'fx-settlements-by-payment',
            paymentId,
          })),
        };
      }
      if (path === 'businesses/business-1/accountsReceivableInstallments') {
        return {
          where: vi.fn((_field, _operator, arId) => ({
            orderBy: vi.fn(() => ({
              kind: 'installments-by-ar',
              arId,
            })),
          })),
        };
      }
      if (
        path === 'businesses/business-1/accountsReceivableInstallmentPayments'
      ) {
        return {
          where: vi.fn((_field, _operator, value) => ({
            kind:
              _field === 'paymentId'
                ? 'installment-payments-by-payment'
                : 'installment-payments-by-ar',
            value,
          })),
        };
      }
      throw new Error(`Unexpected collection lookup in this test: ${path}`);
    });
    transactionGetMock.mockImplementation(async (ref) => {
      if (ref?.kind === 'cash-movements-by-source') {
        const docs = (
          transactionSnapshots.get(`cashMovements:${ref.sourceId}`) || []
        ).map((entry) => ({
          id: entry.id,
          data: () => entry,
        }));
        return { docs };
      }
      if (ref?.kind === 'fx-settlements-by-payment') {
        const docs = (
          transactionSnapshots.get(`fxSettlements:${ref.paymentId}`) || []
        ).map((entry) => ({
          id: entry.id,
          data: () => entry,
          ref: {
            path: `businesses/business-1/accountsReceivableFxSettlements/${entry.id}`,
          },
        }));
        return { docs };
      }
      if (ref?.kind === 'installments-by-ar') {
        const docs = (transactionSnapshots.get(`installments:${ref.arId}`) || [])
          .map((entry) => ({
            id: entry.id,
            data: () => entry,
          }));
        return { docs };
      }
      if (
        ref?.kind === 'installment-payments-by-payment' ||
        ref?.kind === 'installment-payments-by-ar'
      ) {
        const docs = (
          transactionSnapshots.get(`${ref.kind}:${ref.value}`) || []
        ).map((entry) => ({
          id: entry.id,
          data: () => entry,
          get: (field) =>
            field
              .split('.')
              .reduce((current, key) => current?.[key], entry ?? null),
        }));
        return { docs };
      }

      return toSnapshot(ref.path, transactionSnapshots.get(ref.path));
    });
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: transactionGetMock,
        set: transactionSetMock,
        update: vi.fn(),
      }),
    );
  });

  it('rejects voiding an AR payment when the accounting period is closed', async () => {
    const paymentRecord = {
      status: 'posted',
      paymentMethods: [],
      totalApplied: 125,
    };

    documentSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-1',
      paymentRecord,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-1',
      paymentRecord,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      { closedAt: '2026-04-30T23:59:59.000Z' },
    );

    await expect(
      voidAccountsReceivablePayment({
        data: {
          businessId: 'business-1',
          paymentId: 'payment-1',
          reason: 'Error de registro',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No puedes anular este cobro con fecha de abril de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingPeriodClosures/2026-04',
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalledWith(
      'businesses/business-1/cashMovements',
    );
  });

  it('rejects voiding an AR payment when treasury movements are reconciled', async () => {
    const paymentRecord = {
      status: 'posted',
      paymentMethods: [
        {
          method: 'transfer',
          value: 125,
          bankAccountId: 'bank-1',
        },
      ],
      totalApplied: 125,
    };

    documentSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-1',
      paymentRecord,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-1',
      paymentRecord,
    );
    transactionSnapshots.set('cashMovements:payment-1', [
      {
        id: 'arp_payment-1_transfer_1',
        sourceId: 'payment-1',
        reconciliationStatus: 'reconciled',
        reconciliationId: 'rec-1',
      },
    ]);

    await expect(
      voidAccountsReceivablePayment({
        data: {
          businessId: 'business-1',
          paymentId: 'payment-1',
          reason: 'Error de registro',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'El cobro tiene movimientos de caja/banco conciliados. Debe revertirse mediante un flujo de conciliación/refund controlado.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('keeps void response serialization compatible for already voided payments', async () => {
    const createdAt = new Timestamp(Date.parse('2026-04-10T12:00:00.000Z'));
    const voidedAt = new Timestamp(Date.parse('2026-04-11T12:00:00.000Z'));
    const paymentRecord = {
      id: 'payment-1',
      status: 'void',
      paymentMethods: [],
      totalApplied: 125,
      createdAt,
      voidedAt,
      omitted: undefined,
      metadata: {
        restoredAccounts: [
          {
            arId: 'ar-1',
            restoredAt: voidedAt,
            omitted: undefined,
          },
        ],
      },
    };

    documentSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-1',
      paymentRecord,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-1',
      paymentRecord,
    );
    transactionSnapshots.set('cashMovements:payment-1', []);

    const result = await voidAccountsReceivablePayment({
      data: {
        businessId: 'business-1',
        paymentId: 'payment-1',
        reason: 'Ya anulado',
      },
    });

    expect(result).toEqual({
      ok: true,
      alreadyVoided: true,
      paymentId: 'payment-1',
      restoredAccounts: [
        {
          arId: 'ar-1',
          restoredAt: Date.parse('2026-04-11T12:00:00.000Z'),
        },
      ],
      payment: {
        id: 'payment-1',
        status: 'void',
        paymentMethods: [],
        totalApplied: 125,
        createdAt: Date.parse('2026-04-10T12:00:00.000Z'),
        voidedAt: Date.parse('2026-04-11T12:00:00.000Z'),
        metadata: {
          restoredAccounts: [
            {
              arId: 'ar-1',
              restoredAt: Date.parse('2026-04-11T12:00:00.000Z'),
            },
          ],
        },
      },
    });
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('emits FX settlement void accounting events when voiding a foreign-currency payment', async () => {
    const paymentRecord = {
      id: 'payment-1',
      status: 'posted',
      clientId: 'client-1',
      paymentMethods: [
        {
          method: 'transfer',
          value: 5900,
          bankAccountId: 'bank-1',
        },
      ],
      totalApplied: 100,
      totalCollected: 5900,
      functionalAppliedAmount: 5900,
      historicalFunctionalAppliedAmount: 6000,
      functionalCollectedAmount: 5900,
      functionalWithholdingAmount: 0,
      accountEntries: [
        {
          arId: 'ar-1',
          invoiceId: 'invoice-1',
          totalPaid: 100,
        },
      ],
      monetary: {
        documentCurrency: { code: 'USD' },
        functionalCurrency: { code: 'DOP' },
      },
    };

    documentSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-1',
      paymentRecord,
    );
    transactionSnapshots.set(
      'businesses/business-1/accountsReceivablePayments/payment-1',
      paymentRecord,
    );
    transactionSnapshots.set('cashMovements:payment-1', []);
    transactionSnapshots.set('fxSettlements:payment-1', [
      {
        id: 'payment-1_ar-1',
        paymentId: 'payment-1',
        arId: 'ar-1',
        invoiceId: 'invoice-1',
        clientId: 'client-1',
        documentCurrency: 'USD',
        functionalCurrency: 'DOP',
        appliedDocumentAmount: 100,
        historicalFunctionalAmount: 6000,
        settlementFunctionalAmount: 5900,
        fxGainLossAmount: -100,
        fxDirection: 'loss',
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountsReceivable/ar-1',
      {
        id: 'ar-1',
        invoiceId: 'invoice-1',
        arBalance: 0,
      },
    );
    transactionSnapshots.set('installments:ar-1', []);
    transactionSnapshots.set(
      'installment-payments-by-ar:ar-1',
      [],
    );
    transactionSnapshots.set('businesses/business-1/invoices/invoice-1', {
      id: 'invoice-1',
      accumulatedPaid: 100,
      balanceDue: 0,
    });
    transactionSnapshots.set('businesses/business-1/clients/client-1', {
      client: {
        id: 'client-1',
      },
    });

    await voidAccountsReceivablePayment({
      data: {
        businessId: 'business-1',
        paymentId: 'payment-1',
        reason: 'Error de registro',
      },
    });

    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountsReceivableFxSettlements/payment-1_ar-1',
      }),
      expect.objectContaining({
        status: 'void',
        voidReason: 'Error de registro',
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingEvents/fx_settlement.voided__payment-1_ar-1',
      }),
      expect.objectContaining({
        eventType: 'fx_settlement.voided',
        sourceId: 'payment-1_ar-1',
        reversalOfEventId: 'event-recorded-1',
        monetary: expect.objectContaining({
          amount: -100,
          functionalAmount: -100,
        }),
        payload: expect.objectContaining({
          reason: 'Error de registro',
          historicalFunctionalAmount: 6000,
          settlementFunctionalAmount: 5900,
          fxGainLossAmount: -100,
          fxDirection: 'loss',
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingEvents/accounts_receivable.payment.voided__payment-1',
      }),
      expect.objectContaining({
        eventType: 'accounts_receivable.payment.voided',
        payload: expect.objectContaining({
          functionalAppliedAmount: 5900,
          historicalFunctionalAppliedAmount: 6000,
          voidedFxSettlementIds: ['payment-1_ar-1'],
        }),
      }),
    );
  });
});
