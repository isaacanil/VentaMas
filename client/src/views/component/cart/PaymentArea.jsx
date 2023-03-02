import React, { useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'
import { monetarySymbols } from '../../../constants/monetarySymbols'
import { useDispatch, useSelector } from 'react-redux'
import { SelectDelivery, SelectTotalTaxes, addPaymentMethod, SelectTotalPurchase, SelectChange, setChange, totalPurchase, addPaymentMethodAutoValue, addPaymentValue, SelectPaymentValue } from '../../../features/cart/cartSlice'
import { useEffect } from 'react'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import { getTaxReceiptData, handleNCFStatus, selectNcfStatus } from '../../../features/taxReceipt/taxReceiptSlice'
import { readTaxReceiptDataBD } from '../../../firebase/firebaseconfig'
import { quitarCeros } from '../../../hooks/quitarCeros'
import CustomInput from '../../templates/system/Inputs/CustomInput'
export const PaymentArea = () => {
    const ChangeRef = useSelector(SelectChange)
    const [taxReceiptData, setTaxReceiptData] = useState()
    const selectedNcfStatus = useSelector(selectNcfStatus)
    const TaxesRef = useSelector(SelectTotalTaxes)
    const PaymentValue = useSelector(SelectPaymentValue)
    const DeliveryRef = useSelector(SelectDelivery)
    const dispatch = useDispatch()
    const TotalPurchaseRef = useSelector(SelectTotalPurchase)
    const [NCFStatus, setNCFStatus] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState([
        {
            status: true,
            method: 'cash'
        },
        {
            status: false,
            method: 'card'
        },
        {
            status: false,
            method: 'transfer'
        }
    ])
    const [paymentValue, setPaymentValue] = useState(0)
    const SelectPaymentMethod = (id, value) => {
        let SearchingMethod = paymentMethod.find((methodSelected) => methodSelected.method === id)
        setPaymentMethod(
            paymentMethod.map((method) => {
                if (SearchingMethod == method) {
                    return { ...method, status: value }
                }
                if (SearchingMethod !== method) {
                    return { ...method, status: false }
                }
            })
        )
    }

    useEffect(() => {
        dispatch(addPaymentValue(paymentValue))
        dispatch(setChange())
    }, [paymentValue])

    useEffect(() => {
        dispatch(addPaymentMethodAutoValue())
        setPaymentValue(TotalPurchaseRef)
    }, [TotalPurchaseRef])

    useEffect(() => {
        dispatch(addPaymentMethod(paymentMethod))
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
    useEffect(() => {
        dispatch(handleNCFStatus(NCFStatus))
    }, [NCFStatus])
    return (
        <Container>
            <Row>
                <Group className='option1'>
                    <Group>
                        <Switch checked={selectedNcfStatus ? true : false} onChange={(e) => dispatch(handleNCFStatus(e.target.checked))}></Switch>
                        <STitle>Comprobante Fiscal</STitle>
                    </Group>
                    <Group>
                        <CustomInput options={["10", "20", "30"]} />
                    </Group>
                </Group>
            </Row>
            <Area>
                <Group className='option1'>
                    <Group grow='2'>
                        <input type="radio" name="payment-method" id="cash"
                            defaultChecked
                            onChange={(e) => { SelectPaymentMethod("cash", e.target.checked) }}
                        />
                        <label htmlFor='cash'>Efectivo</label>
                    </Group>
                    <Group grow='2'>
                        <input type="radio" name="payment-method" id="card"
                            onChange={(e) => { SelectPaymentMethod("card", e.target.checked) }}
                        />
                        <label htmlFor='card'>Tarjeta</label>
                    </Group>
                    <Group>
                        <input type="radio" name="payment-method" id="transfer"
                            onChange={(e) => { SelectPaymentMethod("transfer", e.target.checked) }}
                        />
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
                            value={quitarCeros(Number(paymentValue))}
                            onChange={(e) => setPaymentValue(e.target.value)}
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
    justify-content: space-evenly;
    flex-grow: 1;
    gap: 0.8em;
    ${props => {
        switch (props.grow) {
            case props.grow:
                return `
                flex-grow: ${props.grow};
                `

            default:
                break;
        }
    }}
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
   
    input[type="radio"]:checked + label{
       
      background-color: var(--color);
      color: black;
      font-weight: 500;
      color: white;
      
        
    }
    input[type="radio"]{
        display:none;
    }
    label{
        flex-grow: 1;
        border-radius: 4px;
        transition: background-color, 400ms ease-in-out, color 400ms ease-in-out;
        background-color: #ccd7e6;
        font-weight: 500;
        text-align: center;
        :hover{
            background-color: var(--color3)
        }
    }
    
    
    
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
        background-color: var(--color3);
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