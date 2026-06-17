import { beforeEach, describe, expect, it, vi } from 'vitest';

const { documentRefs, documentSnapshots, getDocRef, runTransaction } = vi.hoisted(
  () => {
    const hoistedDocumentSnapshots = new Map();
    const hoistedDocumentRefs = new Map();
    const hoistedRunTransaction = vi.fn(async (handler) => handler({}));

    const toDocSnapshot = (path, data) => ({
      exists: data != null,
      id: path.split('/').at(-1) ?? null,
      data: () => data,
    });

    const hoistedGetDocRef = (path) => {
      if (!hoistedDocumentRefs.has(path)) {
        hoistedDocumentRefs.set(path, {
          path,
          get: vi.fn(async () =>
            toDocSnapshot(path, hoistedDocumentSnapshots.get(path)),
          ),
          set: vi.fn(async (data) => {
            hoistedDocumentSnapshots.set(path, data);
          }),
        });
      }

      return hoistedDocumentRefs.get(path);
    };

    return {
      documentRefs: hoistedDocumentRefs,
      documentSnapshots: hoistedDocumentSnapshots,
      getDocRef: hoistedGetDocRef,
      runTransaction: hoistedRunTransaction,
    };
  },
);

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(seconds, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
      this.millis = seconds * 1000 + Math.floor(nanoseconds / 1000000);
    }

    static now() {
      return new MockTimestamp(1772544000, 0);
    }

    toMillis() {
      return this.millis;
    }
  },
  db: {
    doc: (path) => getDocRef(path),
    runTransaction,
  },
}));

vi.mock('../../../core/utils/getNextID.js', () => ({
  getNextIDTransactionalSnap: vi.fn(),
}));

vi.mock('../services/addAccountReceivable.js', () => ({
  addAccountReceivable: vi.fn(),
}));

vi.mock('../services/addInstallmentsAccountReceivable.js', () => ({
  addInstallmentReceivable: vi.fn(),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: vi.fn(async (_businessId, options) => (
    options?.settings ?? null
  )),
  isAccountingRolloutEnabledForBusiness: vi.fn(
    (_businessId, settings) =>
      settings?.rolloutEnabled === true || settings?.rollout?.enabled === true,
  ),
}));

import {
  buildCustomerDebitNoteIssuedAccountingEvent,
  syncCustomerDebitNoteIssuedAccountingEvent,
} from './syncCustomerDebitNoteAccountingEvents.js';

describe('syncCustomerDebitNoteAccountingEvents', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    documentRefs.clear();
    runTransaction.mockClear();
    vi.clearAllMocks();
  });

  it('does not build financial effects for an electronic debit note rejected by DGII', () => {
    const accountingEvent = buildCustomerDebitNoteIssuedAccountingEvent({
      businessId: 'business-1',
      debitNoteId: 'debit-note-rejected',
      debitNoteRecord: {
        id: 'debit-note-rejected',
        status: 'issued',
        ncf: 'E330000000001',
        electronicTaxReceipt: { status: 'rejected' },
        totalAmount: 118,
        client: { id: 'client-1' },
      },
    });

    expect(accountingEvent).toBeNull();
  });

  it('does not create a receivable when an electronic debit note is issued locally but rejected fiscally', async () => {
    await syncCustomerDebitNoteIssuedAccountingEvent({
      params: {
        businessId: 'business-1',
        debitNoteId: 'debit-note-rejected',
      },
      data: {
        after: {
          data: () => ({
            id: 'debit-note-rejected',
            status: 'issued',
            ncf: 'E330000000001',
            electronicTaxReceipt: { status: 'rejected' },
            totalAmount: 118,
            client: { id: 'client-1' },
          }),
        },
      },
    });

    expect(runTransaction).not.toHaveBeenCalled();
    expect(
      documentSnapshots.get(
        'businesses/business-1/accountingEvents/customer_debit_note.issued__debit-note-rejected',
      ),
    ).toBeUndefined();
  });
});
