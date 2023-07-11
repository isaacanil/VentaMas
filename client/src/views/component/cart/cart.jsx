import React, { useEffect, useRef, useState } from 'react'

import style from './cartStyle.module.scss'
import {
  Button,
  ClientControl,
  Receipt,
} from '../../index'
import {
  SelectProduct,
  CancelShipping,
  SelectTotalPurchase,
  SelectClient,
  SelectFacturaData,
  addTaxReceiptInState,
  SelectNCF,
  SelectCartIsOpen,
  toggleCart,
} from '../../../features/cart/cartSlice'

import { useSelector, useDispatch } from 'react-redux'
import { ProductCardForCart } from './components/ProductCardForCart'
import { PaymentArea } from './components/PaymentArea'
import { useReactToPrint } from 'react-to-print'
import { useFormatPrice } from '../../../hooks/useFormatPrice'

import { IncreaseEndConsumer, IncreaseTaxCredit, selectNcfCode, selectNcfStatus, selectTaxReceiptData, updateTaxCreditInFirebase, clearTaxReceiptData } from '../../../features/taxReceipt/taxReceiptSlice'
import styled from 'styled-components'
import { addNotification } from '../../../features/notification/NotificationSlice'
import { selectMenuOpenStatus } from '../../../features/nav/navSlice'
import { selectAppMode } from '../../../features/appModes/appModeSlice'
import { fbAddInvoice } from '../../../firebase/invoices/fbAddInvoice'
import { fbUpdateProductsStock } from '../../../firebase/products/fbUpdateProductStock'
import { selectUser } from '../../../features/auth/userSlice'
import { fbUpdateTaxReceipt } from '../../../firebase/taxReceipt/fbUpdateTaxReceipt'
import { ButtonGroup } from '../../templates/system/Button/Button'
import { deleteClient, handleClient } from '../../../features/clientCart/clientCartSlice'
import { closeUserNotification, setUserNotification } from '../../../features/UserNotification/UserNotificationSlice'
import { useNavigate } from 'react-router-dom'
import { useIsOpenCashReconciliation } from '../../../firebase/cashCount/useIsOpenCashReconciliation'
import { createAction } from '@reduxjs/toolkit'
import { CONFIRMATION_TASK_TYPE } from '../modals/UserNotification/components/ConfirmationDialog/HandleConfirmationAction'
import { getCashCountStrategy } from '../../../notification/cashCountNotification/cashCountNotificacion'
import { ProductsList } from './components/ProductsList/ProductsLit'

