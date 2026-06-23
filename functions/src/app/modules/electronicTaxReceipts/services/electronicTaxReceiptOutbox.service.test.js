import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: vi.fn(),
    runTransaction: vi.fn(),
  },
  FieldValue: {
    serverTimestamp: vi.fn(),
    arrayUnion: vi.fn(),
  },
  Timestamp: {
    now: vi.fn(),
  },
}));

vi.mock('./gisysFactClient.service.js', () => ({
  getGisysFactDocumentStatus: vi.fn(),
  issueGisysFactDocument: vi.fn(),
  refreshGisysFactDocumentStatus: vi.fn(),
}));

vi.mock('../mappers/gisysIssuePayload.mapper.js', () => ({
  buildGisysIssuePayload: vi.fn(() => ({
    payload: { document: 'payload' },
    documentType: 'E32',
    requestHash: 'request-hash',
  })),
}));

vi.mock('../config/gisysFact.config.js', () => ({
  getGisysFactConfigIssues: vi.fn(() => []),
  resolveGisysFactConfig: vi.fn(() => ({ mode: 'required' })),
}));

vi.mock('../config/gisysFactPlatform.config.js', () => ({
  getGisysFactPlatformConfig: vi.fn(async () => ({})),
}));

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';

import {
  issueGisysFactDocument,
  refreshGisysFactDocumentStatus,
} from './gisysFactClient.service.js';
import {
  buildGisysFactIdempotencyKey,
  processElectronicTaxReceiptOutboxTask,
  refreshElectronicTaxReceiptStatus,
  resolveElectronicTaxReceiptLifecycleStatus,
} from './electronicTaxReceiptOutbox.service.js';

