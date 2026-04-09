import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();
const runTransactionMock = vi.fn();
const timestampNowMock = vi.fn();
const toTimestampMock = vi.fn();
const sanitizeFirebaseDataMock = vi.fn();
const fbUploadFileMock = vi.fn();
const fbDeleteImageMock = vi.fn();
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

vi.mock('@/firebase/img/fbDeleteImage', () => ({
  fbDeleteImage: (...args: unknown[]) => fbDeleteImageMock(...args),
}));

vi.mock('@/firebase/img/fbUploadFileAndGetURL', () => ({
  fbUploadFile: (...args: unknown[]) => fbUploadFileMock(...args),
}));

vi.mock('@/utils/firebase/sanitizeFirebaseData', () => ({
  sanitizeFirebaseData: (...args: unknown[]) => sanitizeFirebaseDataMock(...args),
}));

vi.mock('@/utils/firebase/toTimestamp', () => ({
  toTimestamp: (...args: unknown[]) => toTimestampMock(...args),
}));

vi.mock('./utils/expenseAccountingPeriod', () => ({
  assertExpenseAccountingPeriodOpen: (...args: unknown[]) =>
    assertExpenseAccountingPeriodOpenMock(...args),
  assertExpenseAccountingPeriodOpenInTransaction: (...args: unknown[]) =>
    assertExpenseAccountingPeriodOpenInTransactionMock(...args),
}));

import { fbUpdateExpense } from './fbUpdateExpense';

describe('fbUpdateExpense', () => {
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
    fbUploadFileMock.mockResolvedValue({
      url: 'https://firebasestorage.googleapis.com/new-receipt',
    });
    fbDeleteImageMock.mockResolvedValue(undefined);
    assertExpenseAccountingPeriodOpenMock.mockResolvedValue('2026-03');
    assertExpenseAccountingPeriodOpenInTransactionMock.mockResolvedValue(
      '2026-03',
    );
  });

  it('blocks the update before deleting attachments when the period is closed', async () => {
    const setLoading = vi.fn();
    assertExpenseAccountingPeriodOpenMock.mockRejectedValue(
      new Error(
        'El período seleccionado está cerrado. Usa otra fecha o reabre el período.',
      ),
    );

    await expect(
      fbUpdateExpense(
        { uid: 'user-1', businessID: 'business-1' },
        setLoading,
        {
          id: 'exp-1',
          description: 'Taxi',
          amount: 120,
          categoryId: 'cat-1',
          dates: { expenseDate: 1710000000000 },
          attachments: [
            {
              id: 'existing',
              url: 'https://firebasestorage.googleapis.com/existing-receipt',
            },
          ],
        },
        [
          {
            id: 'new',
            name: 'receipt.png',
            type: 'image/png',
            file: {} as File,
          },
        ],
        [
          {
            id: 'existing',
            url: 'https://firebasestorage.googleapis.com/existing-receipt',
          },
        ],
      ),
    ).rejects.toThrow(
      'El período seleccionado está cerrado. Usa otra fecha o reabre el período.',
    );

    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(fbUploadFileMock).not.toHaveBeenCalled();
    expect(fbDeleteImageMock).not.toHaveBeenCalled();
  });

  it('updates the expense and deletes removed attachments only after a successful write', async () => {
    const setLoading = vi.fn();
    const transaction = {
      update: vi.fn(),
    };
    runTransactionMock.mockImplementation(
      async (_db: unknown, callback: (tx: typeof transaction) => Promise<void>) =>
        callback(transaction),
    );

    const result = await fbUpdateExpense(
      { uid: 'user-1', businessID: 'business-1' },
      setLoading,
      {
        id: 'exp-1',
        description: 'Taxi',
        amount: 120,
        categoryId: 'cat-1',
        dates: { expenseDate: 1710000000000, createdAt: 1709000000000 },
        attachments: [
          {
            id: 'existing-keep',
            url: 'https://firebasestorage.googleapis.com/existing-keep',
          },
        ],
      },
      [
        {
          id: 'new',
          name: 'receipt.png',
          type: 'image/png',
          file: {} as File,
        },
      ],
      [
        {
          id: 'existing-remove',
          url: 'https://firebasestorage.googleapis.com/existing-remove',
        },
      ],
    );

    expect(result).toBe(true);
    expect(assertExpenseAccountingPeriodOpenInTransactionMock).toHaveBeenCalledWith(
      {
        transaction,
        businessId: 'business-1',
        expense: expect.objectContaining({
          description: 'Taxi',
          id: 'exp-1',
        }),
      },
    );
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/expenses/exp-1',
      }),
      {
        expense: expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({ id: 'existing-keep' }),
            expect.objectContaining({ id: 'new' }),
          ]),
          description: 'Taxi',
          id: 'exp-1',
        }),
      },
    );
    expect(fbDeleteImageMock).toHaveBeenCalledWith(
      'https://firebasestorage.googleapis.com/existing-remove',
    );
    expect(fbDeleteImageMock).not.toHaveBeenCalledWith(
      'https://firebasestorage.googleapis.com/new-receipt',
    );
  });
});
