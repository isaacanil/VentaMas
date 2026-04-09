import { beforeEach, describe, expect, it, vi } from 'vitest';

let docMock = vi.fn();
let runTransactionMock = vi.fn();
const incrementMock = vi.fn((value) => ({ __op: 'increment', value }));
const serverTimestampMock = vi.fn(() => ({ __op: 'serverTimestamp' }));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  FieldValue: {
    increment: (...args) => incrementMock(...args),
    serverTimestamp: (...args) => serverTimestampMock(...args),
  },
}));

import {
  assertUsageCanIncrease,
  incrementBusinessUsageMetric,
} from './usage.service.js';

describe('usage.service', () => {
  let currentRef;
  let monthlyEntryRef;
  let tx;

  beforeEach(() => {
    incrementMock.mockClear();
    serverTimestampMock.mockClear();

    currentRef = {
      get: vi.fn(),
    };
    monthlyEntryRef = {
      get: vi.fn(),
    };

    const monthlyRef = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => monthlyEntryRef),
      })),
    };

    const businessRef = {
      collection: vi.fn(() => ({
        doc: vi.fn((docId) => {
          if (docId === 'current') return currentRef;
          if (docId === 'monthly') return monthlyRef;
          throw new Error(`Unexpected usage doc id: ${docId}`);
        }),
      })),
    };

    docMock = vi.fn(() => businessRef);
    tx = {
      set: vi.fn(),
    };
    runTransactionMock = vi.fn(async (callback) => callback(tx));
  });

  it('allows increments when the plan limit is unlimited', () => {
    expect(
      assertUsageCanIncrease({
        subscription: {
          limits: {
            monthlyInvoices: -1,
          },
        },
        metricKey: 'monthlyInvoices',
        currentValue: 10,
        incrementBy: 2,
        planId: 'plus',
      }),
    ).toEqual({
      ok: true,
      limit: -1,
      nextValue: 12,
      remaining: null,
    });
  });

  it('throws when the next value would exceed the configured limit', () => {
    expect(() =>
      assertUsageCanIncrease({
        subscription: {
          limits: {
            monthlyInvoices: 5,
          },
        },
        metricKey: 'monthlyInvoices',
        currentValue: 5,
        incrementBy: 1,
        planId: 'demo',
      }),
    ).toThrow('Límite excedido para monthlyInvoices');
  });

  it('skips writes when incrementBy resolves to zero', async () => {
    await expect(
      incrementBusinessUsageMetric({
        businessId: 'business-1',
        metricKey: 'monthlyInvoices',
        incrementBy: 0,
        tx,
      }),
    ).resolves.toEqual({
      ok: true,
      skipped: true,
    });

    expect(tx.set).not.toHaveBeenCalled();
  });

  it('writes both current and monthly usage documents inside a transaction', async () => {
    await expect(
      incrementBusinessUsageMetric({
        businessId: 'business-1',
        metricKey: 'monthlyInvoices',
        incrementBy: 2,
        monthKey: '2026-03',
        tx,
      }),
    ).resolves.toEqual({
      ok: true,
      businessId: 'business-1',
      metricKey: 'monthlyInvoices',
      currentValue: null,
      monthlyValue: null,
      monthKey: '2026-03',
    });

    expect(tx.set).toHaveBeenNthCalledWith(
      1,
      currentRef,
      expect.objectContaining({
        businessId: 'business-1',
        monthKey: '2026-03',
        monthlyInvoices: { __op: 'increment', value: 2 },
        updatedAt: { __op: 'serverTimestamp' },
      }),
      { merge: true },
    );
    expect(tx.set).toHaveBeenNthCalledWith(
      2,
      monthlyEntryRef,
      expect.objectContaining({
        businessId: 'business-1',
        month: '2026-03',
        monthlyInvoices: { __op: 'increment', value: 2 },
        updatedAt: { __op: 'serverTimestamp' },
      }),
      { merge: true },
    );
  });
});
