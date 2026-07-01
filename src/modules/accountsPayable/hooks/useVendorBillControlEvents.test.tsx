import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ControlEventDocData = Record<string, unknown>;

type ControlEventSnapshot = {
  docs: Array<{
    data: () => ControlEventDocData;
    id: string;
  }>;
};

type SnapshotHandler = (snapshot: ControlEventSnapshot) => void;
type SnapshotErrorHandler = (error: unknown) => void;

const { subscribeToVendorBillControlEventsMock } = vi.hoisted(() => ({
  subscribeToVendorBillControlEventsMock: vi.fn(),
}));

vi.mock(
  '@/modules/accountsPayable/repositories/vendorBillControlEvents.repository',
  () => ({
    subscribeToVendorBillControlEvents: (...args: unknown[]) =>
      subscribeToVendorBillControlEventsMock(...args),
  }),
);

import { useVendorBillControlEvents } from './useVendorBillControlEvents';

const createSnapshot = (
  events: Array<{ data: ControlEventDocData; id: string }>,
): ControlEventSnapshot => ({
  docs: events.map((event) => ({
    data: () => event.data,
    id: event.id,
  })),
});

const timestampLike = (millis: number) => ({
  toMillis: () => millis,
});

describe('useVendorBillControlEvents', () => {
  beforeEach(() => {
    subscribeToVendorBillControlEventsMock.mockReset();
  });

  it('no abre suscripcion cuando faltan parametros o el drawer esta cerrado', () => {
    const { result: missingBusinessResult } = renderHook(() =>
      useVendorBillControlEvents(null, 'bill-1', true),
    );
    const { result: missingBillResult } = renderHook(() =>
      useVendorBillControlEvents('business-1', '', true),
    );
    const { result: closedResult } = renderHook(() =>
      useVendorBillControlEvents('business-1', 'bill-1', false),
    );

    expect(missingBusinessResult.current).toEqual({
      error: null,
      events: [],
      loading: false,
    });
    expect(missingBillResult.current).toEqual({
      error: null,
      events: [],
      loading: false,
    });
    expect(closedResult.current).toEqual({
      error: null,
      events: [],
      loading: false,
    });
    expect(subscribeToVendorBillControlEventsMock).not.toHaveBeenCalled();
  });

  it('mantiene loading hasta el snapshot, convierte timestamps, ordena y aplica limite', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToVendorBillControlEventsMock.mockImplementation(
      (_businessId: string, _vendorBillId: string, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return unsubscribe;
      },
    );

    const { result, unmount } = renderHook(() =>
      useVendorBillControlEvents('business-1', 'bill-1', true, { limit: 2 }),
    );

    expect(result.current).toEqual({
      error: null,
      events: [],
      loading: true,
    });
    expect(subscribeToVendorBillControlEventsMock).toHaveBeenCalledWith(
      'business-1',
      'bill-1',
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
              createdAt: timestampLike(200),
              nextControl: {
                paymentHold: {
                  releasedAt: timestampLike(250),
                },
              },
              reason: 'Validado',
            },
            id: 'event-2',
          },
          {
            data: {
              action: 'place_hold',
              createdAt: timestampLike(300),
              reason: 'Falta evidencia',
            },
            id: 'event-3',
          },
          {
            data: {
              action: 'request_approval',
              createdAt: timestampLike(100),
              reason: 'Politica interna',
            },
            id: 'event-1',
          },
        ]),
      );
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events.map((event) => event.id)).toEqual([
      'event-3',
      'event-2',
    ]);
    expect(result.current.events[1].nextControl?.paymentHold).toMatchObject({
      releasedAt: 250,
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('oculta eventos anteriores mientras resuelve otra factura', async () => {
    const handlers = [] as SnapshotHandler[];

    subscribeToVendorBillControlEventsMock.mockImplementation(
      (_businessId: string, _vendorBillId: string, onNext: SnapshotHandler) => {
        handlers.push(onNext);
        return vi.fn();
      },
    );

    const { result, rerender } = renderHook(
      ({ vendorBillId }) =>
        useVendorBillControlEvents('business-1', vendorBillId, true),
      {
        initialProps: { vendorBillId: 'bill-1' },
      },
    );

    act(() => {
      handlers[0]?.(
        createSnapshot([
          {
            data: {
              action: 'approve',
              createdAt: timestampLike(100),
            },
            id: 'event-bill-1',
          },
        ]),
      );
    });

    await waitFor(() =>
      expect(result.current.events.map((event) => event.id)).toEqual([
        'event-bill-1',
      ]),
    );

    rerender({ vendorBillId: 'bill-2' });

    expect(result.current).toEqual({
      error: null,
      events: [],
      loading: true,
    });
  });

  it('expone error de Firestore para el query actual', async () => {
    const snapshotError = new Error('permission denied');
    let handleSnapshotError: SnapshotErrorHandler | null = null;
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    subscribeToVendorBillControlEventsMock.mockImplementation(
      (
        _businessId: string,
        _vendorBillId: string,
        _onNext: SnapshotHandler,
        onError: SnapshotErrorHandler,
      ) => {
        handleSnapshotError = onError;
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useVendorBillControlEvents('business-1', 'bill-1', true),
    );

    act(() => {
      handleSnapshotError?.(snapshotError);
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        error: snapshotError,
        events: [],
        loading: false,
      }),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching vendor bill control events:',
      snapshotError,
    );

    consoleErrorSpy.mockRestore();
  });
});
