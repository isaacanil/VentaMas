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
  searchQuery?: string;
  submenuPortalElement?: HTMLElement | null;
}

export const MenuLink = ({
  item,
  onActionDone,
  isSidebarOpen = false,
  parentTitle,
  searchQuery = '',
  submenuPortalElement,
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
  const Component: React.ElementType =
    item?.route && !isSubmenuItem ? MenuItemLink : MenuItemDiv;
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
          <TitleText data-menu-title="true">
            <HighlightedMenuTitle
              searchQuery={searchQuery}
              title={item.title ?? item.label ?? ''}
            />
          </TitleText>
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
          searchQuery={searchQuery}
          submenuPortalElement={submenuPortalElement}
        />
      )}
    </Fragment>
  );
};

const normalizeTitleSearchValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getSearchMatchRanges = (title: string, searchQuery: string) => {
  const normalizedQuery = normalizeTitleSearchValue(searchQuery).trim();
  if (!title || !normalizedQuery) return [];

  const normalizedToOriginal: Array<{ end: number; start: number }> = [];
  let normalizedTitle = '';
  let originalOffset = 0;

  Array.from(title).forEach((character) => {
    const start = originalOffset;
    const end = start + character.length;
    const normalizedCharacter = normalizeTitleSearchValue(character);

    Array.from(normalizedCharacter).forEach(() => {
      normalizedToOriginal.push({ start, end });
    });

    normalizedTitle += normalizedCharacter;
    originalOffset = end;
  });

  const ranges: Array<{ end: number; start: number }> = [];
  let searchFrom = 0;

  while (searchFrom < normalizedTitle.length) {
    const matchIndex = normalizedTitle.indexOf(normalizedQuery, searchFrom);
    if (matchIndex === -1) break;

    const lastMatchIndex = matchIndex + normalizedQuery.length - 1;
    const start = normalizedToOriginal[matchIndex]?.start;
    const end = normalizedToOriginal[lastMatchIndex]?.end;

    if (typeof start === 'number' && typeof end === 'number') {
      ranges.push({ start, end });
    }

    searchFrom = matchIndex + normalizedQuery.length;
  }

  return ranges;
};

const HighlightedMenuTitle = ({
  title,
  searchQuery,
}: {
  searchQuery: string;
  title: string;
}) => {
  const ranges = getSearchMatchRanges(title, searchQuery);
  if (!ranges.length) return <>{title}</>;

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  ranges.forEach((range, index) => {
    if (range.start > lastIndex) {
      segments.push(
        <React.Fragment key={`text-${index}`}>
          {title.slice(lastIndex, range.start)}
        </React.Fragment>,
      );
    }

    segments.push(
      <SearchMatch data-search-match="true" key={`match-${index}`}>
        {title.slice(range.start, range.end)}
      </SearchMatch>,
    );
    lastIndex = range.end;
  });

  if (lastIndex < title.length) {
    segments.push(
      <React.Fragment key="text-end">{title.slice(lastIndex)}</React.Fragment>,
    );
  }

  return <>{segments}</>;
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

    [data-menu-title='true'] {
      color: currentcolor;
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

    [data-menu-title='true'] {
      color: currentcolor;
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
`;

const TitleText = styled.span`
  color: currentcolor;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SearchMatch = styled.span`
  font-weight: 650;
  color: currentcolor;
  text-decoration-line: underline;
  text-decoration-thickness: 0.12em;
  text-underline-offset: 0.18em;
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2em;
`;
