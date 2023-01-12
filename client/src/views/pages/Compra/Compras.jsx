import React, { Fragment, useEffect, useState } from 'react'
import { MenuApp } from '../../templates/MenuApp/MenuApp'

import { ClientSelector } from '../../component/contact/ClientControl/ClientSelector'
import { SelectClient } from '../../../features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'
import { SearchClient } from '../../templates/system/Inputs/SearchClient'
import { useSearchFilter } from '../../../hooks/useSearchFilter'
import styled from 'styled-components'
import { Button } from './Button'

export const Compras = () => {
    
  const [taxReceiptData, setTaxReceiptData] = useState([])
  const dispatch = useDispatch()
 

  
  return (
    <Fragment>
   <Button children='Hola'/>

    </Fragment >
  )
}
const Container = styled.div`
        border: 1px solid var(--Gray1);
        border-radius: 10px;
        overflow: hidden;
`
const Row = styled.div`
display: grid;
align-items: center;
grid-template-columns: repeat(6, 1fr);
border-bottom: 1px solid var(--Gray1);
height: 2em;
    :last-child{
        border-bottom:0px;
    }
`
const Col = styled.div`
height: 100%;
padding: 0 1em;
display: flex;
align-items: center;
:last-child{
    border-right: 0;
}
:first-child{
    border-left: 0;
}
border-right: 1px solid var(--Gray1);
input[type="text"],input[type="number"]{
    width: 100%;
    height: 100%;
    border: 0;
    font-size: 12px;
    :focus{
        outline: none;
    }
}
h4{
    font-size: 12px;
    margin: 0;
    padding: 0;
}
h5{
    font-weight: 500;
}
`