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

vi.mock('../config/gisysFact.config.js', () => ({
  getGisysFactConfigIssues: vi.fn(() => []),
  resolveGisysFactConfig: vi.fn(() => ({ mode: 'required' })),
}));

vi.mock('../config/gisysFactPlatform.config.js', () => ({
  getGisysFactPlatformConfig: vi.fn(async () => ({})),
}));

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';

import { refreshGisysFactDocumentStatus } from './gisysFactClient.service.js';
import {
  buildGisysFactIdempotencyKey,
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
});
