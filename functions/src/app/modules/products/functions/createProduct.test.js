import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  docRefs,
  getDefaultWarehouseMock,
  getDocRef,
  getNextIDTransactionalMock,
  incrementBusinessUsageMetricMock,
  MockHttpsError,
  nanoidMock,
  prepareLimitedCreateOperationMock,
  runTransactionMock,
  serverTimestampMock,
  transaction,
  transactionSetMock,
} = vi.hoisted(() => {
  const hoistedDocRefs = new Map();
  const hoistedTransactionSetMock = vi.fn();
  const hoistedTransaction = {
    set: hoistedTransactionSetMock,
  };

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

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
    docRefs: hoistedDocRefs,
    getDefaultWarehouseMock: vi.fn(),
    getDocRef: hoistedGetDocRef,
    getNextIDTransactionalMock: vi.fn(),
    incrementBusinessUsageMetricMock: vi.fn(),
    MockHttpsError: HoistedHttpsError,
    nanoidMock: vi.fn(),
    prepareLimitedCreateOperationMock: vi.fn(),
    runTransactionMock: vi.fn(),
    serverTimestampMock: vi.fn(),
    transaction: hoistedTransaction,
    transactionSetMock: hoistedTransactionSetMock,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('nanoid', () => ({
  nanoid: (...args) => nanoidMock(...args),
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
  },
}));

vi.mock('../../../core/utils/getNextID.js', () => ({
  getNextIDTransactional: (...args) => getNextIDTransactionalMock(...args),
}));

vi.mock('../../warehouse/services/defaultWarehouse.service.js', () => ({
  getDefaultWarehouse: (...args) => getDefaultWarehouseMock(...args),
}));

vi.mock('../../../versions/v2/billing/config/limitOperations.config.js', () => ({
  LIMIT_OPERATION_KEYS: {
    PRODUCT_CREATE: 'product.create',
  },
}));

vi.mock('../../../versions/v2/billing/services/usage.service.js', () => ({
  incrementBusinessUsageMetric: (...args) =>
    incrementBusinessUsageMetricMock(...args),
}));

vi.mock(
  '../../../versions/v2/billing/utils/limitedCreateOperation.util.js',
  () => ({
    prepareLimitedCreateOperation: (...args) =>
      prepareLimitedCreateOperationMock(...args),
  }),
);

import { createProduct } from './createProduct.js';

describe('createProduct', () => {
  beforeEach(() => {
    docRefs.clear();
    vi.clearAllMocks();

    const ids = ['product-id', 'batch-id', 'stock-id', 'movement-id'];
    nanoidMock.mockImplementation(() => ids.shift());
    serverTimestampMock.mockReturnValue({ __op: 'serverTimestamp' });
    prepareLimitedCreateOperationMock.mockResolvedValue({
      authUid: 'user-1',
      businessId: 'business-1',
      input: {
        businessID: 'business-1',
        name: 'Cafe',
        stock: '3',
      },
      metricKey: 'productsTotal',
      incrementBy: 1,
    });
    getDefaultWarehouseMock.mockResolvedValue({ id: 'warehouse-1' });
    getNextIDTransactionalMock.mockResolvedValue(77);
    incrementBusinessUsageMetricMock.mockResolvedValue({ ok: true });
    runTransactionMock.mockImplementation(async (callback) =>
      callback(transaction),
    );
  });

  it('uses the limited create preamble and keeps product inventory writes in one transaction', async () => {
    const request = {
      data: {
        product: {
          businessID: 'business-1',
          name: 'Cafe',
          stock: '3',
        },
      },
    };

    await expect(createProduct(request)).resolves.toEqual({
      ok: true,
      productId: 'product-id',
      businessId: 'business-1',
    });

    expect(prepareLimitedCreateOperationMock).toHaveBeenCalledWith({
      request,
      inputKey: 'product',
      operation: 'product.create',
      inputBusinessIdKeys: ['businessID'],
    });
    expect(getDefaultWarehouseMock).toHaveBeenCalledWith({
      uid: 'user-1',
      businessID: 'business-1',
    });
    expect(getNextIDTransactionalMock).toHaveBeenCalledWith(
      transaction,
      { uid: 'user-1', businessID: 'business-1' },
      'batches',
      1,
    );

    const writesByPath = Object.fromEntries(
      transactionSetMock.mock.calls.map(([ref, data]) => [ref.path, data]),
    );
    expect(Object.keys(writesByPath)).toEqual([
      'businesses/business-1/products/product-id',
      'businesses/business-1/batches/batch-id',
      'businesses/business-1/productsStock/stock-id',
      'businesses/business-1/movements/movement-id',
    ]);
    expect(writesByPath['businesses/business-1/products/product-id']).toEqual(
      expect.objectContaining({
        id: 'product-id',
        businessID: 'business-1',
        name: 'Cafe',
        stock: 3,
      }),
    );
    expect(writesByPath['businesses/business-1/batches/batch-id']).toEqual(
      expect.objectContaining({
        id: 'batch-id',
        productId: 'product-id',
        numberId: 77,
        quantity: 3,
        initialQuantity: 3,
        status: 'active',
      }),
    );
    expect(writesByPath['businesses/business-1/productsStock/stock-id']).toEqual(
      expect.objectContaining({
        id: 'stock-id',
        batchId: 'batch-id',
        productId: 'product-id',
        location: 'warehouse-1',
        quantity: 3,
        initialQuantity: 3,
      }),
    );
    expect(writesByPath['businesses/business-1/movements/movement-id']).toEqual(
      expect.objectContaining({
        id: 'movement-id',
        batchId: 'batch-id',
        productId: 'product-id',
        destinationLocation: 'warehouse-1',
        quantity: 3,
        movementType: 'in',
        movementReason: 'initial_stock',
      }),
    );
    expect(incrementBusinessUsageMetricMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      metricKey: 'productsTotal',
      incrementBy: 1,
      tx: transaction,
    });
  });
});
