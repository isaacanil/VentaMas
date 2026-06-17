import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/config/firebase.js', () => ({
  FieldValue: {
    arrayUnion: vi.fn((value) => ({ arrayUnion: value })),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
  },
  Timestamp: {
    now: vi.fn(() => 'timestamp-now'),
  },
}));

import {
  buildElectronicTaxReceiptAttemptRecord,
  buildElectronicTaxReceiptAttemptRefreshRecord,
  resolveElectronicTaxReceiptAttemptId,
} from './electronicTaxReceiptAttempt.service.js';

describe('electronicTaxReceiptAttempt.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds an immutable fiscal attempt record for an issued adjustment note', () => {
    const record = buildElectronicTaxReceiptAttemptRecord({
      attemptId: 'task-1',
      businessId: 'business-1',
      documentKind: 'creditNote',
      documentId: 'credit-note-1',
      documentType: 'E34',
      ncfType: 'NOTAS DE CRÉDITO',
      note: { ncf: null },
      taskId: 'task-1',
      task: { attempts: 0, createdAt: 'task-created-at' },
      issuePayload: {
        documentType: 'E34',
        reference: {
          modifiedENcf: 'E310000000001',
          modifiedDocumentDate: '2026-06-16T12:00:00.000Z',
          modificationCode: '3',
        },
      },
      result: {
        documentType: 'E34',
        requestHash: 'request-hash',
        response: {
          submissionId: 'sub-1',
          eNcf: 'E340000000001',
          dgiiCode: '01',
          dgiiMessage: 'Aceptado',
        },
        electronicSnapshot: {
          status: 'accepted',
          documentType: 'E34',
          submissionId: 'sub-1',
          eNcf: 'E340000000001',
          requestHash: 'request-hash',
          dgiiCode: '01',
          dgiiMessage: 'Aceptado',
        },
      },
    });

    expect(record).toMatchObject({
      id: 'task-1',
      businessId: 'business-1',
      documentKind: 'creditNote',
      documentId: 'credit-note-1',
      provider: 'gisys_fact',
      documentType: 'E34',
      status: 'accepted',
      fiscalStatus: 'accepted',
      eNcf: 'E340000000001',
      submissionId: 'sub-1',
      requestHash: 'request-hash',
      payloadHash: 'request-hash',
      dgiiCode: '01',
      dgiiMessage: 'Aceptado',
      payloadSnapshot: expect.objectContaining({
        documentType: 'E34',
      }),
      reference: expect.objectContaining({
        modifiedENcf: 'E310000000001',
      }),
      providerResponse: expect.objectContaining({
        submissionId: 'sub-1',
      }),
      createdAt: 'task-created-at',
      attemptedAt: 'server-timestamp',
      updatedAt: 'server-timestamp',
    });
    expect(record.statusEvents).toEqual([
      { status: 'accepted', source: 'issue', at: 'timestamp-now' },
    ]);
  });

  it('records local failures without pretending DGII rejected the document', () => {
    const error = new Error('provider timeout');
    const record = buildElectronicTaxReceiptAttemptRecord({
      attemptId: 'task-timeout',
      businessId: 'business-1',
      documentKind: 'debitNote',
      documentId: 'debit-note-1',
      documentType: 'E33',
      ncfType: 'NOTAS DE DÉBITO',
      taskId: 'task-timeout',
      task: { attempts: 1 },
      issuePayload: {
        documentType: 'E33',
        reference: { modifiedENcf: 'E310000000001' },
      },
      result: {
        documentType: 'E33',
        electronicSnapshot: {
          status: 'local_failed',
          documentType: 'E33',
          lastError: 'provider timeout',
        },
      },
      error,
    });

    expect(record).toMatchObject({
      id: 'task-timeout',
      documentKind: 'debitNote',
      status: 'local_failed',
      fiscalStatus: 'local_failed',
      lastError: 'provider timeout',
      errorName: 'Error',
      outboxAttempts: 2,
    });
    expect(record.submissionId).toBeNull();
    expect(record.statusEvents).toEqual([
      { status: 'local_failed', source: 'local_error', at: 'timestamp-now' },
    ]);
  });

  it('builds a merge record when refresh reconciles an existing attempt', () => {
    const record = buildElectronicTaxReceiptAttemptRefreshRecord({
      attemptId: 'task-1',
      documentKind: 'creditNote',
      documentId: 'credit-note-1',
      electronicSnapshot: {
        status: 'accepted',
        documentType: 'E34',
        submissionId: 'sub-1',
        eNcf: 'E340000000001',
        requestHash: 'request-hash',
        dgiiCode: '01',
        dgiiMessage: 'Aceptado',
      },
      response: {
        submissionId: 'sub-1',
        eNcf: 'E340000000001',
      },
    });

    expect(record).toMatchObject({
      id: 'task-1',
      documentKind: 'creditNote',
      documentId: 'credit-note-1',
      status: 'accepted',
      eNcf: 'E340000000001',
      submissionId: 'sub-1',
      refreshedAt: 'server-timestamp',
      updatedAt: 'server-timestamp',
    });
    expect(record.statusEvents).toEqual({
      arrayUnion: { status: 'accepted', source: 'refresh', at: 'timestamp-now' },
    });
  });

  it('prefers the outbox task id as the stable fiscal attempt id', () => {
    expect(
      resolveElectronicTaxReceiptAttemptId({
        taskId: 'task-1',
        currentSnapshot: { attemptId: 'attempt-2' },
        response: { submissionId: 'sub-1' },
        documentId: 'credit-note-1',
      }),
    ).toBe('task-1');
  });
});
