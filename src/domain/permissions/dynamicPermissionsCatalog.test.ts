import { describe, expect, it } from 'vitest';

import {
  getAvailablePermissionsForRole,
  getRolePermissionsInfo,
} from './dynamicPermissionsCatalog';

describe('dynamicPermissions catalog helpers', () => {
  it('returns cashier permissions plus general permissions for cashier role', () => {
    expect(getAvailablePermissionsForRole('cashier')).toEqual([
      expect.objectContaining({
        action: 'read',
        subject: 'PriceList',
      }),
      expect.objectContaining({
        action: 'modify',
        subject: 'Price',
      }),
    ]);
  });

  it('does not leak cashier permissions to unknown or legacy roles', () => {
    expect(getAvailablePermissionsForRole('owner')).toEqual([]);
    expect(getAvailablePermissionsForRole('specialCashier1')).toEqual([]);
    expect(getAvailablePermissionsForRole(null)).toEqual([]);
  });

  it('summarizes role-specific permission counts and categories', () => {
    expect(getRolePermissionsInfo('cashier')).toEqual({
      roleName: 'cashier',
      roleSpecificCount: 2,
      generalCount: 0,
      totalAvailable: 2,
      categories: ['Ventas · Carrito'],
    });
  });
});
