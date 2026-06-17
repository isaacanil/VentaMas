import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildAccountingEventMock,
  documentRefs,
  documentSnapshots,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedBuildAccountingEventMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();

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
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-05T12:00:00.000Z'));
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
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
  };
});

import { syncPurchaseCommittedAccountingEvent } from './syncPurchaseCommittedAccountingEvent.js';

describe('syncPurchaseCommittedAccountingEvent', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    documentRefs.clear();
    vi.clearAllMocks();

    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      functionalCurrency: 'DOP',
      documentCurrencies: ['DOP'],
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    buildAccountingEventMock.mockReturnValue({
      id: 'purchase.committed__purchase-1',
      eventType: 'purchase.committed',
    });
  });

  it('emits purchase.committed when the purchase transitions to completed', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
    });

    await syncPurchaseCommittedAccountingEvent({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        before: {
          data: () => ({
            status: 'pending',
            workflowStatus: 'pending_receipt',
          }),
        },
        after: {
          data: () => ({
            status: 'completed',
            workflowStatus: 'completed',
            numberId: 'PC-001',
            providerId: 'supplier-1',
            paymentTerms: {
              condition: 'credit',
            },
            monetary: {
              documentCurrency: { code: 'USD' },
              functionalCurrency: { code: 'DOP' },
              documentTotals: {
                total: 100,
                taxes: 18,
              },
              functionalTotals: {
                total: 6200,
                taxes: 1116,
              },
            },
            completedAt: {
              toMillis: () => Date.parse('2026-04-05T10:00:00.000Z'),
            },
            createdBy: 'client-created-user',
            updatedBy: 'client-updated-user',
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        eventType: 'purchase.committed',
        sourceId: 'purchase-1',
        sourceDocumentId: 'purchase-1',
        counterpartyType: 'supplier',
        counterpartyId: 'supplier-1',
        currency: 'USD',
        functionalCurrency: 'DOP',
        createdBy: 'system:purchase-accounting-event-sync',
        metadata: {
          sourcePurchaseCreatedBy: 'client-created-user',
          sourcePurchaseUpdatedBy: 'client-updated-user',
        },
        monetary: expect.objectContaining({
          amount: 100,
          subtotalAmount: 82,
          taxAmount: 18,
          netPayableAmount: 100,
          functionalAmount: 6200,
          functionalSubtotalAmount: 5084,
          functionalTaxAmount: 1116,
          functionalNetPayableAmount: 6200,
        }),
        payload: expect.objectContaining({
          fiscalTotals: {
            subtotal: 82,
            taxAmount: 18,
            withholdingITBISAmount: 0,
            withholdingISRAmount: 0,
            total: 100,
            netPayableAmount: 100,
          },
        }),
      }),
    );

    expect(
      getDocRef(
        'businesses/business-1/accountingEvents/purchase.committed__purchase-1',
      ).set,
    ).toHaveBeenCalledWith(
      {
        id: 'purchase.committed__purchase-1',
        eventType: 'purchase.committed',
      },
      { merge: true },
    );
  });

  it('fails instead of clamping when purchase withholdings exceed the total', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
    });

    await expect(
      syncPurchaseCommittedAccountingEvent({
        params: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
        },
        data: {
          before: {
            data: () => ({
              status: 'pending',
              workflowStatus: 'pending_receipt',
            }),
          },
          after: {
            data: () => ({
              status: 'completed',
              workflowStatus: 'completed',
              monetary: {
                documentTotals: {
                  total: 100,
                  taxes: 18,
                  withholdingITBISAmount: 70,
                  withholdingISRAmount: 40,
                },
              },
            }),
          },
        },
      }),
    ).rejects.toThrow(
      'purchase purchase-1: invalid fiscal totals. withholdingITBIS + withholdingISR (110) must be less than or equal to total (100); netPayableAmount must be >= 0 (calculated -10).',
    );

    expect(buildAccountingEventMock).not.toHaveBeenCalled();
    expect(
      getDocRef(
        'businesses/business-1/accountingEvents/purchase.committed__purchase-1',
      ).set,
    ).not.toHaveBeenCalled();
  });

  it('uses legacy purchase totals instead of emitting amount zero', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
    });

    await syncPurchaseCommittedAccountingEvent({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        before: {
          data: () => ({
            status: 'pending',
            workflowStatus: 'pending_receipt',
          }),
        },
        after: {
          data: () => ({
            status: 'completed',
            workflowStatus: 'completed',
            condition: 'credit',
            totals: {
              subtotal: 1000,
              tax: 180,
              total: 1180,
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        monetary: expect.objectContaining({
          amount: 1180,
          subtotalAmount: 1000,
          taxAmount: 180,
          netPayableAmount: 1180,
        }),
        payload: expect.objectContaining({
          fiscalTotals: expect.objectContaining({
            subtotal: 1000,
            taxAmount: 180,
            total: 1180,
          }),
          settlementTiming: 'deferred',
        }),
      }),
    );
  });

  it('reconstructs purchase total when legacy monetary total is zero but subtotal exists', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
    });

    await syncPurchaseCommittedAccountingEvent({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        before: {
          data: () => ({
            status: 'pending',
            workflowStatus: 'pending_receipt',
          }),
        },
        after: {
          data: () => ({
            status: 'completed',
            workflowStatus: 'completed',
            condition: 'cash',
            monetary: {
              documentTotals: {
                subtotal: 1000,
                taxes: 180,
                total: 0,
              },
              functionalTotals: {
                subtotal: 1000,
                taxes: 180,
                total: 0,
              },
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        monetary: expect.objectContaining({
          amount: 1180,
          subtotalAmount: 1000,
          taxAmount: 180,
          netPayableAmount: 1180,
          functionalAmount: 1180,
          functionalSubtotalAmount: 1000,
          functionalTaxAmount: 180,
          functionalNetPayableAmount: 1180,
        }),
        payload: expect.objectContaining({
          settlementTiming: 'deferred',
          fiscalTotals: expect.objectContaining({
            subtotal: 1000,
            taxAmount: 180,
            total: 1180,
            netPayableAmount: 1180,
          }),
        }),
      }),
    );
  });

  it('adds bank treasury context from purchase paymentMethods', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
    });

    await syncPurchaseCommittedAccountingEvent({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        before: {
          data: () => ({
            status: 'pending',
            workflowStatus: 'pending_receipt',
          }),
        },
        after: {
          data: () => ({
            status: 'completed',
            workflowStatus: 'completed',
            paymentTerms: {
              condition: 'cash',
              isImmediate: true,
            },
            totals: {
              total: 2360,
              tax: 360,
            },
            paymentMethods: [
              {
                amount: 2360,
                bankAccountId: 'bank-1',
                method: 'transfer',
                reference: 'TRX-1',
              },
            ],
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        treasury: {
          bankAccountId: 'bank-1',
          cashAccountId: null,
          cashCountId: null,
          paymentChannel: 'bank',
        },
        payload: expect.objectContaining({
          paymentMethodCount: 1,
          paymentMethods: [
            {
              amount: 2360,
              bankAccountId: 'bank-1',
              cashAccountId: null,
              cashCountId: null,
              method: 'transfer',
              reference: 'TRX-1',
              value: 2360,
            },
          ],
          settlementTiming: 'immediate',
        }),
      }),
    );
  });

  it('adds cash treasury context from purchase paymentMethods', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
    });

    await syncPurchaseCommittedAccountingEvent({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        before: {
          data: () => ({
            status: 'pending',
            workflowStatus: 'pending_receipt',
          }),
        },
        after: {
          data: () => ({
            status: 'completed',
            workflowStatus: 'completed',
            paymentTerms: {
              condition: 'cash',
              isImmediate: true,
            },
            totals: {
              total: 3200,
              tax: 0,
            },
            paymentMethods: [
              {
                amount: 3200,
                cashCountId: 'cash-count-1',
                method: 'cash',
              },
            ],
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        treasury: {
          bankAccountId: null,
          cashAccountId: null,
          cashCountId: 'cash-count-1',
          paymentChannel: 'cash',
        },
      }),
    );
  });

  it('does not emit again when the purchase was already completed before the write', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
    });

    await syncPurchaseCommittedAccountingEvent({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        before: {
          data: () => ({
            status: 'completed',
            workflowStatus: 'completed',
          }),
        },
        after: {
          data: () => ({
            status: 'completed',
            workflowStatus: 'completed',
          }),
        },
      },
    });

    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });

  it('skips emission when general accounting is disabled', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: false,
    });

    await syncPurchaseCommittedAccountingEvent({
      params: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
      },
      data: {
        before: {
          data: () => ({
            status: 'pending',
          }),
        },
        after: {
          data: () => ({
            status: 'completed',
            workflowStatus: 'completed',
          }),
        },
      },
    });

    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });
});
