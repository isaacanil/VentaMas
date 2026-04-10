import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MenuItem } from '@/types/menu';

const { canMock, useAbilityMock, mockLoading } = vi.hoisted(() => ({
  canMock: vi.fn(),
  useAbilityMock: vi.fn(),
  mockLoading: { value: false },
}));

vi.mock('@casl/react', () => ({
  useAbility: () => useAbilityMock(),
}));

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      abilities: {
        loading: mockLoading.value,
      },
      auth: {
        user: null,
      },
    }),
}));

vi.mock('@/Context/AbilityContext/context', () => ({
  AbilityContext: {},
}));

vi.mock('@/features/abilities/abilitiesSlice', () => ({
  selectAbilitiesLoading: () => mockLoading.value,
  selectAbilitiesStatus: () => 'success',
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: () => null,
}));

vi.mock('@/router/routes/routeVisibility', () => ({
  isHiddenInMenu: () => false,
  getRouteMeta: () => undefined,
}));

import { useFilterMenuItemsByAccess } from './menuAccess';

describe('useFilterMenuItemsByAccess', () => {
  beforeEach(() => {
    mockLoading.value = false;
    canMock.mockReset();
    useAbilityMock.mockReturnValue({
      can: canMock,
      rules: [{}],
    });
  });

  it('keeps nested submenu groups when a descendant route is accessible', () => {
    const allowedRoutes = new Set(['/account-receivable/list']);

    canMock.mockImplementation((action: string, subject: string) => {
      if (action === 'developerAccess' || action === 'manage') {
        return false;
      }

      if (action === 'access') {
        return allowedRoutes.has(subject);
      }

      return false;
    });

    const menuItems: MenuItem[] = [
      {
        title: 'Contabilidad',
        submenu: [
          {
            title: 'Cuentas por Cobrar',
            submenu: [
              {
                title: 'Listado',
                route: '/account-receivable/list',
              },
              {
                title: 'Recibos de pagos',
                route: '/account-receivable/receipts',
              },
            ],
          },
          {
            title: 'Cuentas por Pagar',
            submenu: [
              {
                title: 'Listado',
                route: '/accounts-payable/list',
              },
            ],
          },
        ],
      },
    ];

    const { result } = renderHook(() =>
      useFilterMenuItemsByAccess(menuItems, true),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.submenu).toHaveLength(1);
    expect(result.current[0]?.submenu?.[0]?.title).toBe('Cuentas por Cobrar');
    expect(result.current[0]?.submenu?.[0]?.submenu).toEqual([
      {
        title: 'Listado',
        route: '/account-receivable/list',
      },
    ]);
  });
});
