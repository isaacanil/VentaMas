import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => ({ path }),
  },
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
}));

import { consumeCreditNotesTx } from './creditNotes.service.js';

const snapshot = (data) => ({
  exists: data != null,
  data: () => data,
});

describe('creditNotes.service', () => {
  it('rechaza consumir una nota de credito electronica pendiente', async () => {
    const tx = {
      get: vi.fn(async () =>
        snapshot({
          id: 'credit-note-1',
          status: 'electronic_pending',
          number: 'NC-2026-000001',
          totalAmount: 118,
          availableAmount: 118,
        }),
      ),
      update: vi.fn(),
      set: vi.fn(),
    };

    await expect(
      consumeCreditNotesTx(tx, {
        businessId: 'business-1',
        userId: 'user-1',
        invoiceId: 'invoice-1',
        creditNotes: [{ id: 'credit-note-1', amountUsed: 50 }],
      }),
    ).rejects.toThrow('no está emitida');

    expect(tx.update).not.toHaveBeenCalled();
  });

  it('rechaza consumir una nota emitida sin NCF o e-NCF', async () => {
    const tx = {
      get: vi.fn(async () =>
        snapshot({
          id: 'credit-note-1',
          status: 'issued',
          number: 'NC-2026-000001',
          totalAmount: 118,
          availableAmount: 118,
        }),
      ),
      update: vi.fn(),
      set: vi.fn(),
    };

    await expect(
      consumeCreditNotesTx(tx, {
        businessId: 'business-1',
        userId: 'user-1',
        invoiceId: 'invoice-1',
        creditNotes: [{ id: 'credit-note-1', amountUsed: 50 }],
      }),
    ).rejects.toThrow('no tiene NCF/e-NCF');

    expect(tx.update).not.toHaveBeenCalled();
  });
});
