import { describe, expect, it, vi } from 'vitest';

const { collectionMock, docMock } = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  docMock: vi.fn(),
}));

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    collection: (...args) => collectionMock(...args),
    doc: (...args) => docMock(...args),
  },
}));

import { getOpenCashCountDoc } from './cashCountQueries.js';

describe('cashCountQueries', () => {
  it('busca solo cash counts abiertos para getOpenCashCountDoc', async () => {
    const whereMock = vi.fn();
    const limitMock = vi.fn();
    const getMock = vi.fn();
    const employeeRef = { path: 'users/user-1' };
    const cashCountDoc = { id: 'cash-1' };
    const cashCountsQuery = {
      where: whereMock,
      limit: limitMock,
    };
    const limitedQuery = {
      get: getMock,
    };

    collectionMock.mockImplementation((path) => {
      if (path === 'users') {
        return {
          doc: vi.fn(() => employeeRef),
        };
      }

      if (path === 'businesses/business-1/cashCounts') {
        return cashCountsQuery;
      }

      throw new Error(`collection inesperada: ${path}`);
    });
    whereMock.mockReturnValue(cashCountsQuery);
    limitMock.mockReturnValue(limitedQuery);
    getMock.mockResolvedValue({
      empty: false,
      docs: [cashCountDoc],
    });

    await expect(
      getOpenCashCountDoc({ uid: 'user-1', businessID: 'business-1' }),
    ).resolves.toBe(cashCountDoc);

    expect(whereMock).toHaveBeenNthCalledWith(
      1,
      'cashCount.state',
      '==',
      'open',
    );
    expect(whereMock).toHaveBeenNthCalledWith(
      2,
      'cashCount.opening.employee',
      '==',
      employeeRef,
    );
    expect(limitMock).toHaveBeenCalledWith(1);
  });

  it('falla con failed-precondition si no hay cash count abierto', async () => {
    const cashCountsQuery = {
      where: vi.fn(),
      limit: vi.fn(),
    };
    const limitedQuery = {
      get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    };

    collectionMock.mockImplementation((path) => {
      if (path === 'users') return { doc: vi.fn(() => ({ id: 'user-1' })) };
      if (path === 'businesses/business-1/cashCounts') return cashCountsQuery;
      throw new Error(`collection inesperada: ${path}`);
    });
    cashCountsQuery.where.mockReturnValue(cashCountsQuery);
    cashCountsQuery.limit.mockReturnValue(limitedQuery);

    await expect(
      getOpenCashCountDoc({ uid: 'user-1', businessID: 'business-1' }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'No hay cuadre de caja abierto',
    });
  });
});
