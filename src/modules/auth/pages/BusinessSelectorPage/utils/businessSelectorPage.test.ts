import { describe, expect, it } from 'vitest';

import {
  getSubscriptionTone,
  resolveBusinessSelectionErrorMessage,
  resolveInviteErrorMessage,
  sortBusinesses,
  upsertBusiness,
} from './businessSelectorPage';

describe('businessSelectorPage utils', () => {
  it('keeps the active business first and inactive businesses last', () => {
    expect(
      sortBusinesses(
        [
          {
            businessId: 'inactive',
            name: 'Inactive',
            role: 'cashier',
            status: 'inactive',
            isActive: false,
          },
          {
            businessId: 'other',
            name: 'Other',
            role: 'admin',
            status: 'active',
            isActive: true,
          },
          {
            businessId: 'current',
            name: 'Current',
            role: 'owner',
            status: 'active',
            isActive: true,
          },
        ],
        'current',
      ).map((business) => business.businessId),
    ).toEqual(['current', 'other', 'inactive']);
  });

  it('upserts invited businesses without dropping existing fields', () => {
    expect(
      upsertBusiness(
        [
          {
            businessId: 'b1',
            name: 'Existing',
            role: 'admin',
            status: 'active',
            isActive: true,
          },
        ],
        {
          businessId: 'b1',
          name: '',
          role: 'admin',
          status: 'active',
          isActive: true,
        },
      )[0],
    ).toMatchObject({
      businessId: 'b1',
      name: 'Existing',
      role: 'admin',
      status: 'active',
      isActive: true,
    });
  });

  it('maps subscription statuses to UI tones', () => {
    expect(getSubscriptionTone('active')).toBe('success');
    expect(getSubscriptionTone('trialing')).toBe('info');
    expect(getSubscriptionTone('past_due')).toBe('warning');
    expect(getSubscriptionTone('canceled')).toBe('danger');
    expect(getSubscriptionTone(null)).toBe('neutral');
  });

  it('returns specific invite error copy', () => {
    expect(resolveInviteErrorMessage({ code: 'not-found' })).toContain(
      'codigo no es valido',
    );
    expect(
      resolveInviteErrorMessage({
        code: 'failed-precondition',
        message: 'expirada',
      }),
    ).toContain('expiro');
  });

  it('returns specific business selection error copy', () => {
    expect(
      resolveBusinessSelectionErrorMessage({ code: 'permission-denied' }),
    ).toContain('permisos');
    expect(
      resolveBusinessSelectionErrorMessage({ code: 'unavailable' }),
    ).toContain('conexion');
  });
});
