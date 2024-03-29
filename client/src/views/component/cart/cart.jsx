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
import { useIsOpenCashReconciliation } from '../../../firebase/cashCount/useIsOpenCashReconciliation'
import { getCashCountStrategy } from '../../../notification/cashCountNotification/cashCountNotificacion'
import { PaymentArea } from './components/PaymentArea'
import { ProductsList } from './components/ProductsList/ProductsLit'
import { CheckoutAction } from './components/CheckoutAction/CheckoutAction'
import useViewportWidth from '../../../hooks/windows/useViewportWidth'
import { addNotification } from '../../../features/notification/NotificationSlice'
import { selectCashReconciliation } from '../../../features/cashCount/cashStateSlice'

export const Cart = () => {
  const dispatch = useDispatch()
  const componentToPrintRef = useRef(null);
  const isOpen = useSelector(SelectCartIsOpen)
  const selectMode = useSelector(selectAppMode)
  const bill = useSelector(({ cart }) => cart.data)
  console.log(bill.products)
  const taxReceiptDataSelected = useSelector(selectTaxReceiptData)
  const nfcType = useSelector(selectNcfType);
  const checkCashCount = useIsOpenCashReconciliation()
  const cashCount = useSelector(selectCashReconciliation)
  const [step, setStep] = useState(0)
  const handleCashReconciliationConfirm = () => {
    const cashCountStrategy = getCashCountStrategy(checkCashCount.status, dispatch)
    cashCountStrategy.handleConfirm()
  }
  const viewport = useViewportWidth();
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
      switch (nfcType) {
        case "CREDITO FISCAL":
          dispatch(IncreaseTaxCredit())
          console.log('hay ncf')
          break;
        case "CONSUMIDOR FINAL":
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
        bill = {
          ...bill,
          cashCountId: cashCount.cashCount.id
        }
        await fbAddInvoice(bill, user)
        if(taxReceiptEnabled) {
           await fbUpdateTaxReceipt(user, taxReceipt) 
        }
        await fbUpdateProductsStock(ProductSelected, user);
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
    onAfterPrint: () => setStep(4),
  })

  useEffect(() => {
    if (step === 1) {
      { taxReceiptEnabled && increaseTaxReceipt() }
      setStep(2)
    }
  }, [step])

  useEffect(() => {
    if (step === 2) {
      if (taxReceiptEnabled && ncfCode === null) {
        dispatch(addNotification({ message: "No hay comprobante fiscal seleccionado", type: 'error' }));
        return;
      }
      if (taxReceiptEnabled) dispatch(addTaxReceiptInState(ncfCode));
      setStep(3)
    }
  }, [step])

  useEffect(() => {
    if (step === 3) {
      try {
        createOrUpdateClient();
        showPrintPreview();
      } catch (error) {
        handleInvoiceError(error);
      }
    }
  }, [step])
  const handleInvoice = async () => {
    if (ProductSelected.length === 0) {
      dispatch(addNotification({ message: "No hay productos seleccionados", type: 'error' }));
      return;
    }
    // const isAmountToBuyValid = ProductSelected.every(product => product?.amountToBuy > 0 || !product?.amountToBuy){
    //   antd
    // }
    if (checkCashCount.status === 'closed' || checkCashCount.status === 'closing' || checkCashCount.status !== 'open') {
      handleCashReconciliationConfirm();
      return;
    };
    setStep(1)
  }
  function handleInvoiceError(error) {
    dispatch(addNotification({ message: "Ocurrió un Error, Intente de Nuevo", type: 'error' }));
    console.error(error);
  }
  useEffect(() => {
    if (step === 4) {
      savingDataToFirebase(billData, taxReceiptDataSelected);
      setSubmittable(true)
    }
  }, [step])
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
      <PaymentArea />
      <CheckoutAction
        ProductSelected={ProductSelected}
        TotalPurchaseRef={TotalPurchaseRef}
        handleCancelShipping={handleCancelShipping}
        handleInvoice={handleInvoice}
        componentToPrintRef={componentToPrintRef}
        bill={bill}
      />
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
   grid-template-rows: min-content 1fr min-content min-content;
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

