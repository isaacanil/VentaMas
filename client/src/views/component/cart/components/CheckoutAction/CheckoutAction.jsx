import React from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { ButtonGroup } from '../../../../templates/system/Button/Button'
import { Receipt } from '../../../../pages/checkout/Receipt'
import * as antd from 'antd'
import { icons } from '../../../../../constants/icons/icons'
const { Typography, Modal } = antd
export const CheckoutAction = ({
    TotalPurchaseRef,
    ProductSelected,
    handleCancelShipping,
    handleInvoice,
    componentToPrintRef,
    bill
}) => {
    const showCancelSaleConfirm = () => {
        Modal.confirm({
            title: 'Cancelar Venta',
            content: 'Si cancelas, se perderán todos los datos de la venta actual. ¿Deseas continuar?',
            okText: 'Cancelar Venta',
            zIndex: 999999999999,
            okType: 'danger',
            cancelText: 'Continuar Venta',
            
            onOk() {
                // Aquí manejas la confirmación de la cancelación
                antd.message.success('Venta cancelada', 2.5)
                console.log('Venta cancelada');
                handleCancelShipping()
            },
            onCancel() {
                // Aquí manejas el caso en que el usuario decide no cancelar la venta

            },
        });
    };
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
                    onClick={showCancelSaleConfirm}
                    disabled={ProductSelected.length >= 1 ? false : true}
                >
                    Cancelar
                </Button>

                <Button
                    type='primary'
                    borderRadius='normal'
                    title='Facturar'
                    onClick={handleInvoice}
                    color='primary'
                    disabled={ProductSelected.length >= 1 ? false : true}
                >Facturar</Button>
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
const Button = styled(antd.Button)`
    font-weight: 600;
    font-size: 1em;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4em;
    ${props => props.disabled ? "background-color: #8f8e8e !important" : null}
    
`