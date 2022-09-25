import React, { Fragment } from 'react'
import { useState } from 'react'
//import component
import {
  MenuApp as Menu,
  MenuComponents,
  ControlSearchProduct,
  MultiDisplayControl,
  Cart, BillingModal
} from '../../'
import { ProductControl } from './ProductControl.jsx'
//import { useBilling } from '../../../hooks/useBilling'

//import style
import Style from './Venta.module.scss'
//import { useModal } from '../../../hooks/useModal'



export const Ventas = () => {


  return (

    <Fragment>
      <Menu></Menu>
      <main className={Style.AppContainer}>

        <MultiDisplayControl></MultiDisplayControl>
        <div className={Style.ProductsContainer}>
        
          <ProductControl></ProductControl>
          <MenuComponents></MenuComponents>
        </div>
        <Cart></Cart>

      </main>

    </Fragment>
  )
}
