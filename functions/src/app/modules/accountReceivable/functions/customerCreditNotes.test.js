import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  consumeCreditNotesTxMock,
  docSnapshots,
  MockHttpsError,
  resolveCallableAuthUidMock,
  resolveBusinessFiscalRolloutMock,
  reserveNcfMock,
  runTransactionMock,
  transactionSetMock,
} = vi.hoisted(() => {
  const hoistedDocSnapshots = new Map();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedConsumeCreditNotesTxMock = vi.fn();
  const hoistedReserveNcfMock = vi.fn();
  const hoistedResolveBusinessFiscalRolloutMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransactionSetMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    consumeCreditNotesTxMock: hoistedConsumeCreditNotesTxMock,
    docSnapshots: hoistedDocSnapshots,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    resolveBusinessFiscalRolloutMock: hoistedResolveBusinessFiscalRolloutMock,
    reserveNcfMock: hoistedReserveNcfMock,
    runTransactionMock: hoistedRunTransactionMock,
    transactionSetMock: hoistedTransactionSetMock,
  };
});

const docRef = (path) => ({ path, id: path.split('/').at(-1) });
const queryRef = (path, filters = []) => ({
  path,
  filters,
  kind: 'query',
  where(field, operator, value) {
    return queryRef(path, [...filters, { field, operator, value }]);
  },
});
const snapshot = (path, data) => ({
  exists: data != null,
  id: path.split('/').at(-1),
  ref: docRef(path),
  data: () => data,
});
const querySnapshot = (path, docs = []) => ({
  docs: docs.map((entry, index) =>
    snapshot(`${path}/${entry.id || `doc-${index + 1}`}`, entry),
  ),
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'credit-note-1',
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    static now() {
      return 'timestamp-now';
    }
  },
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
  db: {
    doc: (path) => ({
      ...docRef(path),
      get: async () => snapshot(path, docSnapshots.get(path) ?? null),
    }),
    collection: (path) => queryRef(path),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/getNextID.js', () => ({
  applyNextIDTransactional: vi.fn(() => 1),
  getNextIDTransactionalSnap: vi.fn(async () => ({})),
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    FINANCIAL_DOCUMENT_VOID: ['financial-document-void'],
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/ncf.service.js', () => ({
  reserveNcf: (...args) => reserveNcfMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/creditNotes.service.js', () => ({
  consumeCreditNotesTx: (...args) => consumeCreditNotesTxMock(...args),
}));

vi.mock('../../taxReceipt/services/fiscalSequenceAudit.service.js', () => ({
  writeFiscalSequenceAudit: vi.fn(),
}));

vi.mock('../../taxReceipt/utils/fiscalRollout.util.js', () => ({
  resolveBusinessFiscalRollout: (...args) =>
    resolveBusinessFiscalRolloutMock(...args),
}));

vi.mock('../../electronicTaxReceipts/config/gisysFactPlatform.config.js', () => ({
  getGisysFactPlatformConfig: vi.fn(async () => ({
    enabled: true,
    mode: 'pilot',
    integrationInstanceCode: 'gisys-instance',
  })),
}));

vi.mock('../../electronicTaxReceipts/config/gisysFact.config.js', () => ({
  getGisysFactConfigIssues: vi.fn(() => []),
  resolveGisysFactConfig: vi.fn(() => ({
    providerId: 'gisys_fact',
    enabled: true,
    mode: 'pilot',
    integrationInstanceCode: 'gisys-instance',
    taxpayerCode: 'taxpayer-1',
  })),
}));

import {
  applyCustomerCreditNotes,
  createCustomerCreditNote,
  updateCustomerCreditNote,
} from './customerCreditNotes.js';

