import React, { Fragment, useRef, useState } from 'react'
import { separator } from '../../../hooks/separator'
import style from './cartStyle.module.scss'
import {
  Counter,
  Button,
  AddClientModal,
  ClientControl,
  BillingModal,
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
  handleUpdateClient
} from '../../../features/cart/cartSlice'
import { HandleSubmit } from './HadleSubmit'
import { useSelector, useDispatch } from 'react-redux'
import { deleteProduct } from '../../../features/cart/cartSlice'
//import { useModal } from '../../../hooks/useModal'
import { useNavigate } from 'react-router-dom'
import { openModalBilling } from '../../../features/modals/modalSlice'
import { ProductCardForCart } from './ProductCardForCart'
import { PaymentArea } from './PaymentArea'
import { useReactToPrint } from 'react-to-print'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
export const Cart = () => {
  const componentToPrintRef = useRef(null);
  const bill = useSelector(state => state.cart)
  const dispatch = useDispatch()
  const TotalPurchaseRef = useSelector(SelectTotalPurchase)
  const ProductSelected = useSelector(SelectProduct)
  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
  })
  const handleInvoice = () => {
    if (ProductSelected.length > 0) {
      // dispatch(totalPurchaseWithoutTaxes())
      // dispatch(totalShoppingItems())
      // dispatch(totalTaxes())
      // dispatch(totalPurchase())
      // dispatch(setChange())
      // handlePrint()
      dispatch(handleUpdateClient())
    }
  }
  
  return (
    <Fragment>
      <section className={style.FacturaControlContainer}>
        <ClientControl></ClientControl>
        <ul className={style.ProductsContainer}>
          <div className={style.Products}>
            <div className={style.ProductsWrapper}>
              {
                ProductSelected.length >= 1 ?
                  (
                    ProductSelected.map((item, Index) => (
                      <ProductCardForCart item={item} key={Index} />
                    ))
                  )
                  :
                  (<h4 style={{ margin: '1em' }}>Seleccione un producto</h4>)
              }
            </div>
          </div>
        </ul>
        <div className={style.billing}>
          <PaymentArea></PaymentArea>
          <div className={style.resultBar}>
            <div>
              <h3>Total : {useFormatPrice(TotalPurchaseRef)}</h3>
            </div>
            <Receipt ref={componentToPrintRef} data={bill}></Receipt>
            <Button
              title='Facturar'
              onClick={handleInvoice}
              bgcolor='primary'
              disabled={ProductSelected.length >= 1 ? false : true}
            />
          </div>
        </div>
      </section>
    </Fragment>
  )
}

