import React, { useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'

import { useDispatch, useSelector } from 'react-redux'
import { SelectDelivery, SelectTotalTaxes, addPaymentMethod, SelectTotalPurchase, SelectChange, setChange } from '../../../features/cart/cartSlice'
import { useEffect } from 'react'
export const PaymentArea = () => {
    const ChangeRef = useSelector(SelectChange)
    const TaxesRef = useSelector(SelectTotalTaxes)
    const DeliveryRef = useSelector(SelectDelivery)
    const dispatch = useDispatch()
    const TotalPurchaseRef = useSelector(SelectTotalPurchase)
    const [PayValue, setPayValue] = useState()
    const [changeValue, setChangeValue] = useState(

    )
    const [paymentMethod, setPaymentMethod] = useState([
        {
            status: true,
            value: 0,
            method: 'cash'
        },
        {
            status: false,
            value: 0,
            method: 'card'
        },
        {
            status: false,
            value: 0,
            method: 'transfer'
        }
    ])
    const PaymentMethodFN = {
        findAndUpdate: (id, value) => {
            let SearchingMethod = paymentMethod.find((methodSelected) => methodSelected.method === id)
            setPaymentMethod(
                paymentMethod.map((method) => {
                    if (SearchingMethod == method) {
                        return { ...method, status: value, value: TotalPurchaseRef }
                    }
                    if (SearchingMethod !== method) {
                        return { ...method, status: false, value: 0 }
                    }
                })
            )

        },
        setValueToPaymentMethodSelected: (value) => {
            let SearchingMethod = paymentMethod.find((methodSelected) => methodSelected.status === true)
            setPaymentMethod(
                paymentMethod.map((method) => {
                    if (SearchingMethod == method) {
                        return { ...method, value: Number(value) }
                    }
                    if (SearchingMethod !== method) {
                        return { ...method, status: false, value: 0 }
                    }
                })
            )
        }

    }
    useEffect(()=>{
        PaymentMethodFN.setValueToPaymentMethodSelected(TotalPurchaseRef)
    }, [])
    useEffect(() => {
      
        dispatch(addPaymentMethod(paymentMethod))
        dispatch(
            setChange()
        )
    
            setChangeValue(
                ChangeRef
            )
    
        setPayValue(
            paymentMethod.find((m) => m.status === true).value
        )
    }, [paymentMethod, ChangeRef])
    console.log(paymentMethod)
    return (
        <Container>
            <Row>
                <Group class='option1'>
                    <Group>
                        <Switch></Switch>
                        <STitle>Comprobante Fiscal</STitle>
                    </Group>
                    <Group>
                        <select name="" id="">
                            <option value="">Descuento</option>
                            <option value="">10%</option>
                            <option value="">15%</option>
                            <option value="">20%</option>
                        </select>
                    </Group>
                </Group>
            </Row>
            <Area>
                <label className='title' htmlFor="">Método de Pago</label>
                <Group class='option1'>
                    <Group>
                        <input type="radio" name="payment-method" id="cash"
                            onChange={(e) => {
                                PaymentMethodFN.findAndUpdate("cash", e.target.checked)
                            }}
                        />
                        <label htmlFor='cash'>Efectivo</label>
                    </Group>
                    <Group>
                        <input type="radio" name="payment-method" id="card"
                            onChange={(e) => {
                                PaymentMethodFN.findAndUpdate("card", e.target.checked)
                            }} />
                        <label htmlFor='card'>Tarjeta</label>
                    </Group>
                    <Group>
                        <input type="radio" name="payment-method" id="transfer"
                            onChange={(e) => {
                                PaymentMethodFN.findAndUpdate("transfer", e.target.checked)
                            }} />
                        <label htmlFor='transfer'>Transferencia</label>
                    </Group>
                </Group>
            </Area>
            <Row>
                <Group class='option1'>
                    <span>Total ITBIS: {TaxesRef.value}</span>
                    <Item>
                        <label htmlFor="">Pago con</label>
                        <input
                            type="number"
                            value={PayValue > 0 ? PayValue : ""}
                            onChange={(e) => PaymentMethodFN.setValueToPaymentMethodSelected(e.target.value)}
                        />
                    </Item>
                </Group>
            </Row>
            <Row>
                <Group class='option1'>
                    <span>Delivery: {DeliveryRef.value}</span>
                    <Item>
                        <label htmlFor="">Cambio</label>
                        <input type="text" value={ changeValue } readOnly />
                    </Item>
                </Group>
            </Row>
        </Container>
    )
}
const Container = styled.div`

`
const Row = styled.div`
    align-items: center;
    padding: 0 0.4em;
`
const Group = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
    ${props => {
        switch (props.class) {
            case 'option1':
                return `
                    justify-content: space-between;
                `
            default:
                break;
        }
    }}
`
const Item = styled.div`
padding: 0;
    flex-shrink: 1;
    height: 2em;
    position: relative;
    display: flex;
    align-items: center;
    label{
        font-size: 11px;
        height: 11px;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        position: absolute;
        top: -4px;
        display: flex;
        align-items: center;
        background-color: #ffffff;
        color: #8b8b8b;
        font-weight: bold;
    }
    input{
        width: 100%;
        border-radius: 4px;
        outline: 1px solid rgba(0, 0, 0, 0.300);
        background-color: #dbdbdb;
        border: none;
        padding: 0.2em 0.4em;
        font-size: 14px;
}
`
const STitle = styled.div`
    
    white-space: nowrap;
`

const Area = styled.div`
    .title{
        position: absolute;
        top: -14px;
        font-weight: 650;
        font-size: 14px;
        color: var(--Black3);
        background-color: white;
    }
    position: relative;
    padding: 0.3em 0.5em;
    border: 1px solid #0000003d;
    border-radius: 8px;
    margin: 0.4em 0;

`