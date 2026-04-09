import { describe, expect, it } from 'vitest';

import {
  assertActiveMembershipForBusiness,
  assertMembershipRole,
  getDistinctActiveBusinesses,
  normalizeMembershipEntries,
} from './membershipContext.util.js';

describe('membershipContext.util', () => {
  it('normalizes accessControl entries and preserves business names when requested', () => {
    expect(
      normalizeMembershipEntries(
        {
          accessControl: [
            {
              business: { id: 'business-1', name: 'Sucursal Central' },
              role: 'super-admin',
              status: 'active',
            },
          ],
        },
        { includeBusinessName: true },
      ),
    ).toEqual([
      {
        businessId: 'business-1',
        businessName: 'Sucursal Central',
        role: 'admin',
        status: 'active',
      },
    ]);
  });

  it('falls back to the legacy active business when there are no membership arrays', () => {
    expect(
      normalizeMembershipEntries({
        activeBusinessId: 'business-legacy',
        activeRole: 'specialcashier1',
      }),
    ).toEqual([
      {
        businessId: 'business-legacy',
        role: 'cashier',
        status: 'active',
      },
    ]);
  });

  it('throws when the user does not have an active membership for the business', () => {
    expect(() =>
      assertActiveMembershipForBusiness(
        [
          { businessId: 'business-1', status: 'inactive', role: 'cashier' },
        ],
        'business-1',
      ),
    ).toThrow('No tienes acceso activo al negocio');
  });

  it('accepts normalized role aliases in role assertions', () => {
    expect(
      assertMembershipRole(
        { role: 'super_admin' },
        [new Set(['admin']).values().next().value],
      ),
    ).toBe('admin');
  });

  it('returns unique active businesses only once', () => {
    expect(
      getDistinctActiveBusinesses([
        { businessId: 'business-1', status: 'active' },
        { businessId: 'business-1', status: 'active' },
        { businessId: 'business-2', status: 'revoked' },
        { businessId: 'business-3', status: 'active' },
      ]),
    ).toEqual(['business-1', 'business-3']);
  });
});
