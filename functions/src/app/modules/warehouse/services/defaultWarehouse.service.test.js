import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    collection: vi.fn(),
  },
  FieldValue: {
    serverTimestamp: vi.fn(() => 'server-timestamp'),
  },
}));

vi.mock('../../../core/utils/getNextID.js', () => ({
  getNextID: vi.fn(),
}));

import { db, FieldValue } from '../../../core/config/firebase.js';
import { getNextID } from '../../../core/utils/getNextID.js';
import {
  ensureDefaultWarehouse,
  getDefaultWarehouse,
} from './defaultWarehouse.service.js';

const emptySnapshot = () => ({
  empty: true,
  docs: [],
});

const snapshot = (docs) => ({
  empty: docs.length === 0,
  docs,
});

const warehouseDoc = (id, data) => ({
  id,
  data: vi.fn(() => data),
  ref: {
    update: vi.fn(async () => undefined),
  },
});

const buildFirestoreHarness = () => {
  const getQueue = [];
  const newWarehouseRef = {
    id: 'new-warehouse-id',
    set: vi.fn(async () => undefined),
  };
  const warehousesCollection = {
    where: vi.fn(() => ({
      limit: vi.fn(() => ({
        get: vi.fn(async () => getQueue.shift() || emptySnapshot()),
      })),
    })),
    limit: vi.fn(() => ({
      get: vi.fn(async () => getQueue.shift() || emptySnapshot()),
    })),
    doc: vi.fn(() => newWarehouseRef),
  };
  const businessDocRef = {
    collection: vi.fn(() => warehousesCollection),
  };
  const businessesCollection = {
    doc: vi.fn(() => businessDocRef),
  };

  db.collection.mockReturnValue(businessesCollection);

  return {
    businessesCollection,
    getQueue,
    newWarehouseRef,
    warehousesCollection,
  };
};

describe('defaultWarehouse.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FieldValue.serverTimestamp.mockReturnValue('server-timestamp');
    getNextID.mockResolvedValue(42);
  });

  it('returns the explicit default warehouse and normalizes missing isDeleted', async () => {
    const harness = buildFirestoreHarness();
    const defaultDoc = warehouseDoc('warehouse-1', {
      name: 'Principal',
      defaultWarehouse: true,
    });
    harness.getQueue.push(snapshot([defaultDoc]));

    const result = await getDefaultWarehouse({
      businessID: 'business-1',
      uid: 'user-1',
    });

    expect(db.collection).toHaveBeenCalledWith('businesses');
    expect(harness.businessesCollection.doc).toHaveBeenCalledWith('business-1');
    expect(harness.warehousesCollection.where).toHaveBeenCalledWith(
      'defaultWarehouse',
      '==',
      true,
    );
    expect(defaultDoc.ref.update).toHaveBeenCalledWith({
      isDeleted: false,
      updatedAt: 'server-timestamp',
      updatedBy: 'user-1',
    });
    expect(result).toEqual({
      id: 'warehouse-1',
      name: 'Principal',
      defaultWarehouse: true,
      isDeleted: false,
    });
  });

  it('falls back to the first active warehouse when no explicit default exists', async () => {
    const harness = buildFirestoreHarness();
    const activeDoc = warehouseDoc('warehouse-2', {
      name: 'Activo',
      isDeleted: false,
    });
    harness.getQueue.push(emptySnapshot(), snapshot([activeDoc]));

    const result = await getDefaultWarehouse({
      businessID: 'business-1',
      uid: 'user-1',
    });

    expect(harness.warehousesCollection.where).toHaveBeenNthCalledWith(
      2,
      'isDeleted',
      '==',
      false,
    );
    expect(result).toEqual({
      id: 'warehouse-2',
      name: 'Activo',
      isDeleted: false,
    });
  });

  it('creates the virtual default warehouse when no warehouse exists', async () => {
    const harness = buildFirestoreHarness();
    const user = {
      businessID: 'business-1',
      uid: 'user-1',
    };
    harness.getQueue.push(emptySnapshot(), emptySnapshot(), emptySnapshot());

    const result = await ensureDefaultWarehouse(user);

    expect(getNextID).toHaveBeenCalledWith(user, 'lastWarehouseId');
    expect(harness.newWarehouseRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-warehouse-id',
        shortName: 'Virtual',
        number: 42,
        owner: 'user-1',
        location: 'default',
        defaultWarehouse: true,
        isDeleted: false,
        createdAt: 'server-timestamp',
        createdBy: 'user-1',
        updatedAt: 'server-timestamp',
        updatedBy: 'user-1',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'new-warehouse-id',
        shortName: 'Virtual',
        number: 42,
        defaultWarehouse: true,
        isDeleted: false,
      }),
    );
  });
});
