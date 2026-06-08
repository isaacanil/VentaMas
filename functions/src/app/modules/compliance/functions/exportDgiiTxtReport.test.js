import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  resolveCallableAuthUidMock,
  collectionDocsByPath,
  businessDocGetMock,
  MockHttpsError,
} = vi.hoisted(() => {
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedCollectionDocsByPath = new Map();
  const hoistedBusinessDocGetMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    collectionDocsByPath: hoistedCollectionDocsByPath,
    businessDocGetMock: hoistedBusinessDocGetMock,
    MockHttpsError: HoistedHttpsError,
  };
});

const createQueryMock = (docs) => {
  const query = {
    where: vi.fn(),
    orderBy: vi.fn(),
    get: vi.fn(async () => ({
      docs,
      size: docs.length,
    })),
  };

  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);

  return query;
};

const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const getCollectionDocs = (path) => collectionDocsByPath.get(path) ?? [];

const getDocData = (doc) => (typeof doc?.data === 'function' ? doc.data() : {});

const resolvePaymentFormCode = (methods = []) => {
  const method = methods.find((entry) => Number(entry?.amount ?? 0) > 0);
  const type = String(method?.method ?? method?.type ?? '').toLowerCase();
  if (['cash', 'efectivo'].includes(type)) return '01';
  if (['transfer', 'transferencia', 'check', 'cheque'].includes(type)) {
    return '02';
  }
  if (['card', 'credit_card', 'debit_card'].includes(type)) return '03';
  return '07';
};

const build606Snapshot = () => {
  const payments = getCollectionDocs(
    'businesses/business-1/accountsPayablePayments',
  ).map((doc) => ({ id: doc.id, ...getDocData(doc) }));
  const paymentByPurchaseId = new Map(
    payments.map((payment) => [payment.purchaseId, payment]),
  );

  const purchases = getCollectionDocs('businesses/business-1/purchases').map(
    (doc, index) => {
      const data = getDocData(doc);
      const payment = paymentByPurchaseId.get(doc.id) ?? null;
      const total = Number(data?.totals?.total ?? data?.totalAmount ?? 0);
      const itbis = Number(data?.taxBreakdown?.itbisTotal ?? 0);
      const base = Math.max(0, total - itbis);
      const documentType = data?.documentType ?? 'goods';
      const isService = documentType === 'service' || documentType === 'expense';

      return {
        index,
        recordId: doc.id,
        sourcePath: `businesses/business-1/purchases/${doc.id}`,
        documentNumber: data?.numberId ?? data?.number ?? null,
        documentFiscalNumber: data?.taxReceipt?.ncf ?? null,
        supplierId: data?.supplierId ?? data?.providerId ?? null,
        counterpartyIdentificationNumber:
          data?.supplier?.rnc ??
          data?.provider?.rnc ??
          data?.supplier?.personalID ??
          data?.provider?.personalID ??
          null,
        documentType,
        expenseType: data?.classification?.dgii606ExpenseType ?? null,
        total,
        itbisTotal: itbis,
        issuedAt: toIsoString(data?.completedAt),
        paymentAt: toIsoString(payment?.occurredAt),
        paymentFormCode:
          resolvePaymentFormCode(payment?.paymentMethods) ||
          resolvePaymentFormCode(data?.paymentMethods),
        serviceAmount: isService ? base : 0,
        goodsAmount: isService ? 0 : base,
        status: data?.status ?? data?.workflowStatus ?? null,
      };
    },
  );

  const expenses = getCollectionDocs('businesses/business-1/expenses').map(
    (doc, index) => {
      const data = getDocData(doc);
      const total = Number(data?.totals?.total ?? data?.amount ?? 0);
      const itbis = Number(data?.taxBreakdown?.itbisTotal ?? 0);
      const base = Math.max(0, total - itbis);

      return {
        index,
        recordId: doc.id,
        sourcePath: `businesses/business-1/expenses/${doc.id}`,
        documentNumber: data?.number ?? null,
        documentFiscalNumber: data?.taxReceipt?.ncf ?? null,
        supplierId: data?.supplierId ?? data?.providerId ?? null,
        counterpartyIdentificationNumber:
          data?.supplier?.rnc ??
          data?.provider?.rnc ??
          data?.supplier?.personalID ??
          data?.provider?.personalID ??
          null,
        documentType: data?.documentType ?? 'expense',
        expenseType:
          data?.classification?.dgii606ExpenseType ?? data?.expenseType ?? null,
        total,
        itbisTotal: itbis,
        issuedAt: toIsoString(data?.expenseDate),
        paymentAt: toIsoString(data?.paymentAt),
        paymentFormCode: resolvePaymentFormCode(data?.paymentMethods),
        serviceAmount: base,
        goodsAmount: 0,
        status: data?.status ?? null,
      };
    },
  );

  return { purchases, expenses, accountsPayablePayments: [] };
};

