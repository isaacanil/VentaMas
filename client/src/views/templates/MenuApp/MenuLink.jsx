import React, { Fragment, useState } from 'react'
import { IoIosArrowBack } from 'react-icons/io'
import { NavLink } from 'react-router-dom'
import { Button } from '../system/Button/Button'
import Style from './MenuLinkStyle.module.scss'
export const MenuLink = ({ item }) => {
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };

  return (
    <Fragment>
      <li className={Style.Menu_link_container} onClick={item.submenu && showSubMenu}>
        {
          item.path ? (
            <div
              className={`${Style.Menu_link}`} >
              <NavLink to={item.path} className={({ isActive }) => (isActive ? `${Style.wrapper} ${Style.active}` : Style.wrapper)}>
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
            </div>
          ) : (
            <div className={`${Style.Menu_link}`}>
              <div className={Style.wrapper}>
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
              </div>
            </div>)
        }
      </li>
      <div className={isOpenSubMenu ? `${Style.SubMenu} ${Style.Open}` : Style.SubMenu}>
        <div className={Style.Head}>
          <Button
            startIcon={<IoIosArrowBack />}
            title='atrás'
            variant='contained'
            onClick={showSubMenu}
          />
          <span>{item.title}</span>
        </div>
        {
          isOpenSubMenu ? (item.submenu.map((submenu, index) => (
            <div className={Style.SubMenu_link_container} key={index}>
              <NavLink to={submenu.path} className={({ isActive }) => (isActive ? `${Style.SubMenu_link} ${Style.Active}` : Style.SubMenu_link)}>
                <div className={Style.wrapper}>
                  {submenu.title}
                </div>
              </NavLink>
            </div>
          ))) : null
        }
      </div>

    </Fragment>
  )
}




