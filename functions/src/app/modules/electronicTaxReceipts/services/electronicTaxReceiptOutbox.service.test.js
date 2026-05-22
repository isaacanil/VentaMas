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

import { buildGisysFactIdempotencyKey } from './electronicTaxReceiptOutbox.service.js';

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
});
