import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
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

import { resolveBankStatementLineMatch } from './resolveBankStatementLineMatch.js';

describe('resolveBankStatementLineMatch', () => {
  beforeEach(() => {
    transactionSnapshots.clear();
    documentRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
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

  it('resolves a pending bank statement line when the selected movements match exactly', async () => {
    transactionSnapshots.set(
      'businesses/business-1/treasuryIdempotency/resolve-line-1',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/bankStatementLines/statement-line-1',
      {
        amount: 100,
        bankAccountId: 'bank-1',
        direction: 'in',
        lineType: 'transaction',
        metadata: {
          exceptionCode: 'unmatched',
        },
        statementDate: { toMillis: () => Date.parse('2026-04-12T00:00:00.000Z') },
        status: 'pending',
      },
    );
    transactionSnapshots.set('businesses/business-1/cashMovements/mov-1', {
      amount: 100,
      bankAccountId: 'bank-1',
      direction: 'in',
      occurredAt: { toMillis: () => Date.parse('2026-04-11T00:00:00.000Z') },
      reconciliationStatus: 'unreconciled',
      status: 'posted',
    });

    const result = await resolveBankStatementLineMatch({
      data: {
        businessId: 'business-1',
        idempotencyKey: 'resolve-line-1',
        movementIds: ['mov-1'],
        statementLineId: 'statement-line-1',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        matchedAmount: 100,
        ok: true,
        reused: false,
        statementLineId: 'statement-line-1',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledTimes(3);
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/bankStatementLines/statement-line-1',
      }),
      expect.objectContaining({
        status: 'reconciled',
        updatedBy: 'user-1',
      }),
      { merge: true },
    );
  });

  it('rejects a pending bank statement line when the selected movements do not match exactly', async () => {
    transactionSnapshots.set(
      'businesses/business-1/treasuryIdempotency/resolve-line-2',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/bankStatementLines/statement-line-2',
      {
        amount: 100,
        bankAccountId: 'bank-1',
        direction: 'in',
        lineType: 'transaction',
        statementDate: { toMillis: () => Date.parse('2026-04-12T00:00:00.000Z') },
        status: 'pending',
      },
    );
    transactionSnapshots.set('businesses/business-1/cashMovements/mov-1', {
      amount: 90,
      bankAccountId: 'bank-1',
      direction: 'in',
      occurredAt: { toMillis: () => Date.parse('2026-04-11T00:00:00.000Z') },
      reconciliationStatus: 'unreconciled',
      status: 'posted',
    });

    await expect(
      resolveBankStatementLineMatch({
        data: {
          businessId: 'business-1',
          idempotencyKey: 'resolve-line-2',
          movementIds: ['mov-1'],
          statementLineId: 'statement-line-2',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'Los movimientos seleccionados no cuadran exactamente con la línea pendiente.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('writes off a pending bank statement line and creates an explicit adjustment movement for the difference', async () => {
    transactionSnapshots.set(
      'businesses/business-1/treasuryIdempotency/resolve-line-3',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/bankStatementLines/statement-line-3',
      {
        amount: 100,
        bankAccountId: 'bank-1',
        direction: 'in',
        lineType: 'transaction',
        statementDate: { toMillis: () => Date.parse('2026-04-12T00:00:00.000Z') },
        status: 'pending',
      },
    );
    transactionSnapshots.set('businesses/business-1/bankAccounts/bank-1', {
      currency: 'DOP',
    });
    transactionSnapshots.set('businesses/business-1/cashMovements/mov-1', {
      amount: 90,
      bankAccountId: 'bank-1',
      direction: 'in',
      occurredAt: { toMillis: () => Date.parse('2026-04-11T00:00:00.000Z') },
      reconciliationStatus: 'unreconciled',
      status: 'posted',
    });

    const result = await resolveBankStatementLineMatch({
      data: {
        businessId: 'business-1',
        idempotencyKey: 'resolve-line-3',
        movementIds: ['mov-1'],
        resolutionMode: 'write_off',
        statementLineId: 'statement-line-3',
        writeOffReason: 'bank_fee',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        differenceAmount: 10,
        matchedAmount: 90,
        ok: true,
        resolutionMode: 'write_off',
        reused: false,
        statementLineId: 'statement-line-3',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashMovements/bsladj_statement-line-3',
      }),
      expect.objectContaining({
        amount: 10,
        bankAccountId: 'bank-1',
        direction: 'in',
        reconciliationStatus: 'reconciled',
        sourceType: 'bank_statement_adjustment',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/bankStatementLines/statement-line-3',
      }),
      expect.objectContaining({
        status: 'written_off',
      }),
      { merge: true },
    );
  });

  it('rejects write-off when the selected movements already match exactly', async () => {
    transactionSnapshots.set(
      'businesses/business-1/treasuryIdempotency/resolve-line-4',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/bankStatementLines/statement-line-4',
      {
        amount: 100,
        bankAccountId: 'bank-1',
        direction: 'in',
        lineType: 'transaction',
        statementDate: { toMillis: () => Date.parse('2026-04-12T00:00:00.000Z') },
        status: 'pending',
      },
    );
    transactionSnapshots.set('businesses/business-1/cashMovements/mov-1', {
      amount: 100,
      bankAccountId: 'bank-1',
      direction: 'in',
      occurredAt: { toMillis: () => Date.parse('2026-04-11T00:00:00.000Z') },
      reconciliationStatus: 'unreconciled',
      status: 'posted',
    });

    await expect(
      resolveBankStatementLineMatch({
        data: {
          businessId: 'business-1',
          idempotencyKey: 'resolve-line-4',
          movementIds: ['mov-1'],
          resolutionMode: 'write_off',
          statementLineId: 'statement-line-4',
          writeOffReason: 'bank_fee',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La diferencia ya es cero. Usa match exacto para cerrar la línea.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
