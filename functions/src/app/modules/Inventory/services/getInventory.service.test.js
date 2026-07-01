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
      prod: {
        productStockId: 'stock-1',
        batchId: 'batch-1',
      },
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

  it('rejects restrictSaleWithoutStock true when no productStockId can be resolved', async () => {
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 0,
        trackInventory: true,
        restrictSaleWithoutStock: true,
      },
    );

    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/products/product-1') {
          return productSnap;
        }
        if (
          ref.type === 'query' &&
          ref.path === 'businesses/business-1/productsStock'
        ) {
          return { docs: [] };
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
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('requiere seleccionar una existencia'),
    });
  });

  it('rejects restrictSaleWithoutStock true when batchId is missing and cannot be resolved', async () => {
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 5,
        trackInventory: true,
        restrictSaleWithoutStock: true,
      },
    );

    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'businesses/business-1/products/product-1') {
          return productSnap;
        }
        if (
          ref.type === 'query' &&
          ref.path === 'businesses/business-1/productsStock'
        ) {
          return { docs: [] };
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
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('requiere seleccionar una existencia'),
    });
  });

  it('rejects restrictSaleWithoutStock true when selected stock is insufficient', async () => {
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 10,
        trackInventory: true,
        restrictSaleWithoutStock: true,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        productId: 'product-1',
        batchId: 'batch-1',
        quantity: 10,
        isDeleted: false,
        status: 'active',
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      productId: 'product-1',
      quantity: 10,
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
            amountToBuy: 12,
            trackInventory: true,
            productStockId: 'stock-1',
            batchId: 'batch-1',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('Stock insuficiente'),
    });
  });

  it('allows restrictSaleWithoutStock true when selected stock is sufficient', async () => {
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 10,
        trackInventory: true,
        restrictSaleWithoutStock: true,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        productId: 'product-1',
        batchId: 'batch-1',
        quantity: 10,
        isDeleted: false,
        status: 'active',
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      productId: 'product-1',
      quantity: 10,
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
          amountToBuy: 8,
          trackInventory: true,
          productStockId: 'stock-1',
          batchId: 'batch-1',
        },
      ],
    });

    expect(prereqs).toHaveLength(1);
    expect(prereqs[0]).toMatchObject({
      prod: {
        restrictSaleWithoutStock: true,
      },
      productStockSnap,
      batchSnap,
    });
  });

  it('pre-reads deterministic movement and backorder side effects when saleId is provided', async () => {
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 10,
        trackInventory: true,
        restrictSaleWithoutStock: false,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        productId: 'product-1',
        batchId: 'batch-1',
        quantity: 10,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      productId: 'product-1',
      quantity: 10,
    });
    const existingMovementSnap = makeSnapshot(
      'businesses/business-1/movements/movement__invoice-1__line-a__product-1__stock-1__batch-1',
      {
        saleId: 'invoice-1',
      },
    );
    const emptyBackorderSnap = makeSnapshot(
      'businesses/business-1/backOrders/backorder__invoice-1__line-a__product-1__stock-1__batch-1',
      null,
    );

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
        if (
          ref.path ===
          'businesses/business-1/movements/movement__invoice-1__line-a__product-1__stock-1__batch-1'
        ) {
          return existingMovementSnap;
        }
        if (
          ref.path ===
          'businesses/business-1/backOrders/backorder__invoice-1__line-a__product-1__stock-1__batch-1'
        ) {
          return emptyBackorderSnap;
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
    };

    const prereqs = await collectInventoryPrereqs(tx, {
      user: { businessID: 'business-1', uid: 'user-1' },
      saleId: 'invoice-1',
      products: [
        {
          id: 'product-1',
          name: 'Producto A',
          amountToBuy: 1,
          trackInventory: true,
          productStockId: 'stock-1',
          batchId: 'batch-1',
          cid: 'line-a',
        },
      ],
    });

    expect(prereqs[0]).toMatchObject({
      movementId: 'movement__invoice-1__line-a__product-1__stock-1__batch-1',
      backorderId:
        'backorder__invoice-1__line-a__product-1__stock-1__batch-1',
      movementSnap: existingMovementSnap,
      backorderSnap: emptyBackorderSnap,
    });
  });
});
