import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionMock,
  dbMock,
  deleteDocMock,
  docMock,
  getDocMock,
  getDocsMock,
  nanoidMock,
  onSnapshotMock,
  setDocMock,
  updateDocMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  dbMock: {},
  deleteDocMock: vi.fn(),
  docMock: vi.fn(),
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  nanoidMock: vi.fn(),
  onSnapshotMock: vi.fn(),
  setDocMock: vi.fn(),
  updateDocMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
}));

vi.mock('nanoid', () => ({
  nanoid: (...args: unknown[]) => nanoidMock(...args),
}));

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: vi.fn(),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import {
  fbDeleteSaleUnit,
  fbUpsetSaleUnits,
} from './fbUpdateSaleUnit';

const existingDoc = (data: Record<string, unknown> = {}) => ({
  exists: () => true,
  data: () => data,
});

const missingDoc = {
  exists: () => false,
  data: () => undefined,
};

const saleUnitsSnapshot = (
  saleUnits: Array<{ id: string; data: Record<string, unknown> }>,
) => ({
  docs: saleUnits.map((saleUnit) => ({
    id: saleUnit.id,
    data: () => saleUnit.data,
  })),
});

describe('fbUpdateSaleUnit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock.mockReturnValue('generated-sale-unit-id');
    docMock.mockImplementation((_, ...segments: string[]) => ({
      id: segments.at(-1),
      path: segments.join('/'),
    }));
    collectionMock.mockImplementation((_, ...segments: string[]) => ({
      path: segments.join('/'),
    }));
  });

  it('creates a subcollection sale unit and syncs product.saleUnits cache', async () => {
    getDocMock
      .mockResolvedValueOnce(existingDoc({ saleUnits: [], saleUnitsCount: 0 }))
      .mockResolvedValueOnce(missingDoc);
    getDocsMock.mockResolvedValueOnce(
      saleUnitsSnapshot([
        {
          id: 'generated-sale-unit-id',
          data: { unitName: 'Caja', quantity: 12 },
        },
      ]),
    );

    await fbUpsetSaleUnits(
      { businessID: 'business-1' } as never,
      'product-1',
      { unitName: 'Caja', quantity: 12 },
    );

    expect(setDocMock).toHaveBeenCalledWith(
      {
        id: 'generated-sale-unit-id',
        path: 'businesses/business-1/products/product-1/saleUnits/generated-sale-unit-id',
      },
      expect.objectContaining({
        id: 'generated-sale-unit-id',
        unitName: 'Caja',
        quantity: 12,
      }),
    );
    expect(updateDocMock).toHaveBeenCalledWith(
      { id: 'product-1', path: 'businesses/business-1/products/product-1' },
      {
        saleUnits: [
          {
            id: 'generated-sale-unit-id',
            unitName: 'Caja',
            quantity: 12,
          },
        ],
        saleUnitsCount: 1,
      },
    );
  });

  it('deletes a subcollection sale unit and syncs an empty cache', async () => {
    getDocsMock.mockResolvedValueOnce(saleUnitsSnapshot([]));

    await fbDeleteSaleUnit(
      { businessID: 'business-1' } as never,
      'product-1',
      'box-12',
    );

    expect(deleteDocMock).toHaveBeenCalledWith({
      id: 'box-12',
      path: 'businesses/business-1/products/product-1/saleUnits/box-12',
    });
    expect(updateDocMock).toHaveBeenCalledWith(
      { id: 'product-1', path: 'businesses/business-1/products/product-1' },
      {
        saleUnits: [],
        saleUnitsCount: 0,
      },
    );
  });
});
