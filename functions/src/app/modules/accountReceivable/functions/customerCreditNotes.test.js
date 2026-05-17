import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  consumeCreditNotesTxMock,
  docSnapshots,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  transactionSetMock,
} = vi.hoisted(() => {
  const hoistedDocSnapshots = new Map();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedConsumeCreditNotesTxMock = vi.fn();
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

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    FINANCIAL_DOCUMENT_VOID: ['financial-document-void'],
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/ncf.service.js', () => ({
  reserveNcf: vi.fn(async () => ({
    ncfCode: 'B0400000001',
    usageId: 'usage-1',
    taxReceiptRef: { id: 'receipt-1' },
  })),
}));

vi.mock('../../../versions/v2/invoice/services/creditNotes.service.js', () => ({
  consumeCreditNotesTx: (...args) => consumeCreditNotesTxMock(...args),
}));

vi.mock('../../taxReceipt/services/fiscalSequenceAudit.service.js', () => ({
  writeFiscalSequenceAudit: vi.fn(),
}));

vi.mock('../../taxReceipt/utils/fiscalRollout.util.js', () => ({
  resolveBusinessFiscalRollout: vi.fn(() => ({
    sequenceEngineV2Enabled: true,
  })),
}));

import {
  applyCustomerCreditNotes,
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
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: async (ref) => snapshot(ref.path, docSnapshots.get(ref.path) ?? null),
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
});
