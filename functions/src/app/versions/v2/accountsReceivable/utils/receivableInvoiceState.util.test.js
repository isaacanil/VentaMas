import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => {
  const query = {};
  query.where = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.get = vi.fn();

  return {
    collection: vi.fn(() => query),
    query,
  };
});

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    collection: (...args) => dbMocks.collection(...args),
  },
}));

import {
  expectsAccountsReceivable,
  getReceivableMetadata,
  hasAccountsReceivable,
} from './receivableInvoiceState.util.js';

describe('receivableInvoiceState.util', () => {
  beforeEach(() => {
    dbMocks.collection.mockClear();
    dbMocks.query.where.mockClear();
    dbMocks.query.limit.mockClear();
    dbMocks.query.get.mockReset();
  });

  it('reads metadata from snapshot.cart.accountsReceivable', () => {
    const invoice = {
      snapshot: {
        cart: {
          accountsReceivable: {
            isAddedToReceivables: true,
            totalInstallments: '3',
          },
        },
      },
    };

    expect(getReceivableMetadata(invoice)).toEqual({
      isAdded: true,
      totalInstallments: 3,
    });
  });

  it('unwraps legacy data invoices with cart and accountsReceivable', () => {
    const invoice = {
      data: {
        cart: {
          isAddedToReceivables: true,
          accountsReceivable: {
            totalInstallments: 2,
          },
        },
        accountsReceivable: {
          totalInstallments: 1,
        },
      },
    };

    expect(getReceivableMetadata(invoice)).toEqual({
      isAdded: true,
      totalInstallments: 2,
    });
  });

  it('uses the greatest totalInstallments candidate', () => {
    const invoice = {
      isAddedToReceivables: true,
      accountsReceivable: {
        totalInstallments: 3,
      },
      snapshot: {
        accountsReceivable: {
          totalInstallments: 2,
        },
        cart: {
          accountsReceivable: {
            totalInstallments: 5,
          },
        },
      },
    };

    expect(getReceivableMetadata(invoice)).toEqual({
      isAdded: true,
      totalInstallments: 5,
    });
  });

  it('expects accounts receivable only when added and installments are positive', () => {
    expect(
      expectsAccountsReceivable({
        accountsReceivable: {
          isAddedToReceivables: true,
          totalInstallments: 1,
        },
      }),
    ).toBe(true);

    expect(
      expectsAccountsReceivable({
        accountsReceivable: {
          isAddedToReceivables: true,
          totalInstallments: 0,
        },
      }),
    ).toBe(false);

    expect(
      expectsAccountsReceivable({
        accountsReceivable: {
          totalInstallments: 1,
        },
      }),
    ).toBe(false);
  });

  it('queries accounts receivable by invoice and returns true or false', async () => {
    dbMocks.query.get
      .mockResolvedValueOnce({ empty: false })
      .mockResolvedValueOnce({ empty: true });

    await expect(
      hasAccountsReceivable({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
      }),
    ).resolves.toBe(true);

    await expect(
      hasAccountsReceivable({
        businessId: 'business-1',
        invoiceId: 'invoice-2',
      }),
    ).resolves.toBe(false);

    expect(dbMocks.collection).toHaveBeenNthCalledWith(
      1,
      'businesses/business-1/accountsReceivable',
    );
    expect(dbMocks.query.where).toHaveBeenNthCalledWith(
      1,
      'invoiceId',
      '==',
      'invoice-1',
    );
    expect(dbMocks.query.limit).toHaveBeenNthCalledWith(1, 1);
    expect(dbMocks.collection).toHaveBeenNthCalledWith(
      2,
      'businesses/business-1/accountsReceivable',
    );
    expect(dbMocks.query.where).toHaveBeenNthCalledWith(
      2,
      'invoiceId',
      '==',
      'invoice-2',
    );
    expect(dbMocks.query.limit).toHaveBeenNthCalledWith(2, 1);
  });
});
