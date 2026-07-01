import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildAccountingEventMock,
  documentRefs,
  documentSnapshots,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
  runAccountingEventProjectionMock,
} = vi.hoisted(() => {
  const hoistedBuildAccountingEventMock = vi.fn();
  const hoistedRunAccountingEventProjectionMock = vi.fn();
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
    runAccountingEventProjectionMock: hoistedRunAccountingEventProjectionMock,
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

vi.mock(
  '../../../versions/v2/accounting/accountingEventProjection.service.js',
  () => ({
    runAccountingEventProjection: (...args) =>
      runAccountingEventProjectionMock(...args),
  }),
);

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
    runAccountingEventProjectionMock.mockResolvedValue({
      ok: true,
      status: 'voided',
    });
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
            createdBy: 'client-created-user',
            updatedBy: 'client-updated-user',
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
        createdBy: 'system:purchase-supplier-credit-note-sync',
        updatedBy: 'system:purchase-supplier-credit-note-sync',
        metadata: expect.objectContaining({
          sourcePurchaseCreatedBy: 'client-created-user',
          sourcePurchaseUpdatedBy: 'client-updated-user',
        }),
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
        createdBy: 'system:purchase-supplier-credit-note-sync',
        metadata: {
          sourcePurchaseCreatedBy: 'client-created-user',
          sourcePurchaseUpdatedBy: 'client-updated-user',
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
    expect(runAccountingEventProjectionMock).not.toHaveBeenCalled();
  });

  it('voids the issued accounting event when an existing overpayment credit note is no longer valid', async () => {
    documentSnapshots.set(
      'businesses/business-1/supplierCreditNotes/purchase_overpaid_purchase-1',
      {
        supplierId: 'supplier-1',
        totalAmount: 30,
        appliedAmount: 0,
        remainingAmount: 30,
        status: 'open',
        createdAt: '2026-04-10T12:00:00.000Z',
      },
    );

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
              paid: 100,
            },
            monetary: {
              documentCurrency: { code: 'USD' },
              functionalCurrency: { code: 'DOP' },
              documentTotals: { total: 100 },
              functionalTotals: { total: 6000 },
            },
            completedAt: '2026-04-10T12:00:00.000Z',
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
        totalAmount: 0,
        appliedAmount: 0,
        remainingAmount: 0,
        status: 'void',
      }),
      { merge: true },
    );
    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'supplier_credit_note.issued',
        status: 'voided',
        sourceId: 'purchase_overpaid_purchase-1',
        monetary: {
          amount: 0,
          functionalAmount: 0,
        },
        payload: expect.objectContaining({
          supplierCreditNoteId: 'purchase_overpaid_purchase-1',
          totalAmount: 0,
          remainingAmount: 0,
          status: 'void',
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
        status: 'voided',
      }),
      { merge: true },
    );
    expect(runAccountingEventProjectionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        eventId: 'supplier_credit_note.issued__purchase_overpaid_purchase-1',
        accountingEvent: expect.objectContaining({
          id: 'supplier_credit_note.issued__purchase_overpaid_purchase-1',
          status: 'voided',
        }),
      }),
    );
  });
});
