import React from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { Button, ButtonGroup } from '../../../../templates/system/Button/Button'
import { Receipt } from '../../../../pages/checkout/Receipt'

export const CheckoutAction = ({
    TotalPurchaseRef,
    ProductSelected,
    handleCancelShipping,
    handleInvoice,
    componentToPrintRef,
    bill
}) => {
    return (
        <Container>
            <PriceContainer>
                {useFormatPrice(TotalPurchaseRef)}
            </PriceContainer>
            <Receipt ref={componentToPrintRef} data={bill}></Receipt>
            <ButtonGroup>
                <Button
                    borderRadius='normal'
                    title='Cancelar'
                    onClick={handleCancelShipping}
                    disabled={ProductSelected.length >= 1 ? false : true}
                />
                <Button
                    borderRadius='normal'
                    title='Facturar'
                    onClick={handleInvoice}
                    color='primary'
                    disabled={ProductSelected.length >= 1 ? false : true}
                />
            </ButtonGroup>
        </Container>
    )
}

const Container = styled.div`
 background-color: var(--Gray8);
 overflow: hidden;
   color: white;
   display: flex;
   padding: 0 0.4em;
   height: 2.6em;
   align-items: center;
   justify-content: space-between;
   border-top-left-radius: var(--border-radius-light);
      
      h3{
         width: 100%;
         display: flex;
         gap: 0.4em;
         .price{
            letter-spacing: 1px;
         }
         
      }
`

const PriceContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
    font-weight: 700;
    font-size: 1.4em;
    letter-spacing: 1px;
    `
