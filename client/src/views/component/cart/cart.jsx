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
  totalShoppingItems
} from '../../../features/cart/cartSlice'

import { useSelector, useDispatch } from 'react-redux'
import { deleteProduct } from '../../../features/cart/cartSlice'
//import { useModal } from '../../../hooks/useModal'

import { useNavigate } from 'react-router-dom'
import { openModalBilling } from '../../../features/modals/modalSlice'
import { ProductCardForCart } from '../../templates/system/Product/Cart/ProductCardForCart'





export const Cart = () => {
  
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [costoTotal, setCostoTotal] = useState('')
  const ProductSelected = useSelector(SelectProduct)
 
 
  const handleInvoice = () => {
    /*navigate('/app/venta/checkout/Billing', {replace: true})*/
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
    console.log('click')
  }
  
  const numb = ProductSelected.reduce((total, product) => total + product.price.total, 0);
  const total = separator(numb)
  return (
    <Fragment>

      <section className={style.FacturaControlContainer}>
        <ClientControl></ClientControl>
        <ul className={style.listItem}>
          {
            ProductSelected.length >= 1 ?
              (
                ProductSelected.map((item, Index) => (
                  <ProductCardForCart item={item} key={Index}/>
                ))
              )
              :
              (<h4 style={{ margin: '1em' }}>Todavía no ha seleccionado ningún producto</h4>)
          }
        </ul>
        <div className={style.resultBar}>
          <div>
            <h3>Total : RD${total}</h3>
          </div>
          <Button onClick={handleInvoice}>Facturar</Button>
        </div>
      </section>
    </Fragment>
  )
}

