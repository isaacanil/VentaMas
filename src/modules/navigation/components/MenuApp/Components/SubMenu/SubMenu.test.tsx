import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';

import type { MenuItem } from '@/types/menu';

import { SubMenu } from './SubMenu';

const testTheme = {
  bg: {
    shade: '#ffffff',
  },
};

vi.mock('@/components/ui/Button/Button', () => ({
  Button: ({
    title,
    onClick,
  }: {
    title?: string;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} type="button">
      {title}
    </button>
  ),
}));

vi.mock('@/modules/navigation/components/MenuApp/Components/MenuLink', () => ({
  MenuLink: ({
    item,
    onActionDone,
  }: {
    item: MenuItem;
    onActionDone?: () => void;
  }) => (
    <button onClick={onActionDone} type="button">
      {item.title}
    </button>
  ),
}));

describe('SubMenu', () => {
  it('closes itself and propagates parent completion when a submenu item is selected', () => {
    const onClose = vi.fn();
    const onActionDone = vi.fn();

    render(
      <ThemeProvider theme={testTheme}>
        <SubMenu
          isOpen={true}
          item={{
            title: 'Inventario',
            submenu: [
              {
                title: 'Administrar Productos',
                route: '/inventario/productos',
              },
            ],
          }}
          onClose={onClose}
          onActionDone={onActionDone}
        />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByText('Administrar Productos'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onActionDone).toHaveBeenCalledTimes(1);
  });
});
