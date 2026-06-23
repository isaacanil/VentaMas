import { describe, expect, it, vi } from 'vitest';

import {
  buildDgii608ValidationPreview,
  mapCreditNoteDocToDgii608Record,
  mapInvoiceDocToDgii608Record,
  resolveMonthlyPeriodRange,
} from './dgii608MonthlyReport.service.js';

const createQueryMock = (docs) => {
  const query = {
    where: vi.fn(),
    orderBy: vi.fn(),
    get: vi.fn(async () => ({ docs })),
  };

  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);

  return query;
};

const createFirestoreMock = ({ docsByCollectionPath }) => {
  const queries = Object.fromEntries(
    Object.entries(docsByCollectionPath).map(([collectionPath, docs]) => [
      collectionPath,
      createQueryMock(docs),
    ]),
  );

  return {
    collection: vi.fn((collectionPath) => {
      const query = queries[collectionPath];
      if (!query) {
        throw new Error(`Unexpected collection path: ${collectionPath}`);
      }
      return query;
    }),
    queries,
  };
};

describe('dgii608MonthlyReport.service', () => {
  it('normaliza factura anulada al shape del validador 608', () => {
    const result = mapInvoiceDocToDgii608Record({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      invoiceDoc: {
        data: {
          id: 'invoice-1',
          numberID: 15,
          NCF: 'B0100000015',
          voidedAt: {
            toDate: () => new Date('2026-04-20T13:20:00.000Z'),
          },
          voidReason: 'Cliente desistió',
          status: 'voided',
        },
      },
    });

    expect(result).toEqual({
      data: {
        NCF: 'B0100000015',
      },
      voidedAt: '2026-04-20T13:20:00.000Z',
      voidReason: 'Cliente desistió',
      voidReasonCode: '06',
      voidReasonLabel: 'Devolución de productos',
      voidReasonCatalogVersion: 'dgii-608-v1-2025',
      status: 'voided',
      documentNumber: '15',
      metadata: {
        recordId: 'invoice-1',
        sourcePath: 'businesses/business-1/invoices/invoice-1',
      },
    });
  });

  it('usa eNcf como número fiscal de facturas electrónicas anuladas en 608', () => {
    const result = mapInvoiceDocToDgii608Record({
      businessId: 'business-1',
      invoiceId: 'invoice-ecf-1',
      invoiceDoc: {
        data: {
          id: 'invoice-ecf-1',
          numberID: 16,
          eNcf: 'E310000000016',
          voidedAt: {
            toDate: () => new Date('2026-04-20T13:20:00.000Z'),
          },
          voidReason: 'Cliente desistió',
          status: 'voided',
        },
      },
    });

    expect(result.data.NCF).toBe('E310000000016');
  });

  it('usa eNcf como número fiscal de notas de crédito electrónicas anuladas en 608', () => {
    const result = mapCreditNoteDocToDgii608Record({
      businessId: 'business-1',
      creditNoteId: 'credit-note-ecf-1',
      creditNoteDoc: {
        id: 'credit-note-ecf-1',
        eNcf: 'E340000000016',
        createdAt: {
          toDate: () => new Date('2026-04-11T09:30:00.000Z'),
        },
        status: 'cancelled',
      },
    });

    expect(result.ncf).toBe('E340000000016');
  });

  it('normaliza nota de crédito anulada al shape del validador 608', () => {
    const result = mapCreditNoteDocToDgii608Record({
      businessId: 'business-1',
      creditNoteId: 'credit-note-1',
      creditNoteDoc: {
        id: 'credit-note-1',
        number: 'NC-2026-000009',
        ncf: 'B0400000009',
        createdAt: {
          toDate: () => new Date('2026-04-11T09:30:00.000Z'),
        },
        invoiceId: 'invoice-1',
        reason: 'Error en monto',
        status: 'cancelled',
      },
    });

    expect(result).toEqual({
      invoiceId: 'invoice-1',
      ncf: 'B0400000009',
      voidedAt: null,
      createdAt: '2026-04-11T09:30:00.000Z',
      status: 'cancelled',
      reason: 'Error en monto',
      voidReasonCode: '04',
      voidReasonLabel: 'Corrección de la información',
      voidReasonCatalogVersion: 'dgii-608-v1-2025',
      documentNumber: 'NC-2026-000009',
      metadata: {
        recordId: 'credit-note-1',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-1',
      },
    });
  });

  it('carga anulaciones del período y excluye estados no anulados', async () => {
    const { collection, queries } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/invoices': [
          {
            id: 'invoice-voided',
            data: () => ({
              data: {
                id: 'invoice-voided',
                numberID: 'INV-001',
                NCF: 'B0100000015',
                voidedAt: {
                  toDate: () => new Date('2026-04-20T13:20:00.000Z'),
                },
                voidReasonCode: '04',
                voidReason: 'Duplicada',
                status: 'voided',
              },
            }),
          },
          {
            id: 'invoice-completed',
            data: () => ({
              data: {
                id: 'invoice-completed',
                numberID: 'INV-002',
                NCF: 'B0100000016',
                voidedAt: {
                  toDate: () => new Date('2026-04-21T13:20:00.000Z'),
                },
                status: 'completed',
              },
            }),
          },
        ],
        'businesses/business-1/creditNotes': [
          {
            id: 'credit-note-cancelled',
            data: () => ({
              id: 'credit-note-cancelled',
              number: 'NC-2026-000001',
              ncf: 'B0400000001',
              createdAt: {
                toDate: () => new Date('2026-04-11T09:30:00.000Z'),
              },
              voidedAt: {
                toDate: () => new Date('2026-04-11T09:30:00.000Z'),
              },
              invoiceId: 'invoice-1',
              reason: 'Error en monto',
              reasonCode: '04',
              status: 'cancelled',
            }),
          },
          {
            id: 'credit-note-issued',
            data: () => ({
              id: 'credit-note-issued',
              number: 'NC-2026-000002',
              ncf: 'B0400000002',
              createdAt: {
                toDate: () => new Date('2026-04-13T09:30:00.000Z'),
              },
              invoiceId: 'invoice-2',
              reason: 'Ajuste',
              status: 'issued',
            }),
          },
        ],
      },
    });

    const result = await buildDgii608ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection },
    });

    expect(queries['businesses/business-1/invoices'].orderBy).toHaveBeenCalledWith(
      'voidedAt',
      'asc',
    );
    expect(queries['businesses/business-1/invoices'].orderBy).toHaveBeenCalledWith(
      'data.voidedAt',
      'asc',
    );
    expect(queries['businesses/business-1/invoices'].orderBy).toHaveBeenCalledWith(
      'data.cancel.cancelledAt',
      'asc',
    );
    expect(queries['businesses/business-1/creditNotes'].orderBy).toHaveBeenCalledWith(
      'voidedAt',
      'asc',
    );
    expect(queries['businesses/business-1/creditNotes'].orderBy).toHaveBeenCalledWith(
      'data.voidedAt',
      'asc',
    );
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.sourceSnapshots.invoices.recordsLoaded).toBe(1);
    expect(result.sourceSnapshots.creditNotes.recordsLoaded).toBe(1);
    expect(result.sourceRecords.invoices).toEqual([
      {
        index: 0,
        recordId: 'invoice-voided',
        sourcePath: 'businesses/business-1/invoices/invoice-voided',
        documentNumber: 'INV-001',
        documentFiscalNumber: 'B0100000015',
        invoiceId: null,
        voidedAt: '2026-04-20T13:20:00.000Z',
        issuedAt: '2026-04-20T13:20:00.000Z',
        createdAt: null,
        reason: 'Duplicada',
        reasonCode: '04',
        reasonLabel: 'Corrección de la información',
        status: 'voided',
      },
    ]);
    expect(result.sourceRecords.creditNotes).toEqual([
      {
        index: 0,
        recordId: 'credit-note-cancelled',
        sourcePath:
          'businesses/business-1/creditNotes/credit-note-cancelled',
        documentNumber: 'NC-2026-000001',
        documentFiscalNumber: 'B0400000001',
        invoiceId: 'invoice-1',
        voidedAt: '2026-04-11T09:30:00.000Z',
        issuedAt: '2026-04-11T09:30:00.000Z',
        createdAt: '2026-04-11T09:30:00.000Z',
        reason: 'Error en monto',
        reasonCode: '04',
        reasonLabel: 'Corrección de la información',
        status: 'cancelled',
      },
    ]);
  });

  it('usa fecha real de anulacion en notas de credito aunque hayan sido creadas en otro periodo', async () => {
    const { collection } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/invoices': [],
        'businesses/business-1/creditNotes': [
          {
            id: 'credit-note-may-void',
            data: () => ({
              id: 'credit-note-may-void',
              number: 'NC-2026-000010',
              ncf: 'B0400000010',
              createdAt: {
                toDate: () => new Date('2026-04-28T09:30:00.000Z'),
              },
              voidedAt: {
                toDate: () => new Date('2026-05-02T11:00:00.000Z'),
              },
              invoiceId: 'invoice-1',
              reasonCode: '04',
              status: 'cancelled',
            }),
          },
        ],
      },
    });

    const april = await buildDgii608ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection },
    });
    const may = await buildDgii608ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-05',
      firestore: { collection },
    });

    expect(april.sourceRecords.creditNotes).toEqual([]);
    expect(may.sourceRecords.creditNotes).toEqual([
      expect.objectContaining({
        recordId: 'credit-note-may-void',
        issuedAt: '2026-05-02T11:00:00.000Z',
        documentFiscalNumber: 'B0400000010',
      }),
    ]);
  });

  it('lee anulaciones guardadas en rutas root y data.voidedAt', async () => {
    const { collection, queries } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/invoices': [
          {
            id: 'invoice-root-voided',
            data: () => ({
              data: {
                id: 'invoice-root-voided',
                numberID: 'INV-ROOT',
                NCF: 'B0100000020',
                status: 'completed',
              },
              voidedAt: {
                toDate: () => new Date('2026-04-23T12:00:00.000Z'),
              },
              voidReasonCode: '04',
              status: 'voided',
            }),
          },
          {
            id: 'invoice-data-voided',
            data: () => ({
              data: {
                id: 'invoice-data-voided',
                numberID: 'INV-DATA',
                NCF: 'B0100000021',
                voidedAt: {
                  toDate: () => new Date('2026-04-24T12:00:00.000Z'),
                },
                voidReasonCode: '06',
                status: 'voided',
              },
            }),
          },
        ],
        'businesses/business-1/creditNotes': [],
      },
    });

    const result = await buildDgii608ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection },
    });

    expect(queries['businesses/business-1/invoices'].orderBy).toHaveBeenCalledWith(
      'data.voidedAt',
      'asc',
    );
    expect(result.sourceRecords.invoices).toEqual([
      expect.objectContaining({
        recordId: 'invoice-root-voided',
        issuedAt: '2026-04-23T12:00:00.000Z',
        documentFiscalNumber: 'B0100000020',
      }),
      expect.objectContaining({
        recordId: 'invoice-data-voided',
        issuedAt: '2026-04-24T12:00:00.000Z',
        documentFiscalNumber: 'B0100000021',
      }),
    ]);
  });

  it('incluye anulaciones legacy usando data.cancel.cancelledAt', async () => {
    const { collection, queries } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/invoices': [
          {
            id: 'invoice-voided',
            data: () => ({
              data: {
                id: 'invoice-voided',
                numberID: 'INV-001',
                NCF: 'B0100000015',
                voidedAt: null,
                cancel: {
                  cancelledAt: {
                    toDate: () => new Date('2026-04-22T12:00:00.000Z'),
                  },
                  reason: 'Cliente desistió',
                  reasonCode: '06',
                  reasonLabel: 'Devolución de productos',
                },
                status: 'cancelled',
              },
            }),
          },
        ],
        'businesses/business-1/creditNotes': [],
      },
    });

    const result = await buildDgii608ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection },
    });

    expect(queries['businesses/business-1/invoices'].orderBy).toHaveBeenCalledWith(
      'data.cancel.cancelledAt',
      'asc',
    );
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.sourceRecords.invoices).toEqual([
      {
        index: 0,
        recordId: 'invoice-voided',
        sourcePath: 'businesses/business-1/invoices/invoice-voided',
        documentNumber: 'INV-001',
        documentFiscalNumber: 'B0100000015',
        invoiceId: null,
        voidedAt: '2026-04-22T12:00:00.000Z',
        issuedAt: '2026-04-22T12:00:00.000Z',
        createdAt: null,
        reason: 'Cliente desistió',
        reasonCode: '06',
        reasonLabel: 'Devolución de productos',
        status: 'cancelled',
      },
    ]);
  });

  it('rechaza períodos inválidos antes de consultar Firestore', async () => {
    await expect(
      buildDgii608ValidationPreview({
        businessId: 'business-1',
        periodKey: '2026-13',
        firestore: createFirestoreMock({
          docsByCollectionPath: {
            'businesses/business-1/invoices': [],
            'businesses/business-1/creditNotes': [],
          },
        }),
      }),
    ).rejects.toThrow('Período mensual inválido: 2026-13');
  });

  it('resuelve el rango mensual con límite superior exclusivo', () => {
    expect(resolveMonthlyPeriodRange('2026-04')).toEqual({
      periodKey: '2026-04',
      start: new Date('2026-04-01T00:00:00.000Z'),
      endExclusive: new Date('2026-05-01T00:00:00.000Z'),
    });
  });
});
