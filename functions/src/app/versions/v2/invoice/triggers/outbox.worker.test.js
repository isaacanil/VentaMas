import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  loggerInfoMock,
  runTransactionMock,
} = vi.hoisted(() => {
  const hoistedLoggerInfoMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();

  return {
    loggerInfoMock: hoistedLoggerInfoMock,
    runTransactionMock: hoistedRunTransactionMock,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    info: (...args) => loggerInfoMock(...args),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_config, handler) => handler,
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(),
    increment: vi.fn(),
    arrayUnion: vi.fn(),
  },
  Timestamp: {
    now: vi.fn(() => new Date('2026-04-13T10:00:00.000Z')),
  },
  db: {
    doc: vi.fn(),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

import { processInvoiceOutbox } from './outbox.worker.js';

describe('processInvoiceOutbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });
});
