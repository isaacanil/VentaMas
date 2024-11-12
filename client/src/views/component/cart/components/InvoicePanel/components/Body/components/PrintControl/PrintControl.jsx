import React from 'react'
import * as antd from 'antd'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { SelectSettingCart, togglePrintInvoice } from '../../../../../../../../../features/cart/cartSlice'
import InvoiceTemplates from '../../../../../../../Invoice/components/InvoiceTemplates/InvoiceTemplates'
const { Switch } = antd
export const PrintControl = () => {
  const cartSetting = useSelector(SelectSettingCart)
  const dispatch = useDispatch()
  const { printInvoice } = cartSetting

  const handlePrintInvoice = () => dispatch(togglePrintInvoice())

  return (
    <Container>
      <InvoiceTemplates
        previewInModal
        hidePreviewButton
      />
      <Label>
        <Switch
          checked={printInvoice}
          onChange={handlePrintInvoice}
        >
        </Switch>
        <span>Imprimir Factura </span>
      </Label>

      {/* <span>Imprimir Factura</span> */}
    </Container>
  )
}
const Container = styled.div`
  
    
    padding: 0.6em 0.8em;

`
const Label = styled.span`
    margin-right: 1em;
    display: flex;
    gap: 1em;
`
