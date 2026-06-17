import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dbCollectionMock, dbDocMock } = vi.hoisted(() => ({
  dbCollectionMock: vi.fn(),
  dbDocMock: vi.fn(),
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
    collection: (...args) => dbCollectionMock(...args),
    doc: (...args) => dbDocMock(...args),
  },
}));

import { collectInventoryPrereqs } from './getInventory.service.js';

const refForPath = (path) => ({ path });

const queryForPath = (path) => {
  const queryRef = {
    path,
    type: 'query',
    constraints: [],
    where(field, op, value) {
      queryRef.constraints.push({ field, op, value });
      return queryRef;
    },
    limit(value) {
      queryRef.limitValue = value;
      return queryRef;
    },
  };
  return queryRef;
};

const readPath = (data, path) =>
  path.split('.').reduce((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return current[key];
  }, data);

const makeSnapshot = (path, data) => ({
  id: path.split('/').pop(),
  exists: data != null,
  ref: refForPath(path),
  data: () => data,
  get: (fieldPath) => readPath(data, fieldPath),
});

describe('collectInventoryPrereqs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbDocMock.mockImplementation((path) => refForPath(path));
    dbCollectionMock.mockImplementation((path) => queryForPath(path));
  });

  it('auto-resolves tracked inventory without cart stock ids using legacy stock quantity', async () => {
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 7,
        trackInventory: true,
        restrictSaleWithoutStock: false,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        productId: 'product-1',
        batchId: 'batch-1',
        stock: 7,
        isDeleted: false,
        status: 'active',
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      productId: 'product-1',
      quantity: 7,
    });

    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/products/product-1') {
          return productSnap;
        }
        if (
          ref.type === 'query' &&
          ref.path === 'businesses/business-1/productsStock'
        ) {
          return { docs: [productStockSnap] };
        }
        if (ref.path === 'businesses/business-1/batches/batch-1') {
          return batchSnap;
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
    };

    const prereqs = await collectInventoryPrereqs(tx, {
      user: { businessID: 'business-1', uid: 'user-1' },
      products: [
        {
          id: 'product-1',
          name: 'Producto A',
          amountToBuy: 1,
          trackInventory: true,
        },
      ],
    });

    expect(prereqs).toHaveLength(1);
    expect(prereqs[0]).toMatchObject({
      index: 0,
      productSnap,
      productStockSnap,
      batchSnap,
    });
    expect(prereqs[0].skipped).toBeUndefined();
  });

  it('resolves selected physical stock even when trackInventory is false', async () => {
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 7,
        trackInventory: null,
        restrictSaleWithoutStock: false,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        productId: 'product-1',
        batchId: 'batch-1',
        quantity: 7,
        isDeleted: false,
        status: 'active',
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      productId: 'product-1',
      quantity: 7,
    });

    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/products/product-1') {
          return productSnap;
        }
        if (ref.path === 'businesses/business-1/productsStock/stock-1') {
          return productStockSnap;
        }
        if (ref.path === 'businesses/business-1/batches/batch-1') {
          return batchSnap;
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
    };

    const prereqs = await collectInventoryPrereqs(tx, {
      user: { businessID: 'business-1', uid: 'user-1' },
      products: [
        {
          id: 'product-1',
          name: 'Producto A',
          amountToBuy: 1,
          trackInventory: false,
          productStockId: 'stock-1',
          batchId: 'batch-1',
        },
      ],
    });

    expect(prereqs).toHaveLength(1);
    expect(prereqs[0]).toMatchObject({
      index: 0,
      productSnap,
      productStockSnap,
      batchSnap,
    });
    expect(prereqs[0].skipped).toBeUndefined();
  });

  it('rejects stock records that belong to another product', async () => {
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 7,
        trackInventory: true,
        restrictSaleWithoutStock: false,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        productId: 'product-2',
        batchId: 'batch-1',
        quantity: 7,
        isDeleted: false,
        status: 'active',
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      productId: 'product-1',
      quantity: 7,
    });

    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/products/product-1') {
          return productSnap;
        }
        if (ref.path === 'businesses/business-1/productsStock/stock-1') {
          return productStockSnap;
        }
        if (ref.path === 'businesses/business-1/batches/batch-1') {
          return batchSnap;
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
    };

    await expect(
      collectInventoryPrereqs(tx, {
        user: { businessID: 'business-1', uid: 'user-1' },
        products: [
          {
            id: 'product-1',
            name: 'Producto A',
            amountToBuy: 1,
            trackInventory: true,
            productStockId: 'stock-1',
            batchId: 'batch-1',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'El stock stock-1 no pertenece al producto product-1.',
    });
  });
});
