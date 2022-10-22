import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import {
  
  //template
  MenuApp as Menu,
} from '../../index'
import { nanoid } from 'nanoid'
import { Receipt } from '../../index'
export const Compras = () => {

  return (
    <div>
      <Menu></Menu>
      <h2>compra</h2>
      <Receipt></Receipt>
     
    </div>
  )
}

