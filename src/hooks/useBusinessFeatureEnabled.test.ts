import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockState, useAccountingRolloutEnabledMock } = vi.hoisted(() => ({
  mockState: {
    user: null as unknown,
  },
  useAccountingRolloutEnabledMock: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: () => mockState.user,
}));

vi.mock('./useAccountingRolloutEnabled', () => ({
  useAccountingRolloutEnabled: (...args: unknown[]) =>
    useAccountingRolloutEnabledMock(...args),
}));

import { useBusinessFeatureEnabled } from './useBusinessFeatureEnabled';

describe('useBusinessFeatureEnabled', () => {
  beforeEach(() => {
    mockState.user = null;
    vi.clearAllMocks();
    useAccountingRolloutEnabledMock.mockReturnValue(false);
  });

  it('uses the active business id from the current user for accounting rollout', () => {
    mockState.user = {
      activeBusinessId: 'business-active',
      businessID: 'business-legacy',
    };
    useAccountingRolloutEnabledMock.mockReturnValue(true);

    const { result } = renderHook(() => useBusinessFeatureEnabled('accounting'));

    expect(result.current).toBe(true);
    expect(useAccountingRolloutEnabledMock).toHaveBeenCalledWith(
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

    expect(useAccountingRolloutEnabledMock).toHaveBeenCalledWith(
      'business-override',
      true,
    );
  });
});
