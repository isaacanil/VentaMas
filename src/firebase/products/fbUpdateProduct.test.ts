import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dbMock, docMock, updateDocMock } = vi.hoisted(() => ({
  dbMock: {},
  docMock: vi.fn(),
  updateDocMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import { fbUpdateProduct } from './fbUpdateProduct';

describe('fbUpdateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docMock.mockReturnValue({ path: 'businesses/business-1/products/product-1' });
  });

  it('normalizes product pricing before updating the master product', async () => {
    await fbUpdateProduct(
      {
        id: 'product-1',
        name: 'Producto',
        pricing: {
          price: 150,
          listPrice: 120,
        },
      } as never,
      { businessID: 'business-1' } as never,
    );

    expect(docMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'products',
      'product-1',
    );
    expect(updateDocMock).toHaveBeenCalledWith(
      { path: 'businesses/business-1/products/product-1' },
      expect.objectContaining({
        pricing: expect.objectContaining({
          price: 120,
          listPrice: 120,
        }),
      }),
    );
  });

  it('backfills legacy listPrice from price before updating', async () => {
    await fbUpdateProduct(
      {
        id: 'product-1',
        name: 'Producto',
        pricing: {
          price: 95,
          listPrice: 0,
        },
      } as never,
      { businessID: 'business-1' } as never,
    );

    expect(updateDocMock).toHaveBeenCalledWith(
      { path: 'businesses/business-1/products/product-1' },
      expect.objectContaining({
        pricing: expect.objectContaining({
          price: 95,
          listPrice: 95,
        }),
      }),
    );
  });
});
