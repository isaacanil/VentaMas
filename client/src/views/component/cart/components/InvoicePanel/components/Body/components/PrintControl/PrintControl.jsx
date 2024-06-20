import React from 'react'
import * as antd from 'antd'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { SelectSettingCart, togglePrintInvoice } from '../../../../../../../../../features/cart/cartSlice'
const {Switch} = antd
export const PrintControl = () => {
    const cartSetting = useSelector(SelectSettingCart)
    const dispatch = useDispatch()
    const {printInvoice} = cartSetting

    const handlePrintInvoice = () => dispatch(togglePrintInvoice())
    
  return (
    <Container>
        <Switch 
            checked={printInvoice} 
            onChange={handlePrintInvoice}
        />
        <span>Imprimir Factura</span>
    </Container>
  )
}
const Container = styled.div`
    display: flex;
    gap:1em;
    padding: 0.6em 0.8em;

`