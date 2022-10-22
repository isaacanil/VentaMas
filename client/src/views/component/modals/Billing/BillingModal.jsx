import React, { Fragment, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SelectProduct, SelectTotalShoppingItems, SelectFacturaData, getId, CancelShipping } from '../../../../features/cart/cartSlice'
import { Button, ButtonGroup } from '../../../templates/system/Button/Button'
import { closeModalBilling } from '../../../../features/modals/modalSlice'
import { ClientBar } from './component/ClientSection'
import { DeliveryOption } from './component/DeliveryOption'
import { PaymentMethod } from './component/Payment'
import ReactToPrint from 'react-to-print'
import { AddBills } from '../../../../firebase/firebaseconfig.js'
import { useDispatch, useSelector } from 'react-redux'
import { separator } from '../../../../hooks/separator'
import { Receipt } from '../../../pages/checkout/Receipt'
import styled from 'styled-components'
import {
  Container,
  BillingWrapper,
  Head,
  Body,
  Main,
  Row,
  Precio_Col,
  ITBIS_Col,
  Product_Col,
  ProductList,
  Product,
  ProductName,
  ProductPrecio,
  ProductItbis,
  ProductView,
  ProductAmount,
  Footer
} from './Style'

export const BillingModal = ({isOpen}) => {
  const dispatch = useDispatch()
  const data = useSelector(SelectFacturaData)
  const totalShoppingItems = useSelector(SelectTotalShoppingItems)
  const id = data.id
  const path = "bills"
  let ComponentRef = useRef(); // <= referencia para el documento que e va a imprimir
  const productSelected = useSelector(SelectProduct)
  //Todo *****Modal******************
  const bill = useSelector(state => state.cart)
  const closeModal = () => {
    dispatch(
      closeModalBilling()
    )
    dispatch(
      closeModalBilling()
    )
  }
  
  const HandleSubmit = () => {
    dispatch(
      getId()
    )
    AddBills(data)
    dispatch(
      closeModalBilling()
    )
    dispatch(
      CancelShipping()
    )
  }
  return (
    <Fragment>
      
  
       {
        isOpen ? (
          <Container>
            <BillingWrapper>
              <Head>
                <h3>Factura #: 123232345</h3>
                <Button color='error' onClick={closeModal}>X</Button>
              </Head>
              <Body>
                <ClientBar/>
                <DeliveryOption />
                <Main>
                  <ProductView>
                    <Row columns='product-list' bgColor='black'>
                      <Product_Col>
                        <span>Descripción</span>
                      </Product_Col>
                      <ITBIS_Col>
                        <span>ITBIS</span>
                      </ITBIS_Col>
                      <Precio_Col>
                        <span>Precio</span>
                      </Precio_Col>
                    </Row>
                    <ProductList>

                      {
                        productSelected.length >= 1 ? (
                          productSelected.map((item, index) => (
                            <Product key={index}>
                              <Row columns='product-list'>
                                <div>{item.amountToBuy.total} UND</div>

                              </Row>
                              <Row columns='product-list'>
                                <ProductName>
                                  {item.productName}
                                </ProductName>
                                <ProductItbis>
                                  {separator(item.tax.total)}
                                </ProductItbis>
                                <ProductPrecio>
                                  {separator(item.price.total)}
                                </ProductPrecio>
                              </Row>
                            </Product>
                          ))
                        ) : null
                      }
                    </ProductList>
                    <Row columns='product-list' bgColor='black'>
                    <ProductAmount>
                      Total de artículos: {totalShoppingItems}
                    </ProductAmount>
                    </Row>
                  </ProductView>
                  <PaymentMethod/>
                    
                 
                </Main>
                <Footer>
                  <ButtonGroup>
                      <ReactToPrint 
                      trigger={()=>( <Button color='primary' onClick={HandleSubmit}>Imprimir</Button>)}
                      content={() => ComponentRef.current}
                      />
                      <DocumentContainer>
                        <Receipt  ref={ComponentRef} data={bill}/>
                      </DocumentContainer>
                      
                      <Button color='gray' onClick={HandleSubmit}>Cerrar</Button>
                      
                   
                  </ButtonGroup>
                </Footer>
              </Body>
            </BillingWrapper>
          </Container>
        ) : null
       }
          
      
     
    </Fragment>

  )
}
const DocumentContainer = styled.div`
  position: absolute;
  left: 100em;
`