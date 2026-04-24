import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  collectionMock,
  documentRefs,
  documentSnapshots,
  getDocRef,
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

import {
  createBankReconciliation,
  previewBankReconciliation,
} from './createBankReconciliation.js';

describe('createBankReconciliation', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    transactionSnapshots.clear();
    documentRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);

    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/bankReconciliations') {
        return {
          doc: vi.fn(() =>
            getDocRef(
              'businesses/business-1/bankReconciliations/reconciliation-1',
            ),
          ),
        };
      }

      if (path === 'businesses/business-1/bankStatementLines') {
        return {
          doc: vi.fn(() =>
            getDocRef(
              'businesses/business-1/bankStatementLines/statement-line-1',
            ),
          ),
        };
      }

      if (path === 'businesses/business-1/cashMovements') {
        return {
          where: vi.fn(() => ({
            __queryDocs: [
              toSnapshot('businesses/business-1/cashMovements/in-1', {
                amount: 100,
                direction: 'in',
                status: 'posted',
                occurredAt: { toMillis: () => Date.parse('2026-04-10T12:00:00.000Z') },
              }),
              toSnapshot('businesses/business-1/cashMovements/out-1', {
                amount: 25,
                direction: 'out',
                status: 'posted',
                occurredAt: { toMillis: () => Date.parse('2026-04-11T12:00:00.000Z') },
              }),
              toSnapshot('businesses/business-1/cashMovements/future-1', {
                amount: 10,
                direction: 'in',
                status: 'posted',
                occurredAt: { toMillis: () => Date.parse('2026-04-14T12:00:00.000Z') },
              }),
              toSnapshot('businesses/business-1/cashMovements/draft-1', {
                amount: 99,
                direction: 'in',
                status: 'draft',
                occurredAt: { toMillis: () => Date.parse('2026-04-10T12:00:00.000Z') },
              }),
            ],
          })),
        };
      }

      throw new Error(`Unexpected collection path: ${path}`);
    });

    transactionGetMock.mockImplementation(async (ref) => {
      if (Array.isArray(ref?.__queryDocs)) {
        return { docs: ref.__queryDocs };
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

  it('creates a reconciliation using posted movements up to the statement date', async () => {
    documentSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      status: 'active',
      openingBalance: 200,
    });
    transactionSnapshots.set(
      'businesses/business-1/treasuryIdempotency/recon-1',
      null,
    );

    const result = await createBankReconciliation({
      data: {
        businessId: 'business-1',
        bankAccountId: 'bank-1',
        idempotencyKey: 'recon-1',
        statementDate: '2026-04-12T00:00:00.000Z',
        statementBalance: 275,
        reference: 'APR-2026',
        note: 'Conciliacion inicial',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        reused: false,
        reconciliationId: 'reconciliation-1',
        reconciliation: expect.objectContaining({
          bankAccountId: 'bank-1',
          ledgerBalance: 275,
          reconciledMovementCount: 2,
          statementLineCount: 1,
          variance: 0,
          status: 'balanced',
          unreconciledMovementCount: 1,
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledTimes(5);
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/bankStatementLines/statement-line-1',
      }),
      expect.objectContaining({
        bankAccountId: 'bank-1',
        lineType: 'closing_balance',
        reconciliationId: 'reconciliation-1',
        runningBalance: 275,
        status: 'reconciled',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashMovements/in-1',
      }),
      expect.objectContaining({
        reconciliationId: 'reconciliation-1',
        reconciliationStatus: 'reconciled',
        bankStatementLineId: 'statement-line-1',
      }),
      { merge: true },
    );
  });

  it('reuses the existing reconciliation for the same idempotency key', async () => {
    documentSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      status: 'active',
      openingBalance: 200,
    });
    transactionSnapshots.set(
      'businesses/business-1/treasuryIdempotency/recon-1',
      {
        reconciliationId: 'reconciliation-existing',
      },
    );
    transactionSnapshots.set(
      'businesses/business-1/bankReconciliations/reconciliation-existing',
      {
        bankAccountId: 'bank-1',
        status: 'variance',
        variance: 15,
      },
    );

    const result = await createBankReconciliation({
      data: {
        businessId: 'business-1',
        bankAccountId: 'bank-1',
        idempotencyKey: 'recon-1',
        statementDate: '2026-04-12T00:00:00.000Z',
        statementBalance: 275,
        reference: 'APR-2026',
        note: 'Conciliacion inicial',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        reused: true,
        reconciliationId: 'reconciliation-existing',
        reconciliation: expect.objectContaining({
          status: 'variance',
          variance: 15,
        }),
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid statement date instead of falling back to now', async () => {
    documentSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      status: 'active',
      openingBalance: 200,
    });

    await expect(
      createBankReconciliation({
        data: {
          businessId: 'business-1',
          bankAccountId: 'bank-1',
          idempotencyKey: 'recon-invalid-date',
          statementDate: 'not-a-date',
          statementBalance: 275,
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'statementDate debe ser una fecha válida.',
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
  });
});

describe('previewBankReconciliation', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    transactionSnapshots.clear();
    documentRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);

    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/cashMovements') {
        return {
          where: vi.fn(() => ({
            get: vi.fn(async () => ({
              docs: [
                toSnapshot('businesses/business-1/cashMovements/in-1', {
                  amount: 100,
                  direction: 'in',
                  status: 'posted',
                  occurredAt: { toMillis: () => Date.parse('2026-04-10T12:00:00.000Z') },
                }),
                toSnapshot('businesses/business-1/cashMovements/out-1', {
                  amount: 25,
                  direction: 'out',
                  status: 'posted',
                  occurredAt: { toMillis: () => Date.parse('2026-04-11T12:00:00.000Z') },
                }),
              ],
            })),
          })),
        };
      }

      throw new Error(`Unexpected collection path: ${path}`);
    });
  });

  it('returns backend preview using current bank movements without persisting reconciliation', async () => {
    documentSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      status: 'active',
      openingBalance: 200,
    });

    const result = await previewBankReconciliation({
      data: {
        businessId: 'business-1',
        bankAccountId: 'bank-1',
        statementDate: '2026-04-12T00:00:00.000Z',
        statementBalance: 290,
      },
    });

    expect(result).toEqual({
      ok: true,
      preview: expect.objectContaining({
        bankAccountId: 'bank-1',
        ledgerBalance: 275,
        reconciledMovementCount: 2,
        statementBalance: 290,
        status: 'variance',
        unreconciledMovementCount: 0,
        variance: 15,
      }),
    });
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
