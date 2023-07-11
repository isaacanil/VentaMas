import React, { Fragment, useState } from 'react'
import { NavLink, useLocation, useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { SubMenu } from './SubMenu/SubMenu'
export const MenuLink = ({ item, Items }) => {
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };

  const Component = item?.route?.path ? MenuItemLink : MenuItemDiv;

  return (
    <Fragment>
      <Component
        onClick={item.submenu && showSubMenu}
        to={item?.route?.path || "#"}
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

      </Component>
      <SubMenu showSubMenu={showSubMenu} isOpen={isOpenSubMenu} item={item} Items={MenuItemLink} />
    </Fragment>
  )
}

const MenuItem = styled.div`
 display: flex;
  justify-content: space-between;
  padding: 0 0.8em;
  height: 2.4em;
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
 
`
const MenuItemLink = styled(MenuItem).attrs({
  as: NavLink,
  activeClassName: 'active'
})`
font-weight: 450;
   &.active {
    color: white;
    font-weight: 600;
  background-color:var(--color);
  svg{
    color: white;
  }
  }

 `
const MenuItemDiv = styled(MenuItem)`
    font-weight: 450;
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
