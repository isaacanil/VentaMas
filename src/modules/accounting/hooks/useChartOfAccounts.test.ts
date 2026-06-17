import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const collectionMock = vi.hoisted(() => vi.fn());
const onSnapshotMock = vi.hoisted(() => vi.fn());
const orderByMock = vi.hoisted(() => vi.fn());
const queryMock = vi.hoisted(() => vi.fn());
const dbMock = vi.hoisted(() => ({ name: 'db-mock' }));
const createChartOfAccountConfigMock = vi.hoisted(() => vi.fn());
const disableChartOfAccountConfigMock = vi.hoisted(() => vi.fn());
const updateChartOfAccountConfigMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

vi.mock('@/firebase/accounting/accountingConfiguration', () => ({
  createChartOfAccountConfig: (...args: unknown[]) =>
    createChartOfAccountConfigMock(...args),
  disableChartOfAccountConfig: (...args: unknown[]) =>
    disableChartOfAccountConfigMock(...args),
  updateChartOfAccountConfig: (...args: unknown[]) =>
    updateChartOfAccountConfigMock(...args),
}));

import { useChartOfAccounts } from './useChartOfAccounts';

type ChartOfAccountsTestSnapshot = {
  docs: Array<{
    data: () => Record<string, unknown>;
    id: string;
  }>;
};

type SnapshotHandler = (snapshot: ChartOfAccountsTestSnapshot) => void;
type SnapshotErrorHandler = (cause: Error) => void;

const renderChartHook = (initialProps: {
  businessId: string | null;
  enabled: boolean;
}) =>
  renderHook(
    ({ businessId, enabled }) =>
      useChartOfAccounts({
        businessId,
        enabled,
        functionalCurrency: 'DOP',
        userId: 'user-1',
      }),
    {
      initialProps,
    },
  );

describe('useChartOfAccounts loading', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    onSnapshotMock.mockReset();
    orderByMock.mockReset();
    queryMock.mockReset();
    createChartOfAccountConfigMock.mockReset();
    disableChartOfAccountConfigMock.mockReset();
    updateChartOfAccountConfigMock.mockReset();

    collectionMock.mockImplementation(
      (_db: unknown, ...segments: string[]) => ({
        path: segments.join('/'),
      }),
    );
    orderByMock.mockImplementation((field: string) => ({ field }));
    queryMock.mockImplementation((ref: { path: string }) => ({
      path: ref.path,
    }));
  });

  it('derives loading and safe data from the active snapshot', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    onSnapshotMock.mockImplementation(
      (_queryRef: unknown, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return unsubscribe;
      },
    );

    const { result, rerender } = renderChartHook({
      businessId: null,
      enabled: true,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.chartOfAccounts).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(onSnapshotMock).not.toHaveBeenCalled();

    rerender({
      businessId: 'business-1',
      enabled: true,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.chartOfAccounts).toEqual([]);

    await waitFor(() => expect(onSnapshotMock).toHaveBeenCalledOnce());

    act(() => {
      handleSnapshot?.({
        docs: [
          {
            id: 'account-1',
            data: () => ({
              code: '1100',
              name: 'Caja general',
              type: 'asset',
            }),
          },
        ],
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.chartOfAccounts).toHaveLength(1);
    });
    expect(result.current.chartOfAccounts[0]).toMatchObject({
      businessId: 'business-1',
      code: '1100',
      id: 'account-1',
      name: 'Caja general',
    });

    rerender({
      businessId: null,
      enabled: true,
    });

    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(result.current.loading).toBe(false);
    expect(result.current.chartOfAccounts).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('sets loading again when business changes until the new snapshot resolves', async () => {
    const snapshotHandlers = new Map<string, SnapshotHandler>();
    const errorHandlers = new Map<string, SnapshotErrorHandler>();

    onSnapshotMock.mockImplementation(
      (
        queryRef: { path: string },
        onNext: SnapshotHandler,
        onError: SnapshotErrorHandler,
      ) => {
        snapshotHandlers.set(queryRef.path, onNext);
        errorHandlers.set(queryRef.path, onError);
        return vi.fn();
      },
    );

    const { result, rerender } = renderChartHook({
      businessId: 'business-1',
      enabled: true,
    });

    await waitFor(() => {
      expect(
        snapshotHandlers.has('businesses/business-1/chartOfAccounts'),
      ).toBe(true);
    });

    act(() => {
      snapshotHandlers.get('businesses/business-1/chartOfAccounts')?.({
        docs: [
          {
            id: 'account-1',
            data: () => ({
              code: '1100',
              name: 'Caja general',
              type: 'asset',
            }),
          },
        ],
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.chartOfAccounts).toHaveLength(1);
    });

    rerender({
      businessId: 'business-2',
      enabled: true,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.chartOfAccounts).toEqual([]);

    await waitFor(() => {
      expect(
        snapshotHandlers.has('businesses/business-2/chartOfAccounts'),
      ).toBe(true);
    });

    act(() => {
      errorHandlers.get('businesses/business-2/chartOfAccounts')?.(
        new Error('permission-denied'),
      );
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toContain('No se pudo cargar');
      expect(result.current.chartOfAccounts).toEqual([]);
    });
  });
});
