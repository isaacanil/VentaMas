import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildAccountingEventIdMock,
  buildAccountingEventMock,
  buildAccountsPayablePaymentCashMovementsMock,
  collectionEntries,
  documentRefs,
  documentSnapshots,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
} = vi.hoisted(() => {
  const hoistedBuildAccountingEventIdMock = vi.fn();
  const hoistedBuildAccountingEventMock = vi.fn();
  const hoistedBuildAccountsPayablePaymentCashMovementsMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedDocumentRefs = new Map();
  const hoistedDocumentSnapshots = new Map();
  const hoistedCollectionEntries = new Map();

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
    buildAccountingEventIdMock: hoistedBuildAccountingEventIdMock,
    buildAccountingEventMock: hoistedBuildAccountingEventMock,
    buildAccountsPayablePaymentCashMovementsMock:
      hoistedBuildAccountsPayablePaymentCashMovementsMock,
    collectionEntries: hoistedCollectionEntries,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
  };
});

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
    collection: (path) => ({
      where: vi.fn(() => ({
        get: vi.fn(async () => ({
          docs: (collectionEntries.get(path) ?? []).map((entry) => ({
            id: entry.id,
            data: () => entry.data,
          })),
        })),
      })),
    }),
    batch: () => ({
      delete: vi.fn(),
      set: vi.fn(),
      commit: vi.fn(async () => undefined),
    }),
  },
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: (...args) =>
    getPilotAccountingSettingsForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', async () => {
  const actual = await vi.importActual(
    '../../../versions/v2/accounting/utils/accountingEvent.util.js',
  );

  return {
    ...actual,
    buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
    buildAccountingEventId: (...args) => buildAccountingEventIdMock(...args),
  };
});

vi.mock('../../../versions/v2/accounting/utils/cashMovement.util.js', async () => {
  const actual = await vi.importActual(
    '../../../versions/v2/accounting/utils/cashMovement.util.js',
  );

  return {
    ...actual,
    buildAccountsPayablePaymentCashMovements: (...args) =>
      buildAccountsPayablePaymentCashMovementsMock(...args),
  };
});

import {
  buildAccountsPayablePaymentAccountingEvents,
  buildVendorBillProjection,
  syncAccountsPayablePayment,
} from './syncAccountsPayablePayment.js';

