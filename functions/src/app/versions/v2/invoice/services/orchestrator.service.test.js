import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let docMock = vi.fn();
let runTransactionMock = vi.fn();
const serverTimestampMock = vi.fn(() => ({ __op: 'serverTimestamp' }));
const timestampNowMock = vi.fn(() => ({ __op: 'timestampNow' }));
const stableHashMock = vi.fn();
const assertUsageCanIncreaseMock = vi.fn();
const resolvePilotMonetarySnapshotForBusinessMock = vi.fn();
const isAccountingRolloutEnabledForBusinessMock = vi.fn();
const auditTxMock = vi.fn();
const getIdempotencyRefMock = vi.fn();
const reserveNcfMock = vi.fn();
const nanoidMock = vi.fn();

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
  },
  Timestamp: {
    now: (...args) => timestampNowMock(...args),
  },
}));

vi.mock('../utils/hash.util.js', () => ({
  stableHash: (...args) => stableHashMock(...args),
}));

vi.mock('../../billing/services/usage.service.js', () => ({
  assertUsageCanIncrease: (...args) => assertUsageCanIncreaseMock(...args),
}));

vi.mock('../../accounting/utils/accountingRollout.util.js', () => ({
  resolvePilotMonetarySnapshotForBusiness: (...args) =>
    resolvePilotMonetarySnapshotForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

vi.mock('./audit.service.js', () => ({
  auditTx: (...args) => auditTxMock(...args),
}));

vi.mock('./idempotency.service.js', () => ({
  getIdempotencyRef: (...args) => getIdempotencyRefMock(...args),
}));

vi.mock('./ncf.service.js', () => ({
  reserveNcf: (...args) => reserveNcfMock(...args),
}));

vi.mock('nanoid', () => ({
  nanoid: (...args) => nanoidMock(...args),
}));

import { createPendingInvoice } from './orchestrator.service.js';

describe('orchestrator.service', () => {
  let tx;
  let refs;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-17T00:00:00.000Z'));

    stableHashMock.mockReset();
    assertUsageCanIncreaseMock.mockReset();
    resolvePilotMonetarySnapshotForBusinessMock.mockReset();
    isAccountingRolloutEnabledForBusinessMock.mockReset();
    auditTxMock.mockReset();
    getIdempotencyRefMock.mockReset();
    reserveNcfMock.mockReset();
    nanoidMock.mockReset();

    stableHashMock
      .mockReturnValueOnce('payload-hash')
      .mockReturnValueOnce('cart-hash');
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(false);
    nanoidMock
      .mockReturnValueOnce('task-inventory')
      .mockReturnValueOnce('task-canonical')
      .mockReturnValueOnce('task-cash-count');

    refs = new Map();
    const getRef = (path) => {
      if (!refs.has(path)) {
        refs.set(path, { path });
      }
      return refs.get(path);
    };

    docMock = vi.fn((path) => getRef(path));
    getIdempotencyRefMock.mockImplementation((businessId, idempotencyKey) =>
      getRef(`idempotency:${businessId}:${idempotencyKey}`),
    );

    tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'idempotency:business-1:idem-1') {
          return { exists: false };
        }
        if (ref.path === 'businesses/business-1') {
          return {
            exists: true,
            data: () => ({
              subscription: {
                status: 'active',
                planId: 'plus',
                limits: { monthlyInvoices: 10 },
              },
            }),
          };
        }
        if (ref.path === 'businesses/business-1/usage/current') {
          return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
        }
        if (ref.path.startsWith('businesses/business-1/usage/monthly/entries/')) {
          return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
        }
        if (ref.path === 'businesses/business-1/settings/accounting') {
          return { exists: false, data: () => ({}) };
        }
        if (ref.path.startsWith('businesses/business-1/accountingPeriodClosures/')) {
          return { exists: false, data: () => ({}) };
        }
        throw new Error(`Unexpected tx.get path: ${ref.path}`);
      }),
      set: vi.fn(),
    };

    runTransactionMock = vi.fn(async (callback) => callback(tx));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the existing invoice when the idempotency key was already registered', async () => {
    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return {
          exists: true,
          data: () => ({
            invoiceId: 'invoice-existing',
          }),
        };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        payload: { cart: {} },
        idempotencyKey: 'idem-1',
      }),
    ).resolves.toEqual({
      invoiceId: 'invoice-existing',
      status: 'pending',
      alreadyExists: true,
    });

    expect(tx.set).not.toHaveBeenCalled();
  });

  it('creates a pending invoice with derived due date, comment and usage updates', async () => {
    const result = await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      cashCountId: 'cash-1',
      payload: {
        cart: {
          id: 'cart-1',
          hasDueDate: true,
          billing: {
            hasDueDate: true,
            duePeriod: {
              days: 10,
            },
          },
          products: [
            { id: 'p1', name: 'Producto A', amountToBuy: 1, comment: 'observacion' },
          ],
          payment: { value: 250 },
          totalPurchaseWithoutTaxes: { value: 200 },
          totalTaxes: { value: 36 },
          totalPurchase: { value: 236 },
        },
        client: { id: 'client-1' },
      },
    });

    expect(assertUsageCanIncreaseMock).toHaveBeenCalledWith({
      subscription: expect.objectContaining({
        planId: 'plus',
      }),
      metricKey: 'monthlyInvoices',
      currentValue: 3,
      incrementBy: 1,
      planId: 'plus',
    });
    expect(result).toEqual({
      invoiceId: 'cart-1',
      status: 'pending',
      alreadyExists: false,
    });

    const invoiceWrite = tx.set.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/invoicesV2/cart-1',
    );
    expect(invoiceWrite).toBeTruthy();
    expect(invoiceWrite[1]).toEqual(
      expect.objectContaining({
        version: 2,
        status: 'pending',
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        requestHash: 'payload-hash',
        cartHash: 'cart-hash',
        snapshot: expect.objectContaining({
          dueDate: new Date('2026-03-27T00:00:00.000Z').getTime(),
          invoiceComment: 'Producto A: observacion',
          meta: expect.objectContaining({
            cashCount: {
              intendedCashCountId: 'cash-1',
            },
          }),
        }),
      }),
    );

    const idempotencyWrite = tx.set.mock.calls.find(
      ([ref]) => ref.path === 'idempotency:business-1:idem-1',
    );
    expect(idempotencyWrite[1]).toEqual(
      expect.objectContaining({
        invoiceId: 'cart-1',
        payloadHash: 'payload-hash',
        status: 'pending',
      }),
    );
  });

  it('rejects enabled NCF requests when the type is missing', async () => {
    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {},
          ncf: {
            enabled: true,
          },
        },
      }),
    ).rejects.toThrow('ncfType requerido cuando ncf.enabled=true');
  });

  it('blocks the invoice when the effective accounting period is closed', async () => {
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);

    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return { exists: false };
      }
      if (ref.path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            subscription: {
              status: 'active',
              planId: 'plus',
              limits: { monthlyInvoices: 10 },
            },
          }),
        };
      }
      if (ref.path === 'businesses/business-1/usage/current') {
        return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
      }
      if (ref.path.startsWith('businesses/business-1/usage/monthly/entries/')) {
        return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
      }
      if (ref.path === 'businesses/business-1/settings/accounting') {
        return {
          exists: true,
          data: () => ({
            generalAccountingEnabled: true,
          }),
        };
      }
      if (ref.path === 'businesses/business-1/accountingPeriodClosures/2026-03') {
        return {
          exists: true,
          data: () => ({
            periodKey: '2026-03',
            status: 'closed',
          }),
        };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {
            id: 'cart-closed',
            date: '2026-03-10T15:00:00.000Z',
            payment: { value: 250 },
            totalPurchaseWithoutTaxes: { value: 200 },
            totalTaxes: { value: 36 },
            totalPurchase: { value: 236 },
          },
        },
      }),
    ).rejects.toThrow(
      'No puedes registrar esta factura con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    );

    expect(tx.set).not.toHaveBeenCalled();
  });

  it('allows the invoice when accounting is enabled and the effective period is open', async () => {
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);

    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return { exists: false };
      }
      if (ref.path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            subscription: {
              status: 'active',
              planId: 'plus',
              limits: { monthlyInvoices: 10 },
            },
          }),
        };
      }
      if (ref.path === 'businesses/business-1/usage/current') {
        return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
      }
      if (ref.path.startsWith('businesses/business-1/usage/monthly/entries/')) {
        return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
      }
      if (ref.path === 'businesses/business-1/settings/accounting') {
        return {
          exists: true,
          data: () => ({
            generalAccountingEnabled: true,
          }),
        };
      }
      if (ref.path === 'businesses/business-1/accountingPeriodClosures/2026-03') {
        return { exists: false, data: () => ({}) };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    const result = await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      cashCountId: 'cash-1',
      payload: {
        cart: {
          id: 'cart-open',
          date: '2026-03-10T15:00:00.000Z',
          payment: { value: 250 },
          totalPurchaseWithoutTaxes: { value: 200 },
          totalTaxes: { value: 36 },
          totalPurchase: { value: 236 },
        },
      },
    });

    expect(result).toEqual({
      invoiceId: 'cart-open',
      status: 'pending',
      alreadyExists: false,
    });
    expect(tx.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingPeriodClosures/2026-03',
      }),
    );
  });
});
