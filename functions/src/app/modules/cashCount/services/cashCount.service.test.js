import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {},
  arrayUnion: vi.fn((value) => ({ arrayUnion: value })),
}));

import { addBillToCashCountById } from './cashCount.service.js';

describe('addBillToCashCountById', () => {
  it('throws not-found before reading data from a missing cash count snapshot', async () => {
    const tx = {
      update: vi.fn(),
    };
    const cashCountSnap = {
      id: 'cash-missing',
      exists: false,
      ref: { id: 'cash-missing-ref' },
      data: vi.fn(() => {
        throw new Error('data should not be read');
      }),
    };

    await expect(
      addBillToCashCountById(
        tx,
        { uid: 'user-1', businessID: 'business-1' },
        { id: 'invoice-1', path: 'invoices/invoice-1' },
        cashCountSnap,
      ),
    ).rejects.toMatchObject({
      code: 'not-found',
      message: 'CashCount cash-missing no existe',
    });

    expect(cashCountSnap.data).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });
});
