import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import navReducer from '@/features/nav/navSlice';
import ROUTES_PATH from '@/router/routes/routesName';

import { SideBar } from './SideBar';

const { mockMenuData } = vi.hoisted(() => ({
  mockMenuData: [] as Array<Record<string, unknown>>,
}));

const mockNavigate = vi.fn();

const testTheme = {
  bg: {
    color: '#42a5f5',
    color2: '#f6f8fb',
    shade: '#ffffff',
  },
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/abilities/useAbilities', () => ({
  useUserAccess: () => ({
    abilities: {
      can: () => true,
    },
  }),
}));

vi.mock('@/utils/menuAccess', () => ({
  useHasDeveloperAccess: () => false,
}));

vi.mock('@/modules/navigation/components/MenuApp/MenuData/MenuData', () => ({
  useMenuData: () => mockMenuData,
}));

vi.mock('@/components/ui/Button/ButtonIconMenu', () => ({
  ButtonIconMenu: ({
    onClick,
    'aria-label': ariaLabel,
  }: {
    onClick?: () => void;
    'aria-label'?: string;
  }) => (
    <button aria-label={ariaLabel} onClick={onClick} type="button">
      {ariaLabel}
    </button>
  ),
}));

vi.mock('@/components/ui/Button/OpenMenuButton', () => ({
  OpenMenuButton: ({ onClick }: { onClick?: () => void }) => (
    <button onClick={onClick} type="button">
      toggle menu
    </button>
  ),
}));

vi.mock('@/components/ui/WebName/WebName', () => ({
  WebName: () => <div>VENTAMAX</div>,
}));

vi.mock('@/modules/navigation/components/MenuApp/UserSection', () => ({
  UserSection: () => <div>User section</div>,
}));

vi.mock('./MenuLink', () => ({
  MenuLink: ({
    item,
    onActionDone,
  }: {
    item: { title: string };
    onActionDone?: () => void;
  }) => (
    <button onClick={onActionDone} type="button">
      {item.title}
    </button>
  ),
}));

describe('SideBar', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockMenuData.splice(0, mockMenuData.length);
    mockMenuData.push({
      title: 'Inicio',
      route: '/inicio',
      group: 'general',
    });
  });

  const createStore = () =>
    configureStore({
      reducer: {
        nav: navReducer,
        cart: () => ({
          settings: {
            billing: {},
          },
        }),
        business: () => ({
          data: {
            businessType: 'retail',
          },
        }),
        user: () => ({
          user: {
            id: 'user-1',
            name: 'Jonathan Lora',
            role: 'admin',
            businessID: 'business-1',
          },
        }),
      },
      preloadedState: {
        nav: {
          isOpen: true,
        },
      },
    });

  it('closes the menu when the settings shortcut navigates to general config', () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ThemeProvider theme={testTheme}>
            <SideBar isOpen={true} handleOpenMenu={vi.fn()} />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      ROUTES_PATH.SETTING_TERM.GENERAL_CONFIG_BUSINESS,
    );
    expect(store.getState().nav.isOpen).toBe(false);
  });

  it('renders grouped items with unique React keys even when they share the same group', () => {
    mockMenuData.splice(0, mockMenuData.length);
    mockMenuData.push(
      {
        title: 'Inventario',
        group: 'inventory',
        submenu: [],
      },
      {
        title: 'Compras y Pedidos',
        group: 'inventory',
        submenu: [],
      },
    );

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const store = createStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ThemeProvider theme={testTheme}>
            <SideBar isOpen={true} handleOpenMenu={vi.fn()} />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>,
    );

    expect(
      screen.getByRole('button', { name: 'Inventario' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Compras y Pedidos' }),
    ).toBeInTheDocument();
    expect(
      consoleErrorSpy.mock.calls.map((args) => args.join(' ')).join('\n'),
    ).not.toContain('Encountered two children with the same key');

    consoleErrorSpy.mockRestore();
  });
});
