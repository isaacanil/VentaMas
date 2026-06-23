import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  auditTxMock,
  detachFromCashCountMock,
  docMock,
  loggerWarnMock,
  runTransactionMock,
} = vi.hoisted(() => ({
  auditTxMock: vi.fn(),
  detachFromCashCountMock: vi.fn(),
  docMock: vi.fn(),
  loggerWarnMock: vi.fn(),
  runTransactionMock: vi.fn(),
}));

vi.mock('firebase-functions', () => ({
  logger: {
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
  },
  Timestamp: {
    now: vi.fn(() => new Date('2026-04-13T10:00:00.000Z')),
  },
  db: {
    doc: (...args) => docMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../services/compensation.service.js', () => ({
  compensateAR: vi.fn(),
  compensateCreditNotes: vi.fn(),
  deleteCanonicalInvoice: vi.fn(),
  detachFromCashCount: (...args) => detachFromCashCountMock(...args),
}));

vi.mock('../services/audit.service.js', () => ({
  auditSafe: vi.fn(),
  auditTx: (...args) => auditTxMock(...args),
}));

import { processInvoiceCompensation } from './compensation.worker.js';

const refForPath = (path) => ({
  id: path.split('/').pop(),
  path,
});

describe('processInvoiceCompensation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runTransactionMock.mockReset();
    docMock.mockReset();
    docMock.mockImplementation((path) => refForPath(path));
  });

  it('uses the parent invoice actor when compensation payload userId differs', async () => {
    const compRef = refForPath(
      'businesses/business-1/invoicesV2/invoice-actor/compensations/comp-1',
    );
    const compData = {
      type: 'attachToCashCount',
      status: 'pending',
      attempts: 0,
      payload: {
        userId: 'spoofed-user',
      },
    };
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === compRef.path) {
          return { data: () => compData };
        }
        if (ref.path === 'businesses/business-1/invoicesV2/invoice-actor') {
          return {
            exists: true,
            data: () => ({
              userId: 'trusted-user',
              snapshot: {},
            }),
          };
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
      set: vi.fn(),
      update: vi.fn(),
    };
    runTransactionMock.mockImplementation(async (callback) => callback(tx));

    const result = await processInvoiceCompensation({
      params: {
        businessId: 'business-1',
        invoiceId: 'invoice-actor',
        compId: 'comp-1',
      },
      data: {
        data: () => compData,
        ref: compRef,
      },
    });

    expect(result).toBeNull();
    expect(detachFromCashCountMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        businessId: 'business-1',
        invoiceId: 'invoice-actor',
        userId: 'trusted-user',
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

  it('marks inventory compensation as manual_required instead of done', async () => {
    const compRef = refForPath(
      'businesses/business-1/invoicesV2/invoice-inventory/compensations/comp-inventory',
    );
    const usageRef = refForPath('businesses/business-1/ncfUsage/usage-1');
    const compData = {
      type: 'updateInventory',
      status: 'pending',
      attempts: 0,
      payload: {
        products: [{ id: 'product-1', quantity: 2 }],
      },
    };
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === compRef.path) {
          return { data: () => compData };
        }
        if (ref.path === 'businesses/business-1/invoicesV2/invoice-inventory') {
          return {
            exists: true,
            data: () => ({
              userId: 'trusted-user',
              snapshot: {
                ncf: {
                  usageId: 'usage-1',
                },
              },
            }),
          };
        }
        if (ref.path === usageRef.path) {
          return {
            exists: true,
            ref: usageRef,
            data: () => ({
              status: 'pending',
            }),
          };
        }
        throw new Error(`unexpected_read:${ref.path}`);
      }),
      set: vi.fn(),
      update: vi.fn(),
    };
    runTransactionMock.mockImplementation(async (callback) => callback(tx));

    const result = await processInvoiceCompensation({
      params: {
        businessId: 'business-1',
        invoiceId: 'invoice-inventory',
        compId: 'comp-inventory',
      },
      data: {
        data: () => compData,
        ref: compRef,
      },
    });

    expect(result).toBeNull();
    expect(tx.update).toHaveBeenCalledWith(
      usageRef,
      expect.objectContaining({
        status: 'voided',
      }),
    );
    expect(tx.set).toHaveBeenCalledWith(
      compRef,
      expect.objectContaining({
        status: 'manual_required',
        attempts: 1,
        requiresManualReview: true,
        lastError: expect.stringContaining('manual stock review'),
      }),
      { merge: true },
    );
    expect(
      tx.set.mock.calls.some(
        ([ref, data]) => ref === compRef && data?.status === 'done',
      ),
    ).toBe(false);
    expect(auditTxMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        event: 'compensation_manual_required',
        level: 'warn',
      }),
    );
  });
});
