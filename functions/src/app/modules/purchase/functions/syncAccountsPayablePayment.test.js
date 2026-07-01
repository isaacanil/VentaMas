import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildAccountingEventIdMock,
  buildAccountingEventMock,
  buildAccountsPayablePaymentCashMovementsMock,
  batchMocks,
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
  const hoistedBatchMocks = [];
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
    batchMocks: hoistedBatchMocks,
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
    batch: () => {
      const batchMock = {
        delete: vi.fn(),
        set: vi.fn(),
        commit: vi.fn(async () => undefined),
      };
      batchMocks.push(batchMock);
      return batchMock;
    },
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
    batchMocks.length = 0;
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
        paymentRunId: 'payment-run-1',
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
          paymentRunStatusSnapshot: {
            id: 'payment-run-1',
            approvalStatus: 'approved',
            executionStatus: 'not_started',
            status: 'approved',
          },
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
        treasury: expect.objectContaining({
          cashCountId: null,
          bankAccountId: 'bank-1',
          paymentChannel: 'mixed',
          cashAccountId: null,
        }),
        idempotencyKey: 'idem-1',
        metadata: {
          paymentRunId: 'payment-run-1',
          paymentRunStatusSnapshot: {
            id: 'payment-run-1',
            approvalStatus: 'approved',
            executionStatus: 'not_started',
            status: 'approved',
          },
        },
        payload: expect.objectContaining({
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-1',
          paymentRunId: 'payment-run-1',
          paymentRunStatusSnapshot: {
            id: 'payment-run-1',
            approvalStatus: 'approved',
            executionStatus: 'not_started',
            status: 'approved',
          },
          purchaseNumber: 'PC-001',
          receiptNumber: 'CPP-0001',
          settlementAmount: 100,
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
    const eventInput = buildAccountingEventMock.mock.calls[0][0];
    expect(eventInput.monetary).not.toHaveProperty('withholdingITBISAmount');
    expect(eventInput.monetary).not.toHaveProperty('withholdingISRAmount');
    expect(eventInput.payload).not.toHaveProperty('fiscalTotals');
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
        treasury: expect.objectContaining({
          cashCountId: 'cash-1',
          bankAccountId: null,
          paymentChannel: 'cash',
          cashAccountId: null,
        }),
        payload: expect.objectContaining({
          reason: 'duplicate',
          restoredCreditNotes: [{ id: 'scn-1', restoredAmount: 20 }],
          vendorBillId: 'purchase:purchase-1',
        }),
        createdBy: 'auditor-1',
      }),
    );
  });

  it.each(['voided', 'canceled', 'cancelled'])(
    'emits a reversal event when an active payment becomes %s',
    (nextStatus) => {
      const events = buildAccountsPayablePaymentAccountingEvents({
        businessId: 'business-1',
        paymentId: 'payment-1',
        beforePayment: {
          status: 'posted',
        },
        afterPayment: {
          status: nextStatus,
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
          cancelReason: 'Pago cancelado por control interno',
          voidedAt: {
            toMillis: () => Date.parse('2026-04-05T12:00:00.000Z'),
          },
          voidedBy: 'auditor-1',
        },
      });

      expect(events).toHaveLength(1);
      expect(buildAccountingEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'accounts_payable.payment.voided',
          reversalOfEventId: 'accounts_payable.payment.recorded__payment-1',
          payload: expect.objectContaining({
            reason: 'Pago cancelado por control interno',
          }),
        }),
      );
    },
  );

  it('does not emit a reversal for a newly-created inactive payment record', () => {
    const events = buildAccountsPayablePaymentAccountingEvents({
      businessId: 'business-1',
      paymentId: 'payment-1',
      beforePayment: null,
      afterPayment: {
        status: 'voided',
        purchaseId: 'purchase-1',
        supplierId: 'supplier-1',
        totalAmount: 80,
      },
    });

    expect(events).toEqual([]);
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
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
      approvalStatus: 'approved',
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
      approvalStatus: 'draft',
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
    batchMocks.length = 0;
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
    documentSnapshots.set(
      'businesses/business-1/vendorBills/purchase:purchase-1',
      {
        id: 'purchase:purchase-1',
        sourceDocumentType: 'purchase',
        sourceDocumentId: 'purchase-1',
        status: 'approved',
        approvalStatus: 'approved',
        approvalReason: 'Aprobación protegida',
        approvalEvidenceNote: 'Soporte de aprobación protegido',
        approvalEvidenceUrls: ['https://files.example/ap-protected.pdf'],
      },
    );
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
        status: 'partially_paid',
        paymentState: expect.objectContaining({
          paid: 40,
          balance: 60,
        }),
        approvalStatus: 'approved',
        approvalReason: 'Aprobación protegida',
        approvalEvidenceNote: 'Soporte de aprobación protegido',
        approvalEvidenceUrls: ['https://files.example/ap-protected.pdf'],
      }),
      { merge: true },
    );
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });

  it('recalculates purchase and vendor bill state with fiscal withholding applications', async () => {
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
        total: 1180,
        paid: 0,
        balance: 1180,
        paymentCount: 0,
      },
      provider: {
        id: 'supplier-1',
        name: 'Supplier One',
      },
      monetary: {
        documentTotals: {
          total: 1180,
          gross: 1180,
          withholdingITBISAmount: 54,
          withholdingISRAmount: 20,
          netPayableAmount: 1106,
        },
      },
    });
    const paymentData = {
      purchaseId: 'purchase-1',
      status: 'posted',
      totalAmount: 1106,
      withholdingAmount: 74,
      settlementAmount: 1180,
      createdAt: 3,
      occurredAt: 4,
      paymentMethods: [
        {
          method: 'cash',
          value: 1106,
          cashCountId: 'cash-1',
        },
      ],
      withholdingApplications: [
        {
          type: 'itbis',
          amount: 54,
          reference: 'RET-ITBIS-1',
          taxPeriod: '2026-04',
        },
        {
          type: 'isr',
          amount: 20,
          reference: 'RET-ISR-1',
          taxPeriod: '2026-04',
        },
      ],
    };
    collectionEntries.set('businesses/business-1/accountsPayablePayments', [
      {
        id: 'payment-1',
        data: paymentData,
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
          data: () => paymentData,
        },
      },
    });

    expect(
      getDocRef('businesses/business-1/purchases/purchase-1').set,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentState: expect.objectContaining({
          paid: 1180,
          balance: 0,
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
        status: 'paid',
        paymentState: expect.objectContaining({
          paid: 1180,
          balance: 0,
        }),
        totals: {
          total: 1180,
          paid: 1180,
          balance: 0,
        },
      }),
      { merge: true },
    );
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });

  it('excludes inactive supplier payments when recalculating purchase state', async () => {
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
        paid: 90,
        balance: 10,
        paymentCount: 3,
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
        id: 'payment-active',
        data: {
          purchaseId: 'purchase-1',
          status: 'posted',
          totalAmount: 40,
          createdAt: 3,
          occurredAt: 4,
        },
      },
      {
        id: 'payment-voided',
        data: {
          purchaseId: 'purchase-1',
          status: 'voided',
          totalAmount: 30,
          createdAt: 5,
          occurredAt: 6,
        },
      },
      {
        id: 'payment-canceled',
        data: {
          purchaseId: 'purchase-1',
          status: 'canceled',
          totalAmount: 20,
          createdAt: 7,
          occurredAt: 8,
        },
      },
      {
        id: 'payment-draft',
        data: {
          purchaseId: 'purchase-1',
          status: 'draft',
          totalAmount: 10,
          createdAt: 9,
          occurredAt: 10,
        },
      },
    ]);

    await syncAccountsPayablePayment({
      params: {
        businessId: 'business-1',
        paymentId: 'payment-voided',
      },
      data: {
        before: {
          data: () => ({
            purchaseId: 'purchase-1',
            status: 'posted',
            totalAmount: 30,
          }),
        },
        after: {
          data: () => ({
            purchaseId: 'purchase-1',
            status: 'voided',
            totalAmount: 30,
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
          lastPaymentId: 'payment-active',
        }),
      }),
      { merge: true },
    );
    expect(
      getDocRef('businesses/business-1/vendorBills/purchase:purchase-1').set,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'partially_paid',
        totals: {
          total: 100,
          paid: 40,
          balance: 60,
        },
      }),
      { merge: true },
    );
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });

  it('recalculates purchase state from legacy totalPurchase totals', async () => {
    documentSnapshots.set('businesses/business-1/purchases/purchase-legacy', {
      id: 'purchase-legacy',
      numberId: 125,
      status: 'completed',
      workflowStatus: 'completed',
      completedAt: 2,
      createdAt: 1,
      provider: {
        id: 'supplier-legacy',
        name: 'Supplier Legacy',
      },
      totalPurchase: {
        totalPurchase: 180,
      },
      paymentTerms: {
        condition: 'credit',
        expectedPaymentAt: 10,
      },
    });
    collectionEntries.set('businesses/business-1/accountsPayablePayments', [
      {
        id: 'payment-legacy',
        data: {
          purchaseId: 'purchase-legacy',
          status: 'posted',
          totalAmount: 45,
          createdAt: 3,
          occurredAt: 4,
          paymentMethods: [
            {
              method: 'transfer',
              value: 45,
              bankAccountId: 'bank-1',
            },
          ],
        },
      },
    ]);

    await syncAccountsPayablePayment({
      params: {
        businessId: 'business-1',
        paymentId: 'payment-legacy',
      },
      data: {
        before: {
          data: () => null,
        },
        after: {
          data: () => ({
            purchaseId: 'purchase-legacy',
            status: 'posted',
            totalAmount: 45,
            createdAt: 3,
            occurredAt: 4,
            paymentMethods: [
              {
                method: 'transfer',
                value: 45,
                bankAccountId: 'bank-1',
              },
            ],
          }),
        },
      },
    });

    expect(
      getDocRef('businesses/business-1/purchases/purchase-legacy').set,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentState: expect.objectContaining({
          total: 180,
          paid: 45,
          balance: 135,
          paymentCount: 1,
        }),
      }),
      { merge: true },
    );
    expect(
      getDocRef('businesses/business-1/vendorBills/purchase:purchase-legacy').set,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceDocumentId: 'purchase-legacy',
        supplierId: 'supplier-legacy',
        totals: {
          total: 180,
          paid: 45,
          balance: 135,
        },
      }),
      { merge: true },
    );
  });

  it('deletes stale cash movements when an active supplier payment changes method', async () => {
    buildAccountsPayablePaymentCashMovementsMock.mockImplementation(
      ({ payment }) => {
        if (!payment || payment.status !== 'posted') {
          return [];
        }

        const method = payment.paymentMethods?.[0]?.method;
        return [
          {
            id:
              method === 'transfer'
                ? 'app_payment-1_transfer_1'
                : 'app_payment-1_cash_1',
            businessId: 'business-1',
            sourceId: 'payment-1',
          },
        ];
      },
    );
    documentSnapshots.set('businesses/business-1/purchases/purchase-1', {
      id: 'purchase-1',
      status: 'completed',
      workflowStatus: 'completed',
      totalAmount: 100,
      paymentState: {
        total: 100,
        paid: 40,
        balance: 60,
        paymentCount: 1,
      },
      paymentTerms: {},
    });
    collectionEntries.set('businesses/business-1/accountsPayablePayments', [
      {
        id: 'payment-1',
        data: {
          purchaseId: 'purchase-1',
          status: 'posted',
          totalAmount: 40,
          paymentMethods: [
            {
              method: 'transfer',
              value: 40,
              bankAccountId: 'bank-1',
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
          data: () => ({
            purchaseId: 'purchase-1',
            status: 'posted',
            totalAmount: 40,
            paymentMethods: [
              {
                method: 'cash',
                value: 40,
                cashCountId: 'cash-1',
              },
            ],
          }),
        },
        after: {
          data: () => ({
            purchaseId: 'purchase-1',
            status: 'posted',
            totalAmount: 40,
            paymentMethods: [
              {
                method: 'transfer',
                value: 40,
                bankAccountId: 'bank-1',
              },
            ],
          }),
        },
      },
    });

    expect(batchMocks[0].delete).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashMovements/app_payment-1_cash_1',
      }),
    );
    expect(batchMocks[0].set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashMovements/app_payment-1_transfer_1',
      }),
      expect.objectContaining({
        id: 'app_payment-1_transfer_1',
      }),
      { merge: true },
    );
  });

  it.each(['void', 'voided', 'canceled'])(
    'preserves original cash movements and writes a reversal on %s transitions',
    async (nextStatus) => {
      buildAccountsPayablePaymentCashMovementsMock.mockImplementation(
        ({ payment }) =>
          payment?.status === 'posted'
            ? [
                {
                  id: 'app_payment-1_transfer_1',
                  businessId: 'business-1',
                  sourceId: 'payment-1',
                },
              ]
            : [],
      );
      documentSnapshots.set('businesses/business-1/purchases/purchase-1', {
        id: 'purchase-1',
        status: 'completed',
        workflowStatus: 'completed',
        totalAmount: 100,
        paymentState: {
          total: 100,
          paid: 40,
          balance: 60,
          paymentCount: 1,
        },
        paymentTerms: {},
      });
      collectionEntries.set('businesses/business-1/accountsPayablePayments', []);

      await syncAccountsPayablePayment({
        params: {
          businessId: 'business-1',
          paymentId: 'payment-1',
        },
        data: {
          before: {
            data: () => ({
              purchaseId: 'purchase-1',
              status: 'posted',
              totalAmount: 40,
              paymentMethods: [
                {
                  method: 'transfer',
                  value: 40,
                  bankAccountId: 'bank-1',
                },
              ],
            }),
          },
          after: {
            data: () => ({
              purchaseId: 'purchase-1',
              status: nextStatus,
              totalAmount: 40,
              voidedAt: 10,
              paymentMethods: [
                {
                  method: 'transfer',
                  value: 40,
                  bankAccountId: 'bank-1',
                },
              ],
            }),
          },
        },
      });

      expect(batchMocks[0].delete).not.toHaveBeenCalled();
      expect(batchMocks[0].set).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'businesses/business-1/cashMovements/appv_payment-1_transfer_1',
        }),
        expect.objectContaining({
          direction: 'in',
          sourceType: 'supplier_payment_void',
        }),
        { merge: true },
      );
    },
  );
});
