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

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', () => ({
  buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
}));

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
            updatedBy: 'user-1',
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
        monetary: {
          amount: 100,
          taxAmount: 18,
          functionalAmount: 6200,
          functionalTaxAmount: 1116,
        },
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
