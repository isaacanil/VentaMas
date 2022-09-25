import React, { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { SelectProduct, SelectFacturaData, getDate  } from '../../../../features/cart/cartSlice'
import { Button, ButtonGroup } from '../../../templates/system/Button/Button'
import { SelectBillingModal } from '../../../../features/modals/modalSlice'
import { closeModalBilling } from '../../../../features/modals/modalSlice'
import { ClientBar } from './component/ClientSection'
import { DeliveryOption } from './component/DeliveryOption'
import { PaymentMethod } from './component/Payment'
import {
  Container,
  BillingWrapper,
  Head,
  Body,
  Main,
  Row,
  Grid,
  GridTitle,
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

  InputText,
  InputNumber,
  InputGroup,
  Footer
} from './Style'
import { Firestore } from '../../../../firebase/firebaseconfig'
import { useDispatch } from 'react-redux'
import { separator } from '../../../../hooks/separator'
export const BillingModal = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const data = useSelector(SelectFacturaData)
  const id = data.id
  const path = "bills"

  const productSelected = useSelector(SelectProduct)

  //Todo *****Modal******************
  const modalBillingSelected = useSelector(SelectBillingModal)
  const closeModal = () => {
    dispatch(
      closeModalBilling()
    )
  }
  const handleSubmit = () => {
    dispatch(
      getDate()
    )
    Firestore(path, data, id)
    navigate('/app/checkout/receipt')
    dispatch(
      closeModalBilling()
    )
  }
  return (
    <Fragment>
      
  
       {
        modalBillingSelected ? (
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
                                <div>{item.amountToBuy} UND</div>

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
                      Total de artículos: {productSelected.length}
                    </ProductAmount>
                    </Row>
                  </ProductView>
                  <PaymentMethod/>
                    
                 
                </Main>
                <Footer>
                  <ButtonGroup>
              
                    <Button color='primary' onClick={handleSubmit}>Imprimir</Button>
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
