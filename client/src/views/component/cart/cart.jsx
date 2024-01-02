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

import { IncreaseEndConsumer, IncreaseTaxCredit, selectNcfCode, selectNcfStatus, selectTaxReceiptData, updateTaxCreditInFirebase, clearTaxReceiptData, selectTaxReceipt } from '../../../features/taxReceipt/taxReceiptSlice'
import { addNotification } from '../../../features/notification/NotificationSlice'
import { selectAppMode } from '../../../features/appModes/appModeSlice'
import { fbAddInvoice } from '../../../firebase/invoices/fbAddInvoice'
import { fbUpdateProductsStock } from '../../../firebase/products/fbUpdateProductStock'
import { selectUser } from '../../../features/auth/userSlice'
import { fbUpdateTaxReceipt } from '../../../firebase/taxReceipt/fbUpdateTaxReceipt'
import { deleteClient, handleClient, selectClient } from '../../../features/clientCart/clientCartSlice'
import { useIsOpenCashReconciliation } from '../../../firebase/cashCount/useIsOpenCashReconciliation'
import { getCashCountStrategy } from '../../../notification/cashCountNotification/cashCountNotificacion'

import { PaymentArea } from './components/PaymentArea'
import { ProductsList } from './components/ProductsList/ProductsLit'
import { CheckoutAction } from './components/CheckoutAction/CheckoutAction'
import useViewportWidth from '../../../hooks/windows/useViewportWidth'
import { useCallback } from 'react'

export const Cart = () => {
  const dispatch = useDispatch()

  const componentToPrintRef = useRef(null);

  const isOpen = useSelector(SelectCartIsOpen)
  const selectMode = useSelector(selectAppMode)
  const bill = useSelector(({ cart }) => cart.data)
  const taxReceiptDataSelected = useSelector(selectTaxReceiptData)

  const checkCashCount = useIsOpenCashReconciliation()

  const handleCashReconciliationConfirm = () => {
    const cashCountStrategy = getCashCountStrategy(checkCashCount.status, dispatch)
    cashCountStrategy.handleConfirm()
  }

  const viewport = useViewportWidth();
  const ncfStatus = useSelector(selectNcfStatus);
  const { settings: { taxReceiptEnabled } } = useSelector(selectTaxReceipt);
  const ncfCode = useSelector(selectNcfCode);
  const TotalPurchaseRef = useSelector(SelectTotalPurchase);
  const ncfCartSelected = useSelector(SelectNCF);
  const ProductSelected = useSelector(SelectProduct);
  const billData = useSelector(SelectFacturaData);
  const user = useSelector(selectUser);
  const clientInCart = useSelector(selectClient)
  const [submittable, setSubmittable] = useState(false)

  const increaseTaxReceipt = async () => {
    if (!taxReceiptEnabled) return;
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
    try {
      if (selectMode === true) {
        fbAddInvoice(bill, user)
        { taxReceiptEnabled && fbUpdateTaxReceipt(user, taxReceipt) }
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
    onAfterPrint: () => {
      //paso #4 guardar los datos en firebase
      savingDataToFirebase(billData, taxReceiptDataSelected);
      setSubmittable(true);
    },
  })
  const handleInvoice = useCallback(async () => {
    try {
      if (ProductSelected.length === 0) {
        dispatch(addNotification({ message: "No hay productos seleccionados", type: 'error' }));
        return;
      }

      if (checkCashCount.status === 'closed' || checkCashCount.status === 'closing' || checkCashCount.status !== 'open') {
        handleCashReconciliationConfirm();
        return;
      };
      await createOrUpdateClient();
      //paso #1 seleccionar el tipo de comprobante
      { taxReceiptEnabled && increaseTaxReceipt() }

      //paso #2 seleccionar el ncf
      if (taxReceiptEnabled && ncfCode === null) {
        dispatch(addNotification({ message: "No hay comprobante fiscal seleccionado", type: 'error' }));
        return;
      }
      if (taxReceiptEnabled) dispatch(addTaxReceiptInState(ncfCode));
      //paso #3 crear o actualizar el cliente


      showPrintPreview();

    } catch (error) {
      handleInvoiceError(error);
    }
  }, [ProductSelected, checkCashCount, ncfCode, taxReceiptDataSelected, billData, submittable])

  function handleInvoiceError(error) {
    dispatch(addNotification({ message: "Ocurrió un Error, Intente de Nuevo", type: 'error' }));
    console.error(error);
  }
  const handleCancelShipping = () => {
    if (viewport <= 800) dispatch(toggleCart());
    dispatch(CancelShipping())
    dispatch(clearTaxReceiptData())
    dispatch(deleteClient())
  }

  useEffect(() => {
    if (submittable === true) {
      clearDataFromState()
      dispatch(deleteClient())
      setSubmittable(false)
    }
  }, [submittable])

  return (
    <Container isOpen={isOpen}>
      <ClientControl />
      <ProductsList />
      <div>
        <PaymentArea />
        <CheckoutAction
          ProductSelected={ProductSelected}
          TotalPurchaseRef={TotalPurchaseRef}
          handleCancelShipping={handleCancelShipping}
          handleInvoice={handleInvoice}
          componentToPrintRef={componentToPrintRef}
          bill={bill}
        />
      </div>
    </Container>
  )
}

const Container = styled.div`
  position: relative;
   height: calc(100%);
   background-color: ${({ theme }) => theme.bg.shade};
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

const PaymentSection = styled.div`
  
`