import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';

import type { MenuItem } from '@/types/menu';

import { MenuLink } from './MenuLink';

const testTheme = {
  bg: {
    color: '#42a5f5',
  },
};

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
}));

vi.mock('@/features/modals/modalSlice', () => ({
  toggleDeveloperModal: vi.fn(),
}));

vi.mock('./SubMenu/SubMenu', () => ({
  SubMenu: ({
    item,
  }: {
    item: MenuItem;
  }) => <div>{`submenu:${item.title}`}</div>,
}));

describe('MenuLink', () => {
  it('reopens submenu when the sidebar opens while the current route belongs to a child route', () => {
    const item: MenuItem = {
      title: 'Contabilidad',
      submenu: [
        {
          title: 'Libro diario',
          route: '/accounting/journal-book',
        },
      ],
    };

    const { rerender } = render(
      <MemoryRouter initialEntries={['/accounting/journal-book']}>
        <ThemeProvider theme={testTheme}>
          <MenuLink isSidebarOpen={false} item={item} />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByText('submenu:Contabilidad')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={['/accounting/journal-book']}>
        <ThemeProvider theme={testTheme}>
          <MenuLink isSidebarOpen={true} item={item} />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('submenu:Contabilidad')).toBeInTheDocument();
  });
});
