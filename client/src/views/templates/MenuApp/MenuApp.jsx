import React, { useState, Fragment } from 'react'
import Style from './Menu.module.scss'
import { NavLink, useMatch, useParams } from 'react-router-dom'
import { MenuData } from './MenuData'
import { MenuLink } from './MenuLink'
import { WebName } from '../../'
import { Account } from '../Account/Account'


export const MenuApp = () => {

  const [clickBtnMenu, setClickBtnMenu] = useState(false)
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };
  const handledClickMenuBtn = () => { setClickBtnMenu(!clickBtnMenu) };
  
  let user = useParams()
 

  return (
    <>
      {user ?
        (

          <>
            <div className={Style.Background}></div>
            <div className={Style.Container}>
              <div className={Style.MenuBtn} onClick={handledClickMenuBtn}>
                <div className={!clickBtnMenu ? Style.MenuBtn_icon : `${Style.MenuBtn_icon} ${Style.MenuBtn_icon_closed}`}></div>
              </div>
              <div className={Style.Center}>
                <WebName size={"large"}></WebName>
              </div>
              <Account></Account>
              <nav className={!clickBtnMenu ? `${Style.Menu} ${Style.Disabled}` : Style.Menu}>
                <ul className={Style.Menu_links_group}>
                  {
                    MenuData.map((item, index) => (
                      <Fragment>
                        <MenuLink item={item} key={index}></MenuLink>
                      </Fragment>
                    ))
                  }
                </ul>
              </nav>
            </div>
          </>
        )
        :
        (
          <h2>hola</h2>
        )
      }
    </>

  )
}

