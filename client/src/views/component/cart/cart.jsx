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
  isNewClient,
  SelectClient,
  SelectFacturaData,
  addTaxReceiptInState,
  SelectNCF,
} from '../../../features/cart/cartSlice'

import { useSelector, useDispatch } from 'react-redux'
import { ProductCardForCart } from './ProductCardForCart'
import { PaymentArea } from './PaymentArea'
import { useReactToPrint } from 'react-to-print'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import { AddBills, UpdateMultipleDocs } from '../../../firebase/firebaseconfig'
import { IncreaseEndConsumer, IncreaseTaxCredit, selectNcfCode, selectNcfStatus, selectTaxReceiptData, updateTaxCreditInFirebase, clearTaxReceiptData } from '../../../features/taxReceipt/taxReceiptSlice'
import styled from 'styled-components'
import { addNotification } from '../../../features/notification/NotificationSlice'
import { selectMenuOpenStatus } from '../../../features/nav/navSlice'
import { selectAppMode } from '../../../features/appModes/appModeSlice'

export const Cart = () => {
  const isOpen = useSelector(selectMenuOpenStatus)
  const dispatch = useDispatch()
  const selectMode = useSelector(selectAppMode)
  const componentToPrintRef = useRef(null);
  const bill = useSelector(state => state.cart.data)
  const taxReceiptDataRef = useSelector(selectTaxReceiptData)
  const clientSelected = useSelector(SelectClient)
  const ncfStatus = useSelector(selectNcfStatus)
  const ncfCode = useSelector(selectNcfCode)
  const [submittable, setSubmittable] = useState(false)
  const TotalPurchaseRef = useSelector(SelectTotalPurchase)
  const ncfCartSelected = useSelector(SelectNCF)
  const ProductSelected = useSelector(SelectProduct)
  const billData = useSelector(SelectFacturaData)
  const [printed, setPrinted] = useState(false)

  useEffect(() => {
    if (ncfCode !== null) {
      dispatch(addTaxReceiptInState(ncfCode))
    }
    if (ncfCode) {
      dispatch(addTaxReceiptInState(ncfCode))
    }
  }, [ncfCode])

  const handleTaxReceipt = async () => {
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
      dispatch(isNewClient())
    } catch (error) {
      console.log(error)
    }
  }
  const savingDataToFirebase = async (bill) => {
    dispatch(addTaxReceiptInState(ncfCode))
    try {
      if (selectMode === true) {
        AddBills(bill)
        dispatch(updateTaxCreditInFirebase())
        UpdateMultipleDocs(ProductSelected);
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
    }
  }
  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    onAfterPrint: () => setPrinted(true),


  })
  const TIME_TO_WAIT = 1000;

  const handleInvoice = async () => {
    dispatch(addTaxReceiptInState(ncfCode))
    if (ProductSelected.length === 0) {
      dispatch(addNotification({ message: "No hay productos seleccionados", type: 'error' }));
      return;
    }

    try {
      await handleTaxReceipt().then(() => {
        return esperar(TIME_TO_WAIT);
      }).then(() => {
        return createOrUpdateClient();
      }).then(() => {
        return showPrintPreview();
      }).then(() => {
        return esperar(TIME_TO_WAIT);
      }).catch((error) => {
        handleInvoiceError(error);
      });
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
      savingDataToFirebase(billData)
      console.log('=> => => => =>', ncfCartSelected)
      setSubmittable(true)
    }
  }, [ncfCartSelected, submittable, printed])
  useEffect(() => {
    if (submittable === true) {
      clearDataFromState()
      setSubmittable(false)
      setPrinted(false)
    }
  }, [submittable])
  return (
    <Container isOpen={isOpen ? true : false}>
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
   transition: width 600ms 200ms ease;
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
   ${props => {
    switch (props.isOpen) {
      case true:
        return `
        width: 0;
        
        `
        break;

      default:
        break;
    }
  }}
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
