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
    collectionDocsByPath.set('businesses/business-1/salesThirdPartyWithholdings', []);

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    businessDocGetMock.mockImplementation(async (path) => {
      if (path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            rnc: '101010101',
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

      return {
        exists: false,
        data: () => ({}),
      };
    });
  });

  it('exporta solo filas válidas para 607 y genera 23 columnas', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', [
      {
        id: 'invoice-credit-fiscal',
        data: () => ({
          data: {
            id: 'invoice-credit-fiscal',
            numberID: 'INV-001',
            NCF: 'B01000000015',
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
          ncf: 'B04000000009',
          createdAt: {
            toDate: () => new Date('2026-04-10T09:30:00.000Z'),
          },
          client: {
            id: 'client-rnc',
            rnc: '101010101',
          },
          totalAmount: 350,
          invoiceId: 'invoice-credit-fiscal',
          invoiceNcf: 'B01000000015',
          status: 'issued',
        }),
      },
    ]);

    const result = await exportDgiiTxtReport({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        reportCode: 'DGII_607',
      },
    });

    const lines = result.content.split('\r\n');
    const detailLines = lines.slice(1);

    expect(result.ok).toBe(true);
    expect(result.fileName).toBe('607_101010101_202604.txt');
    expect(result.rowCount).toBe(3);
    expect(lines[0]).toBe('607|101010101|202604|000000000003');
    expect(detailLines).toHaveLength(3);
    expect(detailLines.every((line) => line.split('|').length === 23)).toBe(true);
    expect(detailLines.some((line) => line.includes('B0200000771'))).toBe(false);
    expect(detailLines.some((line) => line.startsWith('00123456789|2|B0200000500|'))).toBe(
      true,
    );
    expect(detailLines.some((line) => line.includes('|B04000000009|B01000000015|'))).toBe(
      true,
    );
  });

  it('rechaza exportación cuando una fila detallada requiere identificación y no la tiene', async () => {
    collectionDocsByPath.set('businesses/business-1/invoices', [
      {
        id: 'invoice-1',
        data: () => ({
          data: {
            id: 'invoice-1',
            numberID: 'INV-001',
            NCF: 'B01000000015',
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
        },
      }),
    ).rejects.toHaveProperty('code', 'failed-precondition');
    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_607',
        },
      }),
    ).rejects.toThrow('Falta identificación del cliente para exportar el NCF B01000000015.');
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
        },
      }),
    ).rejects.toHaveProperty('code', 'failed-precondition');
    await expect(
      exportDgiiTxtReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
          reportCode: 'DGII_607',
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
            NCF: 'B01000000015',
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
          ncf: 'B04000000009',
          createdAt: {
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
      },
    });

    const lines = result.content.split('\r\n');
    const detailLines = lines.slice(1);

    expect(result.ok).toBe(true);
    expect(result.fileName).toBe('608_101010101_202604.txt');
    expect(result.rowCount).toBe(2);
    expect(lines[0]).toBe('608|101010101|202604|000002');
    expect(detailLines).toEqual([
      'B04000000009|20260410|06',
      'B01000000015|20260420|04',
    ]);
  });
});
