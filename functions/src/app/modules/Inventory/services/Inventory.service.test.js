import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  dbDocMock,
  isAccountingRolloutEnabledForBusinessMock,
  serverTimestampMock,
} = vi.hoisted(() => ({
  dbDocMock: vi.fn(),
  isAccountingRolloutEnabledForBusinessMock: vi.fn(),
  serverTimestampMock: vi.fn(),
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
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'movement-1'),
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => dbDocMock(...args),
  },
  serverTimestamp: (...args) => serverTimestampMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

import { adjustProductInventory } from './Inventory.service.js';

const getRef = (path) => ({ path });

const readPath = (data, path) =>
  path.split('.').reduce((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return current[key];
  }, data);

const makeSnapshot = (path, data) => ({
  exists: data != null,
  ref: getRef(path),
  data: () => data,
  get: (fieldPath) => readPath(data, fieldPath),
});

describe('adjustProductInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbDocMock.mockImplementation((path) => getRef(path));
    serverTimestampMock.mockReturnValue(new Date('2026-04-13T10:00:00.000Z'));
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
  });

  it('emits an inventory COGS accounting event when consumed stock has unit cost', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot('businesses/business-1/products/product-1', {
      stock: 5,
    });
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 5,
        unitCost: 25,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      numberId: 'B-1',
      quantity: 5,
    });

    await adjustProductInventory(tx, {
      user: {
        businessID: 'business-1',
        uid: 'user-1',
      },
      products: [
        {
          id: 'product-1',
          name: 'Producto A',
          amountToBuy: 2,
          trackInventory: true,
          productStockId: 'stock-1',
          batchId: 'batch-1',
        },
      ],
      sale: {
        id: 'invoice-1',
      },
      accountingSettings: {
        generalAccountingEnabled: true,
        rolloutEnabled: true,
        functionalCurrency: 'DOP',
      },
      inventoryPrevreqs: [
        {
          index: 0,
          productSnap,
          productStockSnap,
          batchSnap,
        },
      ],
    });

    const accountingEventCall = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path ===
        'businesses/business-1/accountingEvents/inventory.cogs.recorded__invoice-1',
    );

    expect(tx.get).not.toHaveBeenCalled();
    expect(accountingEventCall).toBeTruthy();
    expect(accountingEventCall[1]).toMatchObject({
      eventType: 'inventory.cogs.recorded',
      monetary: {
        amount: 50,
        functionalAmount: 50,
      },
      payload: {
        documentNature: 'inventory',
        lineCount: 1,
        lines: [
          expect.objectContaining({
            productId: 'product-1',
            quantity: 2,
            unitCost: 25,
            totalCost: 50,
          }),
        ],
      },
    });
  });

  it('uses legacy productsStock.stock when quantity is missing and syncs product totals', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot('businesses/business-1/products/product-1', {
      stock: 7,
    });
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        stock: 7,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      numberId: 'B-1',
      quantity: 7,
    });

    await adjustProductInventory(tx, {
      user: {
        businessID: 'business-1',
        uid: 'user-1',
      },
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
      sale: {
        id: 'invoice-1',
      },
      accountingSettings: {
        generalAccountingEnabled: false,
      },
      inventoryPrevreqs: [
        {
          index: 0,
          productSnap,
          productStockSnap,
          batchSnap,
        },
      ],
    });

    const productStockUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/productsStock/stock-1',
    );
    expect(productStockUpdate?.[1]).toMatchObject({
      quantity: 6,
      stock: 6,
    });

    const productUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/products/product-1',
    );
    expect(productUpdate?.[1]).toMatchObject({
      stock: 6,
    });

    const batchUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/batches/batch-1',
    );
    expect(batchUpdate?.[1]).toMatchObject({
      quantity: 6,
    });

    expect(
      tx.set.mock.calls.some(([ref]) => ref.path.includes('/backOrders/')),
    ).toBe(false);
  });

  it('adjusts selected physical stock even when trackInventory is false', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot('businesses/business-1/products/product-1', {
      stock: 7,
    });
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        productId: 'product-1',
        batchId: 'batch-1',
        quantity: 7,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      productId: 'product-1',
      numberId: 'B-1',
      quantity: 7,
    });

    await adjustProductInventory(tx, {
      user: {
        businessID: 'business-1',
        uid: 'user-1',
      },
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
      sale: {
        id: 'invoice-1',
      },
      accountingSettings: {
        generalAccountingEnabled: false,
      },
      inventoryPrevreqs: [
        {
          index: 0,
          productSnap,
          productStockSnap,
          batchSnap,
        },
      ],
    });

    const productStockUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/productsStock/stock-1',
    );
    expect(productStockUpdate?.[1]).toMatchObject({
      quantity: 6,
      stock: 6,
    });

    const productUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/products/product-1',
    );
    expect(productUpdate?.[1]).toMatchObject({
      stock: 6,
    });

    const batchUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/batches/batch-1',
    );
    expect(batchUpdate?.[1]).toMatchObject({
      quantity: 6,
    });
  });

  it('writes insufficient inventory reservations to the canonical backOrders collection', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot('businesses/business-1/products/product-1', {
      stock: 1,
    });
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 1,
      },
    );

    await adjustProductInventory(tx, {
      user: {
        businessID: 'business-1',
        uid: 'user-1',
      },
      products: [
        {
          id: 'product-1',
          name: 'Producto A',
          amountToBuy: 3,
          trackInventory: true,
          productStockId: 'stock-1',
        },
      ],
      sale: {
        id: 'invoice-1',
      },
      accountingSettings: {
        generalAccountingEnabled: false,
      },
      inventoryPrevreqs: [
        {
          index: 0,
          productSnap,
          productStockSnap,
          batchSnap: null,
        },
      ],
    });

    const backOrderCall = tx.set.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/backOrders/movement-1',
    );

    expect(backOrderCall).toBeTruthy();
    expect(backOrderCall[1]).toMatchObject({
      productId: 'product-1',
      productStockId: 'stock-1',
      saleId: 'invoice-1',
      initialQuantity: 2,
      pendingQuantity: 2,
      status: 'pending',
    });
    expect(tx.set.mock.calls.some(([ref]) => ref.path.includes('/backorders/'))).toBe(
      false,
    );
  });
});
