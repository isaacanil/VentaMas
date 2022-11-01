import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
//import { useNotification } from '../../../tauri/notification/notification'
import {
  //template
  MenuApp as Menu,
} from '../../index'
import { nanoid } from 'nanoid'
import { ProductList } from './ProductList'

export const Compras = () => {
  //useNotification()
  return (
    <div>
      <Menu></Menu>
      <h2>compra</h2>
      <ProductList></ProductList>
    </div>
  )
}

