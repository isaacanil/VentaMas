import React, { Fragment, useState } from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import Style from './MenuLinkStyle.module.scss'
export const MenuLink = ({ item }) => {
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };
  return (
    <Fragment>
      <li className={Style.Menu_link_container} onClick={item.submenu && showSubMenu}>
        {
          item.path ? (
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive ? `${Style.Menu_link} ${Style.Active}` : Style.Menu_link)}
            >
              <div>{item.title}</div>
              <div>
                {
                  item.submenu && isOpenSubMenu
                    ? item.submenuIconOpen
                    : item.submenu
                      ? item.submenuIconClose
                      : null
                }
              </div>
            </NavLink>
          ) : (
            <span className={`${Style.Menu_link}`}>
              <div>{item.title}</div>
              <div>
                {
                  item.submenu && isOpenSubMenu
                    ? item.submenuIconOpen
                    : item.submenu
                      ? item.submenuIconClose
                      : null
                }
              </div>
            </span>)
        }
      </li>
      {
        isOpenSubMenu ?
          (
            <div className={Style.SubMenu}>
              {
                item.submenu.map((item, index) => (
                  <div className={Style.SubMenu_link_container} key={index}>
                    <NavLink to={item.path} className={({ isActive }) => (isActive ? `${Style.SubMenu_link} ${Style.Active}` : Style.SubMenu_link)}>
                      {item.title}
                    </NavLink>
                  </div>
                ))
              }
            </div>
          ) : null
      }

    </Fragment>
  )
}




