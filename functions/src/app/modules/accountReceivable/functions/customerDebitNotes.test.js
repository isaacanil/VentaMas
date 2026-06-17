import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
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
const snapshot = (path, data) => ({
  exists: data != null,
  id: path.split('/').at(-1),
  ref: docRef(path),
  data: () => data,
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'debit-note-1',
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
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/ncf.service.js', () => ({
  reserveNcf: (...args) => reserveNcfMock(...args),
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
  createCustomerDebitNote,
  updateCustomerDebitNote,
} from './customerDebitNotes.js';

describe('customerDebitNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docSnapshots.clear();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    reserveNcfMock.mockResolvedValue({
      ncfCode: 'B0300000001',
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
        get: async (ref) => snapshot(ref.path, docSnapshots.get(ref.path) ?? null),
        set: transactionSetMock,
      }),
    );
  });

  it('rechaza editar una nota de debito emitida', async () => {
    docSnapshots.set('businesses/business-1/debitNotes/debit-note-1', {
      id: 'debit-note-1',
      status: 'issued',
      totalAmount: 118,
    });

    await expect(
      updateCustomerDebitNote({
        data: {
          businessId: 'business-1',
          debitNoteId: 'debit-note-1',
          updates: { totalAmount: 100 },
        },
      }),
    ).rejects.toMatchObject({ code: 'failed-precondition' });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('agenda E33 sin reservar B03 cuando el negocio usa modelo electronico', async () => {
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
        NCF: 'E310000000008',
        numberID: 715,
        date: '2026-06-16T18:47:42.000Z',
        totalPurchase: { value: 10457.16 },
      },
    });

    const result = await createCustomerDebitNote({
      data: {
        businessId: 'business-1',
        debitNote: {
          invoiceId: 'invoice-1',
          client: { id: 'client-1', name: 'GI SYS SRL' },
          totalAmount: 118,
          taxAmount: 18,
          reason: 'Diferencia de precio',
        },
      },
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();
    expect(result.debitNote).toMatchObject({
      ncf: null,
      status: 'electronic_pending',
      invoiceNcf: 'E310000000008',
      documentFormat: 'electronic',
      electronicTaxReceipt: expect.objectContaining({
        documentType: 'E33',
        status: 'pending',
      }),
      items: [
        expect.objectContaining({
          id: 'debit-note-adjustment',
          name: 'Ajuste nota de débito',
          itemKind: '2',
          billingIndicator: '1',
          unitPrice: 100,
          taxRate: 18,
          taxAmount: 18,
        }),
      ],
    });
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/debitNotes/debit-note-1/outbox/debit-note-1',
      }),
      expect.objectContaining({
        type: 'issueElectronicTaxReceipt',
        payload: expect.objectContaining({
          documentType: 'E33',
          reference: expect.objectContaining({
            modifiedENcf: 'E310000000008',
            modificationCode: '3',
          }),
        }),
      }),
    );
  });

  it('rechaza ND cuando el cliente no coincide con la factura afectada', async () => {
    docSnapshots.set('businesses/business-1', {
      fiscal: {
        sequenceEngineV2Enabled: true,
      },
    });
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        NCF: 'B0100000001',
        numberID: 715,
        date: '2026-06-16T18:47:42.000Z',
        client: { id: 'client-1', personalID: '132619201' },
        totalPurchase: { value: 10457.16 },
      },
    });

    await expect(
      createCustomerDebitNote({
        data: {
          businessId: 'business-1',
          debitNote: {
            invoiceId: 'invoice-1',
            client: { id: 'client-2', name: 'OTRO CLIENTE', personalID: '999999999' },
            totalAmount: 118,
            taxAmount: 18,
            reason: 'Diferencia de precio',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        reason: 'debit-note-client-mismatch',
      }),
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();
  });

  it('rechaza ND cuando falta identificacion fiscal en un lado pero el cliente no coincide', async () => {
    docSnapshots.set('businesses/business-1', {
      fiscal: {
        sequenceEngineV2Enabled: true,
      },
    });
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        NCF: 'B0100000001',
        numberID: 715,
        date: '2026-06-16T18:47:42.000Z',
        client: { id: 'client-1', personalID: '132619201' },
        totalPurchase: { value: 10457.16 },
      },
    });

    await expect(
      createCustomerDebitNote({
        data: {
          businessId: 'business-1',
          debitNote: {
            invoiceId: 'invoice-1',
            client: { id: 'client-2', name: 'OTRO CLIENTE' },
            totalAmount: 118,
            taxAmount: 18,
            reason: 'Diferencia de precio',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        reason: 'debit-note-client-mismatch',
      }),
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();
  });
});
