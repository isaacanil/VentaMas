import React, {Fragment} from 'react'
import { Link, useMatch } from 'react-router-dom'
import Style from './Home.module.scss'
import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite'

import { CompraImg, InventarioImg, RegistroImg, VentaImg } from '../../../assets/index'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
export const Home = () => {
  const user = useSelector(selectUser)
  const match = useMatch('/app/')
 match ? console.log('match') : console.log('no match')
  return (
    <Fragment>
      
      <div className={Style.App_container}>

        <MenuWebsite></MenuWebsite>
        <div className={Style.welcomeSection_container}>
          <div className={Style.welcomeSection_inner}>
             {user === null ? null : <h2 className={Style.welcomeSection_title}>¡Bienvenido de nuevo <span>{user.displayName}</span>!</h2>}
            <ul className={Style.WelcomeSection_items}>



              <li className={Style.card}>
                <Link className={Style.card_inner} to='/app/venta/1'>
                  <div className={Style.card_img_container}>
                    <img className={Style.card_img} src={VentaImg} alt="" />
                  </div>
                  <h3 className={Style.card_title}>Venta</h3>
                </Link>
              </li>
              <li className={Style.card}>
                <Link className={Style.card_inner} to='/app/compra'>
                  <div className={Style.card_img_container}>
                    <img className={Style.card_img} src={CompraImg} alt="" />

                  </div>
                  <h3 className={Style.card_title}>Comprar</h3>
                </Link>
              </li>
              <li className={Style.card}>
                <Link className={Style.card_inner} to='/app/registro'>
                  <div className={Style.card_img_container}>
                    <img className={Style.card_img} src={RegistroImg} alt="" />

                  </div>
                  <h3 className={Style.card_title}>Registro</h3>

                </Link>
              </li>
              <li className={Style.card}>
                <Link className={Style.card_inner} to='/app/inventario'>
                  <div className={Style.card_img_container}>
                    <img className={Style.card_img} src={InventarioImg} alt="" />

                  </div>
                  <h3 className={Style.card_title}>Inventario</h3>
                </Link>
              </li>


            </ul>

          </div>
        </div>
      </div>
    </Fragment>
  )
}