export const Cart = () => {
  const isOpen = useSelector(SelectCartIsOpen)
  const dispatch = useDispatch()
  const selectMode = useSelector(selectAppMode)
  const componentToPrintRef = useRef(null);
  const bill = useSelector(({ cart }) => cart.data)
  const taxReceiptDataSelected = useSelector(selectTaxReceiptData)
  const clientSelected = useSelector(SelectClient)
  const navigate = useNavigate()
  const handleCloseCashReconciliation = () => {
    dispatch(closeUserNotification())
  }

  const handleSubmitCashReconciliation = () => {
    handleCloseCashReconciliation()
    navigate('/cash-register-opening')
  }

  const checkCashCountStatus = useIsOpenCashReconciliation()

  const handleCashReconciliationConfirm = () => {
    const cashCountStrategy = getCashCountStrategy(checkCashCountStatus, dispatch)
    cashCountStrategy.handleConfirm()
  }

  const ncfStatus = useSelector(selectNcfStatus)
  const ncfCode = useSelector(selectNcfCode)
  const [submittable, setSubmittable] = useState(false)
  const TotalPurchaseRef = useSelector(SelectTotalPurchase)
  const ncfCartSelected = useSelector(SelectNCF)
  const ProductSelected = useSelector(SelectProduct)
  const billData = useSelector(SelectFacturaData)
  const [printed, setPrinted] = useState(false)
  const user = useSelector(selectUser)

  useEffect(() => {
    if (ncfCode !== null) {
      dispatch(addTaxReceiptInState(ncfCode))
    }
    if (ncfCode) {
      dispatch(addTaxReceiptInState(ncfCode))
    }
  }, [ncfCode])

  const increaseTaxReceipt = async () => {
    try {
      switch (ncfStatus) {
        case true:
          dispatch(IncreaseTaxCredit())
          console.log('hay ncf')
          break;
        case false:
          dispatch(IncreaseEndConsumer())
          console.log('no hay ncf')
          break;
        default:
          dispatch(IncreaseEndConsumer())
          console.log('no hay ncf')
          break;
      }
    } catch (error) {
      console.log(error)
    }
  }

  const createOrUpdateClient = async () => {
    try {
      dispatch(handleClient({ user }))
    } catch (error) {
      console.log(error)
      dispatch(addNotification({ message: "Ocurrió un Error con el cliente, Intente de Nuevo", type: 'error' }));
    }
  }

  const savingDataToFirebase = async (bill, taxReceipt) => {
    dispatch(addTaxReceiptInState(ncfCode))
    try {
      if (selectMode === true) {
        fbAddInvoice(bill, user)
        fbUpdateTaxReceipt(taxReceipt, user)
        fbUpdateProductsStock(ProductSelected, user);
        dispatch(addNotification({ message: "Venta Realizada", type: 'success', title: 'Completada' }))
      } else {
        dispatch(addNotification({ message: "No se puede Facturar en Modo Demo", type: 'error' }))
      }
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
      dispatch(addNotification({ message: "Ocurrió un Error, Intente de Nuevo", type: 'error' }));
    }
  }

  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    onAfterPrint: () => setPrinted(true),
  })

  const TIME_TO_WAIT = 1000;

  const handleInvoice = async () => {

    if (checkCashCountStatus === 'closed' || checkCashCountStatus === 'closing') {
      handleCashReconciliationConfirm()
      return;
    };

    dispatch(addTaxReceiptInState(ncfCode))

    if (ProductSelected.length === 0) {
      dispatch(addNotification({ message: "No hay productos seleccionados", type: 'error' }));
      return;
    }

    try {
      await increaseTaxReceipt();
      await esperar(TIME_TO_WAIT);
      await createOrUpdateClient();
      await showPrintPreview();
      await esperar(TIME_TO_WAIT);
    } catch (error) {
      handleInvoiceError(error);
    }
  }

  function esperar(tiempo) {
    return new Promise((resolve) => {
      setTimeout(resolve, tiempo);
    });
  }

  function handleInvoiceError(error) {
    dispatch(addNotification({ message: "Ocurrió un Error, Intente de Nuevo", type: 'error' }));
    console.error(error);
  }

  useEffect(() => {
    if (ncfCartSelected !== null && submittable === false && printed === true) {
      savingDataToFirebase(billData, taxReceiptDataSelected)
      setSubmittable(true)
    }
  }, [ncfCartSelected, submittable, printed])

  useEffect(() => {
    if (submittable === true) {
      clearDataFromState()
      dispatch(deleteClient())
      setSubmittable(false)
      setPrinted(false)
    }
  }, [submittable])

  const handleCancelShipping = () => {
    dispatch(toggleCart())
    dispatch(CancelShipping())
    dispatch(clearTaxReceiptData())
    dispatch(deleteClient())
  }

  return (
    <Container isOpen={isOpen}>
      <ClientControl />
      <ProductsList />
      <div>
        <PaymentArea></PaymentArea>
        <div className={style.resultBar}>

          <h3><span className={style.price}>{useFormatPrice(TotalPurchaseRef)}</span></h3>
          
          <Receipt ref={componentToPrintRef} data={bill}></Receipt>

          <ButtonGroup>
            <Button
              borderRadius='normal'
              title='Cancelar'
              onClick={handleCancelShipping}
            />
            <Button
              borderRadius='normal'
              title='Facturar'
              onClick={handleInvoice}
              bgcolor='primary'
              disabled={ProductSelected.length >= 1 ? false : true}
            />
          </ButtonGroup>

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
      background-color: white;
      ${props => {
    switch (props.isOpen) {
      case false:
        return `
              width: 0;
              position: absolute;
              z-index: 1;
            `

      default:
        break;
    }
  }}
   
   }
   
`

const PaymentSection = styled.div`
  
`
