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

const defaultInvoiceDoc = () => ({
  data: {
    id: 'invoice-1',
    ncf: { code: 'E310000000001' },
    numberID: 701,
    client: { id: 'client-1', personalID: '132619201' },
    monetary: { documentCurrency: { code: 'DOP' } },
  },
});

const creditNoteDoc = (overrides = {}) => ({
  id: 'credit-note-1',
  invoiceId: 'invoice-1',
  client: { id: 'client-1', personalID: '132619201' },
  monetary: { documentCurrency: { code: 'DOP' } },
  ...overrides,
});

const txWithDocs = ({ invoice = defaultInvoiceDoc(), creditNote }) => {
  const docs = new Map([
    ['businesses/business-1/invoices/invoice-1', invoice],
    ['businesses/business-1/creditNotes/credit-note-1', creditNote],
  ]);

  return {
    get: vi.fn(async (ref) => snapshot(docs.get(ref.path) ?? null)),
    update: vi.fn(),
    set: vi.fn(),
  };
};

describe('creditNotes.service', () => {
  it('rechaza consumir una nota de credito electronica pendiente', async () => {
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
        status: 'electronic_pending',
        number: 'NC-2026-000001',
        totalAmount: 118,
        availableAmount: 118,
      }),
    });

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
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
        status: 'issued',
        number: 'NC-2026-000001',
        totalAmount: 118,
        availableAmount: 118,
      }),
    });

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
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
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
    });

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
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
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
    });

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
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
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
    });

    const result = await consumeCreditNotesTx(tx, {
      businessId: 'business-1',
      userId: 'user-1',
      invoiceId: 'invoice-1',
      creditNotes: [{ id: 'credit-note-1', amountUsed: 50 }],
      invoiceSnapshot: {
        snapshot: {
          ncf: { code: 'E310000009999' },
          numberID: 999,
          client: { id: 'client-hacker' },
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
        invoiceNcf: 'E310000000001',
        invoiceNumber: '701',
        clientId: 'client-1',
        amountApplied: 50,
      }),
    );
  });

  it('rechaza consumir una nota asociada a otra factura', async () => {
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
        invoiceId: 'invoice-2',
        status: 'issued',
        ncf: 'E340000000001',
        totalAmount: 118,
        availableAmount: 118,
      }),
    });

    await expect(
      consumeCreditNotesTx(tx, {
        businessId: 'business-1',
        userId: 'user-1',
        invoiceId: 'invoice-1',
        creditNotes: [{ id: 'credit-note-1', amountUsed: 50 }],
      }),
    ).rejects.toThrow('pertenece a otra factura');

    expect(tx.update).not.toHaveBeenCalled();
  });

  it('rechaza consumir una nota de credito de otro cliente', async () => {
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
        status: 'issued',
        ncf: 'E340000000001',
        client: { id: 'client-2', personalID: '999999999' },
        totalAmount: 118,
        availableAmount: 118,
      }),
    });

    await expect(
      consumeCreditNotesTx(tx, {
        businessId: 'business-1',
        userId: 'user-1',
        invoiceId: 'invoice-1',
        creditNotes: [{ id: 'credit-note-1', amountUsed: 50 }],
      }),
    ).rejects.toThrow('pertenece a otro cliente');

    expect(tx.update).not.toHaveBeenCalled();
  });

  it('rechaza consumir una nota de credito con moneda distinta', async () => {
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
        status: 'issued',
        ncf: 'E340000000001',
        monetary: { documentCurrency: { code: 'USD' } },
        totalAmount: 118,
        availableAmount: 118,
      }),
    });

    await expect(
      consumeCreditNotesTx(tx, {
        businessId: 'business-1',
        userId: 'user-1',
        invoiceId: 'invoice-1',
        creditNotes: [{ id: 'credit-note-1', amountUsed: 50 }],
      }),
    ).rejects.toThrow('moneda distinta');

    expect(tx.update).not.toHaveBeenCalled();
  });

  it('permite consumir una E34 aceptada aunque dgiiValidationStatus siga not_checked', async () => {
    const tx = txWithDocs({
      creditNote: creditNoteDoc({
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
    });

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
