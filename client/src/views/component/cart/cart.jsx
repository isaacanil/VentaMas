import React, { Fragment, useState } from 'react'
import { separator } from '../../../hooks/separator'
import style from './cartStyle.module.scss'
import {
  Counter,
  Button,
  AddClientModal,
  ClientControl,
  BillingModal,
} from '../../index'
import {
  SelectProduct,
  totalPurchaseWithoutTaxes,
  CancelShipping,
  totalTaxes,
  totalPurchase,
  setChange,
  totalShoppingItems,
  SelectTotalPurchase
} from '../../../features/cart/cartSlice'

import { useSelector, useDispatch } from 'react-redux'
import { deleteProduct } from '../../../features/cart/cartSlice'
//import { useModal } from '../../../hooks/useModal'
import { useNavigate } from 'react-router-dom'
import { openModalBilling } from '../../../features/modals/modalSlice'
import { ProductCardForCart } from './ProductCardForCart'
import { PaymentArea } from './PaymentArea'
export const Cart = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const TotalPurchaseRef = useSelector(SelectTotalPurchase)
  const ProductSelected = useSelector(SelectProduct)
  const handleInvoice = () => {
    if (ProductSelected.length === 0) {
      console.log('todavía no has agregado nada')
    } else {
      dispatch(
        openModalBilling()
      )
      dispatch(
        totalPurchaseWithoutTaxes()
      )
      dispatch(
        totalShoppingItems()
      )
      dispatch(
        totalTaxes()
      )
      dispatch(
        totalPurchase()
      )
      dispatch(
        setChange()
      )
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
              <h3>Total : RD${TotalPurchaseRef}</h3>
            </div>
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

