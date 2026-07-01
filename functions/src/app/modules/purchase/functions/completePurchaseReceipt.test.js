import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertAccountingPeriodOpenInTransactionMock,
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  batchCommitMock,
  batchSetMock,
  batchUpdateMock,
  completePath,
  dbMock,
  dbDocs,
  getDefaultWarehouseMock,
  getNextIDMock,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  const hoistedDocs = new Map();
  const hoistedBatchSetMock = vi.fn();
  const hoistedBatchUpdateMock = vi.fn();
  const hoistedBatchCommitMock = vi.fn();
  const hoistedTransactionSetMock = vi.fn();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedAssertBusinessSubscriptionAccessMock = vi.fn();
  const hoistedGetDefaultWarehouseMock = vi.fn();
  const hoistedGetNextIDMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedAssertAccountingPeriodOpenInTransactionMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const normalizePath = (path) => String(path).replace(/^\/+|\/+$/g, '');
  const complete = (path) => normalizePath(path);
  const snap = (path, data) => ({
    exists: data != null,
    id: complete(path).split('/').at(-1),
    ref: getDocRef(complete(path)),
    data: () => data,
  });

  const applyPayload = (path, payload) => {
    const current = hoistedDocs.get(path) || {};
    hoistedDocs.set(path, {
      ...current,
      ...payload,
    });
  };

  const getDocRef = (path) => ({
    path: complete(path),
    id: complete(path).split('/').at(-1),
    get: async () => snap(complete(path), hoistedDocs.get(complete(path))),
  });

  const buildQuery = (path, filters = []) => ({
    path: complete(path),
    where(field, op, value) {
      return buildQuery(path, [...filters, { field, op, value }]);
    },
    limit() {
      return buildQuery(path, filters);
    },
    doc(id = `auto-${hoistedDocs.size + 1}`) {
      return getDocRef(`${complete(path)}/${id}`);
    },
    async get() {
      const prefix = `${complete(path)}/`;
      const docs = Array.from(hoistedDocs.entries())
        .filter(([docPath]) => docPath.startsWith(prefix))
        .filter(([docPath]) => docPath.slice(prefix.length).split('/').length === 1)
        .filter(([, data]) =>
          filters.every(({ field, op, value }) => {
            if (op !== '==') return false;
            return data?.[field] === value;
          }),
        )
        .map(([docPath, data]) => snap(docPath, data));
      return {
        empty: docs.length === 0,
        docs,
      };
    },
  });

  const runTransaction = vi.fn(async (callback) =>
    callback({
      get: (ref) => ref.get(),
      set: (ref, payload) => {
        hoistedTransactionSetMock(ref, payload);
        applyPayload(ref.path, payload);
      },
    }),
  );

  return {
    assertAccountingPeriodOpenInTransactionMock:
      hoistedAssertAccountingPeriodOpenInTransactionMock,
    assertBusinessSubscriptionAccessMock:
      hoistedAssertBusinessSubscriptionAccessMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    batchCommitMock: hoistedBatchCommitMock,
    batchSetMock: hoistedBatchSetMock,
    batchUpdateMock: hoistedBatchUpdateMock,
    completePath: complete,
    dbDocs: hoistedDocs,
    getDefaultWarehouseMock: hoistedGetDefaultWarehouseMock,
    getDocRef,
    getNextIDMock: hoistedGetNextIDMock,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: runTransaction,
    toSnapshot: snap,
    transactionSetMock: hoistedTransactionSetMock,
    dbMock: {
      doc: (path) => getDocRef(path),
      collection: (path) => buildQuery(path),
      batch: () => ({
        set: (ref, payload) => {
          hoistedBatchSetMock(ref, payload);
          applyPayload(ref.path, payload);
        },
        update: (ref, payload) => {
          hoistedBatchUpdateMock(ref, payload);
          applyPayload(ref.path, payload);
        },
        commit: hoistedBatchCommitMock,
      }),
      runTransaction,
    },
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: dbMock,
  FieldValue: {
    increment: (value) => ({ __op: 'increment', value }),
    serverTimestamp: () => ({ __op: 'serverTimestamp' }),
  },
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
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
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../core/utils/getNextID.js', () => ({
  getNextID: (...args) => getNextIDMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    MAINTENANCE: ['owner', 'admin'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock(
  '../../../versions/v2/billing/utils/subscriptionAccess.util.js',
  () => ({
    assertBusinessSubscriptionAccess: (...args) =>
      assertBusinessSubscriptionAccessMock(...args),
  }),
);

vi.mock(
  '../../../versions/v2/accounting/utils/accountingRollout.util.js',
  () => ({
    getPilotAccountingSettingsForBusiness: (...args) =>
      getPilotAccountingSettingsForBusinessMock(...args),
    isAccountingRolloutEnabledForBusiness: (...args) =>
      isAccountingRolloutEnabledForBusinessMock(...args),
  }),
);

vi.mock('../../../versions/v2/accounting/utils/periodClosure.util.js', () => ({
  assertAccountingPeriodOpenInTransaction: (...args) =>
    assertAccountingPeriodOpenInTransactionMock(...args),
}));

vi.mock('../../warehouse/services/defaultWarehouse.service.js', () => ({
  getDefaultWarehouse: (...args) => getDefaultWarehouseMock(...args),
}));

import { completePurchaseReceiptHandler } from './completePurchaseReceipt.js';

describe('completePurchaseReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbDocs.clear();
    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue({ role: 'admin' });
    assertBusinessSubscriptionAccessMock.mockResolvedValue({ allowed: true });
    getDefaultWarehouseMock.mockResolvedValue({
      id: 'warehouse-1',
      name: 'Principal',
    });
    getNextIDMock.mockResolvedValue(77);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    assertAccountingPeriodOpenInTransactionMock.mockResolvedValue('2026-06');
    batchCommitMock.mockResolvedValue(undefined);

    dbDocs.set(completePath('businesses/business-1/purchases/purchase-1'), {
      id: 'purchase-1',
      workflowStatus: 'pending_receipt',
      status: 'pending',
      replenishments: [
        {
          id: 'product-1',
          name: 'Café',
          orderedQuantity: 5,
          receivedQuantity: 0,
          pendingQuantity: 5,
          unitCost: 11,
        },
      ],
      receiptHistory: [],
    });
    dbDocs.set(completePath('businesses/business-1/products/product-1'), {
      id: 'product-1',
      stock: 4,
      status: 'active',
      pricing: {
        cost: 8,
      },
    });
  });

  it('applies purchase receipt inventory in backend and freezes received cost', async () => {
    const result = await completePurchaseReceiptHandler({
      auth: {
        uid: 'user-1',
      },
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        purchase: {
          id: 'purchase-1',
          deliveryAt: Date.parse('2026-06-15T12:00:00.000Z'),
          replenishments: [
            {
              id: 'product-1',
              name: 'Café',
              orderedQuantity: 5,
              receivedQuantity: 3,
              pendingQuantity: 2,
              unitCost: 11,
            },
          ],
        },
        paymentTerms: {
          condition: 'cash',
        },
        paymentState: {
          total: 33,
          paid: 0,
          balance: 33,
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.purchase.workflowStatus).toBe('partial_receipt');
    expect(result.purchase.receiptInventoryState).toMatchObject({
      status: 'applied',
      warehouseId: 'warehouse-1',
      receiptReplenishments: [
        expect.objectContaining({
          id: 'product-1',
          quantity: 3,
        }),
      ],
    });
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['owner', 'admin'],
    });
    expect(assertAccountingPeriodOpenInTransactionMock).toHaveBeenCalled();

    expect(batchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/products/product-1',
      }),
      expect.objectContaining({
        stock: {
          __op: 'increment',
          value: 3,
        },
      }),
    );
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(
          /^businesses\/business-1\/productsStock\/auto-/,
        ),
      }),
      expect.objectContaining({
        productId: 'product-1',
        quantity: 3,
        stock: 3,
        unitCost: 11,
        cost: 11,
        pricing: {
          cost: 11,
        },
      }),
    );
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(
          /^businesses\/business-1\/movements\/purchaseReceipt_purchase-1_/,
        ),
      }),
      expect.objectContaining({
        productId: 'product-1',
        quantity: 3,
        movementType: 'in',
        movementReason: 'purchase',
        unitCost: 11,
        totalCost: 33,
      }),
    );
  });

  it('ignores client supplied payable financial and control fields when completing receipt', async () => {
    const purchasePath = completePath(
      'businesses/business-1/purchases/purchase-1',
    );
    const trustedDueAt = '2026-07-15T12:00:00.000Z';
    const tamperedDueAt = '2099-01-01T00:00:00.000Z';

    dbDocs.set(purchasePath, {
      ...dbDocs.get(purchasePath),
      providerId: 'supplier-1',
      monetary: {
        documentTotals: {
          total: 55,
          netPayableAmount: 55,
        },
      },
      paymentTerms: {
        condition: 'credit',
        nextPaymentAt: trustedDueAt,
      },
      paymentState: {
        total: 55,
        paid: 0,
        balance: 55,
        paymentCount: 0,
        nextPaymentAt: trustedDueAt,
      },
      accountsPayable: {
        approvalStatus: 'pending_approval',
        approvalRequestedBy: 'buyer-1',
      },
    });

    const result = await completePurchaseReceiptHandler({
      auth: {
        uid: 'user-1',
      },
      data: {
        businessId: 'business-1',
        purchaseId: 'purchase-1',
        monetary: {
          documentTotals: {
            total: 0,
            netPayableAmount: 0,
          },
        },
        paymentTerms: {
          condition: 'cash',
          nextPaymentAt: tamperedDueAt,
        },
        paymentState: {
          total: 0,
          paid: 9999,
          balance: 0,
          paymentCount: 99,
          status: 'paid',
          nextPaymentAt: tamperedDueAt,
        },
        purchase: {
          id: 'purchase-1',
          providerId: 'attacker-supplier',
          accountsPayable: {
            approvalStatus: 'approved',
            status: 'voided',
            approvedBy: 'attacker',
          },
          replenishments: [
            {
              id: 'product-1',
              orderedQuantity: 999,
              receivedQuantity: 999,
              pendingQuantity: 0,
              unitCost: 999,
            },
          ],
        },
      },
    });

    const persisted = dbDocs.get(purchasePath);

    expect(result.purchase.paymentState).toMatchObject({
      total: 55,
      paid: 0,
      balance: 55,
      paymentCount: 0,
      nextPaymentAt: trustedDueAt,
    });
    expect(result.purchase.paymentState.status).not.toBe('paid');
    expect(persisted.paymentTerms).toMatchObject({
      condition: 'credit',
      nextPaymentAt: trustedDueAt,
    });
    expect(persisted.monetary.documentTotals.total).toBe(55);
    expect(persisted.providerId).toBe('supplier-1');
    expect(persisted.accountsPayable).toMatchObject({
      approvalStatus: 'pending_approval',
      approvalRequestedBy: 'buyer-1',
    });
    expect(persisted.accountsPayable).not.toMatchObject({
      status: 'voided',
      approvedBy: 'attacker',
    });
    expect(persisted.replenishments[0]).toMatchObject({
      id: 'product-1',
      orderedQuantity: 5,
      receivedQuantity: 5,
      pendingQuantity: 0,
      unitCost: 11,
    });
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(
          /^businesses\/business-1\/movements\/purchaseReceipt_purchase-1_/,
        ),
      }),
      expect.objectContaining({
        productId: 'product-1',
        quantity: 5,
        unitCost: 11,
        totalCost: 55,
      }),
    );
  });

  it('marks the receipt operation as failed when inventory commit fails', async () => {
    batchCommitMock.mockRejectedValueOnce(new Error('commit failed'));

    await expect(
      completePurchaseReceiptHandler({
        auth: {
          uid: 'user-1',
        },
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          purchase: {
            id: 'purchase-1',
            replenishments: [
              {
                id: 'product-1',
                orderedQuantity: 5,
                receivedQuantity: 3,
                pendingQuantity: 2,
              },
            ],
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'internal',
    });

    const purchase = dbDocs.get(
      completePath('businesses/business-1/purchases/purchase-1'),
    );
    expect(purchase.receiptInventoryState).toMatchObject({
      status: 'failed',
      errorMessage: 'commit failed',
    });
  });
});