describe('buildAccountsPayablePaymentAccountingEvents', () => {
  beforeEach(() => {
    collectionEntries.clear();
    documentRefs.clear();
    documentSnapshots.clear();
    vi.clearAllMocks();
    buildAccountsPayablePaymentCashMovementsMock.mockReturnValue([]);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    buildAccountingEventMock.mockImplementation((input) => ({
      id: `${input.eventType}__payment-1`,
      ...input,
    }));
    buildAccountingEventIdMock.mockReturnValue(
      'accounts_payable.payment.recorded__payment-1',
    );
  });

  it('emits accounts_payable.payment.recorded with canonical treasury and idempotency', () => {
    const events = buildAccountsPayablePaymentAccountingEvents({
      businessId: 'business-1',
      paymentId: 'payment-1',
      beforePayment: {
        status: 'draft',
      },
      afterPayment: {
        status: 'posted',
        purchaseId: 'purchase-1',
        supplierId: 'supplier-1',
        receiptNumber: 'CPP-0001',
        createdBy: 'user-1',
        occurredAt: {
          toMillis: () => Date.parse('2026-04-05T10:00:00.000Z'),
        },
        monetary: {
          documentCurrency: { code: 'USD' },
          functionalCurrency: { code: 'DOP' },
          documentTotals: { total: 100 },
          functionalTotals: { total: 6200 },
        },
        paymentMethods: [
          {
            method: 'transfer',
            value: 60,
            bankAccountId: 'bank-1',
            reference: 'TRX-1',
          },
          {
            method: 'supplierCreditNote',
            value: 40,
            supplierCreditNoteId: 'scn-1',
          },
        ],
        metadata: {
          purchaseNumber: 'PC-001',
          idempotencyKey: 'idem-1',
          appliedCreditNotes: [{ id: 'scn-1', appliedAmount: 40 }],
        },
      },
    });

    expect(events).toHaveLength(1);
    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        eventType: 'accounts_payable.payment.recorded',
        sourceType: 'accountsPayablePayment',
        sourceId: 'payment-1',
        sourceDocumentType: 'accountsPayablePayment',
        sourceDocumentId: 'payment-1',
        counterpartyType: 'supplier',
        counterpartyId: 'supplier-1',
        currency: 'USD',
        functionalCurrency: 'DOP',
        monetary: {
          amount: 100,
          functionalAmount: 6200,
        },
        treasury: {
          cashCountId: null,
          bankAccountId: 'bank-1',
          paymentChannel: 'mixed',
        },
        idempotencyKey: 'idem-1',
        payload: expect.objectContaining({
          purchaseId: 'purchase-1',
          purchaseNumber: 'PC-001',
          receiptNumber: 'CPP-0001',
          appliedCreditNotes: [{ id: 'scn-1', appliedAmount: 40 }],
          paymentMethods: [
            expect.objectContaining({
              method: 'transfer',
              amount: 60,
            }),
            expect.objectContaining({
              method: 'supplierCreditNote',
              amount: 40,
              supplierCreditNoteId: 'scn-1',
            }),
          ],
        }),
      }),
    );
  });

  it('emits accounts_payable.payment.voided with reversalOfEventId on void transition', () => {
    const events = buildAccountsPayablePaymentAccountingEvents({
      businessId: 'business-1',
      paymentId: 'payment-1',
      beforePayment: {
        status: 'posted',
      },
      afterPayment: {
        status: 'void',
        purchaseId: 'purchase-1',
        supplierId: 'supplier-1',
        totalAmount: 80,
        paymentMethods: [
          {
            method: 'cash',
            value: 80,
            cashCountId: 'cash-1',
          },
        ],
        metadata: {
          purchaseNumber: 'PC-001',
          restoredCreditNotes: [{ id: 'scn-1', restoredAmount: 20 }],
        },
        voidReason: 'duplicate',
        voidedAt: {
          toMillis: () => Date.parse('2026-04-05T12:00:00.000Z'),
        },
        voidedBy: 'auditor-1',
      },
    });

    expect(events).toHaveLength(1);
    expect(buildAccountingEventIdMock).toHaveBeenCalledWith({
      eventType: 'accounts_payable.payment.recorded',
      sourceId: 'payment-1',
    });
    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'accounts_payable.payment.voided',
        reversalOfEventId: 'accounts_payable.payment.recorded__payment-1',
        treasury: {
          cashCountId: 'cash-1',
          bankAccountId: null,
          paymentChannel: 'cash',
        },
        payload: expect.objectContaining({
          reason: 'duplicate',
          restoredCreditNotes: [{ id: 'scn-1', restoredAmount: 20 }],
        }),
        createdBy: 'auditor-1',
      }),
    );
  });

  it('does not emit when the payment was already active before the write', () => {
    const events = buildAccountsPayablePaymentAccountingEvents({
      businessId: 'business-1',
      paymentId: 'payment-1',
      beforePayment: {
        status: 'posted',
      },
      afterPayment: {
        status: 'posted',
      },
    });

    expect(events).toEqual([]);
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });

  it('projects vendor bill payment state from the recalculated purchase state', () => {
    const vendorBill = buildVendorBillProjection({
      purchaseId: 'purchase-1',
      purchaseRecord: {
        numberId: 124,
        status: 'completed',
        workflowStatus: 'completed',
        createdAt: 1,
        completedAt: 2,
        provider: {
          id: 'supplier-1',
          name: 'Supplier One',
        },
        paymentAt: 10,
        attachmentUrls: [{ id: 'file-1' }],
        monetary: {
          documentTotals: {
            total: 100,
          },
        },
      },
      paymentTerms: {
        condition: 'one_week',
        expectedPaymentAt: 10,
        nextPaymentAt: null,
      },
      paymentState: {
        status: 'paid',
        total: 100,
        paid: 100,
        balance: 0,
        lastPaymentAt: 20,
        lastPaymentId: 'payment-1',
        paymentCount: 1,
        nextPaymentAt: null,
      },
    });

    expect(vendorBill).toMatchObject({
      reference: '124',
      status: 'paid',
      sourceDocumentType: 'purchase',
      sourceDocumentId: 'purchase-1',
      supplierId: 'supplier-1',
      supplierName: 'Supplier One',
      postedAt: 2,
      dueAt: 10,
      paymentState: {
        status: 'paid',
        paid: 100,
        balance: 0,
      },
      paymentTerms: {
        condition: 'one_week',
        nextPaymentAt: null,
      },
      purchase: {
        paymentState: {
          status: 'paid',
          paid: 100,
          balance: 0,
        },
      },
    });
  });

  it('projects a draft vendor bill while the purchase is not completed yet', () => {
    const vendorBill = buildVendorBillProjection({
      purchaseId: 'purchase-2',
      purchaseRecord: {
        numberId: 126,
        status: 'pending',
        workflowStatus: 'pending_receipt',
        createdAt: 1,
        provider: {
          id: 'supplier-2',
          name: 'Supplier Two',
        },
      },
      paymentTerms: {
        condition: 'cash',
        expectedPaymentAt: 10,
        nextPaymentAt: 10,
      },
      paymentState: {
        status: 'partial',
        total: 100,
        paid: 20,
        balance: 80,
        lastPaymentAt: 20,
        lastPaymentId: 'payment-2',
        paymentCount: 1,
        nextPaymentAt: 10,
      },
    });

    expect(vendorBill).toMatchObject({
      reference: '126',
      status: 'draft',
      sourceDocumentId: 'purchase-2',
      supplierId: 'supplier-2',
      supplierName: 'Supplier Two',
      postedAt: null,
      paymentState: {
        status: 'partial',
        paid: 20,
        balance: 80,
      },
    });
  });
});

