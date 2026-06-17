import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  buildAccountingEventMock,
  docRefs,
  fieldArrayUnionMock,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  incrementBusinessUsageMetricMock,
  isAccountingRolloutEnabledForBusinessMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  transaction,
  transactionGetMock,
  transactionUpdateMock,
} = vi.hoisted(() => {
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedBuildAccountingEventMock = vi.fn((input) => ({
    id: `${input.eventType}__${input.sourceId}`,
    ...input,
  }));
  const hoistedDocRefs = new Map();
  const hoistedFieldArrayUnionMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIncrementBusinessUsageMetricMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransactionGetMock = vi.fn();
  const hoistedTransactionUpdateMock = vi.fn();
  const hoistedTransaction = {
    get: hoistedTransactionGetMock,
    update: hoistedTransactionUpdateMock,
  };

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocRefs.has(path)) {
      hoistedDocRefs.set(path, {
        id: path.split('/').at(-1) ?? null,
        path,
        set: vi.fn(),
      });
    }
    return hoistedDocRefs.get(path);
  };

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    buildAccountingEventMock: hoistedBuildAccountingEventMock,
    docRefs: hoistedDocRefs,
    fieldArrayUnionMock: hoistedFieldArrayUnionMock,
    getDocRef: hoistedGetDocRef,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    incrementBusinessUsageMetricMock: hoistedIncrementBusinessUsageMetricMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    transaction: hoistedTransaction,
    transactionGetMock: hoistedTransactionGetMock,
    transactionUpdateMock: hoistedTransactionUpdateMock,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  FieldValue: {
    arrayUnion: (...args) => fieldArrayUnionMock(...args),
  },
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-08T12:00:00.000Z'));
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
    }

    toMillis() {
      return this.millis;
    }
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock(
  '../../../versions/v2/accounting/utils/accountingRollout.util.js',
  () => ({
    getPilotAccountingSettingsForBusiness: (...args) =>
      getPilotAccountingSettingsForBusinessMock(...args),
    isAccountingRolloutEnabledForBusiness: (...args) =>
      isAccountingRolloutEnabledForBusinessMock(...args),
  }),
);

vi.mock(
  '../../../versions/v2/accounting/utils/accountingEvent.util.js',
  () => ({
    buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
  }),
);

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/billing/services/usage.service.js', () => ({
  incrementBusinessUsageMetric: (...args) =>
    incrementBusinessUsageMetricMock(...args),
}));

import {
  buildCashOverShortAccountingEvent,
  closeCashCount,
} from './closeCashCount.js';

const buildCashCountSnap = ({
  openingEmployeePath = 'users/auth-user',
  state = 'open',
} = {}) => ({
  exists: true,
  get: vi.fn((path) => {
    if (path === 'cashCount.state') return state;
    if (path === 'cashCount.opening.employee') {
      return getDocRef(openingEmployeePath);
    }
    return undefined;
  }),
});

const buildCloseRequest = (data = {}) => ({
  data: {
    businessId: 'business-1',
    cashCountId: 'cash-1',
    employeeID: 'auth-user',
    approvalEmployeeID: 'manager-1',
    closingDate: Date.parse('2026-04-08T12:00:00.000Z'),
    cashCount: {
      id: 'cash-1',
      totalCard: 25,
      totalTransfer: 15,
      totalCharged: 40,
      totalReceivables: 5,
      totalDiscrepancy: 0,
      totalRegister: 45,
      totalSystem: 45,
      closing: {
        comments: 'Todo correcto',
      },
    },
    ...data,
  },
});

