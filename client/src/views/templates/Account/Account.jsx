import React, { useState } from 'react'
import { UserIcon } from '../../../assets'

import Style from './Account.module.scss'
import { Link } from 'react-router-dom'
import { Button } from '../../'
import { auth } from '../../../firebase/firebaseconfig.js'
import { logout, selectUser } from '../../../features/auth/userSlice'
import { useDispatch, useSelector } from 'react-redux'
import { FaUser, FaUserCog } from 'react-icons/fa'
import { FiExternalLink } from 'react-icons/fi'
export const Account = () => {
  const dispatch = useDispatch();
  const [isOpen, SetIsOpen] = useState(false)
  const OpenMenu = () => {
    SetIsOpen(!isOpen)
  }
  const user = useSelector(selectUser)
  const logoutOfApp = () => {
    // dispatch to the store with the logout action
    dispatch(logout());
    auth.signOut();
  }

  return (

    <div className={Style.Component_container} onClick={OpenMenu}>
      <Button
      color='gray-dark'
        borderRadius={'normal'}
        width={'icon32'}
        title={<FaUserCog />}
      />
      <article className={!isOpen ? `${Style.AccountMenu}` : `${Style.AccountMenu} ${Style.Open}`}>
        <ul className={Style.Items}>
          <li className={Style.Item}>
            <Link to className={Style.Item_Link}>Cuenta</Link>
            <div className={Style.Icon_wrapper}>
              <FiExternalLink />
            </div>
          </li>
          <li className={Style.Item}>
            <Link to className={Style.Item_Link}>Ayuda</Link>
            <div className={Style.Icon_wrapper}>
              <FiExternalLink />
            </div>
          </li>

          <Button
            borderRadius={'normal'}
            title='Cerrar sesión'
            bgcolor="primary"
            width="100"
            onClick={logoutOfApp}
          />

        </ul>
      </article>
    </div>

  )
}