describe('electronicTaxReceiptOutbox.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FieldValue.serverTimestamp.mockReturnValue('server-timestamp');
    FieldValue.arrayUnion.mockImplementation((value) => ({
      arrayUnion: value,
    }));
    Timestamp.now.mockReturnValue('timestamp-now');
  });

  it('uses a stable GISYS idempotency key independent from outbox task ids', () => {
    expect(
      buildGisysFactIdempotencyKey({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        documentType: 'e31',
      }),
    ).toBe('ventamas:business-1:invoice-1:ecf:E31:v1');
  });

  it('keeps issued as the lifecycle status while DGII validation is not checked', () => {
    expect(
      resolveElectronicTaxReceiptLifecycleStatus({
        currentStatus: 'issued',
        response: {
          eNcf: 'E320000000001',
          localStatus: 'signed_local',
          requestStatus: 'queued',
          dgiiSubmissionStatus: 'queued',
          dgiiStatus: 'pending',
          dgiiValidationStatus: 'not_checked',
        },
      }),
    ).toBe('issued');
  });

  it('derives issued from a signed GISYS response when the current status is not checked', () => {
    expect(
      resolveElectronicTaxReceiptLifecycleStatus({
        currentStatus: 'not_checked',
        response: {
          eNcf: 'E320000000001',
          localStatus: 'signed_local',
          dgiiValidationStatus: 'not_checked',
          links: {
            xml: 'https://api.gisys.net/v1/ecf/sub-1/xml',
          },
        },
      }),
    ).toBe('issued');
  });

  it('promotes terminal DGII validation statuses to lifecycle status', () => {
    expect(
      resolveElectronicTaxReceiptLifecycleStatus({
        currentStatus: 'issued',
        response: {
          eNcf: 'E320000000001',
          dgiiValidationStatus: 'accepted',
        },
      }),
    ).toBe('accepted');
  });

  it('promotes accepted RFCE over a pending standard DGII status', () => {
    expect(
      resolveElectronicTaxReceiptLifecycleStatus({
        currentStatus: 'issued',
        response: {
          eNcf: 'E320000000007',
          requestStatus: 'accepted',
          dgiiSubmissionStatus: 'not_applicable_standard_channel',
          dgiiStatus: 'pending',
          dgiiValidationStatus: 'not_checked',
          routing: {
            channel: 'recepcion_fc',
            rfceToDgii: true,
          },
          rfceStatus: 'accepted',
          rfceSubmissionStatus: 'accepted',
          rfceDgiiCode: 1,
          rfceDgiiEstado: 'Aceptado',
        },
      }),
    ).toBe('accepted');
  });

  it('promotes GISYS processing errors over a previously issued lifecycle status', () => {
    expect(
      resolveElectronicTaxReceiptLifecycleStatus({
        currentStatus: 'issued',
        response: {
          status: 'issued',
          eNcf: 'E320000000001',
          localStatus: 'signed_local',
          requestStatus: 'error',
          dgiiSubmissionStatus: 'not_applicable_standard_channel',
          dgiiValidationStatus: 'not_checked',
        },
      }),
    ).toBe('error');
  });

  it('promotes DGII rejection over an older issued snapshot status', () => {
    expect(
      resolveElectronicTaxReceiptLifecycleStatus({
        currentStatus: 'issued',
        response: {
          status: 'issued',
          eNcf: 'E320000000001',
          localStatus: 'signed_local',
          requestStatus: 'error',
          dgiiSubmissionStatus: 'not_applicable_standard_channel',
          dgiiValidationStatus: 'not_checked',
          dgiiStatus: 'rejected',
        },
      }),
    ).toBe('rejected');
  });

  it('fails a required invoice e-CF task when GISYS returns a rejected lifecycle', async () => {
    const invoiceDoc = {
      snapshot: {
        ncf: {
          documentType: 'E32',
        },
      },
    };
    const invoiceRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => invoiceDoc,
      })),
    };
    const taskRef = {
      path: 'businesses/business-1/invoicesV2/invoice-1/outbox/task-1',
    };
    const businessRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({}),
      })),
    };
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref === taskRef) {
          return {
            data: () => ({
              status: 'pending',
              attempts: 0,
              payload: {
                mode: 'required',
                transportEnabled: true,
              },
            }),
          };
        }
        if (ref === invoiceRef) {
          return {
            data: () => invoiceDoc,
          };
        }
        throw new Error(`Unexpected tx ref: ${ref.path || ref}`);
      }),
      set: vi.fn(),
      update: vi.fn(),
    };

    db.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1') {
        return businessRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });
    db.runTransaction.mockImplementation(async (callback) => callback(tx));
    issueGisysFactDocument.mockResolvedValue({
      eNcf: 'E320000000001',
      dgiiStatus: 'rejected',
      messages: [
        {
          code: '145',
          message: 'Fecha de vencimiento de secuencia inválida.',
        },
      ],
    });

    await expect(
      processElectronicTaxReceiptOutboxTask({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        taskId: 'task-1',
        taskRef,
        invoiceRef,
        task: {
          payload: {
            mode: 'required',
            transportEnabled: true,
          },
        },
      }),
    ).rejects.toThrow('Fecha de vencimiento de secuencia inválida.');

    expect(tx.set).toHaveBeenCalledWith(
      taskRef,
      expect.objectContaining({
        status: 'failed',
        attempts: 1,
        lastError: 'Fecha de vencimiento de secuencia inválida.',
      }),
      { merge: true },
    );
    expect(tx.update).toHaveBeenCalledWith(
      invoiceRef,
      expect.objectContaining({
        'snapshot.electronicTaxReceipt': expect.objectContaining({
          mode: 'required',
          status: 'rejected',
          dgiiCode: '145',
          dgiiMessage: 'Fecha de vencimiento de secuencia inválida.',
          lastError: 'Fecha de vencimiento de secuencia inválida.',
        }),
        'snapshot.ncf': expect.objectContaining({
          status: 'failed',
          documentFormat: 'electronic',
          provider: 'gisys_fact',
          documentType: 'E32',
        }),
      }),
    );
    expect(tx.set).not.toHaveBeenCalledWith(
      taskRef,
      expect.objectContaining({ status: 'done' }),
      { merge: true },
    );
  });

  it('does not preserve a stale refresh transport error when GISYS returns current status', async () => {
    const staleLastError =
      'GISYS FACT request failed (404): Cannot POST /v1/submissions/sub-1/process-submit';
    const invoiceDoc = {
      snapshot: {
        electronicTaxReceipt: {
          status: 'issued',
          mode: 'required',
          documentType: 'E32',
          requestHash: 'request-hash',
          submissionId: 'sub-1',
          eNcf: 'E320000000001',
          lastError: staleLastError,
        },
        ncf: {
          code: 'E320000000001',
        },
      },
    };
    const invoiceRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => invoiceDoc,
      })),
    };
    const businessRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({}),
      })),
    };
    const canonicalInvoiceRef = {};
    const tx = {
      get: vi.fn(async () => ({
        data: () => invoiceDoc,
      })),
      set: vi.fn(),
      update: vi.fn(),
    };

    db.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1/invoicesV2/invoice-1') {
        return invoiceRef;
      }
      if (path === 'businesses/business-1') {
        return businessRef;
      }
      if (path === 'businesses/business-1/invoices/invoice-1') {
        return canonicalInvoiceRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });
    db.runTransaction.mockImplementation(async (callback) => callback(tx));
    refreshGisysFactDocumentStatus.mockResolvedValue({
      eNcf: 'E320000000001',
      localStatus: 'signed_local',
      requestStatus: 'error',
      dgiiSubmissionStatus: 'not_applicable_standard_channel',
      dgiiValidationStatus: 'not_checked',
      dgiiStatus: 'rejected',
    });

    const result = await refreshElectronicTaxReceiptStatus({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
    });

    expect(result.electronicTaxReceipt.status).toBe('rejected');
    expect(result.electronicTaxReceipt.lastError).toBeNull();
    expect(JSON.stringify(result.electronicTaxReceipt)).not.toContain(
      'Cannot POST',
    );
    expect(
      tx.update.mock.calls[0][1]['snapshot.electronicTaxReceipt'].lastError,
    ).toBeNull();
  });

  it('refreshes an E34 credit note document status from GISYS', async () => {
    const creditNoteDoc = {
      status: 'electronic_pending',
      ncf: 'E340000000001',
      electronicTaxReceipt: {
        status: 'issued',
        mode: 'required',
        documentType: 'E34',
        requestHash: 'request-hash',
        submissionId: 'sub-34',
        eNcf: 'E340000000001',
      },
    };
    const creditNoteRef = {
      path: 'businesses/business-1/creditNotes/credit-note-1',
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ path: 'credit-note-1/fiscalAttempts/sub-34' })),
      })),
      get: vi.fn(async () => ({
        exists: true,
        data: () => creditNoteDoc,
      })),
    };
    const businessRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({}),
      })),
    };
    const tx = {
      get: vi.fn(async () => ({
        data: () => creditNoteDoc,
      })),
      set: vi.fn(),
      update: vi.fn(),
    };

    db.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1/creditNotes/credit-note-1') {
        return creditNoteRef;
      }
      if (
        path ===
        'businesses/business-1/creditNotes/credit-note-1/fiscalAttempts/sub-34'
      ) {
        return { path };
      }
      if (path === 'businesses/business-1') {
        return businessRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });
    db.runTransaction.mockImplementation(async (callback) => callback(tx));
    refreshGisysFactDocumentStatus.mockResolvedValue({
      eNcf: 'E340000000001',
      dgiiValidationStatus: 'accepted',
      dgiiStatus: 'accepted',
    });

    const result = await refreshElectronicTaxReceiptStatus({
      businessId: 'business-1',
      creditNoteId: 'credit-note-1',
      documentKind: 'creditNote',
    });

    expect(result.documentKind).toBe('creditNote');
    expect(result.creditNoteId).toBe('credit-note-1');
    expect(tx.update).toHaveBeenCalledWith(
      creditNoteRef,
      expect.objectContaining({
        ncf: 'E340000000001',
        eNcf: 'E340000000001',
        status: 'issued',
        fiscalMode: 'electronic_ecf',
        documentFormat: 'electronic',
      }),
    );
    expect(tx.update.mock.calls[0][1].electronicTaxReceipt.status).toBe(
      'accepted',
    );
    expect(tx.set).toHaveBeenCalledWith(
      {
        path: 'businesses/business-1/creditNotes/credit-note-1/fiscalAttempts/sub-34',
      },
      expect.objectContaining({
        id: 'sub-34',
        documentKind: 'creditNote',
        documentId: 'credit-note-1',
        status: 'accepted',
        eNcf: 'E340000000001',
        submissionId: 'sub-34',
      }),
      { merge: true },
    );
  });

  it('refreshes an E33 debit note document status from GISYS', async () => {
    const debitNoteDoc = {
      status: 'electronic_pending',
      ncf: 'E330000000001',
      electronicTaxReceipt: {
        status: 'issued',
        mode: 'required',
        documentType: 'E33',
        requestHash: 'request-hash',
        submissionId: 'sub-33',
        eNcf: 'E330000000001',
      },
    };
    const debitNoteRef = {
      path: 'businesses/business-1/debitNotes/debit-note-1',
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ path: 'debit-note-1/fiscalAttempts/sub-33' })),
      })),
      get: vi.fn(async () => ({
        exists: true,
        data: () => debitNoteDoc,
      })),
    };
    const businessRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({}),
      })),
    };
    const tx = {
      get: vi.fn(async () => ({
        data: () => debitNoteDoc,
      })),
      set: vi.fn(),
      update: vi.fn(),
    };

    db.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1/debitNotes/debit-note-1') {
        return debitNoteRef;
      }
      if (
        path ===
        'businesses/business-1/debitNotes/debit-note-1/fiscalAttempts/sub-33'
      ) {
        return { path };
      }
      if (path === 'businesses/business-1') {
        return businessRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });
    db.runTransaction.mockImplementation(async (callback) => callback(tx));
    refreshGisysFactDocumentStatus.mockResolvedValue({
      eNcf: 'E330000000001',
      requestStatus: 'accepted',
      dgiiValidationStatus: 'accepted',
      dgiiStatus: 'accepted',
      dgiiMessage: 'Documento firmado localmente y encolado para envio DGII.',
    });

    const result = await refreshElectronicTaxReceiptStatus({
      businessId: 'business-1',
      debitNoteId: 'debit-note-1',
      documentKind: 'debitNote',
    });

    expect(result.documentKind).toBe('debitNote');
    expect(result.debitNoteId).toBe('debit-note-1');
    expect(tx.update).toHaveBeenCalledWith(
      debitNoteRef,
      expect.objectContaining({
        ncf: 'E330000000001',
        eNcf: 'E330000000001',
        status: 'issued',
        fiscalMode: 'electronic_ecf',
        documentFormat: 'electronic',
      }),
    );
    expect(tx.update.mock.calls[0][1].electronicTaxReceipt.status).toBe(
      'accepted',
    );
    expect(tx.update.mock.calls[0][1].electronicTaxReceipt).toEqual(
      expect.objectContaining({
        dgiiCode: '01',
        dgiiMessage: 'Aceptado',
        lastError: null,
      }),
    );
    expect(tx.set).toHaveBeenCalledWith(
      {
        path: 'businesses/business-1/debitNotes/debit-note-1/fiscalAttempts/sub-33',
      },
      expect.objectContaining({
        id: 'sub-33',
        documentKind: 'debitNote',
        documentId: 'debit-note-1',
        status: 'accepted',
        eNcf: 'E330000000001',
        submissionId: 'sub-33',
      }),
      { merge: true },
    );
  });

  it('keeps E33 debit notes pending when GISYS has not returned a terminal DGII status', async () => {
    const debitNoteDoc = {
      status: 'issued',
      ncf: 'E330000000002',
      electronicTaxReceipt: {
        status: 'issued',
        mode: 'required',
        documentType: 'E33',
        requestHash: 'request-hash',
        submissionId: 'sub-33-pending',
        eNcf: 'E330000000002',
      },
    };
    const debitNoteRef = {
      path: 'businesses/business-1/debitNotes/debit-note-pending',
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          path: 'debit-note-pending/fiscalAttempts/sub-33-pending',
        })),
      })),
      get: vi.fn(async () => ({
        exists: true,
        data: () => debitNoteDoc,
      })),
    };
    const businessRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({}),
      })),
    };
    const tx = {
      get: vi.fn(async () => ({
        data: () => debitNoteDoc,
      })),
      set: vi.fn(),
      update: vi.fn(),
    };

    db.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1/debitNotes/debit-note-pending') {
        return debitNoteRef;
      }
      if (
        path ===
        'businesses/business-1/debitNotes/debit-note-pending/fiscalAttempts/sub-33-pending'
      ) {
        return { path };
      }
      if (path === 'businesses/business-1') {
        return businessRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });
    db.runTransaction.mockImplementation(async (callback) => callback(tx));
    refreshGisysFactDocumentStatus.mockResolvedValue({
      eNcf: 'E330000000002',
      localStatus: 'signed_local',
      requestStatus: 'submitted',
      dgiiSubmissionStatus: 'submitted',
      dgiiStatus: 'pending',
      dgiiValidationStatus: 'not_checked',
    });

    const result = await refreshElectronicTaxReceiptStatus({
      businessId: 'business-1',
      debitNoteId: 'debit-note-pending',
      documentKind: 'debitNote',
    });

    expect(result.electronicTaxReceipt.status).toBe('submitted');
    expect(tx.update).toHaveBeenCalledWith(
      debitNoteRef,
      expect.objectContaining({
        ncf: 'E330000000002',
        eNcf: 'E330000000002',
        status: 'electronic_pending',
        fiscalMode: 'electronic_ecf',
        documentFormat: 'electronic',
      }),
    );
  });

  it('persists diagnostic aliases when an E33 debit note is rejected by DGII', async () => {
    const debitNoteDoc = {
      status: 'electronic_pending',
      ncf: 'E330000000003',
      electronicTaxReceipt: {
        status: 'issued',
        mode: 'required',
        documentType: 'E33',
        requestHash: 'request-hash',
        submissionId: 'sub-33-rejected',
        eNcf: 'E330000000003',
      },
    };
    const debitNoteRef = {
      path: 'businesses/business-1/debitNotes/debit-note-rejected',
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          path: 'debit-note-rejected/fiscalAttempts/sub-33-rejected',
        })),
      })),
      get: vi.fn(async () => ({
        exists: true,
        data: () => debitNoteDoc,
      })),
    };
    const businessRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({}),
      })),
    };
    const tx = {
      get: vi.fn(async () => ({
        data: () => debitNoteDoc,
      })),
      set: vi.fn(),
      update: vi.fn(),
    };

    db.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1/debitNotes/debit-note-rejected') {
        return debitNoteRef;
      }
      if (
        path ===
        'businesses/business-1/debitNotes/debit-note-rejected/fiscalAttempts/sub-33-rejected'
      ) {
        return { path };
      }
      if (path === 'businesses/business-1') {
        return businessRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });
    db.runTransaction.mockImplementation(async (callback) => callback(tx));
    refreshGisysFactDocumentStatus.mockResolvedValue({
      eNcf: 'E330000000003',
      status: 'rejected',
      code: 'RFCE-VAL-001',
      message: 'El comprobante modificado no es valido para esta nota.',
      diagnostics: [
        {
          code: 'DGII-REF',
          message: 'La referencia del e-CF modificado no fue aceptada.',
        },
      ],
    });

    const result = await refreshElectronicTaxReceiptStatus({
      businessId: 'business-1',
      debitNoteId: 'debit-note-rejected',
      documentKind: 'debitNote',
    });

    expect(result.electronicTaxReceipt.status).toBe('rejected');
    expect(tx.update).toHaveBeenCalledWith(
      debitNoteRef,
      expect.objectContaining({
        status: 'electronic_failed',
      }),
    );
    expect(tx.update.mock.calls[0][1].electronicTaxReceipt).toEqual(
      expect.objectContaining({
        dgiiCode: 'RFCE-VAL-001',
        dgiiMessage: 'La referencia del e-CF modificado no fue aceptada.',
        dgiiMessages: [
          {
            code: 'DGII-REF',
            message: 'La referencia del e-CF modificado no fue aceptada.',
          },
        ],
        lastError: 'La referencia del e-CF modificado no fue aceptada.',
      }),
    );
  });

  it('preserves credit note usage status while refreshing an accepted E34', async () => {
    const creditNoteDoc = {
      status: 'applied',
      ncf: 'E340000000004',
      electronicTaxReceipt: {
        status: 'accepted',
        mode: 'required',
        documentType: 'E34',
        requestHash: 'request-hash',
        submissionId: 'sub-34-applied',
        eNcf: 'E340000000004',
      },
    };
    const creditNoteRef = {
      path: 'businesses/business-1/creditNotes/credit-note-applied',
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          path: 'credit-note-applied/fiscalAttempts/sub-34-applied',
        })),
      })),
      get: vi.fn(async () => ({
        exists: true,
        data: () => creditNoteDoc,
      })),
    };
    const businessRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({}),
      })),
    };
    const tx = {
      get: vi.fn(async () => ({
        data: () => creditNoteDoc,
      })),
      set: vi.fn(),
      update: vi.fn(),
    };

    db.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1/creditNotes/credit-note-applied') {
        return creditNoteRef;
      }
      if (
        path ===
        'businesses/business-1/creditNotes/credit-note-applied/fiscalAttempts/sub-34-applied'
      ) {
        return { path };
      }
      if (path === 'businesses/business-1') {
        return businessRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });
    db.runTransaction.mockImplementation(async (callback) => callback(tx));
    refreshGisysFactDocumentStatus.mockResolvedValue({
      eNcf: 'E340000000004',
      dgiiValidationStatus: 'accepted',
      dgiiStatus: 'accepted',
    });

    await refreshElectronicTaxReceiptStatus({
      businessId: 'business-1',
      creditNoteId: 'credit-note-applied',
      documentKind: 'creditNote',
    });

    expect(tx.update).toHaveBeenCalledWith(
      creditNoteRef,
      expect.objectContaining({
        ncf: 'E340000000004',
        eNcf: 'E340000000004',
        status: 'applied',
        fiscalMode: 'electronic_ecf',
        documentFormat: 'electronic',
      }),
    );
  });

  it('persists DGII rejection diagnostics for E33 debit notes', async () => {
    const debitNoteDoc = {
      status: 'issued',
      ncf: 'E330000000001',
      electronicTaxReceipt: {
        status: 'issued',
        mode: 'required',
        documentType: 'E33',
        requestHash: 'request-hash',
        submissionId: 'sub-33-rejected',
        eNcf: 'E330000000001',
      },
    };
    const debitNoteRef = {
      path: 'businesses/business-1/debitNotes/debit-note-rejected',
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          path: 'debit-note-rejected/fiscalAttempts/sub-33-rejected',
        })),
      })),
      get: vi.fn(async () => ({
        exists: true,
        data: () => debitNoteDoc,
      })),
    };
    const businessRef = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({}),
      })),
    };
    const tx = {
      get: vi.fn(async () => ({
        data: () => debitNoteDoc,
      })),
      set: vi.fn(),
      update: vi.fn(),
    };

    db.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1/debitNotes/debit-note-rejected') {
        return debitNoteRef;
      }
      if (
        path ===
        'businesses/business-1/debitNotes/debit-note-rejected/fiscalAttempts/sub-33-rejected'
      ) {
        return { path };
      }
      if (path === 'businesses/business-1') {
        return businessRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });
    db.runTransaction.mockImplementation(async (callback) => callback(tx));
    refreshGisysFactDocumentStatus.mockResolvedValue({
      eNcf: 'E330000000001',
      requestStatus: 'rejected',
      dgiiStatus: 'rejected',
      code: '02',
      messages: [
        {
          code: '145',
          message: 'Fecha de vencimiento de secuencia inválida.',
        },
      ],
      requiresDataCorrection: true,
    });

    await refreshElectronicTaxReceiptStatus({
      businessId: 'business-1',
      debitNoteId: 'debit-note-rejected',
      documentKind: 'debitNote',
    });

    const update = tx.update.mock.calls[0][1];
    expect(update.status).toBe('electronic_failed');
    expect(update.electronicTaxReceipt).toEqual(
      expect.objectContaining({
        status: 'rejected',
        dgiiCode: '02',
        dgiiMessage: 'Fecha de vencimiento de secuencia inválida.',
        dgiiMessages: [
          {
            code: '145',
            message: 'Fecha de vencimiento de secuencia inválida.',
          },
        ],
        lastError: 'Fecha de vencimiento de secuencia inválida.',
        requiresDataCorrection: true,
      }),
    );
    expect(tx.set).toHaveBeenCalledWith(
      {
        path: 'businesses/business-1/debitNotes/debit-note-rejected/fiscalAttempts/sub-33-rejected',
      },
      expect.objectContaining({
        id: 'sub-33-rejected',
        documentKind: 'debitNote',
        status: 'rejected',
        dgiiCode: '02',
        lastError: 'Fecha de vencimiento de secuencia inválida.',
      }),
      { merge: true },
    );
  });
});
