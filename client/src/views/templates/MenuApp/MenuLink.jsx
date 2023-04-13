import React, { Fragment, useState } from 'react'
import { NavLink, useLocation, useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { SubMenu } from './SubMenu/SubMenu'
export const MenuLink = ({ item, Items }) => {
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };
  const location = useLocation();
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };
  return (
    <Fragment>
      <MenuItemLink
        onClick={item.submenu && showSubMenu}
        to={item.path}
        path={item?.path}
        active={isActiveRoute(item?.path)}
      >
        <Group>
          <Icon color={item.color}>
            {item.icon}
          </Icon>
          {item.title}
        </Group>

        {
          item.submenu && isOpenSubMenu
            ? item.submenuIconOpen
            : item.submenu
              ? item.submenuIconClose
              : null
        }

      </MenuItemLink>
      <SubMenu showSubMenu={showSubMenu} isOpen={isOpenSubMenu} item={item} Items={MenuItemLink}/>
    </Fragment>
  )
}

const MenuItemLink = styled(NavLink)`
  display: flex;
  justify-content: space-between;
  padding: 0 0.8em;
  height: 2.5rem;
  align-items: center;
  color: var(--Gray6);
  margin: 0 0.8em;
  border-radius: 0.5rem;
  :hover{
    color: var(--color);
    background-color: var(--color2);
    transition: background-color 400ms ease;
    svg{
      color: var(--color);
    }
  }
  svg{
    color: var(--Gray6);
  }
  ${({ active }) => active && `
  color: white;
  background-color:var(--color);
  svg{
    color: white;
  }

  `}
  
 
      `
const Group = styled.div`
  display: flex;
  gap: 1rem;
  svg{
    font-size: 1.2rem;
  }
`
const Icon = styled.div`
width: 1.2em;
display: flex;
align-items: center;
justify-content: center;

 

`
const EmptyBox = styled.div`
    height: 2.75em;
    width:4em;
    background-color: var(--color);
    `