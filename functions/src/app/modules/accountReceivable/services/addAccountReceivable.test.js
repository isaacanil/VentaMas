import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();
const applyNextIDTransactionalMock = vi.fn();
const buildClientPendingBalanceUpdateMock = vi.fn();
const buildReceivableMonetarySnapshotFromSourceMock = vi.fn();
const buildAccountsReceivablePaymentStateMock = vi.fn();

vi.mock('nanoid', () => ({
  nanoid: () => 'ar-fixed-id',
}));

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class MockHttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: docMock,
  },
  Timestamp: {
    fromMillis: (value) => ({ ms: value }),
  },
}));

vi.mock('../../../core/utils/getNextID.js', () => ({
  applyNextIDTransactional: applyNextIDTransactionalMock,
}));

vi.mock('../utils/clientPendingBalance.util.js', () => ({
  buildClientPendingBalanceUpdate: buildClientPendingBalanceUpdateMock,
}));

vi.mock('../utils/receivableMonetary.util.js', () => ({
  buildReceivableMonetarySnapshotFromSource:
    buildReceivableMonetarySnapshotFromSourceMock,
}));

vi.mock('../utils/receivablePaymentPlan.util.js', () => ({
  buildAccountsReceivablePaymentState: buildAccountsReceivablePaymentStateMock,
}));

describe('addAccountReceivable', () => {
  beforeEach(() => {
    vi.resetModules();
    docMock.mockReset();
    applyNextIDTransactionalMock.mockReset();
    buildClientPendingBalanceUpdateMock.mockReset();
    buildReceivableMonetarySnapshotFromSourceMock.mockReset();
    buildAccountsReceivablePaymentStateMock.mockReset();
  });

  it(
    'lee cliente e invoice antes de escribir y usa invoicesV2 cuando aplica',
    async () => {
      const refs = new Map();
      docMock.mockImplementation((path) => {
        if (!refs.has(path)) {
          refs.set(path, { path, id: path.split('/').pop() });
        }
        return refs.get(path);
      });

      buildReceivableMonetarySnapshotFromSourceMock.mockReturnValue({
        total: 76.7,
      });
      buildAccountsReceivablePaymentStateMock.mockReturnValue({
        balance: 76.7,
        status: 'unpaid',
        lastPaymentAt: null,
        nextPaymentAt: 1778126400000,
      });
      buildClientPendingBalanceUpdateMock.mockReturnValue({
        pendingBalance: 76.7,
      });
      applyNextIDTransactionalMock.mockImplementation((tx, snap) => {
        tx.set(snap.ref, { value: 'increment' }, { merge: true });
        return 7;
      });

      const tx = {
        get: vi.fn(async (ref) => {
          switch (ref.path) {
            case 'businesses/business-1/clients/client-1':
              return {
                exists: true,
                data: () => ({ pendingBalance: 0 }),
              };
            case 'businesses/business-1/invoices/invoice-1':
              return {
                exists: false,
                data: () => null,
                get: () => null,
              };
            case 'businesses/business-1/invoicesV2/invoice-1':
              return {
                exists: true,
                data: () => ({ snapshot: { monetary: { total: 76.7 } } }),
                get: (field) => {
                  if (field === 'snapshot.monetary') return { total: 76.7 };
                  return null;
                },
              };
            default:
              throw new Error(`Unexpected tx.get for ${ref.path}`);
          }
        }),
        set: vi.fn(),
      };

      const { addAccountReceivable } = await import('./addAccountReceivable.js');

      const nextIdRef = { path: 'businesses/business-1/counters/lastAccountReceivableId' };
      const accountReceivable = await addAccountReceivable(tx, {
        user: { businessID: 'business-1', uid: 'user-1' },
        ar: {
          clientId: 'client-1',
          invoiceId: 'invoice-1',
          totalReceivable: 76.7,
          totalInstallments: 1,
          createdAt: 1775588023877,
          updatedAt: 1775588023878,
          paymentDate: 1778126400000,
        },
        accountReceivableNextIDSnap: {
          ref: nextIdRef,
          data: () => ({ value: 6 }),
        },
      });

      expect(tx.get).toHaveBeenCalledTimes(3);
      expect(tx.get.mock.calls.map(([ref]) => ref.path)).toEqual([
        'businesses/business-1/clients/client-1',
        'businesses/business-1/invoices/invoice-1',
        'businesses/business-1/invoicesV2/invoice-1',
      ]);
      expect(tx.get.mock.invocationCallOrder.at(-1)).toBeLessThan(
        tx.set.mock.invocationCallOrder[0],
      );
      expect(applyNextIDTransactionalMock).toHaveBeenCalledWith(tx, {
        ref: nextIdRef,
        data: expect.any(Function),
      });
      expect(tx.set).toHaveBeenCalledWith(
        refs.get('businesses/business-1/invoicesV2/invoice-1'),
        expect.objectContaining({
          receivableState: expect.objectContaining({
            arId: 'ar-fixed-id',
            balanceDue: 76.7,
          }),
        }),
        { merge: true },
      );
      expect(accountReceivable.id).toBe('ar-fixed-id');
      expect(accountReceivable.numberId).toBe(7);
    },
    10000,
  );
});
