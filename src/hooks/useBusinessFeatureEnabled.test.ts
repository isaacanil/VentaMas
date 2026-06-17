import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockState, useAccountingSettingsSnapshotMock } = vi.hoisted(() => ({
  mockState: {
    user: null as unknown,
  },
  useAccountingSettingsSnapshotMock: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: () => mockState.user,
}));

vi.mock('./useAccountingSettingsSnapshot', () => ({
  toCleanBusinessId: (businessId: string | null | undefined) => {
    if (typeof businessId !== 'string') return null;
    const trimmed = businessId.trim();
    return trimmed.length ? trimmed : null;
  },
  useAccountingSettingsSnapshot: (...args: unknown[]) =>
    useAccountingSettingsSnapshotMock(...args),
}));

import { useBusinessFeatureEnabled } from './useBusinessFeatureEnabled';

describe('useBusinessFeatureEnabled', () => {
  beforeEach(() => {
    mockState.user = null;
    vi.clearAllMocks();
    useAccountingSettingsSnapshotMock.mockImplementation((businessId) => ({
      businessId,
      status: 'ready',
      data: { rolloutEnabled: false },
      error: null,
    }));
  });

  it('uses the active business id from the current user for accounting rollout', () => {
    mockState.user = {
      activeBusinessId: 'business-active',
      businessID: 'business-legacy',
    };
    useAccountingSettingsSnapshotMock.mockImplementation((businessId) => ({
      businessId,
      status: 'ready',
      data: { rolloutEnabled: true },
      error: null,
    }));

    const { result } = renderHook(() => useBusinessFeatureEnabled('accounting'));

    expect(result.current).toBe(true);
    expect(useAccountingSettingsSnapshotMock).toHaveBeenCalledWith(
      'business-active',
      true,
    );
  });

  it('prefers the explicit business id override when provided', () => {
    mockState.user = {
      activeBusinessId: 'business-active',
    };

    renderHook(() =>
      useBusinessFeatureEnabled('accounting', '  business-override  '),
    );

    expect(useAccountingSettingsSnapshotMock).toHaveBeenCalledWith(
      'business-override',
      true,
    );
  });
});
