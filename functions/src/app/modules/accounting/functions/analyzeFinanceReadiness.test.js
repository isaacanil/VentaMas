import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  collectionData,
  docData,
  getUserAccessProfileMock,
} = vi.hoisted(() => ({
  assertUserAccessMock: vi.fn(),
  collectionData: new Map(),
  docData: new Map(),
  getUserAccessProfileMock: vi.fn(),
}));

const makeDocSnap = (id, data = null) => ({
  id,
  exists: data != null,
  data: () => data,
});

const makeCollection = (path, limitValue = null) => ({
  limit: vi.fn((nextLimit) => makeCollection(path, nextLimit)),
  get: vi.fn(async () => {
    const rows = collectionData.get(path) ?? [];
    const limitedRows =
      limitValue == null ? rows : rows.slice(0, Math.max(0, limitValue));
    return {
      docs: limitedRows.map((row) => makeDocSnap(row.id, row.data)),
    };
  }),
});

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
    onCall: (handler) => handler,
  },
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    collection: (path) => makeCollection(path),
    doc: (path) => ({
      get: vi.fn(async () => {
        const data = docData.get(path);
        return makeDocSnap(path.split('/').pop(), data ?? null);
      }),
    }),
  },
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    AUDIT: new Set(['owner', 'admin', 'manager', 'dev']),
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
  getUserAccessProfile: (...args) => getUserAccessProfileMock(...args),
}));

import { analyzeFinanceReadiness } from './analyzeFinanceReadiness.js';

describe('analyzeFinanceReadiness', () => {
  beforeEach(() => {
    collectionData.clear();
    docData.clear();
    vi.clearAllMocks();
    assertUserAccessMock.mockResolvedValue(undefined);
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      hasGlobalUnscopedAccess: true,
    });
  });

  it('reports blockers and preparation gaps without writing data', async () => {
    docData.set('businesses/business-1', { businessName: 'Demo' });
    docData.set('businesses/business-1/settings/accounting', {
      functionalCurrency: 'DOP',
      rollout: { cutoverAt: 1_700_000_000_000 },
    });
    collectionData.set('businesses/business-1/purchases', [
      {
        id: 'purchase-1',
        data: {
          id: 'purchase-1',
          workflowStatus: 'completed',
          totalAmount: 118,
          completedAt: 1_700_000_100_000,
          monetary: {
            documentCurrency: { code: 'USD' },
            documentTotals: { total: 118 },
          },
        },
      },
    ]);
    collectionData.set('businesses/business-1/vendorBills', []);
    collectionData.set('businesses/business-1/accountsPayablePayments', [
      {
        id: 'payment-1',
        data: {
          id: 'payment-1',
          purchaseId: 'purchase-1',
          status: 'posted',
          paymentMethods: [{ method: 'transfer', amount: 50 }],
          occurredAt: 1_700_000_200_000,
        },
      },
    ]);
    collectionData.set('businesses/business-1/accountsReceivablePayments', []);
    collectionData.set('businesses/business-1/bankAccounts', []);
    collectionData.set('businesses/business-1/cashCounts', []);
    collectionData.set('businesses/business-1/cashMovements', []);
    collectionData.set('businesses/business-1/accountingEvents', []);
    collectionData.set('businesses/business-1/journalEntries', []);
    collectionData.set('businesses/business-1/exchangeRates', []);

    const result = await analyzeFinanceReadiness(
      { businessId: 'business-1' },
      { auth: { uid: 'dev-1' } },
    );

    expect(result.status).toBe('done');
    expect(result.mode).toBe('read-only');
    expect(result.summary.blocked).toBe(1);
    expect(result.summary.blockers).toBeGreaterThan(0);
    expect(result.businessResults[0].modules.cxp.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'purchase_missing_supplier' }),
        expect.objectContaining({ code: 'purchase_missing_vendor_bill' }),
      ]),
    );
    expect(result.businessResults[0].modules.treasury.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'payment_bank_method_missing_bank_account',
        }),
      ]),
    );
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'dev-1',
      businessId: 'business-1',
      allowedRoles: new Set(['owner', 'admin', 'manager', 'dev']),
    });
  });

  it('marks a prepared business as ready', async () => {
    docData.set('businesses/business-1', { businessName: 'Ready Demo' });
    docData.set('businesses/business-1/settings/accounting', {
      functionalCurrency: 'DOP',
      rollout: { cutoverAt: 1_700_000_000_000 },
    });
    collectionData.set('businesses/business-1/purchases', [
      {
        id: 'purchase-1',
        data: {
          id: 'purchase-1',
          workflowStatus: 'completed',
          provider: 'supplier-1',
          completedAt: 1_700_000_100_000,
          paymentState: {
            status: 'paid',
            total: 118,
            paid: 118,
            balance: 0,
          },
          monetary: {
            documentCurrency: { code: 'DOP' },
            documentTotals: { total: 118 },
          },
        },
      },
    ]);
    collectionData.set('businesses/business-1/vendorBills', [
      {
        id: 'purchase:purchase-1',
        data: { id: 'purchase:purchase-1' },
      },
    ]);
    collectionData.set('businesses/business-1/accountsPayablePayments', [
      {
        id: 'payment-1',
        data: {
          id: 'payment-1',
          purchaseId: 'purchase-1',
          status: 'posted',
          bankAccountId: 'bank-1',
          paymentMethods: [
            { method: 'transfer', amount: 118, bankAccountId: 'bank-1' },
          ],
          occurredAt: 1_700_000_200_000,
          monetary: {
            documentCurrency: { code: 'DOP' },
            documentTotals: { total: 118 },
          },
        },
      },
    ]);
    collectionData.set('businesses/business-1/accountsReceivablePayments', []);
    collectionData.set('businesses/business-1/bankAccounts', [
      { id: 'bank-1', data: { id: 'bank-1', status: 'active' } },
    ]);
    collectionData.set('businesses/business-1/cashCounts', []);
    collectionData.set('businesses/business-1/cashMovements', []);
    collectionData.set('businesses/business-1/accountingEvents', [
      {
        id: 'purchase-event',
        data: {
          id: 'purchase-event',
          eventType: 'purchase.committed',
          sourceId: 'purchase-1',
        },
      },
      {
        id: 'payment-event',
        data: {
          id: 'payment-event',
          eventType: 'accounts_payable.payment.recorded',
          sourceId: 'payment-1',
        },
      },
    ]);
    collectionData.set('businesses/business-1/journalEntries', []);
    collectionData.set('businesses/business-1/exchangeRates', []);

    const result = await analyzeFinanceReadiness(
      { businessId: 'business-1' },
      { auth: { uid: 'dev-1' } },
    );

    expect(result.summary).toMatchObject({
      ready: 1,
      needs_preparation: 0,
      blocked: 0,
      blockers: 0,
      warnings: 0,
    });
    expect(result.businessResults[0].status).toBe('ready');
  });
});
