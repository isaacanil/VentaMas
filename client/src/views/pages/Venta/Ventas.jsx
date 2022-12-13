import React, { Fragment } from 'react'
import { useState } from 'react'
import styled from 'styled-components'
//import component
import {
  MenuApp as Menu,
  MenuComponents,
  Cart
} from '../../'
import { ProductControl } from './ProductControl.jsx'
import { ShoppingItemsCounter } from './ShoppingItemsCounter'
//import { useBilling } from '../../../hooks/useBilling'
import Style from './Venta.module.scss'
export const Ventas = () => {
  return (
    <Fragment>
      <main className={Style.AppContainer}>
        {/* <MultiDisplayControl></MultiDisplayControl> */}
        <div className={Style.ProductsContainer}>
          <Menu borderRadius={'bottom-right'}></Menu>
          <ProductControl></ProductControl>
          <MenuComponents></MenuComponents>
          <ShoppingItemsCounter></ShoppingItemsCounter>
        </div>
        <Cart></Cart>
      </main>

    </Fragment>
  )
}
const Container = styled.div`
  
`