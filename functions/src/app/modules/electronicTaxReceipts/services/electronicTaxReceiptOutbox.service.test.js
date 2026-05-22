import { describe, expect, it, vi } from 'vitest';

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

import {
  buildGisysFactIdempotencyKey,
  resolveElectronicTaxReceiptLifecycleStatus,
} from './electronicTaxReceiptOutbox.service.js';

describe('electronicTaxReceiptOutbox.service', () => {
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
});
