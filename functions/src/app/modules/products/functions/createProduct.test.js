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

  it('normalizes component-tracked combos without creating initial physical inventory', async () => {
    prepareLimitedCreateOperationMock.mockResolvedValue({
      authUid: 'user-1',
      businessId: 'business-1',
      input: {
        businessID: 'business-1',
        name: 'Combo desayuno',
        itemType: 'kit',
        stock: '8',
        combo: {
          inventoryPolicy: 'unknown-policy',
          components: [
            {
              id: 'line-1',
              idProduct: ' coffee ',
              name: '  Cafe  ',
              quantity: '2',
              unitName: 'Unidad',
              sku: 'CAF-1',
            },
            {
              id: 'line-duplicate',
              productId: 'coffee',
              productName: 'Cafe duplicado',
              quantity: '1.25',
            },
            { productId: 'milk', quantity: 0 },
            { productName: 'Sin producto', quantity: 1 },
            null,
          ],
        },
      },
      metricKey: 'productsTotal',
      incrementBy: 1,
    });

    await expect(createProduct({ data: {} })).resolves.toEqual({
      ok: true,
      productId: 'product-id',
      businessId: 'business-1',
    });

    const writesByPath = Object.fromEntries(
      transactionSetMock.mock.calls.map(([ref, data]) => [ref.path, data]),
    );

    expect(Object.keys(writesByPath)).toEqual([
      'businesses/business-1/products/product-id',
    ]);
    expect(writesByPath['businesses/business-1/products/product-id']).toEqual(
      expect.objectContaining({
        id: 'product-id',
        businessID: 'business-1',
        name: 'Combo desayuno',
        itemType: 'combo',
        stock: 0,
        combo: {
          enabled: true,
          inventoryPolicy: 'components',
          components: [
            {
              id: 'line-1',
              productId: 'coffee',
              productName: 'Cafe',
              quantity: 3.25,
              unitName: 'Unidad',
              sku: 'CAF-1',
            },
          ],
        },
      }),
    );
    expect(getNextIDTransactionalMock).not.toHaveBeenCalled();
    expect(getDefaultWarehouseMock).not.toHaveBeenCalled();
    expect(incrementBusinessUsageMetricMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      metricKey: 'productsTotal',
      incrementBy: 1,
      tx: transaction,
    });
  });

  it('normalizes services without creating initial physical inventory', async () => {
    prepareLimitedCreateOperationMock.mockResolvedValue({
      authUid: 'user-1',
      businessId: 'business-1',
      input: {
        businessID: 'business-1',
        name: 'Instalacion',
        itemType: 'servicio',
        stock: '8',
        trackInventory: true,
        restrictSaleWithoutStock: true,
        productStockId: 'stock-1',
        batchId: 'batch-1',
        saleUnits: [{ id: 'box' }],
        selectedSaleUnit: { id: 'box' },
        weightDetail: {
          isSoldByWeight: true,
          weight: 2,
          weightUnit: 'lb',
        },
        combo: {
          inventoryPolicy: 'components',
          components: [{ productId: 'coffee', quantity: 1 }],
        },
      },
      metricKey: 'productsTotal',
      incrementBy: 1,
    });

    await expect(createProduct({ data: {} })).resolves.toEqual({
      ok: true,
      productId: 'product-id',
      businessId: 'business-1',
    });

    const writesByPath = Object.fromEntries(
      transactionSetMock.mock.calls.map(([ref, data]) => [ref.path, data]),
    );

    expect(Object.keys(writesByPath)).toEqual([
      'businesses/business-1/products/product-id',
    ]);
    expect(writesByPath['businesses/business-1/products/product-id']).toEqual(
      expect.objectContaining({
        id: 'product-id',
        businessID: 'business-1',
        name: 'Instalacion',
        itemType: 'service',
        stock: 0,
        trackInventory: false,
        restrictSaleWithoutStock: false,
        totalUnits: null,
        packSize: 1,
        saleUnits: [],
        selectedSaleUnit: null,
        selectedSaleUnitId: null,
        productStockId: null,
        batchId: null,
        batchInfo: null,
        weightDetail: expect.objectContaining({ isSoldByWeight: false }),
        combo: null,
      }),
    );
    expect(getNextIDTransactionalMock).not.toHaveBeenCalled();
    expect(getDefaultWarehouseMock).not.toHaveBeenCalled();
    expect(incrementBusinessUsageMetricMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      metricKey: 'productsTotal',
      incrementBy: 1,
      tx: transaction,
    });
  });

  it('normalizes raw materials as inventory-only products with initial stock', async () => {
    prepareLimitedCreateOperationMock.mockResolvedValue({
      authUid: 'user-1',
      businessId: 'business-1',
      input: {
        businessID: 'business-1',
        name: 'Harina',
        itemType: 'product',
        inventoryRole: 'materia prima',
        isSellable: true,
        isVisible: true,
        stock: '12',
        trackInventory: false,
        restrictSaleWithoutStock: false,
        pricing: {
          cost: 40,
          price: 75,
          listPrice: 75,
        },
        saleUnits: [{ id: 'box' }],
        selectedSaleUnit: { id: 'box' },
        selectedSaleUnitId: 'box',
        qrcode: 'QR-RAW',
        barcode: 'BAR-RAW',
        weightDetail: { isSoldByWeight: true, weight: 1, weightUnit: 'lb' },
        warranty: { status: true, quantity: 1, unit: 'months' },
      },
      metricKey: 'productsTotal',
      incrementBy: 1,
    });

    await expect(createProduct({ data: {} })).resolves.toEqual({
      ok: true,
      productId: 'product-id',
      businessId: 'business-1',
    });

    const writesByPath = Object.fromEntries(
      transactionSetMock.mock.calls.map(([ref, data]) => [ref.path, data]),
    );

    expect(Object.keys(writesByPath)).toEqual([
      'businesses/business-1/products/product-id',
      'businesses/business-1/batches/batch-id',
      'businesses/business-1/productsStock/stock-id',
      'businesses/business-1/movements/movement-id',
    ]);
    const product = writesByPath['businesses/business-1/products/product-id'];
    expect(product).toEqual(
      expect.objectContaining({
        id: 'product-id',
        name: 'Harina',
        itemType: 'product',
        inventoryRole: 'raw_material',
        isSellable: false,
        isVisible: false,
        stock: 12,
        trackInventory: true,
        restrictSaleWithoutStock: true,
        saleUnits: [],
        selectedSaleUnit: null,
        selectedSaleUnitId: null,
        qrcode: '',
        barcode: '',
        warranty: { status: false, quantity: 1, unit: 'months' },
      }),
    );
    expect(product.weightDetail).toEqual(
      expect.objectContaining({ isSoldByWeight: false }),
    );
    expect(product.pricing).toEqual(
      expect.objectContaining({
        cost: 40,
        price: 0,
        listPrice: 0,
        avgPrice: 0,
        minPrice: 0,
        cardPrice: 0,
        offerPrice: 0,
      }),
    );
    expect(writesByPath['businesses/business-1/batches/batch-id']).toEqual(
      expect.objectContaining({
        productId: 'product-id',
        quantity: 12,
      }),
    );
  });

  it('rejects component-tracked combos without valid recipe components', async () => {
    prepareLimitedCreateOperationMock.mockResolvedValue({
      authUid: 'user-1',
      businessId: 'business-1',
      input: {
        businessID: 'business-1',
        name: 'Combo vacio',
        itemType: 'combo',
        combo: {
          inventoryPolicy: 'components',
          components: [{ productId: '', quantity: 1 }],
        },
      },
      metricKey: 'productsTotal',
      incrementBy: 1,
    });

    await expect(createProduct({ data: {} })).rejects.toMatchObject({
      code: 'invalid-argument',
      message:
        'Un combo por componentes requiere al menos un producto en la receta.',
    });
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('normalizes persisted product pricing so price follows listPrice', async () => {
    prepareLimitedCreateOperationMock.mockResolvedValue({
      authUid: 'user-1',
      businessId: 'business-1',
      input: {
        businessID: 'business-1',
        name: 'Cafe Premium',
        stock: '1',
        pricing: {
          price: 150,
          listPrice: 120,
          avgPrice: 140,
        },
        saleUnits: [
          {
            id: 'box-12',
            unitName: 'Caja',
            pricing: {
              price: 1300,
              listPrice: 1200,
            },
          },
        ],
      },
      metricKey: 'productsTotal',
      incrementBy: 1,
    });

    await expect(createProduct({ data: {} })).resolves.toEqual({
      ok: true,
      productId: 'product-id',
      businessId: 'business-1',
    });

    const writesByPath = Object.fromEntries(
      transactionSetMock.mock.calls.map(([ref, data]) => [ref.path, data]),
    );
    const product = writesByPath['businesses/business-1/products/product-id'];

    expect(product.pricing).toMatchObject({
      price: 120,
      listPrice: 120,
      avgPrice: 140,
    });
    expect(product.saleUnits[0].pricing).toMatchObject({
      price: 1200,
      listPrice: 1200,
    });
  });

  it('backfills legacy product listPrice from price on create', async () => {
    prepareLimitedCreateOperationMock.mockResolvedValue({
      authUid: 'user-1',
      businessId: 'business-1',
      input: {
        businessID: 'business-1',
        name: 'Cafe Legacy',
        stock: 1,
        pricing: {
          price: 95,
          listPrice: 0,
        },
      },
      metricKey: 'productsTotal',
      incrementBy: 1,
    });

    await createProduct({ data: {} });

    const writesByPath = Object.fromEntries(
      transactionSetMock.mock.calls.map(([ref, data]) => [ref.path, data]),
    );
    expect(
      writesByPath['businesses/business-1/products/product-id'].pricing,
    ).toMatchObject({
      price: 95,
      listPrice: 95,
    });
  });
});
