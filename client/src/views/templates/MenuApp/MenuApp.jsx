import React, { useState } from 'react'
import Style from './Menu.module.scss'
import { NavLink, useParams } from 'react-router-dom'
import { MenuData as Data } from './MenuAppData'
import { WebName } from '../../'
import { Account } from '../Account/Account'


export const MenuApp = () => {
  const MenuData = Data
  const [clickBtnMenu, setClickBtnMenu] = useState(false)
  const handledClickMenuBtn = (e) => {
    e.preventDefault();
    setClickBtnMenu(!clickBtnMenu)
  }
  document.querySelector('cl')
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
                      <li className={Style.Menu_link_container} key={index}>
                        <NavLink
                          className={
                            ({ isActive }) => (isActive ? `${Style.Menu_link} ${Style.Active}` : Style.Menu_link)
                          }
                          to={item.path}>
                          {item.title}
                        </NavLink>
                      </li>
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