describe('closeCashCount identity boundary', () => {
  beforeEach(() => {
    docRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('auth-user');
    assertUserAccessMock.mockResolvedValue({
      role: 'cashier',
      source: 'canonical',
    });
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      functionalCurrency: 'DOP',
      generalAccountingEnabled: false,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(false);
    incrementBusinessUsageMetricMock.mockResolvedValue({ ok: true });
    fieldArrayUnionMock.mockImplementation((value) => ({
      __op: 'arrayUnion',
      value,
    }));
    transactionGetMock.mockResolvedValue(buildCashCountSnap());
    runTransactionMock.mockImplementation(async (callback) =>
      callback(transaction),
    );
  });

  it.each(['employeeID', 'employeeId'])(
    'rejects a payload %s that targets a different closing employee',
    async (employeeKey) => {
      await expect(
        closeCashCount(buildCloseRequest({ [employeeKey]: 'forged-user' })),
      ).rejects.toMatchObject({
        code: 'permission-denied',
      });

      expect(assertUserAccessMock).not.toHaveBeenCalled();
      expect(runTransactionMock).not.toHaveBeenCalled();
      expect(transactionUpdateMock).not.toHaveBeenCalled();
      expect(incrementBusinessUsageMetricMock).not.toHaveBeenCalled();
    },
  );

  it('keeps the opening employee as closing employee and writes the authenticated actor as approver', async () => {
    transactionGetMock.mockResolvedValue(
      buildCashCountSnap({ openingEmployeePath: 'users/cashier-1' }),
    );
    assertUserAccessMock.mockResolvedValue({
      role: 'manager',
      source: 'canonical',
    });

    await expect(
      closeCashCount(
        buildCloseRequest({
          employeeID: 'auth-user',
          approvalEmployeeID: 'forged-manager',
          cashCount: {
            id: 'cash-1',
            totalCard: 25,
            totalTransfer: 15,
            totalCharged: 40,
            totalReceivables: 5,
            totalDiscrepancy: 0,
            totalRegister: 45,
            totalSystem: 45,
            closing: {
              comments: 'Intento con identidades manipuladas',
              employee: getDocRef('users/forged-user'),
              approvalEmployee: getDocRef('users/forged-manager'),
            },
          },
        }),
      ),
    ).resolves.toEqual({
      ok: true,
      businessId: 'business-1',
      cashCountId: 'cash-1',
      state: 'closed',
    });

    expect(transactionUpdateMock).toHaveBeenCalledTimes(1);
    const updatePayload = transactionUpdateMock.mock.calls[0]?.[1];
    expect(updatePayload['cashCount.closing']).toMatchObject({
      comments: 'Intento con identidades manipuladas',
      initialized: true,
      employee: expect.objectContaining({
        path: 'users/cashier-1',
      }),
      approvalEmployee: expect.objectContaining({
        path: 'users/auth-user',
      }),
    });
    expect(updatePayload['cashCount.closing'].employee.path).not.toBe(
      'users/forged-user',
    );
    expect(updatePayload['cashCount.closing'].approvalEmployee.path).not.toBe(
      'users/forged-manager',
    );
  });
});

describe('buildCashOverShortAccountingEvent', () => {
  it('returns null when there is no discrepancy', () => {
    const result = buildCashOverShortAccountingEvent({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      cashCount: {
        totalDiscrepancy: 0,
      },
      accountingSettings: {
        functionalCurrency: 'DOP',
      },
      authUid: 'user-1',
      occurredAt: Date.parse('2026-04-08T12:00:00.000Z'),
    });

    expect(result).toBeNull();
  });

  it('builds an over event with signed monetary amount', () => {
    const result = buildCashOverShortAccountingEvent({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      cashCount: {
        totalDiscrepancy: 25.5,
        totalSystem: 100,
        totalRegister: 125.5,
      },
      accountingSettings: {
        functionalCurrency: 'DOP',
      },
      authUid: 'user-1',
      occurredAt: Date.parse('2026-04-08T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      eventType: 'cash_over_short.recorded',
      sourceType: 'cashCount',
      sourceId: 'cash-1',
      monetary: {
        amount: 25.5,
        functionalAmount: 25.5,
      },
      treasury: {
        cashCountId: 'cash-1',
        paymentChannel: 'cash',
      },
      payload: expect.objectContaining({
        discrepancyAmount: 25.5,
        discrepancyDirection: 'over',
      }),
    });
  });

  it('builds a short event preserving the negative sign', () => {
    const result = buildCashOverShortAccountingEvent({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      cashCount: {
        totalDiscrepancy: -12.75,
        totalSystem: 100,
        totalRegister: 87.25,
      },
      accountingSettings: {
        functionalCurrency: 'DOP',
      },
      authUid: 'user-1',
      occurredAt: Date.parse('2026-04-08T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      monetary: {
        amount: -12.75,
        functionalAmount: -12.75,
      },
      payload: expect.objectContaining({
        discrepancyAmount: -12.75,
        discrepancyDirection: 'short',
      }),
    });
  });
});