const build607Snapshot = () => {
  const withholdings = getCollectionDocs(
    'businesses/business-1/salesThirdPartyWithholdings',
  ).map((doc) => ({ id: doc.id, ...getDocData(doc) }));
  const withholdingsByInvoiceId = new Map(
    withholdings.map((withholding) => [withholding.invoiceId, withholding]),
  );

  const invoices = getCollectionDocs('businesses/business-1/invoices').map(
    (doc, index) => {
      const data = getDocData(doc)?.data ?? {};
      const withholding = withholdingsByInvoiceId.get(doc.id) ?? null;

      return {
        index,
        recordId: doc.id,
        sourcePath: `businesses/business-1/invoices/${doc.id}`,
        documentNumber: data?.numberID ?? null,
        documentFiscalNumber: data?.NCF ?? null,
        counterpartyIdentificationNumber:
          data?.client?.rnc ?? data?.client?.personalID ?? null,
        issuedAt: toIsoString(data?.date),
        retentionDate: toIsoString(withholding?.retentionDate),
        total: Number(data?.totalPurchase?.value ?? 0),
        itbisTotal: Number(data?.totalTaxes?.value ?? 0),
        itbisWithheld: Number(withholding?.itbisWithheld ?? 0),
        incomeTaxWithheld: Number(withholding?.incomeTaxWithheld ?? 0),
        status: data?.status ?? null,
      };
    },
  );

  const creditNotes = getCollectionDocs('businesses/business-1/creditNotes').map(
    (doc, index) => {
      const data = getDocData(doc);

      return {
        index,
        recordId: doc.id,
        sourcePath: `businesses/business-1/creditNotes/${doc.id}`,
        documentNumber: data?.number ?? null,
        documentFiscalNumber: data?.ncf ?? null,
        counterpartyIdentificationNumber:
          data?.client?.rnc ?? data?.client?.personalID ?? null,
        invoiceId: data?.invoiceId ?? null,
        invoiceNcf: data?.invoiceNcf ?? null,
        issuedAt: toIsoString(data?.createdAt),
        total: Number(data?.totalAmount ?? 0),
        itbisTotal: Number(data?.taxAmount ?? 0),
        status: data?.status ?? null,
      };
    },
  );

  return {
    invoices,
    creditNotes,
    thirdPartyWithholdings: [],
    mergedThirdPartyWithholdings: withholdings,
  };
};

const build608Snapshot = () => {
  const invoices = getCollectionDocs('businesses/business-1/invoices').map(
    (doc, index) => {
      const data = getDocData(doc)?.data ?? {};

      return {
        index,
        recordId: doc.id,
        sourcePath: `businesses/business-1/invoices/${doc.id}`,
        documentNumber: data?.numberID ?? null,
        documentFiscalNumber: data?.NCF ?? null,
        voidedAt: toIsoString(data?.voidedAt),
        issuedAt: toIsoString(data?.voidedAt),
        reasonCode: data?.voidReasonCode ?? null,
        reasonLabel: data?.voidReasonLabel ?? null,
        status: data?.status ?? null,
      };
    },
  );

  const creditNotes = getCollectionDocs('businesses/business-1/creditNotes').map(
    (doc, index) => {
      const data = getDocData(doc);

      return {
        index,
        recordId: doc.id,
        sourcePath: `businesses/business-1/creditNotes/${doc.id}`,
        documentNumber: data?.number ?? null,
        documentFiscalNumber: data?.ncf ?? null,
        invoiceId: data?.invoiceId ?? null,
        voidedAt: toIsoString(data?.voidedAt),
        issuedAt: toIsoString(data?.voidedAt),
        createdAt: toIsoString(data?.createdAt),
        reason: data?.reason ?? null,
        reasonCode: data?.reasonCode ?? null,
        reasonLabel: data?.reasonLabel ?? null,
        status: data?.status ?? null,
      };
    },
  );

  return { invoices, creditNotes };
};

