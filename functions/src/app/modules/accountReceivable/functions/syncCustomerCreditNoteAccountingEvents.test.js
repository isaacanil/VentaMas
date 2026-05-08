import { beforeEach, describe, expect, it, vi } from 'vitest';

const { documentRefs, documentSnapshots, getDocRef } = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedDocumentRefs = new Map();

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
  };
});

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_options, handler) => handler,
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

    static fromMillis(millis) {
      return new MockTimestamp(Math.floor(millis / 1000), 0);
    }

    toMillis() {
      return this.millis;
    }

    toDate() {
      return new Date(this.millis);
    }
  },
  db: {
    doc: (path) => getDocRef(path),
  },
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
  syncCustomerCreditNoteApplicationAccountingEvent,
  syncCustomerCreditNoteIssuedAccountingEvent,
} from './syncCustomerCreditNoteAccountingEvents.js';

describe('syncCustomerCreditNoteAccountingEvents', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    documentRefs.clear();
    vi.clearAllMocks();

    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
  });

  it('creates an accounting event when a customer credit note is issued', async () => {
    await syncCustomerCreditNoteIssuedAccountingEvent({
      params: {
        businessId: 'business-1',
        creditNoteId: 'credit-note-1',
      },
      data: {
        data: () => ({
          id: 'credit-note-1',
          status: 'issued',
          number: 'NC-2026-000001',
          ncf: 'B0400000001',
          invoiceId: 'invoice-1',
          invoiceNcf: 'B0100000001',
          client: { id: 'client-1' },
          totalAmount: 118,
          items: [
            {
              amountToBuy: 1,
              pricing: {
                price: 100,
                tax: 18,
              },
            },
          ],
          createdAt: { seconds: 1772543000, nanoseconds: 0 },
          createdBy: { uid: 'user-1' },
        }),
      },
    });

    const accountingEvent = documentSnapshots.get(
      'businesses/business-1/accountingEvents/customer_credit_note.issued__credit-note-1',
    );

    expect(accountingEvent).toMatchObject({
      id: 'customer_credit_note.issued__credit-note-1',
      businessId: 'business-1',
      eventType: 'customer_credit_note.issued',
      sourceType: 'creditNote',
      sourceDocumentType: 'creditNote',
      sourceDocumentId: 'credit-note-1',
      counterpartyType: 'client',
      counterpartyId: 'client-1',
      monetary: {
        amount: 118,
        taxAmount: 18,
        functionalAmount: 118,
        functionalTaxAmount: 18,
      },
      payload: {
        creditNoteNumber: 'NC-2026-000001',
        creditNoteNcf: 'B0400000001',
        invoiceId: 'invoice-1',
        invoiceNcf: 'B0100000001',
        itemCount: 1,
      },
      createdBy: 'user-1',
    });
  });

  it('creates an accounting event when a customer credit note is applied', async () => {
    await syncCustomerCreditNoteApplicationAccountingEvent({
      params: {
        businessId: 'business-1',
        applicationId: 'application-1',
      },
      data: {
        data: () => ({
          id: 'application-1',
          creditNoteId: 'credit-note-1',
          creditNoteNcf: 'B0400000001',
          invoiceId: 'invoice-1',
          invoiceNcf: 'B0100000001',
          clientId: 'client-1',
          amountApplied: 75,
          previousBalance: 118,
          newBalance: 43,
          appliedBy: { uid: 'user-1' },
          createdAt: { seconds: 1772543000, nanoseconds: 0 },
        }),
      },
    });

    const accountingEvent = documentSnapshots.get(
      'businesses/business-1/accountingEvents/customer_credit_note.applied__application-1',
    );

    expect(accountingEvent).toMatchObject({
      id: 'customer_credit_note.applied__application-1',
      businessId: 'business-1',
      eventType: 'customer_credit_note.applied',
      sourceType: 'creditNoteApplication',
      sourceDocumentType: 'creditNoteApplication',
      sourceDocumentId: 'application-1',
      counterpartyType: 'client',
      counterpartyId: 'client-1',
      monetary: {
        amount: 75,
        functionalAmount: 75,
      },
      payload: {
        creditNoteId: 'credit-note-1',
        creditNoteNcf: 'B0400000001',
        invoiceId: 'invoice-1',
        invoiceNcf: 'B0100000001',
        previousBalance: 118,
        newBalance: 43,
      },
      createdBy: 'user-1',
    });
  });
});
