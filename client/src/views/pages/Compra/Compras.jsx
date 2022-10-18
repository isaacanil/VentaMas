import React, { useState, useEffect } from 'react'
import { Receipt } from '../../index'
import { useSelector } from 'react-redux'

import {
  
  //template
  MenuApp as Menu,
} from '../../index'
import { nanoid } from 'nanoid'
export const Compras = () => {
  const [product, setProduct] = useState({
    status: false,
    id: '',
    name: ''
  })
 const change = () => {
  setProduct({
    status: true,
    id: nanoid(6),
    name: 'Jonathan'
  })
 }
  return (
    <div>
      <Menu></Menu>
      <h2>compra</h2>
      {product.status ? (
        <span>{product.name && product.id} </span>

      ) : null}
     <button onClick={change}>click pls</button>
    </div>
  )
}

