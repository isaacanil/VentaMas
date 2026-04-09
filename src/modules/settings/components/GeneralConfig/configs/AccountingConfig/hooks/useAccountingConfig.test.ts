import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const collectionMock = vi.hoisted(() => vi.fn());
const docMock = vi.hoisted(() => vi.fn());
const getDocMock = vi.hoisted(() => vi.fn());
const limitMock = vi.hoisted(() => vi.fn());
const onSnapshotMock = vi.hoisted(() => vi.fn());
const orderByMock = vi.hoisted(() => vi.fn());
const queryMock = vi.hoisted(() => vi.fn());
const setDocMock = vi.hoisted(() => vi.fn());
const writeBatchMock = vi.hoisted(() => vi.fn());
const dbMock = vi.hoisted(() => ({ name: 'db-mock' }));
const useAccountingRolloutEnabledMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  limit: (...args: unknown[]) => limitMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  Timestamp: {
    now: () => ({ seconds: 1, nanoseconds: 0 }),
  },
  writeBatch: (...args: unknown[]) => writeBatchMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

vi.mock('@/hooks/useAccountingRolloutEnabled', () => ({
  useAccountingRolloutEnabled: (...args: unknown[]) =>
    useAccountingRolloutEnabledMock(...args),
}));

import { useAccountingConfig } from './useAccountingConfig';

describe('useAccountingConfig loading', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    docMock.mockReset();
    getDocMock.mockReset();
    limitMock.mockReset();
    onSnapshotMock.mockReset();
    orderByMock.mockReset();
    queryMock.mockReset();
    setDocMock.mockReset();
    writeBatchMock.mockReset();
    useAccountingRolloutEnabledMock.mockReset();

    useAccountingRolloutEnabledMock.mockReturnValue(true);
    collectionMock.mockImplementation(
      (_db: unknown, ...segments: string[]) => ({
        path: segments.join('/'),
      }),
    );
    docMock.mockImplementation((_dbOrCollection: unknown, ...segments: string[]) => {
      if (
        typeof _dbOrCollection === 'object' &&
        _dbOrCollection !== null &&
        'path' in (_dbOrCollection as Record<string, unknown>)
      ) {
        const basePath = String(
          (_dbOrCollection as { path: string }).path ?? '',
        );
        return {
          path: [basePath, ...segments].join('/'),
        };
      }

      return {
        path: segments.join('/'),
      };
    });
    orderByMock.mockImplementation((field: string, direction: string) => ({
      field,
      direction,
    }));
    limitMock.mockImplementation((value: number) => ({ value }));
    queryMock.mockImplementation((ref: { path: string }) => ({
      path: ref.path,
    }));
    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });
    setDocMock.mockResolvedValue(undefined);
    writeBatchMock.mockReturnValue({
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('reactivates loading when a business is selected until settings snapshot resolves', async () => {
    const listeners = new Map<string, (snapshot: any) => void>();

    onSnapshotMock.mockImplementation(
      (
        ref: { path: string },
        onNext: (snapshot: any) => void,
      ) => {
        listeners.set(ref.path, onNext);
        return vi.fn();
      },
    );

    const { result, rerender } = renderHook(
      ({ businessId }) =>
        useAccountingConfig({
          businessId,
          userId: 'user-1',
        }),
      {
        initialProps: {
          businessId: null as string | null,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ businessId: 'business-1' });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    const settingsListener = listeners.get('businesses/business-1/settings/accounting');
    expect(settingsListener).toBeTypeOf('function');

    act(() => {
      settingsListener?.({
        data: () => ({
          generalAccountingEnabled: true,
          functionalCurrency: 'DOP',
          documentCurrencies: ['DOP'],
          bankAccountsEnabled: true,
          bankPaymentPolicy: {},
        }),
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
