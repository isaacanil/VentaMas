import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  buildAccountingEventMock,
  buildInternalTransferCashMovementsMock,
  documentRefs,
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
  const hoistedTransactionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();

  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedAssertBusinessSubscriptionAccessMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedBuildAccountingEventMock = vi.fn();
  const hoistedBuildInternalTransferCashMovementsMock = vi.fn();
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
      hoistedDocumentRefs.set(path, { path });
    }

    return hoistedDocumentRefs.get(path);
  };

  return {
    assertBusinessSubscriptionAccessMock:
      hoistedAssertBusinessSubscriptionAccessMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    buildAccountingEventMock: hoistedBuildAccountingEventMock,
    buildInternalTransferCashMovementsMock:
      hoistedBuildInternalTransferCashMovementsMock,
    documentRefs: hoistedDocumentRefs,
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
      return new MockTimestamp(Date.parse('2026-04-01T00:00:00.000Z'));
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
}));

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', () => ({
  buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/cashMovement.util.js', () => ({
  buildInternalTransferCashMovements: (...args) =>
    buildInternalTransferCashMovementsMock(...args),
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'transfer-123',
}));

import { createInternalTransfer } from './createInternalTransfer.js';

describe('createInternalTransfer accounting period validation', () => {
  beforeEach(() => {
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
    buildAccountingEventMock.mockReturnValue({ id: 'event-1' });
    buildInternalTransferCashMovementsMock.mockReturnValue([
      { id: 'movement-1' },
      { id: 'movement-2' },
    ]);
    transactionGetMock.mockImplementation(async (ref) =>
      toSnapshot(ref.path, transactionSnapshots.get(ref.path)),
    );
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: transactionGetMock,
        set: transactionSetMock,
      }),
    );
  });

  it('rejects an internal transfer when the accounting period is closed', async () => {
    transactionSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
    });
    transactionSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      status: 'active',
    });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      { closedAt: '2026-04-30T23:59:59.000Z' },
    );

    await expect(
      createInternalTransfer({
        data: {
          businessId: 'business-1',
          amount: 75,
          from: {
            type: 'cash',
            cashCountId: 'cash-1',
          },
          to: {
            type: 'bank',
            bankAccountId: 'bank-1',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No puedes registrar esta transferencia interna con fecha de abril de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingPeriodClosures/2026-04',
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
    expect(buildInternalTransferCashMovementsMock).not.toHaveBeenCalled();
  });

  it('records the internal transfer when the accounting period is open', async () => {
    transactionSnapshots.set('businesses/business-1/cashCounts/cash-1', {
      cashCount: { state: 'open' },
    });
    transactionSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      status: 'active',
    });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await createInternalTransfer({
      data: {
        businessId: 'business-1',
        amount: 75,
        reference: 'TRF-1',
        note: 'Prueba',
        from: {
          type: 'cash',
          cashCountId: 'cash-1',
        },
        to: {
          type: 'bank',
          bankAccountId: 'bank-1',
        },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        businessId: 'business-1',
        transfer: expect.objectContaining({
          id: 'transfer-123',
          status: 'posted',
          amount: 75,
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledTimes(4);
    expect(buildInternalTransferCashMovementsMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      transfer: expect.objectContaining({
        id: 'transfer-123',
        occurredAt: expect.any(Object),
      }),
      createdAt: expect.any(Object),
      createdBy: 'user-1',
    });
  });
});
