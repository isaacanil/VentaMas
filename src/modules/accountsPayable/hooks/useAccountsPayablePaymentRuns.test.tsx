import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type PaymentRunSnapshot = {
  docs: Array<{
    data: () => Record<string, unknown>;
    id: string;
  }>;
};

type PaymentRunsSnapshotMetadata = {
  hasMore: boolean;
  rawDocCount: number;
  visibleDocCount: number;
};

type SnapshotHandler = (
  snapshot: PaymentRunSnapshot,
  metadata?: PaymentRunsSnapshotMetadata,
) => void;

const { subscribeToAccountsPayablePaymentRunsMock } = vi.hoisted(() => ({
  subscribeToAccountsPayablePaymentRunsMock: vi.fn(),
}));

vi.mock('@/modules/accountsPayable/repositories/paymentRuns.repository', () => ({
  DEFAULT_PAYMENT_RUNS_LIMIT: 25,
  MAX_PAYMENT_RUNS_LIMIT: 100,
  resolvePaymentRunsLimit: (value: number | null | undefined) => {
    if (value == null) return 25;
    const parsed = Math.trunc(Number(value));
    if (!Number.isFinite(parsed) || parsed <= 0) return 25;
    return Math.min(parsed, 100);
  },
  subscribeToAccountsPayablePaymentRuns: (...args: unknown[]) =>
    subscribeToAccountsPayablePaymentRunsMock(...args),
}));

import { useAccountsPayablePaymentRuns } from './useAccountsPayablePaymentRuns';

const createSnapshot = (
  runs: Array<{ data: Record<string, unknown>; id: string }>,
): PaymentRunSnapshot => ({
  docs: runs.map((run) => ({
    data: () => run.data,
    id: run.id,
  })),
});

describe('useAccountsPayablePaymentRuns', () => {
  beforeEach(() => {
    subscribeToAccountsPayablePaymentRunsMock.mockReset();
  });

  it('does not subscribe while the modal is closed', () => {
    const { result } = renderHook(() =>
      useAccountsPayablePaymentRuns('business-1', false),
    );

    expect(subscribeToAccountsPayablePaymentRunsMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      error: null,
      hasMore: false,
      loading: false,
      queryLimit: 25,
      rawDocCount: 0,
      runs: [],
    });
  });

  it('exposes capped history metadata from the subscription', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToAccountsPayablePaymentRunsMock.mockImplementation(
      (
        _businessId: string,
        onNext: SnapshotHandler,
      ) => {
        handleSnapshot = onNext;
        return unsubscribe;
      },
    );

    const { result, unmount } = renderHook(() =>
      useAccountsPayablePaymentRuns('business-1', true, { limit: 2 }),
    );

    expect(result.current.loading).toBe(true);
    expect(subscribeToAccountsPayablePaymentRunsMock).toHaveBeenCalledWith(
      'business-1',
      expect.any(Function),
      expect.any(Function),
      { limit: 2 },
    );

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            data: {
              createdAt: new Date('2026-04-12T12:00:00.000Z').getTime(),
              status: 'approved',
            },
            id: 'run-1',
          },
          {
            data: {
              createdAt: new Date('2026-04-11T12:00:00.000Z').getTime(),
              status: 'draft',
            },
            id: 'run-2',
          },
        ]),
        {
          hasMore: true,
          rawDocCount: 3,
          visibleDocCount: 2,
        },
      );
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.queryLimit).toBe(2);
    expect(result.current.rawDocCount).toBe(3);
    expect(result.current.runs.map((run) => run.id)).toEqual(['run-1', 'run-2']);

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
