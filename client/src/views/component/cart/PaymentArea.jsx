import React, { useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'
import { monetarySymbols } from '../../../constants/monetarySymbols'
import { useDispatch, useSelector } from 'react-redux'
import { SelectDelivery, SelectTotalTaxes, addPaymentMethod,  SelectTotalPurchase, SelectChange, setChange, totalPurchase, addPaymentMethodAutoValue, addPaymentValue, SelectPaymentValue } from '../../../features/cart/cartSlice'
import { useEffect } from 'react'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import { getTaxReceiptData, handleNCFStatus, SELECT_NCF_STATUS } from '../../../features/taxReceipt/taxReceiptSlice'
import { readTaxReceiptDataBD } from '../../../firebase/firebaseconfig'
import { quitarCeros } from '../../../hooks/quitarCeros'
export const PaymentArea = () => {
    const ChangeRef = useSelector(SelectChange)
    const [taxReceiptData, setTaxReceiptData] = useState()
    const NCF_STATUS = useSelector(SELECT_NCF_STATUS)
    const TaxesRef = useSelector(SelectTotalTaxes)
    const PaymentValue = useSelector(SelectPaymentValue)
    const DeliveryRef = useSelector(SelectDelivery)
    const dispatch = useDispatch()
    const TotalPurchaseRef = useSelector(SelectTotalPurchase)
    const [PayValue, setPayValue] = useState(0)
    const [NCFStatus, setNCFStatus] = useState(false)
    const [focusedPaymentInput, setFocusedPaymentInput] = useState(false)
    const paidAmount = useSelector(state => state.cart.paymentMethod)
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

    }
    const setValueToPaymentMethodSelected = async (value) => {
        const updatedPaymentMethod = paymentMethod.map((method) => {
            if (value === null) {
                return { ...method, value: 0 };
              }
            if (method.status && value !== null) {
                return { ...method, value: Number(value) };
            }
            return { ...method, status: false, value: 0 };
        });
        setPaymentMethod(updatedPaymentMethod);
    }
    const handlePayment = (e) => {
        dispatch(addPaymentValue(e.target.value))
    }
    useEffect(() => {
        setValueToPaymentMethodSelected(PaymentValue)
        console.log('.....', paymentMethod)
    }, [PaymentValue])
    useEffect(() => {
        dispatch(addPaymentMethod(paymentMethod))
        dispatch(setChange())
        console.log(paymentMethod)
    }, [paymentMethod])
    useEffect(() => {
        readTaxReceiptDataBD(setTaxReceiptData)
      }, [])
      useEffect(() => {
        if (taxReceiptData !== undefined && taxReceiptData.length > 0) {
          dispatch(getTaxReceiptData(taxReceiptData))
        }
      }, [taxReceiptData])
    useEffect(()=>{
        dispatch(handleNCFStatus(NCFStatus))
    }, [NCFStatus])
    return (
        <Container>
            <Row>
                <Group className='option1'>
                    <Group>
                        <Switch checked={NCF_STATUS ? true : false} onChange={(e) => dispatch(handleNCFStatus(e.target.checked))}></Switch>
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
                <label className='title' htmlFor="">M??todo de Pago</label>
                <Group className='option1'>
                    <Group>
                        <input type="radio" name="payment-method" id="cash"
                            defaultChecked
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
            <Row margin='bottom'>
                <Group className='option1'>
                    <span>Total ITBIS: {useFormatPrice(TaxesRef)}</span>
                    <Item>
                        <label htmlFor="">Pago con {monetarySymbols.dollarSign}</label>
                        <input
                            type="number"
                            value={quitarCeros(Number(PaymentValue))}
                            onChange={(e) => handlePayment(e)}
                        />
                    </Item>
                </Group>
            </Row>
            <Row margin='bottom'>
                <Group className='option1'>
                    <span>Delivery: {useFormatPrice(DeliveryRef.value)}</span>
                    <Item>
                        <label htmlFor="">Cambio {monetarySymbols.dollarSign}</label>
                        <input type="text" value={ChangeRef} readOnly />
                    </Item>
                </Group>
            </Row>
        </Container>
    )
}
const Container = styled.div`
    background-color: white;
`
const Row = styled.div`
    align-items: center;
    padding: 0 0.4em;
    ${props => {
        switch (props.margin) {
            case 'bottom':
                return `
                    margin-bottom: 10px;
                `
            default:
                break;
        }
    }}
`
const Group = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
    ${props => {
        switch (props.className) {
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
        padding: 2px 0.6em;
        position: absolute;
        top: -4px;
        display: flex;
        align-items: center;
        background-color: var(--icolor3);
        color: #5c5c5c;
        font-weight: bold;
        border-radius: 3px;
    }
    input{
        width: 100%;
        border-radius: 6px;
        outline: none;
        border: 1px solid rgba(0, 0, 0, 0.100);
        padding: 0.2em 0.4em;
        height: 2em;
        font-size: 14px;
        color: var(--Gray3);
    
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
        line-height: 19px;
        color: var(--Black3);
        background-color: white;
        border-radius: 10px;
        padding: 0 0.2em;
    }
    position: relative;
    padding: 0.3em 0.5em;
    //border: 1px solid #0000003d;
    color: #292929;
    background-color: var(--icolor4);
    border-radius: 4px;
    margin: 0.4em 0;

`