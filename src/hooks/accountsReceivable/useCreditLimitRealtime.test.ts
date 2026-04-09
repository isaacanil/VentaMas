import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.hoisted(() => vi.fn());
const onSnapshotMock = vi.hoisted(() => vi.fn());
const dbMock = vi.hoisted(() => ({ name: 'db-mock' }));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import { useCreditLimitRealtime } from './useCreditLimitRealtime';

describe('useCreditLimitRealtime', () => {
  beforeEach(() => {
    docMock.mockReset();
    onSnapshotMock.mockReset();
    docMock.mockReturnValue({ path: 'creditLimit/doc' });
  });

  it('no abre suscripcion cuando falta businessID o clientId', () => {
    const { result } = renderHook(() =>
      useCreditLimitRealtime({ businessID: null }, ''),
    );

    expect(result.current).toEqual({
      creditLimit: null,
      isLoading: false,
      error: null,
    });
    expect(docMock).not.toHaveBeenCalled();
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it('carga el limite de credito cuando llega un snapshot existente', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot;

    onSnapshotMock.mockImplementation((_ref, onNext) => {
      handleSnapshot = onNext;
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() =>
      useCreditLimitRealtime({ businessID: 'business-1' }, 'client-1'),
    );

    expect(result.current.isLoading).toBe(true);
    expect(docMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'creditLimit',
      'client-1',
    );

    act(() => {
      handleSnapshot({
        exists: () => true,
        data: () => ({
          currentBalance: 150,
          creditLimit: {
            status: true,
            value: 500,
          },
        }),
      });
    });

    await waitFor(() =>
      expect(result.current.creditLimit).toEqual({
        currentBalance: 150,
        creditLimit: {
          status: true,
          value: 500,
        },
      }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('deja el limite en null cuando el documento no existe', async () => {
    let handleSnapshot;

    onSnapshotMock.mockImplementation((_ref, onNext) => {
      handleSnapshot = onNext;
      return vi.fn();
    });

    const { result } = renderHook(() =>
      useCreditLimitRealtime({ businessID: 'business-2' }, 'client-2'),
    );

    act(() => {
      handleSnapshot({
        exists: () => false,
      });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.creditLimit).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('expone el error del listener y limpia el limite cargado', async () => {
    const snapshotError = {
      code: 'permission-denied',
      message: 'No autorizado',
      name: 'FirestoreError',
    };
    let handleSnapshotError;
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    onSnapshotMock.mockImplementation((_ref, _onNext, onError) => {
      handleSnapshotError = onError;
      return vi.fn();
    });

    const { result } = renderHook(() =>
      useCreditLimitRealtime({ businessID: 'business-3' }, 'client-3'),
    );

    act(() => {
      handleSnapshotError(snapshotError);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.creditLimit).toBeNull();
    expect(result.current.error).toEqual(snapshotError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error listening to credit limit:',
      snapshotError,
    );

    consoleErrorSpy.mockRestore();
  });
});
