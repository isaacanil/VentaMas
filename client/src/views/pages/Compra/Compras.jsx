import React, { Fragment, useEffect, useState } from 'react'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { getOrder } from '../../../firebase/firebaseconfig'
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import styled from 'styled-components';
import { ProductCardForCart } from './ProductCardForCart';
import { Carrucel } from './Carrucel';


export const Compras = () => {
  const [orders, setOrder] = useState([])
  const [isTrue, setIsTrue] = useState(false)
  useEffect(() => {
    getOrder(setOrder)
  }, [])
 
  return (
    <Fragment>
      <MenuApp></MenuApp>
      <Carrucel></Carrucel>
    </Fragment >
  )
}
