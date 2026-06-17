import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {},
  FieldValue: {
    arrayUnion: vi.fn((value) => ({ arrayUnion: value })),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
  },
  Timestamp: {
    now: vi.fn(() => 'timestamp-now'),
  },
}));

vi.mock('../../../core/config/secrets.js', () => ({
  GISYS_FACT_SECRETS: [],
}));

vi.mock('../../electronicTaxReceipts/services/electronicTaxReceiptOutbox.service.js', () => ({
  issueElectronicTaxReceiptForDocument: vi.fn(),
}));

import { resolveDebitNoteStatus } from './customerDebitNoteOutbox.worker.js';

describe('customerDebitNoteOutbox.worker', () => {
  it.each([
    ['issued', 'electronic_pending'],
    ['accepted', 'issued'],
    ['accepted_conditional', 'issued'],
    ['shadow_ready', 'issued'],
    ['rejected', 'electronic_failed'],
    ['error', 'electronic_failed'],
    ['submitted', 'electronic_pending'],
  ])('maps GISYS %s to debit note %s', (gisysStatus, expectedStatus) => {
    expect(resolveDebitNoteStatus({ status: gisysStatus })).toBe(expectedStatus);
  });
});
