import React, { useState, useEffect } from 'react'
import { Receipt } from '../../index'
import { useSelector } from 'react-redux'

import {
  
  //template
  MenuApp as Menu,
} from '../../index'
export const Compras = () => {
  const bill = useSelector(state => state.cart)
  return (
    <div>
      <Menu></Menu>
      <h2>compra</h2>
      {/* <Receipt data={bill}></Receipt> */}
    </div>
  )
}

