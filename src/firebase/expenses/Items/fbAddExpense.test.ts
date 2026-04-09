import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();
const runTransactionMock = vi.fn();
const timestampNowMock = vi.fn();
const toTimestampMock = vi.fn();
const getNextIDMock = vi.fn();
const sanitizeFirebaseDataMock = vi.fn();
const fbUploadFileMock = vi.fn();
const fbDeleteImageMock = vi.fn();
const isAccountingRolloutEnabledForBusinessMock = vi.fn();
const resolveMonetarySnapshotForBusinessMock = vi.fn();
const assertExpenseAccountingPeriodOpenMock = vi.fn();
const assertExpenseAccountingPeriodOpenInTransactionMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => timestampNowMock(),
  },
  doc: (...args: unknown[]) => docMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: { __name: 'db' },
}));

vi.mock('@/firebase/img/fbUploadFileAndGetURL', () => ({
  fbUploadFile: (...args: unknown[]) => fbUploadFileMock(...args),
}));

vi.mock('@/firebase/img/fbDeleteImage', () => ({
  fbDeleteImage: (...args: unknown[]) => fbDeleteImageMock(...args),
}));

vi.mock('@/firebase/Tools/getNextID', () => ({
  getNextID: (...args: unknown[]) => getNextIDMock(...args),
}));

vi.mock('@/utils/firebase/sanitizeFirebaseData', () => ({
  sanitizeFirebaseData: (...args: unknown[]) => sanitizeFirebaseDataMock(...args),
}));

vi.mock('@/utils/firebase/toTimestamp', () => ({
  toTimestamp: (...args: unknown[]) => toTimestampMock(...args),
}));

vi.mock('@/utils/accounting/monetary', () => ({
  isAccountingRolloutEnabledForBusiness: (...args: unknown[]) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
  resolveMonetarySnapshotForBusiness: (...args: unknown[]) =>
    resolveMonetarySnapshotForBusinessMock(...args),
}));

vi.mock('./utils/expenseAccountingPeriod', () => ({
  assertExpenseAccountingPeriodOpen: (...args: unknown[]) =>
    assertExpenseAccountingPeriodOpenMock(...args),
  assertExpenseAccountingPeriodOpenInTransaction: (...args: unknown[]) =>
    assertExpenseAccountingPeriodOpenInTransactionMock(...args),
}));

import { fbAddExpense } from './fbAddExpense';

describe('fbAddExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    timestampNowMock.mockReturnValue({ kind: 'timestamp-now' });
    toTimestampMock.mockImplementation((value: unknown) => ({
      kind: 'timestamp',
      value,
    }));
    sanitizeFirebaseDataMock.mockImplementation((value: unknown) => value);
    docMock.mockImplementation((...args: unknown[]) => ({
      path: args.slice(1).join('/'),
    }));
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(false);
    resolveMonetarySnapshotForBusinessMock.mockResolvedValue(null);
    fbUploadFileMock.mockResolvedValue({
      url: 'https://firebasestorage.googleapis.com/new-receipt',
    });
    fbDeleteImageMock.mockResolvedValue(undefined);
    getNextIDMock.mockResolvedValue(12);
    assertExpenseAccountingPeriodOpenMock.mockResolvedValue('2026-03');
    assertExpenseAccountingPeriodOpenInTransactionMock.mockResolvedValue(
      '2026-03',
    );
  });

  it('blocks the expense before persisting when the period is closed', async () => {
    const setLoading = vi.fn();
    assertExpenseAccountingPeriodOpenMock.mockRejectedValue(
      new Error(
        'El período seleccionado está cerrado. Usa otra fecha o reabre el período.',
      ),
    );

    await expect(
      fbAddExpense(
        { uid: 'user-1', businessID: 'business-1' },
        setLoading,
        {
          description: 'Taxi',
          amount: 120,
          categoryId: 'cat-1',
          dates: { expenseDate: 1710000000000 },
        },
      ),
    ).rejects.toThrow(
      'El período seleccionado está cerrado. Usa otra fecha o reabre el período.',
    );

    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(getNextIDMock).not.toHaveBeenCalled();
    expect(fbUploadFileMock).not.toHaveBeenCalled();
  });

  it('persists the expense inside a transaction when the period is open', async () => {
    const setLoading = vi.fn();
    const transaction = {
      set: vi.fn(),
    };
    runTransactionMock.mockImplementation(
      async (_db: unknown, callback: (tx: typeof transaction) => Promise<void>) =>
        callback(transaction),
    );

    const result = await fbAddExpense(
      { uid: 'user-1', businessID: 'business-1' },
      setLoading,
      {
        description: 'Taxi',
        amount: 120,
        categoryId: 'cat-1',
        dates: { expenseDate: 1710000000000 },
      },
    );

    expect(result).toBe(true);
    expect(assertExpenseAccountingPeriodOpenInTransactionMock).toHaveBeenCalledWith(
      {
        transaction,
        businessId: 'business-1',
        expense: expect.objectContaining({
          createdBy: 'user-1',
          description: 'Taxi',
          status: 'active',
        }),
      },
    );
    expect(getNextIDMock).toHaveBeenCalledWith(
      { uid: 'user-1', businessID: 'business-1' },
      'lastExpensesId',
      1,
      transaction,
    );
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining('businesses/business-1/expenses/'),
      }),
      {
        expense: expect.objectContaining({
          createdBy: 'user-1',
          description: 'Taxi',
          numberId: 12,
          status: 'active',
        }),
      },
    );
  });
});
