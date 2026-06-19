import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  cashCountsQuery,
  collectionMock,
  docRefs,
  getDocRef,
  linkSaleToCashCountInTransactionMock,
  MockHttpsError,
  openCashCountsGetMock,
  resolveCallableAuthUidMock,
  runTransactionMock,
  transaction,
} = vi.hoisted(() => {
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedCollectionMock = vi.fn();
  const hoistedDocRefs = new Map();
  const hoistedLinkSaleToCashCountInTransactionMock = vi.fn();
  const hoistedOpenCashCountsGetMock = vi.fn();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  };

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  const hoistedCashCountsQuery = {
    where: vi.fn(() => hoistedCashCountsQuery),
    limit: vi.fn(() => ({
      get: hoistedOpenCashCountsGetMock,
    })),
  };

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocRefs.has(path)) {
      hoistedDocRefs.set(path, {
        id: path.split('/').at(-1) ?? null,
        path,
      });
    }
    return hoistedDocRefs.get(path);
  };

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    cashCountsQuery: hoistedCashCountsQuery,
    collectionMock: hoistedCollectionMock,
    docRefs: hoistedDocRefs,
    getDocRef: hoistedGetDocRef,
    linkSaleToCashCountInTransactionMock:
      hoistedLinkSaleToCashCountInTransactionMock,
    MockHttpsError: HoistedHttpsError,
    openCashCountsGetMock: hoistedOpenCashCountsGetMock,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    transaction: hoistedTransaction,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
    collection: (...args) => collectionMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  FieldValue: {
    arrayUnion: vi.fn((...values) => ({ __op: 'arrayUnion', values })),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../services/cashCountSales.service.js', () => ({
  linkSaleToCashCountInTransaction: (...args) =>
    linkSaleToCashCountInTransactionMock(...args),
}));

import { addInvoiceToOpenCashCount } from './addInvoiceToOpenCashCount.js';

const buildRequest = (data = {}) => ({
  data: {
    businessId: 'business-1',
    invoiceId: 'invoice-1',
    invoicePath: 'businesses/business-1/invoices/invoice-1',
    ...data,
  },
});

const buildCashCountSnap = ({
  state = 'open',
  employeePath = 'users/auth-user',
} = {}) => ({
  exists: true,
  data: () => ({
    cashCount: {
      id: 'cash-1',
      state,
      sales: [],
    },
  }),
  get: vi.fn((field) => {
    if (field === 'cashCount.state') return state;
    if (field === 'cashCount.opening.employee') return getDocRef(employeePath);
    if (field === 'cashCount.sales') return [];
    return undefined;
  }),
});

describe('addInvoiceToOpenCashCount', () => {
  beforeEach(() => {
    docRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('auth-user');
    assertUserAccessMock.mockResolvedValue({
      role: 'cashier',
      source: 'canonical',
    });
    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/cashCounts') {
        return cashCountsQuery;
      }
      throw new Error(`Unexpected collection path: ${path}`);
    });
    runTransactionMock.mockImplementation(async (callback) =>
      callback(transaction),
    );
    linkSaleToCashCountInTransactionMock.mockResolvedValue({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
      alreadyLinked: false,
    });
  });

  it('links the invoice to the authenticated cashier open cash count', async () => {
    const cashCountRef = getDocRef('businesses/business-1/cashCounts/cash-1');
    const invoiceRef = getDocRef('businesses/business-1/invoices/invoice-1');
    openCashCountsGetMock.mockResolvedValue({
      empty: false,
      docs: [{ id: 'cash-1', ref: cashCountRef }],
    });
    transaction.get.mockImplementation(async (ref) => {
      if (ref === cashCountRef) return buildCashCountSnap();
      if (ref === invoiceRef) return { exists: true };
      throw new Error(`Unexpected transaction get: ${ref.path}`);
    });

    await expect(addInvoiceToOpenCashCount(buildRequest())).resolves.toEqual({
      ok: true,
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      cashCountId: 'cash-1',
      alreadyLinked: false,
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'auth-user',
      businessId: 'business-1',
      allowedRoles: ['invoice-operator'],
    });
    expect(cashCountsQuery.where).toHaveBeenCalledWith(
      'cashCount.opening.employee',
      '==',
      expect.objectContaining({ path: 'users/auth-user' }),
    );
    expect(linkSaleToCashCountInTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tx: transaction,
        businessId: 'business-1',
        cashCountId: 'cash-1',
        cashCountRef,
        invoiceId: 'invoice-1',
        invoiceRef,
        createdBy: 'auth-user',
      }),
    );
  });

  it('rejects invoice paths outside the requested business', async () => {
    await expect(
      addInvoiceToOpenCashCount(
        buildRequest({
          invoicePath: 'businesses/other-business/invoices/invoice-1',
        }),
      ),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(openCashCountsGetMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('fails when the authenticated cashier has no open cash count', async () => {
    openCashCountsGetMock.mockResolvedValue({ empty: true, docs: [] });

    await expect(
      addInvoiceToOpenCashCount(buildRequest()),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'No hay cuadre de caja abierto para el cajero actual',
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(linkSaleToCashCountInTransactionMock).not.toHaveBeenCalled();
  });

  it('rechecks cash count ownership inside the transaction', async () => {
    const cashCountRef = getDocRef('businesses/business-1/cashCounts/cash-1');
    openCashCountsGetMock.mockResolvedValue({
      empty: false,
      docs: [{ id: 'cash-1', ref: cashCountRef }],
    });
    transaction.get.mockResolvedValue(
      buildCashCountSnap({ employeePath: 'users/other-user' }),
    );

    await expect(
      addInvoiceToOpenCashCount(buildRequest()),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(linkSaleToCashCountInTransactionMock).not.toHaveBeenCalled();
  });
});
