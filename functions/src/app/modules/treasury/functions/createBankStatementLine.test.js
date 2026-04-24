import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  collectionMock,
  documentRefs,
  getDocRef,
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
        id: path.split('/').at(-1) ?? null,
        path,
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
      return new MockTimestamp(Date.parse('2026-04-12T10:00:00.000Z'));
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
    collection: (...args) => collectionMock(...args),
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

import { createBankStatementLine } from './createBankStatementLine.js';

describe('createBankStatementLine', () => {
  beforeEach(() => {
    transactionSnapshots.clear();
    documentRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);

    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/bankStatementLines') {
        return {
          doc: vi.fn(() =>
            getDocRef('businesses/business-1/bankStatementLines/statement-line-1'),
          ),
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
      }),
    );
  });

  it('creates a reconciled statement line when selected movements match the bank line amount exactly', async () => {
    transactionSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      status: 'active',
    });
    transactionSnapshots.set(
      'businesses/business-1/treasuryIdempotency/statement-line-1',
      null,
    );
    transactionSnapshots.set('businesses/business-1/cashMovements/mov-1', {
      amount: 100,
      bankAccountId: 'bank-1',
      direction: 'in',
      occurredAt: { toMillis: () => Date.parse('2026-04-11T00:00:00.000Z') },
      reconciliationStatus: 'unreconciled',
      status: 'posted',
    });

    const result = await createBankStatementLine({
      data: {
        amount: 100,
        bankAccountId: 'bank-1',
        businessId: 'business-1',
        description: 'Deposito cliente',
        direction: 'in',
        idempotencyKey: 'statement-line-1',
        movementIds: ['mov-1'],
        reference: 'DEP-1',
        statementDate: '2026-04-12T00:00:00.000Z',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        exactMatch: true,
        matchStatus: 'reconciled',
        matchedAmount: 100,
        ok: true,
        statementLineId: 'statement-line-1',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledTimes(3);
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashMovements/mov-1',
      }),
      expect.objectContaining({
        bankStatementLineId: 'statement-line-1',
        reconciliationStatus: 'reconciled',
      }),
      { merge: true },
    );
  });

  it('creates a pending exception line when selected movements do not match the statement amount', async () => {
    transactionSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      status: 'active',
    });
    transactionSnapshots.set(
      'businesses/business-1/treasuryIdempotency/statement-line-2',
      null,
    );
    transactionSnapshots.set('businesses/business-1/cashMovements/mov-1', {
      amount: 100,
      bankAccountId: 'bank-1',
      direction: 'in',
      occurredAt: { toMillis: () => Date.parse('2026-04-11T00:00:00.000Z') },
      reconciliationStatus: 'unreconciled',
      status: 'posted',
    });

    const result = await createBankStatementLine({
      data: {
        amount: 90,
        bankAccountId: 'bank-1',
        businessId: 'business-1',
        description: 'Deposito parcial',
        direction: 'in',
        idempotencyKey: 'statement-line-2',
        movementIds: ['mov-1'],
        reference: 'DEP-2',
        statementDate: '2026-04-12T00:00:00.000Z',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        exactMatch: false,
        matchStatus: 'pending',
        matchedAmount: 100,
        ok: true,
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledTimes(2);
    expect(transactionSetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashMovements/mov-1',
      }),
      expect.anything(),
      { merge: true },
    );
  });
});