const buildSourceRecordsForReport = (reportCode) => {
  if (reportCode === 'DGII_606') return build606Snapshot();
  if (reportCode === 'DGII_607') return build607Snapshot();
  if (reportCode === 'DGII_608') return build608Snapshot();
  return {};
};

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    collection: vi.fn((collectionPath) => {
      const docs = collectionDocsByPath.get(collectionPath);
      if (!docs) {
        throw new Error(`Unexpected collection path: ${collectionPath}`);
      }
      return createQueryMock(docs);
    }),
    doc: vi.fn((documentPath) => ({
      id: documentPath.split('/').at(-1),
      path: documentPath,
      get: (...args) => businessDocGetMock(documentPath, ...args),
    })),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    AUDIT: ['audit-role'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

import { exportDgiiTxtReport } from './exportDgiiTxtReport.js';

describe('exportDgiiTxtReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectionDocsByPath.clear();
    collectionDocsByPath.set('businesses/business-1/purchases', []);
    collectionDocsByPath.set('businesses/business-1/expenses', []);
    collectionDocsByPath.set(
      'businesses/business-1/accountsPayablePayments',
      [],
    );
    collectionDocsByPath.set(
      'businesses/business-1/salesThirdPartyWithholdings',
      [],
    );

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    businessDocGetMock.mockImplementation(async (path) => {
      if (path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            business: {
              rnc: '101010101',
              features: {
                fiscal: {
                  reportingEnabled: true,
                  monthlyComplianceEnabled: true,
                },
              },
            },
          }),
        };
      }

      const reportRunMatch = path.match(
        /^businesses\/business-1\/taxReportRuns\/report-run-(606|607|608)$/,
      );
      if (reportRunMatch) {
        const reportCode = `DGII_${reportRunMatch[1]}`;
        return {
          exists: true,
          data: () => ({
            businessId: 'business-1',
            periodKey: '2026-04',
            reportCode,
            sourceSnapshot: {
              sourceRecords: buildSourceRecordsForReport(reportCode),
            },
          }),
        };
      }

      return {
        exists: false,
        data: () => ({}),
      };
    });
  });

  it('exporta TXT 606 con compras, gastos y pagos vinculados', async () => {
    collectionDocsByPath.set('businesses/business-1/purchases', [
      {
        id: 'purchase-1',
        data: () => ({
          id: 'purchase-1',
          numberId: 'PUR-001',
          supplierId: 'supplier-1',
          supplier: {
            rnc: '101010101',
          },
          documentType: 'inventory',
          completedAt: {
            toDate: () => new Date('2026-04-04T13:20:00.000Z'),
          },
          taxReceipt: {
            ncf: 'B0100000010',
          },
          totals: {
            total: 1180,
          },
          taxBreakdown: {
            itbisTotal: 180,
          },
          classification: {
            dgii606ExpenseType: '09',
          },
          status: 'completed',
        }),
      },
    ]);
    collectionDocsByPath.set('businesses/business-1/expenses', [
      {
        id: 'expense-1',
        data: () => ({
          id: 'expense-1',
          number: 'EXP-001',
          supplierId: 'supplier-2',
          supplier: {
            personalID: '001-2345678-9',
          },
          documentType: 'expense',
          expenseDate: {
            toDate: () => new Date('2026-04-06T10:00:00.000Z'),
          },
          paymentAt: {
            toDate: () => new Date('2026-04-06T15:00:00.000Z'),
          },
          paymentMethods: [{ method: 'cash', amount: 590 }],
          taxReceipt: {
            ncf: 'B0100000011',
          },
          totals: {
            total: 590,
          },
          taxBreakdown: {
            itbisTotal: 90,
          },
          classification: {
            dgii606ExpenseType: '02',
          },
          status: 'recorded',
        }),
      },
    ]);
    collectionDocsByPath.set('businesses/business-1/accountsPayablePayments', [
      {
        id: 'payment-1',
        data: () => ({
          purchaseId: 'purchase-1',
          occurredAt: {
            toDate: () => new Date('2026-04-08T10:30:00.000Z'),
          },
          paymentMethods: [{ method: 'transfer', amount: 1180 }],
          paymentStateSnapshot: { paid: 1180 },
          metadata: { appliedCreditNotes: [] },
          status: 'completed',
        }),
      },
    ]);

    const result = await exportDgiiTxtReport({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        reportCode: 'DGII_606',
        reportRunId: 'report-run-606',
      },
    });

    const lines = result.content.split('\r\n');
    const purchaseColumns = lines[1].split('|');
    const expenseColumns = lines[2].split('|');

    expect(result.ok).toBe(true);
    expect(result.fileName).toBe('DGII_F_606_101010101_202604.TXT');
    expect(result.rowCount).toBe(2);
    expect(lines[0]).toBe('606|101010101|202604|000000000002');
    expect(purchaseColumns).toHaveLength(23);
    expect(purchaseColumns.slice(0, 11)).toEqual([
      '101010101',
      '1',
      '09',
      'B0100000010',
      '',
      '20260404',
      '20260408',
      '0.00',
      '1000.00',
      '1000.00',
      '180.00',
    ]);
    expect(purchaseColumns[22]).toBe('02');
    expect(expenseColumns).toHaveLength(23);
    expect(expenseColumns[0]).toBe('00123456789');
    expect(expenseColumns[2]).toBe('02');
    expect(expenseColumns[7]).toBe('500.00');
    expect(expenseColumns[8]).toBe('0.00');
    expect(expenseColumns[22]).toBe('01');
  });

  it('exporta solo filas válidas para 607 y genera 23 columnas', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', [
      {
        id: 'invoice-credit-fiscal',
        data: () => ({
          data: {
            id: 'invoice-credit-fiscal',
            numberID: 'INV-001',
            NCF: 'B0100000015',
            date: {
              toDate: () => new Date('2026-04-05T13:20:00.000Z'),
            },
            client: {
              id: 'client-rnc',
              rnc: '101010101',
            },
            totalPurchase: { value: 1180 },
            totalTaxes: { value: 180 },
            status: 'completed',
          },
        }),
      },
      {
        id: 'invoice-consumer-small',
        data: () => ({
          data: {
            id: 'invoice-consumer-small',
            numberID: 'INV-002',
            NCF: 'B0200000771',
            date: {
              toDate: () => new Date('2026-04-07T13:20:00.000Z'),
            },
            client: {
              id: 'client-cf-small',
            },
            totalPurchase: { value: 189.98 },
            totalTaxes: { value: 28.98 },
            status: 'completed',
          },
        }),
      },
      {
        id: 'invoice-consumer-large',
        data: () => ({
          data: {
            id: 'invoice-consumer-large',
            numberID: 'INV-003',
            NCF: 'B0200000500',
            date: {
              toDate: () => new Date('2026-04-08T13:20:00.000Z'),
            },
            client: {
              id: 'client-cf-large',
              personalID: '001-2345678-9',
            },
            totalPurchase: { value: 250000 },
            totalTaxes: { value: 38135.59 },
            status: 'completed',
          },
        }),
      },
      {
        id: 'invoice-without-ncf',
        data: () => ({
          data: {
            id: 'invoice-without-ncf',
            numberID: 'INV-004',
            NCF: '',
            date: {
              toDate: () => new Date('2026-04-09T13:20:00.000Z'),
            },
            client: {
              id: 'client-no-ncf',
              rnc: '101010101',
            },
            totalPurchase: { value: 590 },
            totalTaxes: { value: 90 },
            status: 'completed',
          },
        }),
      },
    ]);
    collectionDocsByPath.set('businesses/business-1/creditNotes', [
      {
        id: 'credit-note-1',
        data: () => ({
          id: 'credit-note-1',
          number: 'NC-2026-000009',
          ncf: 'B0400000009',
          createdAt: {
            toDate: () => new Date('2026-04-10T09:30:00.000Z'),
          },
          voidedAt: {
            toDate: () => new Date('2026-04-10T09:30:00.000Z'),
          },
          client: {
            id: 'client-rnc',
            rnc: '101010101',
          },
          totalAmount: 350,
          invoiceId: 'invoice-credit-fiscal',
          invoiceNcf: 'B0100000015',
          status: 'issued',
        }),
      },
    ]);

    const result = await exportDgiiTxtReport({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        reportCode: 'DGII_607',
        reportRunId: 'report-run-607',
      },
    });

    const lines = result.content.split('\r\n');
    const detailLines = lines.slice(1);

    expect(result.ok).toBe(true);
    expect(result.fileName).toBe('DGII_F_607_101010101_202604.TXT');
    expect(result.rowCount).toBe(3);
    expect(lines[0]).toBe('607|101010101|202604|000000000003');
    expect(detailLines).toHaveLength(3);
    expect(detailLines.every((line) => line.split('|').length === 23)).toBe(
      true,
    );
    expect(detailLines.some((line) => line.includes('B0200000771'))).toBe(
      false,
    );
    expect(
      detailLines.some((line) => line.startsWith('00123456789|2|B0200000500|')),
    ).toBe(true);
    expect(
      detailLines.some((line) => line.includes('|B0400000009|B0100000015|')),
    ).toBe(true);
  });

  it('exporta 607 desde el snapshot de la corrida aunque Firestore vivo cambie', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', [
      {
        id: 'invoice-1',
        data: () => ({
          data: {
            id: 'invoice-1',
            numberID: 'INV-LIVE',
            NCF: 'B0100009999',
            date: {
              toDate: () => new Date('2026-04-05T13:20:00.000Z'),
            },
            client: {
              id: 'client-rnc',
              rnc: '101010101',
            },
            totalPurchase: { value: 1180 },
            totalTaxes: { value: 180 },
            status: 'completed',
          },
        }),
      },
    ]);
    collectionDocsByPath.set('businesses/business-1/creditNotes', []);

    businessDocGetMock.mockImplementation(async (path) => {
      if (path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            business: {
              rnc: '101010101',
              features: {
                fiscal: {
                  reportingEnabled: true,
                  monthlyComplianceEnabled: true,
                },
              },
            },
          }),
        };
      }

      if (path === 'businesses/business-1/taxReportRuns/report-run-607') {
        return {
          exists: true,
          data: () => ({
            businessId: 'business-1',
            periodKey: '2026-04',
            reportCode: 'DGII_607',
            sourceSnapshot: {
              sourceRecords: {
                invoices: [
                  {
                    index: 0,
                    recordId: 'invoice-1',
                    sourcePath: 'businesses/business-1/invoices/invoice-1',
                    documentNumber: 'INV-SNAPSHOT',
                    documentFiscalNumber: 'B0100000015',
                    counterpartyIdentificationNumber: '101010101',
                    issuedAt: '2026-04-05T13:20:00.000Z',
                    total: 1180,
                    itbisTotal: 180,
                    status: 'completed',
                  },
                ],
                creditNotes: [],
                thirdPartyWithholdings: [],
              },
            },
          }),
        };
      }

      return {
        exists: false,
        data: () => ({}),
      };
    });

    const result = await exportDgiiTxtReport({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        reportCode: 'DGII_607',
        reportRunId: 'report-run-607',
      },
    });

    expect(result.content).toContain('B0100000015');
    expect(result.content).not.toContain('B0100009999');
  });

  it('fusiona retenciones de terceros en la factura 607 sin duplicar filas TXT', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', [
      {
        id: 'invoice-1',
        data: () => ({
          data: {
            id: 'invoice-1',
            numberID: 'INV-001',
            NCF: 'B0100000015',
            date: {
              toDate: () => new Date('2026-04-05T13:20:00.000Z'),
            },
            client: {
              id: 'client-rnc',
              rnc: '101010101',
            },
            totalPurchase: { value: 1180 },
            totalTaxes: { value: 180 },
            status: 'completed',
          },
        }),
      },
    ]);
    collectionDocsByPath.set('businesses/business-1/creditNotes', []);
    collectionDocsByPath.set(
      'businesses/business-1/salesThirdPartyWithholdings',
      [
        {
          id: 'withholding-1',
          data: () => ({
            invoiceId: 'invoice-1',
            retentionDate: {
              toDate: () => new Date('2026-04-18T09:00:00.000Z'),
            },
            itbisWithheld: 54,
            incomeTaxWithheld: 100,
            status: 'recorded',
          }),
        },
      ],
    );

    const result = await exportDgiiTxtReport({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        reportCode: 'DGII_607',
        reportRunId: 'report-run-607',
      },
    });

    const lines = result.content.split('\r\n');
    const detailColumns = lines[1].split('|');

    expect(result.rowCount).toBe(1);
    expect(lines[0]).toBe('607|101010101|202604|000000000001');
    expect(detailColumns[2]).toBe('B0100000015');
    expect(detailColumns[6]).toBe('20260418');
    expect(detailColumns[9]).toBe('54.00');
    expect(detailColumns[11]).toBe('100.00');
  });

  it('rechaza exportación cuando una fila detallada requiere identificación y no la tiene', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', [
      {
        id: 'invoice-1',
        data: () => ({
          data: {
            id: 'invoice-1',
            numberID: 'INV-001',
            NCF: 'B0100000015',
            date: {
              toDate: () => new Date('2026-04-05T13:20:00.000Z'),
            },
            client: {
              id: 'client-1',
              personalID: '',
              rnc: '',
            },
            totalPurchase: { value: 1180 },
            totalTaxes: { value: 180 },
            status: 'completed',
          },
        }),
      },
    ]);
    collectionDocsByPath.set('businesses/business-1/creditNotes', []);

    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_607',
          reportRunId: 'report-run-607',
        },
      }),
    ).rejects.toHaveProperty('code', 'failed-precondition');
    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_607',
          reportRunId: 'report-run-607',
        },
      }),
    ).rejects.toThrow(
      'Falta identificación del cliente para exportar el NCF B0100000015.',
    );
  });

  it('rechaza exportación cuando el negocio no tiene RNC para el encabezado', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', []);
    collectionDocsByPath.set('businesses/business-1/creditNotes', []);
    businessDocGetMock.mockImplementation(async (path) => {
      if (path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            rnc: '',
            business: {
              features: {
                fiscal: {
                  reportingEnabled: true,
                  monthlyComplianceEnabled: true,
                },
              },
            },
          }),
        };
      }

      if (path === 'businesses/business-1/taxReportRuns/report-run-607') {
        return {
          exists: true,
          data: () => ({
            businessId: 'business-1',
            periodKey: '2026-04',
            reportCode: 'DGII_607',
            sourceSnapshot: {
              sourceRecords: buildSourceRecordsForReport('DGII_607'),
            },
          }),
        };
      }

      return {
        exists: false,
        data: () => ({}),
      };
    });

    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_607',
          reportRunId: 'report-run-607',
        },
      }),
    ).rejects.toHaveProperty('code', 'failed-precondition');
    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_607',
          reportRunId: 'report-run-607',
        },
      }),
    ).rejects.toThrow('RNC o cédula del emisor requerido.');
  });

  it('exporta TXT 608 con conteo y códigos de anulación DGII', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', [
      {
        id: 'invoice-1',
        data: () => ({
          data: {
            id: 'invoice-1',
            numberID: 'INV-001',
            NCF: 'B0100000015',
            voidedAt: {
              toDate: () => new Date('2026-04-20T13:20:00.000Z'),
            },
            voidReasonCode: '04',
            voidReasonLabel: 'Corrección de la información',
            status: 'voided',
          },
        }),
      },
    ]);
    collectionDocsByPath.set('businesses/business-1/creditNotes', [
      {
        id: 'credit-note-1',
        data: () => ({
          id: 'credit-note-1',
          number: 'NC-2026-000009',
          ncf: 'B0400000009',
          createdAt: {
            toDate: () => new Date('2026-04-10T09:30:00.000Z'),
          },
          voidedAt: {
            toDate: () => new Date('2026-04-10T09:30:00.000Z'),
          },
          invoiceId: 'invoice-1',
          reasonCode: '06',
          reasonLabel: 'Devolución de productos',
          reason: 'Cliente desistió',
          status: 'cancelled',
        }),
      },
    ]);

    const result = await exportDgiiTxtReport({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        reportCode: 'DGII_608',
        reportRunId: 'report-run-608',
      },
    });

    const lines = result.content.split('\r\n');
    const detailLines = lines.slice(1);

    expect(result.ok).toBe(true);
    expect(result.fileName).toBe('DGII_F_608_101010101_202604.TXT');
    expect(result.rowCount).toBe(2);
    expect(lines[0]).toBe('608|101010101|202604|000002');
    expect(detailLines).toEqual([
      'B0400000009|20260410|06',
      'B0100000015|20260420|04',
    ]);
  });

  it('requiere una corrida fiscal auditable antes de exportar TXT', async () => {
    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_607',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'reportRunId es requerido para exportar un TXT DGII auditable.',
    });
  });

  it('rechaza una corrida fiscal que no corresponde al reporte solicitado', async () => {
    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_607',
          reportRunId: 'report-run-606',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La corrida fiscal seleccionada no corresponde al negocio, periodo y reporte solicitados.',
    });
  });

  it('rechaza TXT vacio y orienta a formato informativo en cero', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', []);
    collectionDocsByPath.set('businesses/business-1/creditNotes', []);

    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_608',
          reportRunId: 'report-run-608',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No hay registros para exportar TXT DGII_608. Presente el formato informativo/en cero desde la Oficina Virtual DGII.',
    });
  });
});
