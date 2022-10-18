import React, { useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { separator } from '../../../../../hooks/separator'
import {
    setChange,
    addCashPaymentMethod,
    addCardPaymentMethod,
    addTransferPaymentMethod,
    TotalProductWithoutTaxes,
    CashPaymentMethodRef,
    totalTaxes,
    SelectClient,
    SelectTotalPurchaseWithoutTaxes,
    SelectTotalTaxes,
    SelectTotalPurchase,
    SelectChange
} from '../../../../../features/cart/cartSlice'

import {
    Grid,
    GridTitle,
    Row,
    InputNumber,
    InputText
} from '../Style'

export const PaymentMethod = () => {
    const dispatch = useDispatch()
    const TotalPurchaseWithoutTaxes = useSelector(SelectTotalPurchaseWithoutTaxes)
    const TotalTaxesRef = useSelector(SelectTotalTaxes)
    const TotalPurchaseRef = useSelector(SelectTotalPurchase)
    const ChangeRef = useSelector(SelectChange)
    const [cashChecked, setCashChecked] = useState(false)
    const [cardChecked, setCardChecked] = useState(false)
    const [transferChecked, setTransferChecked] = useState(false)

    const setCashPaymentMethod = (cashValue) => {
        const cash = {
            status: cashChecked,
            value: cashValue
        }
        cashChecked ? (
            dispatch(
                addCashPaymentMethod(cash)
            )

        ) : console.log(cashChecked)
        dispatch(
            setChange()
        )
    }
    const setCardPaymentMethod = (Value) => {
        const card = {
            status: cardChecked,
            value: Value
        }
        cardChecked ? (
            dispatch(
                addCardPaymentMethod(card)
            )

        ) : console.log(cardChecked)
        dispatch(
            setChange()
        )
    }
    const setTransferPaymentMethod = (Value) => {
        const transfer = {
            status: transferChecked,
            value: Value
        }
        transferChecked ? (
            dispatch(
                addTransferPaymentMethod(transfer)
            )

        ) : console.log(transferChecked)
        dispatch(
            setChange()
        )
    }
    return (
        <Container>
            <Group gap='normal'>
                <GridTitle>
                    <h4>Método de pago</h4>
                </GridTitle>
                <Row columns='payment'>
                    <input type="checkbox" name="" id="cash" onChange={(e) => setCashChecked(e.target.checked)} />
                    <label htmlFor="cash">Efectivo</label>
                    <InputNumber border='circle' type="number" name="" id="" placeholder='RD$' onChange={e => setCashPaymentMethod(e.target.value)} />
                </Row>
                <Row columns='payment'>
                    <input type="checkbox" name="" id="card" onChange={(e) => setCardChecked(e.target.checked)} />
                    <label htmlFor="card">Tarjeta</label>
                    <InputNumber border='circle' type="number" name="" id="" placeholder='RD$' onChange={e => setCardPaymentMethod(e.target.value)} />
                    <InputText border='circle' type="text" name="" id="" placeholder='no. tarjeta' />
                </Row>
                <Row columns='payment'>
                    <input type="checkbox" name="" id="transfer" onChange={(e) => setTransferChecked(e.target.checked)} />
                    <label htmlFor="transfer">Transferencia</label>
                    <InputNumber border='circle' type="number" name="" id="" placeholder='RD$' onChange={e => setTransferPaymentMethod(e.target.value)} />
                    <InputText border='circle' type="text" name="" id="" placeholder='no. transf' />
                </Row>

            </Group>
            <Group gap='normal'>
                <Row columns='2' borderRadius='normal' padding='normal'>
                    <label>Monto:</label>
                    <span>{separator(TotalPurchaseWithoutTaxes)}</span>
                </Row>
                <Row columns='2' borderRadius='normal' padding='normal'>
                    <label>ITBIS:</label>
                    <span>{separator(TotalTaxesRef)}</span>
                </Row>
            </Group>
            <Group display='grid' >

                <Row columns='2' bgColor='black' borderRadius='normal' fontWeight='title'>
                    <label>Total:</label>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>RD${separator(TotalPurchaseRef)}</span>
                </Row>
                <Row columns='2' bgColor='primary' borderRadius='normal' fontWeight='title'>
                    <label>Cambio:</label>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>RD${separator(ChangeRef)}</span>
                </Row>
            </Group>
        </Container>
    )
}

export const Container = styled.div`
     background-color: rgba(226, 225, 225, 0.671);
     padding: 0.6em 0.6em ;
     border-radius: 10px;
     display: grid;
     gap: 0.5em;

     
`
export const Group = styled.div`
    background-color: rgb(236, 236, 236);
    padding: 0.5em 0.5em;
    border-radius: 10px;
    
    ${(props) => {
        switch (props.display) {
            case 'flex':
                return `
                display: flex;
                justify-content: space-between;
                
                gap: 0.5em;
                `
            case 'grid':
                return `
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5em;
                `
            default:
                break;
        }
    }}
    ${(props) => {
        switch (props.direction) {
            case 'column':
                return `
                display: flex;
                flex-direction: column;
               
                
                gap: 0.5em;
                `

            default:
                break;
        }
    }}
    ${(props) => {
        switch (props.gap) {
            case 'normal':
                return `
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                
                gap: 0.5em;
                `
            default:
                break;
        }
    }}
   
`
