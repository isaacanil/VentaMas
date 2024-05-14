import styled from 'styled-components'
import { useReactToPrint } from 'react-to-print'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ClientControl } from '../../index'
import {
  SelectProduct,
  CancelShipping,
  SelectTotalPurchase,
  SelectFacturaData,
  addTaxReceiptInState,
  SelectNCF,
  SelectCartIsOpen,
  toggleCart,
} from '../../../features/cart/cartSlice'
import {
  IncreaseEndConsumer,
  IncreaseTaxCredit,
  selectNcfCode,
  selectTaxReceiptData,
  clearTaxReceiptData,
  selectTaxReceipt,
  selectNcfType
} from '../../../features/taxReceipt/taxReceiptSlice'
import { selectAppMode } from '../../../features/appModes/appModeSlice'
import { fbAddInvoice } from '../../../firebase/invoices/fbAddInvoice'
import { fbUpdateProductsStock } from '../../../firebase/products/fbUpdateProductStock'
import { selectUser } from '../../../features/auth/userSlice'
import { fbUpdateTaxReceipt } from '../../../firebase/taxReceipt/fbUpdateTaxReceipt'
import { deleteClient, handleClient, selectClient } from '../../../features/clientCart/clientCartSlice'
import { getCashCountStrategy } from '../../../notification/cashCountNotification/cashCountNotificacion'
import { PaymentArea } from './components/PaymentArea'
import { ProductsList } from './components/ProductsList/ProductsLit'
import { CheckoutAction } from './components/CheckoutAction/CheckoutAction'
import useViewportWidth from '../../../hooks/windows/useViewportWidth'
import { addNotification } from '../../../features/notification/NotificationSlice'
import { selectCashReconciliation } from '../../../features/cashCount/cashStateSlice'
import InvoiceSummary from './components/InvoiceSummary/InvoiceSummary'

export const Cart = () => {
  const isOpen = useSelector(SelectCartIsOpen)
  return (
    <Container isOpen={isOpen}>
      <ClientControl />
      <ProductsList />
      <InvoiceSummary />
    </Container>
  )
}

const Container = styled.div`
  position: relative;
   height: 100vh;
   background-color: ${({ theme }) => theme.bg.shade};
   max-width: 30em;
   width: 24em;
   overflow: hidden;
   display: grid;
   grid-template-columns: 1fr;
   grid-template-rows: min-content 1fr min-content ;
   padding: 0 ;
   margin: 0;
   gap: 0.4em;
   transition: width 600ms 0ms linear;
   @media(max-width: 800px){
      height: calc(100vh);
      width: 100%;
      max-width: 100%;
      border: 1px solid rgba(0, 0, 0, 0.121);
      border-top: 0;

      border-bottom: 0;
      position: absolute;
      top: 0;
      z-index: 100000;
 
      transition: transform 600ms 0ms linear;
      
      ${props => {
    switch (props.isOpen) {
      case false:
        return `
             
              transform: translateX(-100%);
              position: absolute;
              z-index: 1;
            `

      default:
        break;
    }
  }}
   
   }
   
`

