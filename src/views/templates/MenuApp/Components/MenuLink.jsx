import { Tag } from 'antd';
import React, { Fragment, useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useLocation, useMatch } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { toggleDeveloperModal } from '../../../../features/modals/modalSlice';

import { SubMenu } from './SubMenu/SubMenu';

export const MenuLink = ({ item, onActionDone }) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const isExactMatch = useMatch({
    path: item?.route || '',
    end: true,
  });

  const isRouteActive = (route) => {
    const currentPath = location.pathname;
    return currentPath === route || currentPath.startsWith(route + '/');
  };

  const isCurrentRoute = item?.submenu?.some((subItem) =>
    isRouteActive(subItem.route),
  );

  // Inicializar abierto si la ruta coincide
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(() => !!isCurrentRoute);

  const toggleSubMenu = (e) => {
    e?.preventDefault?.();
    setIsOpenSubMenu((prev) => !prev);
  };

  const closeSubMenu = () => {
    setIsOpenSubMenu(false);
  };

  const handleAction = (e) => {
    e?.preventDefault?.();
    if (!item?.action) return;
    if (item.action === 'openDeveloperModal') {
      dispatch(toggleDeveloperModal());
    }
    if (typeof onActionDone === 'function') onActionDone();
  };

  const handlePrefetch = () => {
    if (typeof item?.preload === 'function') {
      item.preload();
    }
  };

  const isSubmenuItem = Boolean(item?.submenu);
  const Component = item?.route && !isSubmenuItem ? MenuItemLink : MenuItemDiv;
  const componentProps = Component === MenuItemLink ? { to: item?.route } : {};

  return (
    <Fragment>
      <Component
        onClick={isSubmenuItem ? toggleSubMenu : item.action ? handleAction : null}
        onPointerEnter={handlePrefetch}
        onFocus={handlePrefetch}
        className={isExactMatch ? 'active' : ''}
        {...componentProps}
      >
        <Group>
          <Icon color={item.color}>{item.icon}</Icon>
          <span>{item.title}</span>
        </Group>
        {item.tag && (
          <Tag color={item.tag.color} style={{ fontSize: 16 }}>
            {item.tag.text}
          </Tag>
        )}
        {item.submenu && isOpenSubMenu
          ? item.submenuIconOpen
          : item.submenu
            ? item.submenuIconClose
            : null}
      </Component>
      {isOpenSubMenu && (
        <SubMenu onClose={closeSubMenu} isOpen={isOpenSubMenu} item={item} />
      )}
    </Fragment>
  );
};
const commonStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2.8em;
  padding: 0 0.8em;
  margin: 0;
  font-weight: 450;
  color: var(--gray-6);
  border-bottom: var(--border-primary);
  cursor: pointer;
  user-select: none;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    color: ${(props) => props.theme.bg.color};
    transition: background-color 400ms ease;

    svg {
      color: ${(props) => props.theme.bg.color};
    }
  }

  svg {
    color: var(--gray-6);
  }
`;

const MenuItemLink = styled(NavLink).attrs({ end: true })`
  ${commonStyles}

  &.active {
    font-weight: 600;
    color: white;
    background-color: ${(props) => props.theme.bg.color};
    border-radius: 0.4em;

    svg {
      color: white;
    }
  }
`;
const MenuItemDiv = styled.div`
  ${commonStyles}
`;

const Group = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  max-width: 80%;
  overflow: hidden;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2em;
`;
