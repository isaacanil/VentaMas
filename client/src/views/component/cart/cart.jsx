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





export const Cart = () => {
  
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [costoTotal, setCostoTotal] = useState('')
  const ProductSelected = useSelector(SelectProduct)
  const deleteProductFromCart = (id) => {
    dispatch(
      deleteProduct(id)
    )
    dispatch(
      totalShoppingItems()
     ) 
  }
 
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
                  <li key={Index} className={style.group}>
                    <div className={`${style.Item} ${style.Item1}`}>{item.productName}</div>
                    <Counter className={`${style.Item}`} amountToBuyTotal={item.amountToBuy.total} stock={item.stock} id={item.id} product={item}/>

                    <div className={style.CrossContainer} onClick={() => deleteProductFromCart(item.id)}>
                      <svg className={style.Cross} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" ><path d="M23.707.293a1 1 0 00-1.414 0L12 10.586 1.707.293a1 1 0 00-1.414 0 1 1 0 000 1.414L10.586 12 .293 22.293a1 1 0 000 1.414 1 1 0 001.414 0L12 13.414l10.293 10.293a1 1 0 001.414 0 1 1 0 000-1.414L13.414 12 23.707 1.707a1 1 0 000-1.414z" /></svg>
                    </div>
                    <div className={`${style.Item} ${style.Item3}`}>RD${separator(item.price.total)}</div>
                    <br />
                  </li>
                ))
              )
              :
              (<h4 style={{ margin: '1em' }}>Todavía no ha seleccionado ningún producto</h4>)
          }
        </ul>
        <div className={style.resultBar}>
          <div>
            <h3>Total : RD$  {total}</h3>
          </div>
          <Button onClick={handleInvoice}>Facturar</Button>
        </div>
      </section>
    </Fragment>
  )
}

