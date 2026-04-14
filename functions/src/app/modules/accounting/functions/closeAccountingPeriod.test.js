import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
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
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
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
  });

  const hoistedGetDocRef = (path) => ({
    path,
    id: path.split('/').at(-1) ?? null,
  });

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
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
  onCall: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: {
    now: () => ({
      toMillis: () => Date.parse('2026-04-12T15:00:00.000Z'),
    }),
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

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: (...args) =>
    getPilotAccountingSettingsForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

import { closeAccountingPeriod } from './closeAccountingPeriod.js';

describe('closeAccountingPeriod', () => {
  beforeEach(() => {
    transactionSnapshots.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
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

  it('closes an open accounting period', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        note: 'Cierre operativo',
      },
    });

    expect(result).toEqual({
      ok: true,
      periodKey: '2026-04',
      reused: false,
    });
    expect(transactionSetMock).toHaveBeenCalledTimes(1);
  });

  it('reuses an already closed period without rewriting it', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      { status: 'closed' },
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
      },
    });

    expect(result).toEqual({
      ok: true,
      periodKey: '2026-04',
      reused: true,
    });
    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
