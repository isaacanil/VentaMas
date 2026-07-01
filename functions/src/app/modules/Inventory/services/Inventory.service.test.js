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

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => dbDocMock(...args),
  },
  serverTimestamp: (...args) => serverTimestampMock(...args),
}));

vi.mock(
  '../../../versions/v2/accounting/utils/accountingRollout.util.js',
  () => ({
    isAccountingRolloutEnabledForBusiness: (...args) =>
      isAccountingRolloutEnabledForBusinessMock(...args),
  }),
);

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
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 5,
      },
    );
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

  it('consumes base inventory quantity from selected sale unit conversion', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 30,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 30,
        unitCost: 10,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      numberId: 'B-1',
      quantity: 30,
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
          selectedSaleUnit: {
            id: 'box-12',
            unitName: 'Caja',
            quantity: 12,
          },
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

    const productStockUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/productsStock/stock-1',
    );
    expect(productStockUpdate?.[1]).toMatchObject({
      quantity: 6,
      stock: 6,
    });

    const movementCall = tx.set.mock.calls.find(([ref]) =>
      ref.path.includes('/movements/'),
    );
    expect(movementCall?.[1]).toMatchObject({
      quantity: 24,
      requestedQuantity: 24,
      saleUnit: {
        saleUnitId: 'box-12',
        saleUnitName: 'Caja',
        saleQuantity: 2,
        conversionFactorToBase: 12,
      },
    });

    const accountingEventCall = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path ===
        'businesses/business-1/accountingEvents/inventory.cogs.recorded__invoice-1',
    );
    expect(accountingEventCall?.[1]).toMatchObject({
      monetary: {
        amount: 240,
        functionalAmount: 240,
      },
      payload: {
        lines: [
          expect.objectContaining({
            quantity: 24,
            totalCost: 240,
            saleUnit: expect.objectContaining({
              saleUnitId: 'box-12',
            }),
          }),
        ],
      },
    });
  });

  it('uses auto-resolved stock ids from inventory prereqs for movements and cogs', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 30,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 30,
        unitCost: 10,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      numberId: 'B-1',
      quantity: 30,
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
          prod: {
            id: 'product-1',
            name: 'Producto A',
            amountToBuy: 1,
            trackInventory: true,
            productStockId: 'stock-1',
            batchId: 'batch-1',
          },
          productSnap,
          productStockSnap,
          batchSnap,
        },
      ],
    });

    const movementCall = tx.set.mock.calls.find(([ref]) =>
      ref.path.includes('/movements/'),
    );
    expect(movementCall?.[1]).toMatchObject({
      productStockId: 'stock-1',
      batchId: 'batch-1',
      quantity: 1,
    });

    const accountingEventCall = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path ===
        'businesses/business-1/accountingEvents/inventory.cogs.recorded__invoice-1',
    );
    expect(accountingEventCall?.[1]).toMatchObject({
      payload: {
        lines: [
          expect.objectContaining({
            productStockId: 'stock-1',
            batchId: 'batch-1',
            quantity: 1,
          }),
        ],
      },
    });
  });

  it('accumulates repeated productStock consumption before writing the physical stock document', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 10,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 10,
        unitCost: 5,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      numberId: 'B-1',
      quantity: 10,
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
          amountToBuy: 4,
          trackInventory: true,
          productStockId: 'stock-1',
          batchId: 'batch-1',
          cid: 'line-a',
        },
        {
          id: 'product-1',
          name: 'Producto A',
          amountToBuy: 3,
          trackInventory: true,
          productStockId: 'stock-1',
          batchId: 'batch-1',
          cid: 'line-b',
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
        {
          index: 1,
          productSnap,
          productStockSnap,
          batchSnap,
        },
      ],
    });

    const productStockUpdates = tx.update.mock.calls.filter(
      ([ref]) => ref.path === 'businesses/business-1/productsStock/stock-1',
    );
    expect(productStockUpdates).toHaveLength(1);
    expect(productStockUpdates[0]?.[1]).toMatchObject({
      quantity: 3,
      stock: 3,
    });

    const productUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/products/product-1',
    );
    expect(productUpdate?.[1]).toMatchObject({
      stock: 3,
    });

    const batchUpdate = tx.update.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/batches/batch-1',
    );
    expect(batchUpdate?.[1]).toMatchObject({
      quantity: 3,
    });

    const movementCalls = tx.set.mock.calls.filter(([ref]) =>
      ref.path.includes('/movements/'),
    );
    expect(movementCalls).toHaveLength(2);
    expect(movementCalls.map(([, data]) => data.quantity)).toEqual([4, 3]);

    const accountingEventCall = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path ===
        'businesses/business-1/accountingEvents/inventory.cogs.recorded__invoice-1',
    );
    expect(accountingEventCall?.[1]).toMatchObject({
      monetary: {
        amount: 35,
        functionalAmount: 35,
      },
      payload: {
        lineCount: 2,
      },
    });
  });

  it('uses legacy productsStock.stock when quantity is missing and syncs product totals', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 7,
      },
    );
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
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 7,
      },
    );
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
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 1,
      },
    );
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
      ([ref]) =>
        ref.path ===
        'businesses/business-1/backOrders/backorder__invoice-1__line-0__product-1__stock-1__no-batch',
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
    expect(
      tx.set.mock.calls.some(([ref]) => ref.path.includes('/backorders/')),
    ).toBe(false);
  });

  it('rejects insufficient stock when restrictSaleWithoutStock is true without movement or backorder writes', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 1,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 1,
      },
    );

    await expect(
      adjustProductInventory(tx, {
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
            restrictSaleWithoutStock: true,
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
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('Stock insuficiente'),
    });

    expect(tx.set).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('allows restricted stock when available quantity is sufficient', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 10,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 10,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      numberId: 'B-1',
      quantity: 10,
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
          amountToBuy: 8,
          trackInventory: true,
          restrictSaleWithoutStock: true,
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
      quantity: 2,
      stock: 2,
    });
    expect(
      tx.set.mock.calls.some(([ref]) => ref.path.includes('/backOrders/')),
    ).toBe(false);
  });

  it('rejects restricted sale unit consumption using baseQuantity', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 20,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 20,
      },
    );

    await expect(
      adjustProductInventory(tx, {
        user: {
          businessID: 'business-1',
          uid: 'user-1',
        },
        products: [
          {
            id: 'product-1',
            name: 'Caja Producto A',
            amountToBuy: 2,
            selectedSaleUnit: {
              id: 'box-12',
              unitName: 'Caja',
              conversionFactorToBase: 12,
            },
            trackInventory: true,
            restrictSaleWithoutStock: true,
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
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('Stock insuficiente'),
    });

    expect(tx.set).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('rejects restricted weighted consumption using weight as base quantity', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/weighted-1',
      {
        stock: 2,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 2,
      },
    );

    await expect(
      adjustProductInventory(tx, {
        user: {
          businessID: 'business-1',
          uid: 'user-1',
        },
        products: [
          {
            id: 'weighted-1',
            name: 'Producto por peso',
            amountToBuy: 1,
            weightDetail: {
              isSoldByWeight: true,
              weight: 2.5,
            },
            trackInventory: true,
            restrictSaleWithoutStock: true,
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
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('Stock insuficiente'),
    });

    expect(tx.set).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('rejects unsupported weighted units before writing inventory side effects', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/weighted-1',
      {
        stock: 10,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 10,
      },
    );

    await expect(
      adjustProductInventory(tx, {
        user: {
          businessID: 'business-1',
          uid: 'user-1',
        },
        products: [
          {
            id: 'weighted-1',
            name: 'Producto por peso',
            amountToBuy: 1,
            weightDetail: {
              isSoldByWeight: true,
              weight: 2.5,
              weightUnit: 'unidad',
            },
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
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('Unidad de peso no soportada'),
    });

    expect(tx.set).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('does not duplicate movement, backorder, COGS or stock decrement on retry of the same invoice line', async () => {
    const tx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const productSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 1,
      },
    );
    const productStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 1,
        unitCost: 25,
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
          cid: 'line-a',
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
          batchSnap: null,
          movementSnap: { exists: true },
          backorderSnap: { exists: true },
          movementId:
            'movement__invoice-1__line-a__product-1__stock-1__no-batch',
          backorderId:
            'backorder__invoice-1__line-a__product-1__stock-1__no-batch',
        },
      ],
    });

    expect(tx.set).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('keeps transaction-retry concurrency safe: stock 10, cashier A sells 8, cashier B retry with stock 2 fails when restricted', async () => {
    const firstTx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const firstProductSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 10,
      },
    );
    const firstProductStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 10,
      },
    );
    const batchSnap = makeSnapshot('businesses/business-1/batches/batch-1', {
      numberId: 'B-1',
      quantity: 10,
    });

    await adjustProductInventory(firstTx, {
      user: {
        businessID: 'business-1',
        uid: 'cashier-a',
      },
      products: [
        {
          id: 'product-1',
          name: 'Producto A',
          amountToBuy: 8,
          trackInventory: true,
          restrictSaleWithoutStock: true,
          productStockId: 'stock-1',
          batchId: 'batch-1',
        },
      ],
      sale: {
        id: 'invoice-a',
      },
      accountingSettings: {
        generalAccountingEnabled: false,
      },
      inventoryPrevreqs: [
        {
          index: 0,
          productSnap: firstProductSnap,
          productStockSnap: firstProductStockSnap,
          batchSnap,
        },
      ],
    });

    const secondTx = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const secondProductSnap = makeSnapshot(
      'businesses/business-1/products/product-1',
      {
        stock: 2,
      },
    );
    const secondProductStockSnap = makeSnapshot(
      'businesses/business-1/productsStock/stock-1',
      {
        quantity: 2,
      },
    );

    await expect(
      adjustProductInventory(secondTx, {
        user: {
          businessID: 'business-1',
          uid: 'cashier-b',
        },
        products: [
          {
            id: 'product-1',
            name: 'Producto A',
            amountToBuy: 8,
            trackInventory: true,
            restrictSaleWithoutStock: true,
            productStockId: 'stock-1',
            batchId: 'batch-1',
          },
        ],
        sale: {
          id: 'invoice-b',
        },
        accountingSettings: {
          generalAccountingEnabled: false,
        },
        inventoryPrevreqs: [
          {
            index: 0,
            productSnap: secondProductSnap,
            productStockSnap: secondProductStockSnap,
            batchSnap,
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('Stock insuficiente'),
    });

    expect(secondTx.set).not.toHaveBeenCalled();
    expect(secondTx.update).not.toHaveBeenCalled();
  });
});
