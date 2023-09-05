import React, { Fragment, useEffect, useState } from 'react'
import { NavLink, useLocation, useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { SubMenu } from './SubMenu/SubMenu'
export const MenuLink = ({ item, Items }) => {
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };
  const isCurrentRoute = item?.submenu?.some(subItem => subItem.route === location.pathname);
  useEffect(() => {
    if (isCurrentRoute) {
      setIsOpenSubMenu(true);
    }
  }, [isCurrentRoute]);
  const Component = item?.route ? MenuItemLink : MenuItemDiv;

  return (
    <Fragment>
      <Component
        onClick={item.submenu ? showSubMenu : null}
        to={item?.route || "#"}
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
      {isOpenSubMenu && 
      <SubMenu showSubMenu={showSubMenu} isOpen={isOpenSubMenu} item={item} MenuItemsLink={MenuItemLink} />}
    </Fragment>
  )
}

const MenuItem = styled.div`
 display: flex;
  justify-content: space-between;
  padding: 0 0.8em;
  height: 2.8em;
  align-items: center;
  color: var(--Gray6);

  margin: 0em;
  border-bottom: var(--border-primary);
  :last-child{
    border-bottom: none;
  }
  
  :hover{
 
    color: ${props => props.theme.bg.color};
    /* background-color: var(--color2); */
    transition: background-color 400ms ease;
    svg{
      color: ${props => props.theme.bg.color};
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
    
    background-color: ${props => props.theme.bg.color};
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
