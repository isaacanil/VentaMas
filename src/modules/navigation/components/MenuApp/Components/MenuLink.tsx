import { Tag } from 'antd';
import React, { Fragment, useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useLocation, useMatch } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { toggleDeveloperModal } from '@/features/modals/modalSlice';
import type { MenuItem } from '@/types/menu';

import { SubMenu } from './SubMenu/SubMenu';

interface MenuLinkProps {
  isSidebarOpen?: boolean;
  item: MenuItem;
  onActionDone?: () => void;
  parentTitle?: string;
}

export const MenuLink = ({
  item,
  onActionDone,
  isSidebarOpen = false,
  parentTitle,
}: MenuLinkProps) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const isExactMatch = useMatch({
    path: item?.route || '',
    end: true,
  });

  const isRouteActive = (route: string) => {
    const currentPath = location.pathname;
    return currentPath === route || currentPath.startsWith(route + '/');
  };

  const hasActiveDescendantRoute = (items?: MenuItem[]) =>
    items?.some((subItem) => {
      if (subItem.route && isRouteActive(subItem.route)) {
        return true;
      }

      if (Array.isArray(subItem.submenu) && subItem.submenu.length) {
        return hasActiveDescendantRoute(subItem.submenu);
      }

      return false;
    }) ?? false;

  const isCurrentRoute = hasActiveDescendantRoute(item?.submenu);

  const [isUserExpanded, setIsUserExpanded] = useState(
    () => !!isCurrentRoute && isSidebarOpen,
  );
  const [isUserCollapsed, setIsUserCollapsed] = useState(false);
  const isOpenSubMenu =
    isUserExpanded || (isCurrentRoute && isSidebarOpen && !isUserCollapsed);

  const toggleSubMenu = (e: React.MouseEvent) => {
    e?.preventDefault?.();
    if (isOpenSubMenu) {
      setIsUserExpanded(false);
      setIsUserCollapsed(true);
      return;
    }

    setIsUserExpanded(true);
    setIsUserCollapsed(false);
  };

  const closeSubMenu = () => {
    setIsUserExpanded(false);
    setIsUserCollapsed(true);
  };

  const handleAction = (e: React.MouseEvent) => {
    e?.preventDefault?.();
    if (!item?.action) return;
    if (item.action === 'openDeveloperModal') {
      dispatch(toggleDeveloperModal(undefined));
    }
    if (typeof onActionDone === 'function') onActionDone();
  };

  const handleRouteClick = () => {
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
        onClick={
          isSubmenuItem
            ? toggleSubMenu
            : item.action
              ? handleAction
              : handleRouteClick
        }
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
        <SubMenu
          onClose={closeSubMenu}
          onActionDone={onActionDone}
          isOpen={isOpenSubMenu}
          item={item}
          parentTitle={parentTitle}
        />
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

  &:not(.active):hover {
    color: ${(props: any) => props.theme.bg.color};
    transition:
      background-color 400ms ease,
      color 400ms ease;

    svg {
      color: ${(props: any) => props.theme.bg.color};
    }
  }

  svg {
    color: var(--gray-6);
  }
`;

const MenuItemLink = styled(NavLink).attrs({ end: true })`
  ${commonStyles}

  &,
  &:link,
  &:visited,
  &:hover,
  &:focus {
    color: var(--gray-6);
    text-decoration: none;
  }

  /* Neutraliza el selector "a :hover" del CSS global que colorea descendientes de morado */
  & *:hover {
    color: inherit;
  }

  &:not(.active):hover,
  &:not(.active):focus-visible {
    color: ${(props: any) => props.theme.bg.color};

    svg {
      color: ${(props: any) => props.theme.bg.color};
    }

    span {
      color: currentColor;
    }
  }

  &.active {
    font-weight: 600;
    color: white;
    background-color: ${(props: any) => props.theme.bg.color};
    border-radius: 0.4em;
    text-decoration: none;

    &:hover,
    &:visited,
    &:focus-visible {
      color: white;
    }

    svg {
      color: white;
    }

    span {
      color: currentColor;
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
  flex: 1;
  min-width: 0;

  span {
    color: currentColor;
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
