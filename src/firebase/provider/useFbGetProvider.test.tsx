import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockUser = {
  activeBusinessId?: string | null;
  businessID?: string | null;
  businessId?: string | null;
};

const { listenProvidersMock, mockUser } = vi.hoisted(() => ({
  listenProvidersMock: vi.fn(),
  mockUser: {
    current: { businessID: 'business-1' } as MockUser | null,
  },
}));

vi.mock('react-redux', () => ({
  useSelector: () => mockUser.current,
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: vi.fn(),
}));

vi.mock('./provider.repository', () => ({
  listenProviders: (...args: unknown[]) => listenProvidersMock(...args),
}));

import { useFbGetProviders } from './useFbGetProvider';

describe('useFbGetProviders', () => {
  beforeEach(() => {
    listenProvidersMock.mockReset();
    mockUser.current = { businessID: 'business-1' };
  });

  it('escucha proveedores con activeBusinessId cuando falta businessID', async () => {
    mockUser.current = { activeBusinessId: 'business-active' };
    listenProvidersMock.mockImplementation((_businessId, onNext) => {
      onNext([{ id: 'provider-1', name: 'Proveedor Uno' }]);
      return vi.fn();
    });

    const { result } = renderHook(() => useFbGetProviders());

    await waitFor(() =>
      expect(result.current.providers).toEqual([
        { id: 'provider-1', name: 'Proveedor Uno' },
      ]),
    );
    expect(listenProvidersMock).toHaveBeenCalledWith(
      'business-active',
      expect.any(Function),
      expect.any(Function),
    );
    expect(result.current.loading).toBe(false);
  });
});
