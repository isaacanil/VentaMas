import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => ({ path }),
    collection: (path) => ({
      doc: (id) => ({
        id: id || 'application-1',
        path: `${path}/${id || 'application-1'}`,
        collection: (childPath) => ({
          doc: (childId) => ({
            id: childId || 'application-1',
            path: `${path}/${id || 'application-1'}/${childPath}/${childId || 'application-1'}`,
          }),
        }),
      }),
    }),
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

  it('rechaza consumir una nota electronica emitida pero aun pendiente fiscalmente', async () => {
    const tx = {
      get: vi.fn(async () =>
        snapshot({
          id: 'credit-note-1',
          status: 'issued',
          ncf: 'E340000000001',
          documentFormat: 'electronic',
          totalAmount: 118,
          availableAmount: 118,
          electronicTaxReceipt: {
            status: 'issued',
            dgiiValidationStatus: 'not_checked',
          },
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
    ).rejects.toThrow('no está aceptada fiscalmente');

    expect(tx.update).not.toHaveBeenCalled();
  });

  it('rechaza consumir una nota electronica emitida pero rechazada por DGII', async () => {
    const tx = {
      get: vi.fn(async () =>
        snapshot({
          id: 'credit-note-1',
          status: 'issued',
          ncf: 'E340000000001',
          documentFormat: 'electronic',
          totalAmount: 118,
          availableAmount: 118,
          electronicTaxReceipt: {
            status: 'rejected',
            dgiiValidationStatus: 'rejected',
          },
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
    ).rejects.toThrow('no está aceptada fiscalmente');

    expect(tx.update).not.toHaveBeenCalled();
  });

  it('permite consumir una nota electronica aceptada fiscalmente', async () => {
    const tx = {
      get: vi.fn(async () =>
        snapshot({
          id: 'credit-note-1',
          status: 'issued',
          ncf: 'E340000000001',
          documentFormat: 'electronic',
          totalAmount: 118,
          availableAmount: 118,
          electronicTaxReceipt: {
            status: 'accepted',
            dgiiValidationStatus: 'accepted',
          },
        }),
      ),
      update: vi.fn(),
      set: vi.fn(),
    };

    const result = await consumeCreditNotesTx(tx, {
      businessId: 'business-1',
      userId: 'user-1',
      invoiceId: 'invoice-1',
      creditNotes: [{ id: 'credit-note-1', amountUsed: 50 }],
      invoiceSnapshot: {
        snapshot: {
          ncf: { code: 'E310000000001' },
          numberID: 701,
          client: { id: 'client-1' },
        },
      },
    });

    expect(result.applicationIds).toEqual(['application-1']);
    expect(tx.update).toHaveBeenCalledWith(
      { path: 'businesses/business-1/creditNotes/credit-note-1' },
      expect.objectContaining({
        availableAmount: 68,
        status: 'applied',
      }),
    );
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/creditNoteApplications/application-1',
      }),
      expect.objectContaining({
        creditNoteId: 'credit-note-1',
        creditNoteNcf: 'E340000000001',
        amountApplied: 50,
      }),
    );
  });

  it('permite consumir una E34 aceptada aunque dgiiValidationStatus siga not_checked', async () => {
    const tx = {
      get: vi.fn(async () =>
        snapshot({
          id: 'credit-note-1',
          status: 'issued',
          ncf: 'E340000000001',
          documentFormat: 'electronic',
          totalAmount: 118,
          availableAmount: 118,
          electronicTaxReceipt: {
            status: 'accepted',
            dgiiStatus: 'accepted',
            requestStatus: 'accepted',
            dgiiValidationStatus: 'not_checked',
          },
        }),
      ),
      update: vi.fn(),
      set: vi.fn(),
    };

    const result = await consumeCreditNotesTx(tx, {
      businessId: 'business-1',
      userId: 'user-1',
      invoiceId: 'invoice-1',
      creditNotes: [{ id: 'credit-note-1', amountUsed: 50 }],
      invoiceSnapshot: {
        snapshot: {
          ncf: { code: 'E310000000001' },
          numberID: 701,
          client: { id: 'client-1' },
        },
      },
    });

    expect(result.applicationIds).toEqual(['application-1']);
    expect(tx.update).toHaveBeenCalledWith(
      { path: 'businesses/business-1/creditNotes/credit-note-1' },
      expect.objectContaining({
        availableAmount: 68,
        status: 'applied',
      }),
    );
  });
});
