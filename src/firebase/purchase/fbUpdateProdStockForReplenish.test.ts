import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();
const incrementMock = vi.fn();
const updateDocMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  increment: (...args: unknown[]) => incrementMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: { __name: 'db' },
}));

import { fbUpdateProdStockForReplenish } from './fbUpdateProdStockForReplenish';

describe('fbUpdateProdStockForReplenish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docMock.mockImplementation((...args: unknown[]) => ({
      path: args.slice(1).join('/'),
    }));
    incrementMock.mockImplementation((value: unknown) => ({
      kind: 'increment',
      value,
    }));
    updateDocMock.mockResolvedValue(undefined);
  });

  it('increments the canonical product stock field', async () => {
    await fbUpdateProdStockForReplenish(
      {
        uid: 'user-1',
        businessID: 'business-1',
      },
      [
        {
          id: 'product-1',
          quantity: 3,
        },
      ],
    );

    expect(updateDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/products/product-1',
      }),
      {
        stock: {
          kind: 'increment',
          value: 3,
        },
      },
    );
    expect(updateDocMock.mock.calls[0][1]).not.toHaveProperty(
      'product.stock',
    );
  });
});