describe('syncAccountsPayablePayment', () => {
  beforeEach(() => {
    collectionEntries.clear();
    documentRefs.clear();
    documentSnapshots.clear();
    vi.clearAllMocks();

    buildAccountsPayablePaymentCashMovementsMock.mockReturnValue([]);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    buildAccountingEventMock.mockImplementation((input) => ({
      id: `${input.eventType}__payment-1`,
      ...input,
    }));
    buildAccountingEventIdMock.mockReturnValue(
      'accounts_payable.payment.recorded__payment-1',
    );
  });

  it('keeps syncing vendor bills when general accounting is disabled', async () => {
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: false,
    });

    documentSnapshots.set('businesses/business-1/purchases/purchase-1', {
      id: 'purchase-1',
      numberId: 124,
      status: 'completed',
      workflowStatus: 'completed',
      completedAt: 2,
      createdAt: 1,
      paymentTerms: {
        condition: 'credit',
        expectedPaymentAt: 10,
      },
      paymentState: {
        total: 100,
        paid: 0,
        balance: 100,
        paymentCount: 0,
      },
      provider: {
        id: 'supplier-1',
        name: 'Supplier One',
      },
      monetary: {
        documentTotals: {
          total: 100,
        },
      },
    });
    collectionEntries.set('businesses/business-1/accountsPayablePayments', [
      {
        id: 'payment-1',
        data: {
          purchaseId: 'purchase-1',
          status: 'posted',
          totalAmount: 40,
          createdAt: 3,
          occurredAt: 4,
          paymentMethods: [
            {
              method: 'cash',
              value: 40,
              cashCountId: 'cash-1',
            },
          ],
        },
      },
    ]);

    await syncAccountsPayablePayment({
      params: {
        businessId: 'business-1',
        paymentId: 'payment-1',
      },
      data: {
        before: {
          data: () => null,
        },
        after: {
          data: () => ({
            purchaseId: 'purchase-1',
            status: 'posted',
            totalAmount: 40,
            createdAt: 3,
            occurredAt: 4,
            paymentMethods: [
              {
                method: 'cash',
                value: 40,
                cashCountId: 'cash-1',
              },
            ],
          }),
        },
      },
    });

    expect(
      getDocRef('businesses/business-1/purchases/purchase-1').set,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentState: expect.objectContaining({
          paid: 40,
          balance: 60,
          paymentCount: 1,
        }),
      }),
      { merge: true },
    );
    expect(
      getDocRef('businesses/business-1/vendorBills/purchase:purchase-1').set,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceDocumentId: 'purchase-1',
        status: 'partial',
        paymentState: expect.objectContaining({
          paid: 40,
          balance: 60,
        }),
      }),
      { merge: true },
    );
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });
});
