import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' })),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: {},
}));

const loadModule = async () => import('./dynamicPermissions');

describe('dynamicPermissions catalog helpers', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns cashier permissions plus general permissions for cashier role', async () => {
    const { getAvailablePermissionsForRole } = await loadModule();

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

  it('does not leak cashier permissions to unknown or legacy roles', async () => {
    const { getAvailablePermissionsForRole } = await loadModule();

    expect(getAvailablePermissionsForRole('owner')).toEqual([]);
    expect(getAvailablePermissionsForRole('specialCashier1')).toEqual([]);
    expect(getAvailablePermissionsForRole(null)).toEqual([]);
  });

  it('summarizes role-specific permission counts and categories', async () => {
    const { getRolePermissionsInfo } = await loadModule();

    expect(getRolePermissionsInfo('cashier')).toEqual({
      roleName: 'cashier',
      roleSpecificCount: 2,
      generalCount: 0,
      totalAvailable: 2,
      categories: ['Ventas · Carrito'],
    });
  });
});
