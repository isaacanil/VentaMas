import React, { Fragment, useEffect, useRef, useState } from 'react'
import { separator } from '../../../hooks/separator'
import style from './cartStyle.module.scss'
import {
  Counter,
  Button,
  AddClientModal,
  ClientControl,
  Receipt,
} from '../../index'
import {
  SelectProduct,
  totalPurchaseWithoutTaxes,
  CancelShipping,
  totalTaxes,
  totalPurchase,
  setChange,
  totalShoppingItems,
  SelectTotalPurchase,
  handleClient,
  isNewClient,
  SelectClient,
  SelectFacturaData,
  addTaxReceiptInState
} from '../../../features/cart/cartSlice'
import { useSelector, useDispatch } from 'react-redux'
//import { useModal } from '../../../hooks/useModal'
import { ProductCardForCart } from './ProductCardForCart'
import { PaymentArea } from './PaymentArea'
import { useReactToPrint } from 'react-to-print'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import { AddBills, UpdateMultipleDocs } from '../../../firebase/firebaseconfig'
import { IncreaseEndConsumer, IncreaseTaxCredit, SELECT_NCF_CODE, SELECT_NCF_STATUS, selectTaxReceiptData, updateTaxCreditInFirebase, clearTaxReceiptData } from '../../../features/taxReceipt/taxReceiptSlice'
import styled from 'styled-components'
export const Cart = () => {
  const dispatch = useDispatch()
  const componentToPrintRef = useRef(null);
  const bill = useSelector(state => state.cart.data)
  const taxReceiptDataRef = useSelector(selectTaxReceiptData)
  const clientSelected = useSelector(SelectClient)
  const NCF_status = useSelector(SELECT_NCF_STATUS)
  const NCF_code = useSelector(SELECT_NCF_CODE)
  const TotalPurchaseRef = useSelector(SelectTotalPurchase)
  const ProductSelected = useSelector(SelectProduct)
  const billData = useSelector(SelectFacturaData)
  useEffect(() => {
    if (NCF_code !== null) {
      dispatch(addTaxReceiptInState(NCF_code))
    }
  }, [NCF_code])
  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
  })
  const handleTaxReceipt = async () => {
    console.log(NCF_status)
    try {
      if (NCF_status === true) {
        console.log('true')
        dispatch(IncreaseTaxCredit())
      }
      if (NCF_status === false) {
        console.log('false')
        dispatch(IncreaseEndConsumer())
      }
    } catch (error) {
      console.log(error)
    }
  }
  const createOrUpdateClient = async () => {
    try {
      dispatch(isNewClient())
    } catch (error) {
      console.log(error)
    }
  }
  const savingDataToFirebase = async () => {
    try {
      //AddBills(billData);
      dispatch(updateTaxCreditInFirebase())
      //UpdateMultipleDocs(ProductSelected);
    } catch (err) {
      console.log(err)
    }
  }
  const clearDataFromState = async () => {
    try {
      dispatch(CancelShipping())
      dispatch(clearTaxReceiptData())

    } catch (error) {
      console.log('error al borrar los datos del state de factura')
    }
  }
  const showPrintPreview = async () => {
    try {
      handlePrint()

    } catch (error) {

    }
  }
  const handleInvoice = async () => {
    if (ProductSelected.length > 0) {
      try {
        await handleTaxReceipt()
        await createOrUpdateClient()
        await savingDataToFirebase()
        await showPrintPreview()
        await showPrintPreview()
        await clearDataFromState()
      } catch (error) {
        console.log(error)
      }
    }
  }
  return (
    <Container>
      <ClientControl></ClientControl>
      <ProductsList>
        {
          ProductSelected.length > 0 ?
            (
              ProductSelected.map((item, Index) => (
                <ProductCardForCart item={item} key={Index} />
              ))
            )
            :
            (<h4 style={{ margin: '1em' }}>Seleccione un producto</h4>)
        }

      </ProductsList>
      <div className={style.billing}>
        <PaymentArea></PaymentArea>
        <div className={style.resultBar}>

          <h3><span>Total :</span><span className={style.price}>{useFormatPrice(TotalPurchaseRef)}</span></h3>

          <Receipt ref={componentToPrintRef} data={bill}></Receipt>
          <Button
            borderRadius='normal'
            title='Facturar'
            onClick={handleInvoice}
            bgcolor='primary'
            disabled={ProductSelected.length >= 1 ? false : true}
          />
        </div>
      </div>
    </Container>
  )
}
const Container = styled.div`
  position: relative;
   height: calc(100%);
   background-color: rgb(255, 255, 255);
   max-width: 30em;
   width: 24em;
   overflow: hidden;
   display: grid;
   grid-template-columns: 1fr;
   grid-template-rows: min-content auto min-content;
   padding: 0 ;
   margin: 0;
   gap: 10px;
   @media(max-width: 800px){
    height: calc(100vh);
      width: 100%;
      max-width: none;
      border: 1px solid rgba(0, 0, 0, 0.121);
      border-top: 0;
      border-bottom: 0;
      position: absolute;
      top: 0;
      z-index: 1;
      background-color: white;
      display: none;
   }
`
const ProductsList = styled.ul`
  background-color: var(--color2);
      display: grid;
      gap: 0.4em;
      align-items: flex-start;
      align-content: flex-start;
      width: 100%;
      margin: 0;
      padding: 0.4em;
      overflow-y: scroll;
      position: relative;
      //border-radius: 10px;
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
`
const PaymentSection = styled.div`
  
`
