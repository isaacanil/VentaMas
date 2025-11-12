import { Tag } from 'antd';
import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useLocation, useMatch } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { toggleDeveloperModal } from '../../../../features/modals/modalSlice';

import { SubMenu } from './SubMenu/SubMenu';

export const MenuLink = ({ item, onActionDone }) => {
  const dispatch = useDispatch();
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false);
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

  useEffect(() => {
    if (isCurrentRoute) {
      setIsOpenSubMenu(true);
    }
  }, [isCurrentRoute]);

  const showSubMenu = () => {
    setIsOpenSubMenu(!isOpenSubMenu);
  };

  const handleAction = (e) => {
    e.preventDefault();
    if (!item?.action) return;
    if (item.action === 'openDeveloperModal') {
      dispatch(toggleDeveloperModal());
    }
    // Cerrar el overlay del submenu si viene callback del padre
    if (typeof onActionDone === 'function') onActionDone();
  };
  const Component = item?.route ? MenuItemLink : MenuItemDiv;
  return (
    <Fragment>
      <Component
        onClick={item.submenu ? showSubMenu : item.action ? handleAction : null}
        to={item?.route || '#'}
        className={isExactMatch ? 'active' : ''}
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
          showSubMenu={showSubMenu}
          isOpen={isOpenSubMenu}
          item={item}
          MenuItemsLink={MenuItemLink}
        />
      )}
    </Fragment>
  );
};
const commonStyles = css`
  display: flex;
  justify-content: space-between;
  padding: 0 0.8em;
  height: 2.8em;
  align-items: center;
  font-weight: 450;
  color: var(--Gray6);
  margin: 0em;
  border-bottom: var(--border-primary);
  :last-child {
    border-bottom: none;
  }
  :hover {
    color: ${(props) => props.theme.bg.color};
    transition: background-color 400ms ease;
    svg {
      color: ${(props) => props.theme.bg.color};
    }
  }
  svg {
    color: var(--Gray6);
  }
`;

const MenuItemLink = styled(NavLink).attrs({ end: true })`
  ${commonStyles}

  &.active {
    color: white;
    font-weight: 600;
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
  overflow: hidden;
  max-width: 80%;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
const Icon = styled.div`
  width: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
`;
