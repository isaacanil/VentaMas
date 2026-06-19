import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  attemptMarkInvoicePrintReadyMock,
  docMock,
  loadedDependencyModules,
  loggerInfoMock,
  loggerWarnMock,
  runTransactionMock,
} = vi.hoisted(() => {
  const hoistedAttemptMarkInvoicePrintReadyMock = vi.fn();
  const hoistedDocMock = vi.fn();
  const hoistedLoadedDependencyModules = [];
  const hoistedLoggerInfoMock = vi.fn();
  const hoistedLoggerWarnMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();

  return {
    attemptMarkInvoicePrintReadyMock: hoistedAttemptMarkInvoicePrintReadyMock,
    docMock: hoistedDocMock,
    loadedDependencyModules: hoistedLoadedDependencyModules,
    loggerInfoMock: hoistedLoggerInfoMock,
    loggerWarnMock: hoistedLoggerWarnMock,
    runTransactionMock: hoistedRunTransactionMock,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    info: (...args) => loggerInfoMock(...args),
    warn: (...args) => loggerWarnMock(...args),
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_config, handler) => handler,
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ __op: 'serverTimestamp' })),
    increment: vi.fn((value) => ({ __op: 'increment', value })),
    arrayUnion: vi.fn((...values) => ({ __op: 'arrayUnion', values })),
    delete: vi.fn(() => ({ __op: 'delete' })),
  },
  Timestamp: {
    now: vi.fn(() => new Date('2026-04-13T10:00:00.000Z')),
    fromMillis: vi.fn((value) => new Date(value)),
  },
  db: {
    doc: (...args) => docMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock(
  '../../../../modules/Inventory/services/getInventory.service.js',
  () => {
    loadedDependencyModules.push('inventoryPrereqs');
    return {
      collectInventoryPrereqs: vi.fn(),
    };
  },
);

vi.mock('../../../../modules/Inventory/services/Inventory.service.js', () => {
  loadedDependencyModules.push('inventoryService');
  return {
    adjustProductInventory: vi.fn(),
  };
});

vi.mock(
  '../../../../modules/accountReceivable/services/getAccountReceivable.service.js',
  () => {
    loadedDependencyModules.push('receivablePrereqs');
    return {
      collectReceivablePrereqs: vi.fn(),
    };
  },
);

vi.mock(
  '../../../../modules/accountReceivable/services/addAccountReceivable.js',
  () => {
    loadedDependencyModules.push('addAccountReceivable');
    return {
      addAccountReceivable: vi.fn(),
    };
  },
);

vi.mock(
  '../../../../modules/accountReceivable/services/addInstallmentsAccountReceivable.js',
  () => {
    loadedDependencyModules.push('addInstallmentReceivable');
    return {
      addInstallmentReceivable: vi.fn(),
    };
  },
);

vi.mock('../services/creditNotes.service.js', () => {
  loadedDependencyModules.push('creditNotes');
  return {
    consumeCreditNotesTx: vi.fn(),
  };
});

vi.mock('../services/finalize.service.js', () => {
  loadedDependencyModules.push('finalize');
  return {
    attemptFinalizeInvoice: vi.fn(),
  };
});

vi.mock('../../../../modules/cashCount/utils/cashCountQueries.js', () => {
  loadedDependencyModules.push('cashCountQueries');
  return {
    default: {
      getOpenCashCountDocFromTx: vi.fn(),
      getCashCountDocByIdFromTx: vi.fn(),
    },
  };
});

vi.mock('../../../../modules/cashCount/utils/cashCountCheck.js', () => {
  loadedDependencyModules.push('cashCountCheck');
  return {
    checkOpenCashCount: vi.fn(),
  };
});

vi.mock('../../../../core/utils/getNextID.js', () => {
  loadedDependencyModules.push('nextId');
  return {
    getNextIDTransactionalSnap: vi.fn(),
    applyNextIDTransactional: vi.fn(),
  };
});

vi.mock('../../../../modules/insurance/services/insurance.service.js', () => {
  loadedDependencyModules.push('insurance');
  return {
    getInsurance: vi.fn(),
  };
});

vi.mock('../../../../modules/accountReceivable/services/insuranceAuth.js', () => {
  loadedDependencyModules.push('insuranceAuth');
  return {
    addInsuranceAuth: vi.fn(),
  };
});

vi.mock('../services/audit.service.js', () => {
  loadedDependencyModules.push('audit');
  return {
    auditSafe: vi.fn(),
    auditTx: vi.fn(),
  };
});

vi.mock(
  '../../../../modules/electronicTaxReceipts/services/electronicTaxReceiptOutbox.service.js',
  () => {
    loadedDependencyModules.push('electronicTaxReceiptOutbox');
    return {
      processElectronicTaxReceiptOutboxTask: vi.fn(),
    };
  },
);

vi.mock(
  '../../../../modules/commissions/services/serviceCommissions.service.js',
  () => {
    loadedDependencyModules.push('serviceCommissions');
    return {
      syncServiceCommissionsTx: vi.fn(),
    };
  },
);

vi.mock('../services/printReady.service.js', () => ({
  attemptMarkInvoicePrintReady: (...args) =>
    attemptMarkInvoicePrintReadyMock(...args),
}));

import { processInvoiceOutbox } from './outbox.worker.js';

const refForPath = (path) => ({
  id: path.split('/').pop(),
  path,
});

describe('processInvoiceOutbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadedDependencyModules.length = 0;
    attemptMarkInvoicePrintReadyMock.mockResolvedValue({ status: 'skipped' });
    runTransactionMock.mockReset();
    docMock.mockReset();
    docMock.mockImplementation((path) => refForPath(path));
  });

  it('skips tasks that are not pending before loading dependencies', async () => {
    const result = await processInvoiceOutbox({
      params: {
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        taskId: 'task-1',
      },
      data: {
        data: () => ({
          type: 'unsupportedType',
          status: 'done',
        }),
        ref: {
          set: vi.fn(),
        },
      },
    });

    expect(result).toBeNull();
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(loggerInfoMock).toHaveBeenCalledWith(
      'Outbox task not pending, skipping',
      expect.objectContaining({
        invoiceId: 'invoice-1',
        taskId: 'task-1',
        status: 'done',
      }),
    );
    expect(loadedDependencyModules).toEqual([]);
  });

  it('loads only electronic receipt dependencies for electronic outbox tasks', async () => {
    const taskRef = refForPath(
      'businesses/business-1/invoicesV2/invoice-ecf/outbox/task-electronic',
    );

    const result = await processInvoiceOutbox({
      params: {
        businessId: 'business-1',
        invoiceId: 'invoice-ecf',
        taskId: 'task-electronic',
      },
      data: {
        data: () => ({
          type: 'issueElectronicTaxReceipt',
          status: 'pending',
        }),
        ref: taskRef,
      },
    });

    expect(result).toBeNull();
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect([...new Set(loadedDependencyModules)].sort()).toEqual(
      ['audit', 'electronicTaxReceiptOutbox', 'finalize'].sort(),
    );
  });

  it('uses the shared client upsert without adding transaction reads after writes', async () => {
    const operations = [];
    const taskRef = refForPath(
      'businesses/business-1/invoicesV2/invoice-1/outbox/task-1',
    );
    const taskPayload = {
      businessId: 'business-1',
      userId: 'user-1',
      cart: {
        cashCountId: 'cash-1',
        numberID: 27,
        products: [],
        payment: { value: 125 },
      },
      client: {
        id: 'client-1',
        name: 'Cliente Nuevo',
        personalId: '00112345678',
        tel: '809-555-0101',
      },
    };
    const taskData = {
      type: 'createCanonicalInvoice',
      status: 'pending',
      attempts: 0,
      payload: taskPayload,
    };
    let writeStarted = false;
    const tx = {
      get: vi.fn(async (ref) => {
        operations.push({ op: 'get', path: ref.path });
        if (writeStarted) {
          throw new Error(`read_after_write:${ref.path}`);
        }
        if (ref.path === taskRef.path) {
          return { data: () => taskData };
        }
        if (ref.path === 'businesses/business-1/invoicesV2/invoice-1') {
          return {
            exists: true,
            data: () => ({
              status: 'pending',
              snapshot: {},
            }),
          };
        }
        if (ref.path === 'businesses/business-1/invoices/invoice-1') {
          return {
            exists: false,
            data: () => null,
          };
        }
        if (ref.path === 'businesses/business-1/settings/billing') {
          return {
            exists: false,
            data: () => null,
          };
        }
        if (ref.path === 'businesses/business-1/clients/client-1') {
          return {
            exists: true,
            data: () => ({
              client: {
                id: 'client-1',
                name: 'Cliente Anterior',
                tel: '809-000-0000',
              },
              customSegment: 'vip',
            }),
          };
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
      set: vi.fn((ref, data, options) => {
        writeStarted = true;
        operations.push({ op: 'set', path: ref.path, data, options });
      }),
      update: vi.fn((ref, data) => {
        writeStarted = true;
        operations.push({ op: 'update', path: ref.path, data });
      }),
    };
    runTransactionMock.mockImplementation(async (callback) => callback(tx));

    const result = await processInvoiceOutbox({
      params: {
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        taskId: 'task-1',
      },
      data: {
        data: () => taskData,
        ref: taskRef,
      },
    });

    expect(result).toBeNull();
    const firstWriteIndex = operations.findIndex((entry) =>
      ['set', 'update'].includes(entry.op),
    );
    const clientReadIndex = operations.findIndex(
      (entry) =>
        entry.op === 'get' &&
        entry.path === 'businesses/business-1/clients/client-1',
    );
    expect(clientReadIndex).toBeGreaterThanOrEqual(0);
    expect(clientReadIndex).toBeLessThan(firstWriteIndex);
    expect(
      operations
        .slice(firstWriteIndex + 1)
        .some((entry) => entry.op === 'get'),
    ).toBe(false);

    const clientWrite = operations.find(
      (entry) =>
        entry.op === 'set' &&
        entry.path === 'businesses/business-1/clients/client-1',
    );
    expect(clientWrite).toEqual(
      expect.objectContaining({
        options: { merge: true },
      }),
    );
    expect(clientWrite.data.customSegment).toBe('vip');
    expect(clientWrite.data.client).toEqual(
      expect.objectContaining({
        id: 'client-1',
        name: 'Cliente Nuevo',
        personalID: '00112345678',
        tel: '809-555-0101',
      }),
    );
  });

  it('projects non-transport electronic receipts into the canonical invoice', async () => {
    const operations = [];
    const taskRef = refForPath(
      'businesses/business-1/invoicesV2/invoice-ecf/outbox/task-canonical',
    );
    const taskPayload = {
      businessId: 'business-1',
      userId: 'user-1',
      cart: {
        cashCountId: 'cash-1',
        numberID: 31,
        products: [],
        payment: { value: 189.98 },
      },
    };
    const taskData = {
      type: 'createCanonicalInvoice',
      status: 'pending',
      attempts: 0,
      payload: taskPayload,
    };
    const electronicSnapshot = {
      provider: 'gisys_fact',
      mode: 'shadow',
      status: 'pending',
      documentType: 'E32',
      transportEnabled: false,
    };
    const tx = {
      get: vi.fn(async (ref) => {
        operations.push({ op: 'get', path: ref.path });
        if (ref.path === taskRef.path) {
          return { data: () => taskData };
        }
        if (ref.path === 'businesses/business-1/invoicesV2/invoice-ecf') {
          return {
            exists: true,
            data: () => ({
              status: 'pending',
              idempotencyKey: 'idem-ecf',
              snapshot: {
                fiscalMode: 'electronic_ecf',
                documentFormat: 'electronic',
                electronicTaxReceipt: electronicSnapshot,
                ncf: {
                  type: 'fiscal-consumer',
                  status: 'electronic_pending',
                },
              },
            }),
          };
        }
        if (ref.path === 'businesses/business-1/invoices/invoice-ecf') {
          return {
            exists: false,
            data: () => null,
          };
        }
        if (ref.path === 'businesses/business-1/settings/billing') {
          return {
            exists: false,
            data: () => null,
          };
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
      set: vi.fn((ref, data, options) => {
        operations.push({ op: 'set', path: ref.path, data, options });
      }),
      update: vi.fn((ref, data) => {
        operations.push({ op: 'update', path: ref.path, data });
      }),
    };
    runTransactionMock.mockImplementation(async (callback) => callback(tx));

    const result = await processInvoiceOutbox({
      params: {
        businessId: 'business-1',
        invoiceId: 'invoice-ecf',
        taskId: 'task-canonical',
      },
      data: {
        data: () => taskData,
        ref: taskRef,
      },
    });

    expect(result).toBeNull();
    const canonicalWrite = operations.find(
      (entry) =>
        entry.op === 'set' &&
        entry.path === 'businesses/business-1/invoices/invoice-ecf',
    );
    expect(canonicalWrite.data.data).toEqual(
      expect.objectContaining({
        documentFormat: 'electronic',
        electronicTaxReceipt: electronicSnapshot,
        fiscalMode: 'electronic_ecf',
        fiscal: {
          electronic: electronicSnapshot,
        },
      }),
    );
    expect(canonicalWrite.data.data.NCF).toBeUndefined();
    expect(canonicalWrite.data.data.eNcf).toBeUndefined();

    const invoiceUpdate = operations.find(
      (entry) =>
        entry.op === 'update' &&
        entry.path === 'businesses/business-1/invoicesV2/invoice-ecf' &&
        entry.data.canonicalReadyAt,
    );
    expect(invoiceUpdate).toBeTruthy();
    expect(invoiceUpdate.data.status).toBeUndefined();
  });

  it('uses the parent invoice actor when task payload userId differs', async () => {
    const operations = [];
    const taskRef = refForPath(
      'businesses/business-1/invoicesV2/invoice-actor/outbox/task-canonical',
    );
    const taskPayload = {
      businessId: 'business-1',
      userId: 'spoofed-user',
      cart: {
        cashCountId: 'cash-1',
        numberID: 32,
        products: [],
        payment: { value: 100 },
      },
    };
    const taskData = {
      type: 'createCanonicalInvoice',
      status: 'pending',
      attempts: 0,
      payload: taskPayload,
    };
    const tx = {
      get: vi.fn(async (ref) => {
        operations.push({ op: 'get', path: ref.path });
        if (ref.path === taskRef.path) {
          return { data: () => taskData };
        }
        if (ref.path === 'businesses/business-1/invoicesV2/invoice-actor') {
          return {
            exists: true,
            data: () => ({
              status: 'pending',
              userId: 'trusted-user',
              snapshot: {},
            }),
          };
        }
        if (ref.path === 'businesses/business-1/invoices/invoice-actor') {
          return {
            exists: false,
            data: () => null,
          };
        }
        if (ref.path === 'businesses/business-1/settings/billing') {
          return {
            exists: false,
            data: () => null,
          };
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
      set: vi.fn((ref, data, options) => {
        operations.push({ op: 'set', path: ref.path, data, options });
      }),
      update: vi.fn((ref, data) => {
        operations.push({ op: 'update', path: ref.path, data });
      }),
    };
    runTransactionMock.mockImplementation(async (callback) => callback(tx));

    const result = await processInvoiceOutbox({
      params: {
        businessId: 'business-1',
        invoiceId: 'invoice-actor',
        taskId: 'task-canonical',
      },
      data: {
        data: () => taskData,
        ref: taskRef,
      },
    });

    expect(result).toBeNull();
    const canonicalWrite = operations.find(
      (entry) =>
        entry.op === 'set' &&
        entry.path === 'businesses/business-1/invoices/invoice-actor',
    );
    expect(canonicalWrite.data.data).toEqual(
      expect.objectContaining({
        userID: 'trusted-user',
        user: expect.objectContaining({
          path: 'users/trusted-user',
        }),
      }),
    );
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'Invoice trigger payload userId differs from invoice userId',
      expect.objectContaining({
        invoiceId: 'invoice-actor',
        invoiceUserId: 'trusted-user',
        payloadUserId: 'spoofed-user',
      }),
    );
  });
});
