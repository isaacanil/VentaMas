import { describe, expect, it } from 'vitest';

import {
  normalizeAvailableBusinesses,
  resolveCurrentActiveBusinessId,
} from './businessContext';

describe('businessContext', () => {
  it('ignores array roots and array business collections', () => {
    expect(normalizeAvailableBusinesses([])).toEqual([]);
    expect(
      normalizeAvailableBusinesses({
        availableBusinesses: [{}],
        accessControl: [],
      }),
    ).toEqual([]);
  });

  it('normalizes available businesses and legacy fallback ids', () => {
    expect(
      normalizeAvailableBusinesses({
        activeBusinessId: ' legacy-business ',
        activeRole: 'admin',
        availableBusinesses: [
          {
            businessId: ' business-1 ',
            businessName: 'Ignored by helper',
            name: ' Mi negocio ',
            role: 'cashier',
            status: 'active',
          },
        ],
      }),
    ).toEqual([
      {
        businessId: 'business-1',
        name: 'Mi negocio',
        role: 'cashier',
        status: 'active',
        isActive: true,
      },
      {
        businessId: 'legacy-business',
        name: 'Negocio legacy-business',
        role: 'admin',
        status: 'active',
        isActive: true,
      },
    ]);
  });

  it('resolves current active business from canonical and legacy aliases', () => {
    expect(
      resolveCurrentActiveBusinessId({
        activeBusinessId: ' active ',
        businessID: 'legacy',
      }),
    ).toBe('active');
    expect(resolveCurrentActiveBusinessId({ businessID: ' legacy ' })).toBe(
      'legacy',
    );
    expect(resolveCurrentActiveBusinessId([])).toBeNull();
  });
});
