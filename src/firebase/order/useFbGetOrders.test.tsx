import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SnapshotHandler = (snapshot: {
  docs: Array<{ data: () => Record<string, unknown> }>;
  empty: boolean;
}) => void;

const {
  collectionMock,
  dbMock,
  getDocMock,
  mockUser,
  onSnapshotMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  dbMock: { name: 'db-mock' },
  getDocMock: vi.fn(),
  mockUser: {
    current: { businessID: 'business-1' } as { businessID: string } | null,
  },
  onSnapshotMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: () => mockUser.current,
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: vi.fn(),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import { useFbGetOrders } from './useFbGetOrders';

describe('useFbGetOrders', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    getDocMock.mockReset();
    onSnapshotMock.mockReset();
    mockUser.current = { businessID: 'business-1' };
    collectionMock.mockReturnValue({ path: 'businesses/business-1/orders' });
  });

  it('keeps loading orders when one provider reference fails', async () => {
    const validProviderRef = {
      id: 'provider-1',
      parent: {},
      path: 'businesses/business-1/providers/provider-1',
    };
    const embeddedProvider = {
      id: 'provider-2',
      name: 'Proveedor embebido',
    };
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    getDocMock.mockRejectedValueOnce(new Error('provider fetch failed'));
    onSnapshotMock.mockImplementation((_ref, onNext: SnapshotHandler) => {
      handleSnapshot = onNext;
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => useFbGetOrders());

    expect(collectionMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'orders',
    );
    expect(handleSnapshot).not.toBeNull();

    handleSnapshot?.({
      empty: false,
      docs: [
        {
          data: () => ({
            id: 'order-1',
            data: { provider: validProviderRef },
          }),
        },
        {
          data: () => ({
            id: 'order-2',
            data: { provider: embeddedProvider },
          }),
        },
      ],
    });

    await waitFor(() => {
      expect(result.current.orders).toHaveLength(2);
    });

    expect(result.current.orders).toEqual([
      {
        id: 'order-1',
        data: { provider: null },
      },
      {
        id: 'order-2',
        data: { provider: embeddedProvider },
      },
    ]);

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });
});
