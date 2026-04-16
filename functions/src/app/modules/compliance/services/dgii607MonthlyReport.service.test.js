import { describe, expect, it, vi } from 'vitest';

import {
  buildDgii607ValidationPreview,
  mapCreditNoteDocToDgii607Record,
  mapInvoiceDocToDgii607Record,
  resolveMonthlyPeriodRange,
} from './dgii607MonthlyReport.service.js';

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

const createDocSnap = (data) =>
  data
    ? {
        exists: true,
        data: () => data,
      }
    : {
        exists: false,
        data: () => null,
      };

const createFirestoreMock = ({
  docsByCollectionPath,
  docsByDocumentPath = {},
}) => {
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
    doc: vi.fn((documentPath) => ({
      id: documentPath.split('/').at(-1),
      path: documentPath,
      get: vi.fn(async () => createDocSnap(docsByDocumentPath[documentPath])),
    })),
    queries,
  };
};

describe('dgii607MonthlyReport.service', () => {
  it('normaliza una factura legacy al shape del validador 607', () => {
    const result = mapInvoiceDocToDgii607Record({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      invoiceDoc: {
        data: {
          id: 'invoice-1',
          numberID: 15,
          NCF: 'B01000000015',
          date: {
            toDate: () => new Date('2026-04-05T13:20:00.000Z'),
          },
          client: {
            id: 'client-1',
            rnc: '101010101',
          },
          totalPurchase: { value: 1180 },
          totalTaxes: { value: 180 },
          status: 'completed',
        },
      },
    });

    expect(result).toEqual({
      businessId: 'business-1',
      issuedAt: '2026-04-05T13:20:00.000Z',
      documentNumber: '15',
      counterparty: {
        id: 'client-1',
        identification: {
          number: '101010101',
        },
      },
      clientId: 'client-1',
      data: {
        NCF: 'B01000000015',
      },
      totals: {
        total: 1180,
        tax: 180,
      },
      status: 'completed',
      metadata: {
        recordId: 'invoice-1',
        sourcePath: 'businesses/business-1/invoices/invoice-1',
        issuedAtSource: '2026-04-05T13:20:00.000Z',
      },
    });
  });

  it('normaliza una nota de credito real al shape del validador 607', () => {
    const result = mapCreditNoteDocToDgii607Record({
      businessId: 'business-1',
      creditNoteId: 'credit-note-1',
      creditNoteDoc: {
        id: 'credit-note-1',
        numberID: 9,
        number: 'NC-2026-000009',
        ncf: 'B04000000009',
        createdAt: {
          toDate: () => new Date('2026-04-11T09:30:00.000Z'),
        },
        client: {
          id: 'client-1',
          rnc: '101010101',
        },
        totalAmount: 350,
        invoiceId: 'invoice-1',
        invoiceNcf: 'B01000000015',
        status: 'issued',
      },
    });

    expect(result).toEqual({
      businessId: 'business-1',
      issuedAt: '2026-04-11T09:30:00.000Z',
      createdAt: '2026-04-11T09:30:00.000Z',
      documentNumber: 'NC-2026-000009',
      invoiceId: 'invoice-1',
      counterparty: {
        id: 'client-1',
        identification: {
          number: '101010101',
        },
      },
      clientId: 'client-1',
      data: {
        NCF: 'B04000000009',
      },
      ncf: 'B04000000009',
      totals: {
        total: 350,
      },
      status: 'issued',
      metadata: {
        recordId: 'credit-note-1',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-1',
        issuedAtSource: '2026-04-11T09:30:00.000Z',
        invoiceId: 'invoice-1',
        invoiceNcf: 'B01000000015',
      },
    });
  });

  it('carga invoices y creditNotes del período, valida faltantes y resume fuentes', async () => {
    const { collection, queries, doc } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/invoices': [
          {
            id: 'invoice-1',
            data: () => ({
              data: {
                id: 'invoice-1',
                numberID: 'INV-001',
                NCF: '',
                date: {
                  toDate: () => new Date('2026-04-10T14:00:00.000Z'),
                },
                client: {
                  id: 'client-1',
                  personalID: '',
                },
                totalPurchase: { value: 1180 },
                totalTaxes: { value: 180 },
                status: 'completed',
              },
            }),
          },
        ],
        'businesses/business-1/creditNotes': [
          {
            id: 'credit-note-1',
            data: () => ({
              id: 'credit-note-1',
              number: 'NC-2026-000001',
              ncf: '',
              createdAt: {
                toDate: () => new Date('2026-04-12T10:00:00.000Z'),
              },
              client: {
                id: 'client-1',
              },
              totalAmount: null,
              invoiceId: '',
              status: 'issued',
            }),
          },
        ],
      },
    });

    const result = await buildDgii607ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection, doc },
    });

    expect(collection).toHaveBeenCalledWith('businesses/business-1/invoices');
    expect(collection).toHaveBeenCalledWith('businesses/business-1/creditNotes');
    expect(queries['businesses/business-1/invoices'].where).toHaveBeenCalledTimes(2);
    expect(queries['businesses/business-1/invoices'].orderBy).toHaveBeenCalledWith(
      'data.date',
      'asc',
    );
    expect(queries['businesses/business-1/creditNotes'].where).toHaveBeenCalledTimes(2);
    expect(queries['businesses/business-1/creditNotes'].orderBy).toHaveBeenCalledWith(
      'createdAt',
      'asc',
    );

    expect(result.ok).toBe(false);
    expect(result.periodKey).toBe('2026-04');
    expect(result.sourceSnapshots.invoices.recordsLoaded).toBe(1);
    expect(result.sourceSnapshots.creditNotes.recordsLoaded).toBe(1);
    expect(result.sourceSnapshots.linkedInvoices).toEqual({
      recordsRequested: 0,
      recordsResolved: 0,
      recordsMissing: 0,
    });
    expect(result.pendingGaps).toContain(
      'Las retenciones sufridas por terceros todavía no tienen una colección canónica dedicada en backend.',
    );
    expect(result.issues).toEqual([
      {
        sourceId: 'invoices',
        index: 0,
        fieldPath: 'counterparty.identification.number',
        code: 'missing-required-field',
        severity: 'error',
        recordId: 'invoice-1',
        sourcePath: 'businesses/business-1/invoices/invoice-1',
        documentNumber: 'INV-001',
        documentFiscalNumber: null,
      },
      {
        sourceId: 'invoices',
        index: 0,
        fieldPath: 'data.NCF',
        code: 'missing-required-field',
        severity: 'error',
        recordId: 'invoice-1',
        sourcePath: 'businesses/business-1/invoices/invoice-1',
        documentNumber: 'INV-001',
        documentFiscalNumber: null,
      },
      {
        sourceId: 'creditNotes',
        index: 0,
        fieldPath: 'invoiceId',
        code: 'missing-required-field',
        severity: 'error',
        recordId: 'credit-note-1',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-1',
        documentNumber: 'NC-2026-000001',
        documentFiscalNumber: null,
      },
      {
        sourceId: 'creditNotes',
        index: 0,
        fieldPath: 'ncf',
        code: 'missing-required-field',
        severity: 'error',
        recordId: 'credit-note-1',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-1',
        documentNumber: 'NC-2026-000001',
        documentFiscalNumber: null,
      },
      {
        sourceId: 'creditNotes',
        index: 0,
        fieldPath: 'totals.total',
        code: 'missing-required-field',
        severity: 'error',
        recordId: 'credit-note-1',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-1',
        documentNumber: 'NC-2026-000001',
        documentFiscalNumber: null,
      },
    ]);
    expect(result.sourceRecords.creditNotes).toEqual([
      {
        index: 0,
        recordId: 'credit-note-1',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-1',
        documentNumber: 'NC-2026-000001',
        documentFiscalNumber: null,
        invoiceId: null,
        invoiceNcf: null,
        issuedAt: '2026-04-12T10:00:00.000Z',
        status: 'issued',
      },
    ]);
    expect(result.issueSummary).toEqual({
      total: 5,
      bySeverity: { error: 5 },
      bySource: { invoices: 2, creditNotes: 3 },
      byCode: { 'missing-required-field': 5 },
    });
  });

  it('marca nota de credito con factura fuera de período y NCF referenciado inconsistente', async () => {
    const { collection, doc } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/invoices': [],
        'businesses/business-1/creditNotes': [
          {
            id: 'credit-note-1',
            data: () => ({
              id: 'credit-note-1',
              number: 'NC-2026-000002',
              ncf: 'B04000000002',
              createdAt: {
                toDate: () => new Date('2026-04-18T15:00:00.000Z'),
              },
              client: {
                id: 'client-1',
              },
              totalAmount: 500,
              invoiceId: 'invoice-prev',
              invoiceNcf: 'B01000000999',
              status: 'issued',
            }),
          },
        ],
      },
      docsByDocumentPath: {
        'businesses/business-1/invoices/invoice-prev': {
          data: {
            id: 'invoice-prev',
            numberID: 'INV-090',
            NCF: 'B01000000015',
            date: {
              toDate: () => new Date('2026-03-30T11:00:00.000Z'),
            },
            client: {
              id: 'client-1',
              rnc: '101010101',
            },
            totalPurchase: { value: 2500 },
            totalTaxes: { value: 381.36 },
            status: 'completed',
          },
        },
      },
    });

    const result = await buildDgii607ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection, doc },
    });

    expect(result.ok).toBe(false);
    expect(result.sourceSnapshots.linkedInvoices).toEqual({
      recordsRequested: 1,
      recordsResolved: 1,
      recordsMissing: 0,
    });
    expect(result.sourceRecords.linkedInvoices).toEqual([
      {
        invoiceId: 'invoice-prev',
        sourcePath: 'businesses/business-1/invoices/invoice-prev',
        documentNumber: 'INV-090',
        documentFiscalNumber: 'B01000000015',
        issuedAt: '2026-03-30T11:00:00.000Z',
      },
    ]);
    expect(result.issues).toEqual([
      {
        sourceId: 'creditNotes',
        index: 0,
        fieldPath: 'invoiceId',
        code: 'linked-invoice-out-of-period',
        severity: 'warning',
        linkedRecordId: 'invoice-prev',
        linkedSourcePath: 'businesses/business-1/invoices/invoice-prev',
        linkedPeriodKey: '2026-03',
        recordId: 'credit-note-1',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-1',
        documentNumber: 'NC-2026-000002',
        documentFiscalNumber: 'B04000000002',
      },
      {
        sourceId: 'creditNotes',
        index: 0,
        fieldPath: 'metadata.invoiceNcf',
        code: 'linked-invoice-ncf-mismatch',
        severity: 'error',
        linkedRecordId: 'invoice-prev',
        linkedSourcePath: 'businesses/business-1/invoices/invoice-prev',
        expectedValue: 'B01000000015',
        actualValue: 'B01000000999',
        recordId: 'credit-note-1',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-1',
        documentNumber: 'NC-2026-000002',
        documentFiscalNumber: 'B04000000002',
      },
    ]);
    expect(result.issueSummary).toEqual({
      total: 2,
      bySeverity: { warning: 1, error: 1 },
      bySource: { creditNotes: 2 },
      byCode: {
        'linked-invoice-out-of-period': 1,
        'linked-invoice-ncf-mismatch': 1,
      },
    });
  });

  it('excluye facturas y notas anuladas del dataset 607', async () => {
    const { collection, doc } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/invoices': [
          {
            id: 'invoice-active',
            data: () => ({
              data: {
                id: 'invoice-active',
                numberID: 'INV-001',
                NCF: 'B01000000015',
                date: {
                  toDate: () => new Date('2026-04-10T14:00:00.000Z'),
                },
                client: {
                  id: 'client-1',
                  rnc: '101010101',
                },
                totalPurchase: { value: 1180 },
                totalTaxes: { value: 180 },
                status: 'completed',
              },
            }),
          },
          {
            id: 'invoice-cancelled',
            data: () => ({
              data: {
                id: 'invoice-cancelled',
                numberID: 'INV-002',
                NCF: 'B01000000016',
                date: {
                  toDate: () => new Date('2026-04-11T14:00:00.000Z'),
                },
                client: {
                  id: 'client-1',
                  rnc: '101010101',
                },
                totalPurchase: { value: 500 },
                totalTaxes: { value: 76.27 },
                status: 'cancelled',
              },
            }),
          },
        ],
        'businesses/business-1/creditNotes': [
          {
            id: 'credit-note-issued',
            data: () => ({
              id: 'credit-note-issued',
              number: 'NC-2026-000001',
              ncf: 'B04000000001',
              createdAt: {
                toDate: () => new Date('2026-04-12T10:00:00.000Z'),
              },
              client: {
                id: 'client-1',
                rnc: '101010101',
              },
              totalAmount: 350,
              invoiceId: 'invoice-active',
              invoiceNcf: 'B01000000015',
              status: 'issued',
            }),
          },
          {
            id: 'credit-note-cancelled',
            data: () => ({
              id: 'credit-note-cancelled',
              number: 'NC-2026-000002',
              ncf: 'B04000000002',
              createdAt: {
                toDate: () => new Date('2026-04-13T10:00:00.000Z'),
              },
              client: {
                id: 'client-1',
                rnc: '101010101',
              },
              totalAmount: 90,
              invoiceId: 'invoice-active',
              invoiceNcf: 'B01000000015',
              status: 'cancelled',
            }),
          },
        ],
      },
      docsByDocumentPath: {
        'businesses/business-1/invoices/invoice-active': {
          data: {
            id: 'invoice-active',
            numberID: 'INV-001',
            NCF: 'B01000000015',
            date: {
              toDate: () => new Date('2026-04-10T14:00:00.000Z'),
            },
            client: {
              id: 'client-1',
              rnc: '101010101',
            },
            totalPurchase: { value: 1180 },
            totalTaxes: { value: 180 },
            status: 'completed',
          },
        },
      },
    });

    const result = await buildDgii607ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection, doc },
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.sourceSnapshots.invoices.recordsLoaded).toBe(1);
    expect(result.sourceSnapshots.invoices.recordsExcluded).toBe(1);
    expect(result.sourceSnapshots.creditNotes.recordsLoaded).toBe(1);
    expect(result.sourceSnapshots.creditNotes.recordsExcluded).toBe(1);
    expect(result.sourceRecords.invoices).toHaveLength(1);
    expect(result.sourceRecords.creditNotes).toHaveLength(1);
    expect(result.sourceRecords.excludedInvoices).toEqual([
      {
        index: 0,
        recordId: 'invoice-cancelled',
        sourcePath: 'businesses/business-1/invoices/invoice-cancelled',
        documentNumber: 'INV-002',
        documentFiscalNumber: 'B01000000016',
        invoiceId: null,
        invoiceNcf: null,
        issuedAt: '2026-04-11T14:00:00.000Z',
        status: 'cancelled',
      },
    ]);
    expect(result.sourceRecords.excludedCreditNotes).toEqual([
      {
        index: 0,
        recordId: 'credit-note-cancelled',
        sourcePath: 'businesses/business-1/creditNotes/credit-note-cancelled',
        documentNumber: 'NC-2026-000002',
        documentFiscalNumber: 'B04000000002',
        invoiceId: 'invoice-active',
        invoiceNcf: 'B01000000015',
        issuedAt: '2026-04-13T10:00:00.000Z',
        status: 'cancelled',
      },
    ]);
  });

  it('rechaza períodos inválidos antes de consultar Firestore', async () => {
    await expect(
      buildDgii607ValidationPreview({
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
