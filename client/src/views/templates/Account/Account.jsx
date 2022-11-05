import React, { useState } from 'react'
import { UserIcon } from '../../../assets'
import Style from './Account.module.scss'
import { Link } from 'react-router-dom'
import { Button } from '../../'
import { auth } from '../../../firebase/firebaseconfig.js'
import { logout , selectUser} from '../../../features/auth/userSlice'
import { useDispatch, useSelector } from 'react-redux'
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

      <UserIcon></UserIcon>
      {user === null ? null : <span>{user.displayName}</span>}
      <article className={!isOpen ? `${Style.AccountMenu}` : `${Style.AccountMenu} ${Style.Open}`}>
        <ul className={Style.Items}>
          <li className={Style.Item}>
            <Link to className={Style.Item_Link}>Cuenta</Link>
            <div className={Style.Icon_wrapper}>
              <svg className={Style.Icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 64C256 46.33 270.3 32 288 32H415.1C415.1 32 415.1 32 415.1 32C420.3 32 424.5 32.86 428.2 34.43C431.1 35.98 435.5 38.27 438.6 41.3C438.6 41.35 438.6 41.4 438.7 41.44C444.9 47.66 447.1 55.78 448 63.9C448 63.94 448 63.97 448 64V192C448 209.7 433.7 224 416 224C398.3 224 384 209.7 384 192V141.3L214.6 310.6C202.1 323.1 181.9 323.1 169.4 310.6C156.9 298.1 156.9 277.9 169.4 265.4L338.7 96H288C270.3 96 256 81.67 256 64V64zM0 128C0 92.65 28.65 64 64 64H160C177.7 64 192 78.33 192 96C192 113.7 177.7 128 160 128H64V416H352V320C352 302.3 366.3 288 384 288C401.7 288 416 302.3 416 320V416C416 451.3 387.3 480 352 480H64C28.65 480 0 451.3 0 416V128z" /></svg>
            </div>
          </li>
          <li className={Style.Item}>
            <Link to className={Style.Item_Link}>Ayuda</Link>
            <div className={Style.Icon_wrapper}>
              <svg className={Style.Icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 64C256 46.33 270.3 32 288 32H415.1C415.1 32 415.1 32 415.1 32C420.3 32 424.5 32.86 428.2 34.43C431.1 35.98 435.5 38.27 438.6 41.3C438.6 41.35 438.6 41.4 438.7 41.44C444.9 47.66 447.1 55.78 448 63.9C448 63.94 448 63.97 448 64V192C448 209.7 433.7 224 416 224C398.3 224 384 209.7 384 192V141.3L214.6 310.6C202.1 323.1 181.9 323.1 169.4 310.6C156.9 298.1 156.9 277.9 169.4 265.4L338.7 96H288C270.3 96 256 81.67 256 64V64zM0 128C0 92.65 28.65 64 64 64H160C177.7 64 192 78.33 192 96C192 113.7 177.7 128 160 128H64V416H352V320C352 302.3 366.3 288 384 288C401.7 288 416 302.3 416 320V416C416 451.3 387.3 480 352 480H64C28.65 480 0 451.3 0 416V128z" /></svg>
            </div>
          </li>
          <li className={Style.Item}>
            <Button 
              title='Cerrar sesión'
              bgcolor="primary"
              width="100"
              onClick={logoutOfApp}
            />

          </li>
        </ul>
      </article>
    </div>

  )
}

