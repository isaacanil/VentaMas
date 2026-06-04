import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildAccountingEventMock,
  documentRefs,
  documentSnapshots,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
} = vi.hoisted(() => {
  const hoistedBuildAccountingEventMock = vi.fn();
  const hoistedDocumentRefs = new Map();
  const hoistedDocumentSnapshots = new Map();
  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        path,
        get: vi.fn(async () => ({
          exists: hoistedDocumentSnapshots.has(path),
          id: path.split('/').at(-1) ?? null,
          data: () => hoistedDocumentSnapshots.get(path),
        })),
        set: vi.fn(async () => undefined),
      });
    }

    return hoistedDocumentRefs.get(path);
  };

  return {
    buildAccountingEventMock: hoistedBuildAccountingEventMock,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    getPilotAccountingSettingsForBusinessMock: vi.fn(),
    isAccountingRolloutEnabledForBusinessMock: vi.fn(),
  };
});

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-13T09:00:00.000Z'));
    }

    toMillis() {
      return this.millis;
    }
  },
  db: {
    doc: (path) => getDocRef(path),
  },
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: (...args) =>
    getPilotAccountingSettingsForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', () => ({
  buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
}));

import { syncPurchaseSupplierCreditNote } from './syncPurchaseSupplierCreditNote.js';

describe('syncPurchaseSupplierCreditNote', () => {
  beforeEach(() => {
    documentRefs.clear();
    documentSnapshots.clear();
    vi.clearAllMocks();

    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    buildAccountingEventMock.mockImplementation((input) => ({
      id: `${input.eventType}__${input.sourceId}`,
      ...input,
    }));
  });

  it('writes a supplier credit note and accounting event for purchase overpayments', async () => {
    await syncPurchaseSupplierCreditNote({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        after: {
          data: () => ({
            numberId: 'PC-001',
            provider: {
              id: 'supplier-1',
            },
            paymentState: {
              total: 100,
              paid: 130,
            },
            monetary: {
              documentCurrency: { code: 'USD' },
              functionalCurrency: { code: 'DOP' },
              documentTotals: { total: 100 },
              functionalTotals: { total: 6000 },
            },
            completedAt: '2026-04-10T12:00:00.000Z',
            updatedBy: 'user-1',
          }),
        },
      },
    });

    expect(
      getDocRef(
        'businesses/business-1/supplierCreditNotes/purchase_overpaid_purchase-1',
      ).set,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'purchase_overpaid_purchase-1',
        supplierId: 'supplier-1',
        totalAmount: 30,
        appliedAmount: 0,
        remainingAmount: 30,
        status: 'open',
      }),
      { merge: true },
    );
    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        eventType: 'supplier_credit_note.issued',
        sourceType: 'supplierCreditNote',
        sourceId: 'purchase_overpaid_purchase-1',
        counterpartyType: 'supplier',
        counterpartyId: 'supplier-1',
        currency: 'USD',
        functionalCurrency: 'DOP',
        monetary: {
          amount: 30,
          functionalAmount: 1800,
        },
        payload: expect.objectContaining({
          supplierCreditNoteId: 'purchase_overpaid_purchase-1',
          purchaseId: 'purchase-1',
          purchaseNumber: 'PC-001',
          remainingAmount: 30,
        }),
      }),
    );
    expect(
      getDocRef(
        'businesses/business-1/accountingEvents/supplier_credit_note.issued__purchase_overpaid_purchase-1',
      ).set,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'supplier_credit_note.issued',
      }),
      { merge: true },
    );
  });
});
