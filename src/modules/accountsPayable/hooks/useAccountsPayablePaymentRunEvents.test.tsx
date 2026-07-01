import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type PaymentRunEventsSnapshot = {
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
  snapshot: PaymentRunEventsSnapshot,
  metadata?: PaymentRunsSnapshotMetadata,
) => void;

const { subscribeToAccountsPayablePaymentRunEventsMock } = vi.hoisted(() => ({
  subscribeToAccountsPayablePaymentRunEventsMock: vi.fn(),
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
  subscribeToAccountsPayablePaymentRunEvents: (...args: unknown[]) =>
    subscribeToAccountsPayablePaymentRunEventsMock(...args),
}));

import { useAccountsPayablePaymentRunEvents } from './useAccountsPayablePaymentRunEvents';

const createSnapshot = (
  events: Array<{ data: Record<string, unknown>; id: string }>,
): PaymentRunEventsSnapshot => ({
  docs: events.map((event) => ({
    data: () => event.data,
    id: event.id,
  })),
});

describe('useAccountsPayablePaymentRunEvents', () => {
  beforeEach(() => {
    subscribeToAccountsPayablePaymentRunEventsMock.mockReset();
  });

  it('exposes capped event metadata and groups events by payment run', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToAccountsPayablePaymentRunEventsMock.mockImplementation(
      (
        _businessId: string,
        onNext: SnapshotHandler,
      ) => {
        handleSnapshot = onNext;
        return unsubscribe;
      },
    );

    const { result, unmount } = renderHook(() =>
      useAccountsPayablePaymentRunEvents('business-1', true, { limit: 2 }),
    );

    expect(result.current.loading).toBe(true);
    expect(subscribeToAccountsPayablePaymentRunEventsMock).toHaveBeenCalledWith(
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
              action: 'approve',
              createdAt: new Date('2026-04-12T12:00:00.000Z').getTime(),
              paymentRunId: 'run-1',
            },
            id: 'event-1',
          },
          {
            data: {
              action: 'submit',
              createdAt: new Date('2026-04-11T12:00:00.000Z').getTime(),
              paymentRunId: 'run-1',
            },
            id: 'event-2',
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
    expect(result.current.events.map((event) => event.id)).toEqual([
      'event-1',
      'event-2',
    ]);
    expect(result.current.eventsByPaymentRunId['run-1']).toHaveLength(2);

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
