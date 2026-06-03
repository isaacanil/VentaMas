import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: vi.fn(),
  },
}));

import {
  businessAllowsMemberWrite,
  resolveUserBusinessAccessState,
} from './accountAccessPolicy.util.js';

const buildLoadBusiness = (statusesByBusinessId) => async (businessId) => {
  if (!Object.prototype.hasOwnProperty.call(statusesByBusinessId, businessId)) {
    return { exists: false, data: null };
  }
  return {
    exists: true,
    data: { status: statusesByBusinessId[businessId] },
  };
};

const buildLoadMembership =
  (membershipsByBusinessId) =>
  async ({ businessId }) => {
    if (
      !Object.prototype.hasOwnProperty.call(membershipsByBusinessId, businessId)
    ) {
      return { exists: false, data: null };
    }
    return {
      exists: true,
      data: membershipsByBusinessId[businessId],
    };
  };

describe('accountAccessPolicy.util', () => {
  it('rejects inactive user accounts before checking business access', async () => {
    await expect(
      resolveUserBusinessAccessState({
        userId: 'user-1',
        userData: {
          active: false,
          activeBusinessId: 'business-1',
        },
        loadBusiness: buildLoadBusiness({ 'business-1': 'active' }),
        loadMembership: buildLoadMembership({
          'business-1': { status: 'active', role: 'cashier' },
        }),
      }),
    ).rejects.toThrow('Tu usuario esta inactivo');
  });

  it('does not allow legacy cache to bypass an inactive canonical membership', async () => {
    await expect(
      resolveUserBusinessAccessState({
        userId: 'user-1',
        userData: {
          activeBusinessId: 'business-1',
          accessControl: [
            { businessId: 'business-1', role: 'admin', status: 'active' },
          ],
        },
        loadBusiness: buildLoadBusiness({ 'business-1': 'active' }),
        loadMembership: buildLoadMembership({
          'business-1': { status: 'suspended', role: 'admin' },
        }),
      }),
    ).rejects.toThrow('Tu usuario no tiene acceso activo');
  });

  it('allows read-only businesses to authenticate but not write', async () => {
    const result = await resolveUserBusinessAccessState({
      userId: 'user-1',
      userData: {
        activeBusinessId: 'business-1',
        accessControl: [
          { businessId: 'business-1', role: 'cashier', status: 'active' },
        ],
      },
      loadBusiness: buildLoadBusiness({ 'business-1': 'read_only' }),
      loadMembership: buildLoadMembership({
        'business-1': { status: 'active', role: 'cashier' },
      }),
    });

    expect(result.activeBusinessId).toBe('business-1');
    expect(result.selectedMembership.businessStatus).toBe('read_only');
    expect(businessAllowsMemberWrite('read_only')).toBe(false);
  });

  it('selects another active business when the preferred one is blocked', async () => {
    const result = await resolveUserBusinessAccessState({
      userId: 'user-1',
      userData: {
        activeBusinessId: 'blocked-business',
        accessControl: [
          { businessId: 'blocked-business', role: 'admin', status: 'active' },
          { businessId: 'open-business', role: 'cashier', status: 'active' },
        ],
      },
      loadBusiness: buildLoadBusiness({
        'blocked-business': 'suspended',
        'open-business': 'active',
      }),
      loadMembership: buildLoadMembership({
        'blocked-business': { status: 'active', role: 'admin' },
        'open-business': { status: 'active', role: 'cashier' },
      }),
    });

    expect(result.activeBusinessId).toBe('open-business');
    expect(result.selectedMembership.role).toBe('cashier');
  });
});
