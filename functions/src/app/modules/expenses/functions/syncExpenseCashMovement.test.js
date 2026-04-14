import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildExpenseCashMovementIdMock,
  buildExpenseCashMovementMock,
  deleteMock,
  getDocRef,
  isAccountingRolloutEnabledForBusinessMock,
  setMock,
} = vi.hoisted(() => {
  const hoistedBuildExpenseCashMovementMock = vi.fn();
  const hoistedBuildExpenseCashMovementIdMock = vi.fn();
  const hoistedSetMock = vi.fn(async () => undefined);
  const hoistedDeleteMock = vi.fn(async () => undefined);
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();

  const hoistedGetDocRef = (path) => ({
    path,
    set: hoistedSetMock,
    delete: hoistedDeleteMock,
  });

  return {
    buildExpenseCashMovementIdMock: hoistedBuildExpenseCashMovementIdMock,
    buildExpenseCashMovementMock: hoistedBuildExpenseCashMovementMock,
    deleteMock: hoistedDeleteMock,
    getDocRef: hoistedGetDocRef,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
    setMock: hoistedSetMock,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
  },
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/cashMovement.util.js', () => ({
  buildExpenseCashMovement: (...args) => buildExpenseCashMovementMock(...args),
  buildExpenseCashMovementId: (...args) =>
    buildExpenseCashMovementIdMock(...args),
}));

import { syncExpenseCashMovement } from './syncExpenseCashMovement.js';

describe('syncExpenseCashMovement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    buildExpenseCashMovementIdMock.mockReturnValue('exp_exp_1');
  });

  it('writes the canonical treasury movement for a settled expense', async () => {
    buildExpenseCashMovementMock.mockReturnValue({
      id: 'exp_exp_1',
      sourceDocumentType: 'expense',
      amount: 80,
    });

    await syncExpenseCashMovement({
      params: {
        businessId: 'business-1',
        expenseId: 'expense-1',
      },
      data: {
        before: {
          data: () => ({ expense: null }),
        },
        after: {
          data: () => ({
            expense: {
              id: 'expense-1',
              amount: 80,
            },
          }),
        },
      },
    });

    expect(setMock).toHaveBeenCalledWith(
      {
        id: 'exp_exp_1',
        sourceDocumentType: 'expense',
        amount: 80,
      },
      { merge: true },
    );
  });

  it('deletes the stale treasury movement when the expense no longer impacts cash', async () => {
    buildExpenseCashMovementMock.mockReturnValue(null);

    await syncExpenseCashMovement({
      params: {
        businessId: 'business-1',
        expenseId: 'expense-1',
      },
      data: {
        before: {
          data: () => ({
            expense: {
              id: 'expense-1',
            },
          }),
        },
        after: {
          data: () => ({
            expense: {
              id: 'expense-1',
              payment: {
                settlementMode: 'payable',
              },
            },
          }),
        },
      },
    });

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(setMock).not.toHaveBeenCalled();
  });
});
