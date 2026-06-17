import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WarehouseStructureData } from '@/domain/warehouse/warehouseStructure';
import type { InventoryUser } from '@/utils/inventory/types';

const {
  batchCommitMock,
  batchSetMock,
  docMock,
} = vi.hoisted(() => ({
  batchCommitMock: vi.fn(),
  batchSetMock: vi.fn(),
  docMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: (...args: unknown[]) => batchSetMock(...args),
    commit: (...args: unknown[]) => batchCommitMock(...args),
  })),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: { __name: 'db' },
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: vi.fn(),
}));

import { createStructureFromExisting } from './warehouseStructureService';

const FIXED_NOW = '2026-04-05T12:30:00.000Z';

const expectStructureSet = (
  callIndex: number,
  type: string,
  elementId: string,
  element: Record<string, unknown>,
) => {
  expect(batchSetMock).toHaveBeenNthCalledWith(
    callIndex,
    { path: `businesses/business-1/warehouseStructure/${type}` },
    {
      elements: {
        [elementId]: {
          ...element,
          updatedAt: FIXED_NOW,
          updatedBy: 'user-1',
          isDeleted: false,
        },
      },
    },
  );
};

describe('warehouseStructureService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_NOW));
    vi.clearAllMocks();

    batchCommitMock.mockResolvedValue(undefined);
    docMock.mockImplementation((...args: unknown[]) => ({
      path: args.slice(1).join('/'),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates structure documents with location paths for every warehouse level', async () => {
    const user: InventoryUser = {
      businessID: 'business-1',
      uid: 'user-1',
    };
    const structureData: WarehouseStructureData = {
      warehouses: [{ id: 'warehouse-1', name: 'Principal' }],
      shelves: [
        {
          id: 'shelf-1',
          name: 'Pasillo A',
          warehouseId: 'warehouse-1',
        },
      ],
      rows: [
        {
          id: 'row-1',
          name: 'Fila 1',
          warehouseId: 'warehouse-1',
          shelfId: 'shelf-1',
        },
      ],
      segments: [
        {
          id: 'segment-1',
          name: 'Segmento 1',
          warehouseId: 'warehouse-1',
          shelfId: 'shelf-1',
          rowShelfId: 'row-1',
        },
      ],
    };

    await expect(
      createStructureFromExisting(user, structureData),
    ).resolves.toBe(true);

    expectStructureSet(1, 'warehouses', 'warehouse-1', {
      id: 'warehouse-1',
      name: 'Principal',
      location: 'warehouse-1',
    });
    expectStructureSet(2, 'shelves', 'shelf-1', {
      id: 'shelf-1',
      name: 'Pasillo A',
      location: 'warehouse-1/shelf-1',
    });
    expectStructureSet(3, 'rows', 'row-1', {
      id: 'row-1',
      name: 'Fila 1',
      location: 'warehouse-1/shelf-1/row-1',
    });
    expectStructureSet(4, 'segments', 'segment-1', {
      id: 'segment-1',
      name: 'Segmento 1',
      location: 'warehouse-1/shelf-1/row-1/segment-1',
    });
    expect(batchCommitMock).toHaveBeenCalledTimes(1);
  });
});