describe('customerCreditNotes hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docSnapshots.clear();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    consumeCreditNotesTxMock.mockResolvedValue({
      applicationIds: ['application-1'],
    });
    reserveNcfMock.mockResolvedValue({
      ncfCode: 'B0400000001',
      usageId: 'usage-1',
      taxReceiptRef: { id: 'receipt-1' },
    });
    resolveBusinessFiscalRolloutMock.mockReturnValue({
      sequenceEngineV2Enabled: true,
      electronicModelEnabled: false,
      electronicTransportEnabled: false,
    });
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: async (ref) =>
          ref.kind === 'query'
            ? querySnapshot(ref.path, docSnapshots.get(ref.path) ?? [])
            : snapshot(ref.path, docSnapshots.get(ref.path) ?? null),
        set: transactionSetMock,
      }),
    );
  });

  it('rechaza editar una nota de credito emitida', async () => {
    docSnapshots.set('businesses/business-1/creditNotes/credit-note-1', {
      id: 'credit-note-1',
      status: 'issued',
      totalAmount: 118,
    });

    await expect(
      updateCustomerCreditNote({
        data: {
          businessId: 'business-1',
          creditNoteId: 'credit-note-1',
          updates: { totalAmount: 100 },
        },
      }),
    ).rejects.toMatchObject({ code: 'failed-precondition' });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('aplica notas de credito solo por transaccion backend', async () => {
    const result = await applyCustomerCreditNotes({
      data: {
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        creditNotes: [{ id: 'credit-note-1', amount: 50 }],
        invoiceData: { id: 'invoice-1' },
      },
    });

    expect(result).toEqual({ ok: true, applicationIds: ['application-1'] });
    expect(consumeCreditNotesTxMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        businessId: 'business-1',
        userId: 'user-1',
        invoiceId: 'invoice-1',
      }),
    );
  });

  it('agenda E34 sin reservar B04 cuando el negocio usa modelo electronico', async () => {
    resolveBusinessFiscalRolloutMock.mockReturnValue({
      sequenceEngineV2Enabled: true,
      electronicModelEnabled: true,
      electronicTransportEnabled: true,
    });
    docSnapshots.set('businesses/business-1', {
      fiscal: {
        electronicModelEnabled: true,
        electronicTransportEnabled: true,
      },
    });
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        NCF: 'E310000000007',
        numberID: 714,
        date: '2026-06-16T18:40:42.000Z',
        totalPurchase: { value: 10457.16 },
      },
    });
    docSnapshots.set('businesses/business-1/creditNotes', []);

    const result = await createCustomerCreditNote({
      data: {
        businessId: 'business-1',
        creditNote: {
          invoiceId: 'invoice-1',
          client: { id: 'client-1', name: 'GI SYS SRL' },
          items: [{ id: 'product-1', name: 'Servicio', price: 100, amountToBuy: 1 }],
          totalAmount: 118,
          reason: 'Devolucion parcial',
        },
      },
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();
    expect(result.creditNote).toMatchObject({
      ncf: null,
      status: 'electronic_pending',
      invoiceNcf: 'E310000000007',
      documentFormat: 'electronic',
      electronicTaxReceipt: expect.objectContaining({
        documentType: 'E34',
        status: 'pending',
      }),
    });
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/creditNotes/credit-note-1/outbox/credit-note-1',
      }),
      expect.objectContaining({
        type: 'issueElectronicTaxReceipt',
        payload: expect.objectContaining({
          documentType: 'E34',
          reference: expect.objectContaining({
            modifiedENcf: 'E310000000007',
            modificationCode: '3',
          }),
        }),
      }),
    );
  });

  it('rechaza NC cuando la suma excede el total de la factura afectada', async () => {
    docSnapshots.set('businesses/business-1', {
      fiscal: {
        sequenceEngineV2Enabled: true,
      },
    });
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        NCF: 'B0100000001',
        numberID: 714,
        date: '2026-06-16T18:40:42.000Z',
        totalPurchase: { value: 100 },
        products: [{ id: 'product-1', amountToBuy: 1 }],
      },
    });
    docSnapshots.set('businesses/business-1/creditNotes', [
      {
        id: 'credit-note-existing',
        status: 'issued',
        invoiceId: 'invoice-1',
        totalAmount: 80,
        items: [{ id: 'product-1', amountToBuy: 0.5 }],
      },
    ]);

    await expect(
      createCustomerCreditNote({
        data: {
          businessId: 'business-1',
          creditNote: {
            invoiceId: 'invoice-1',
            client: { id: 'client-1', name: 'GI SYS SRL' },
            items: [{ id: 'product-1', name: 'Servicio', amountToBuy: 0.25 }],
            totalAmount: 30,
            reason: 'Devolucion parcial',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        reason: 'credit-note-total-exceeds-invoice',
      }),
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();
  });

  it('no cuenta notas electronicas rechazadas por DGII contra el cupo de la factura', async () => {
    docSnapshots.set('businesses/business-1', {
      fiscal: {
        sequenceEngineV2Enabled: true,
      },
    });
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        NCF: 'B0100000001',
        numberID: 714,
        date: '2026-06-16T18:40:42.000Z',
        client: { id: 'client-1', personalID: '132619201' },
        totalPurchase: { value: 100 },
        products: [{ id: 'product-1', amountToBuy: 1 }],
      },
    });
    docSnapshots.set('businesses/business-1/creditNotes', [
      {
        id: 'credit-note-failed',
        status: 'electronic_failed',
        electronicTaxReceipt: {
          status: 'rejected',
          requiresNewENcf: true,
        },
        invoiceId: 'invoice-1',
        totalAmount: 80,
        items: [{ id: 'product-1', amountToBuy: 0.5 }],
      },
    ]);

    const result = await createCustomerCreditNote({
      data: {
        businessId: 'business-1',
        creditNote: {
          invoiceId: 'invoice-1',
          client: { id: 'client-1', name: 'GI SYS SRL', personalID: '132619201' },
          items: [{ id: 'product-1', name: 'Servicio', amountToBuy: 0.25 }],
          totalAmount: 30,
          reason: 'Devolucion parcial',
        },
      },
    });

    expect(result.creditNote).toMatchObject({
      number: 'NC-2026-000001',
      totalAmount: 30,
    });
  });

  it('mantiene en cupo notas electronicas con fallo ambiguo hasta reconciliar', async () => {
    docSnapshots.set('businesses/business-1', {
      fiscal: {
        sequenceEngineV2Enabled: true,
      },
    });
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        NCF: 'B0100000001',
        numberID: 714,
        date: '2026-06-16T18:40:42.000Z',
        client: { id: 'client-1', personalID: '132619201' },
        totalPurchase: { value: 100 },
        products: [{ id: 'product-1', amountToBuy: 1 }],
      },
    });
    docSnapshots.set('businesses/business-1/creditNotes', [
      {
        id: 'credit-note-local-failed',
        status: 'electronic_failed',
        electronicTaxReceipt: {
          status: 'local_failed',
          lastError: 'provider timeout',
        },
        invoiceId: 'invoice-1',
        totalAmount: 80,
        items: [{ id: 'product-1', amountToBuy: 0.5 }],
      },
    ]);

    await expect(
      createCustomerCreditNote({
        data: {
          businessId: 'business-1',
          creditNote: {
            invoiceId: 'invoice-1',
            client: { id: 'client-1', name: 'GI SYS SRL', personalID: '132619201' },
            items: [{ id: 'product-1', name: 'Servicio', amountToBuy: 0.25 }],
            totalAmount: 30,
            reason: 'Devolucion parcial',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        reason: 'credit-note-total-exceeds-invoice',
      }),
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();
  });

  it('rechaza NC cuando el cliente no coincide con la factura afectada', async () => {
    docSnapshots.set('businesses/business-1', {
      fiscal: {
        sequenceEngineV2Enabled: true,
      },
    });
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        NCF: 'B0100000001',
        numberID: 714,
        date: '2026-06-16T18:40:42.000Z',
        client: { id: 'client-1', personalID: '132619201' },
        totalPurchase: { value: 100 },
        products: [{ id: 'product-1', amountToBuy: 1 }],
      },
    });
    docSnapshots.set('businesses/business-1/creditNotes', []);

    await expect(
      createCustomerCreditNote({
        data: {
          businessId: 'business-1',
          creditNote: {
            invoiceId: 'invoice-1',
            client: { id: 'client-2', name: 'OTRO CLIENTE', personalID: '999999999' },
            items: [{ id: 'product-1', name: 'Servicio', amountToBuy: 0.25 }],
            totalAmount: 30,
            reason: 'Devolucion parcial',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        reason: 'credit-note-client-mismatch',
      }),
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();
  });
});
