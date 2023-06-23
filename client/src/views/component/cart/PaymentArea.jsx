import React, { useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'
import { monetarySymbols } from '../../../constants/monetarySymbols'
import { useDispatch, useSelector } from 'react-redux'
import { SelectDelivery, SelectTotalTaxes, addPaymentMethod, SelectTotalPurchase, SelectChange, setChange, totalPurchase, addPaymentMethodAutoValue, addPaymentValue, SelectPaymentValue } from '../../../features/cart/cartSlice'
import { useEffect } from 'react'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import { getTaxReceiptData, handleNCFStatus, selectNcfStatus } from '../../../features/taxReceipt/taxReceiptSlice'


import { quitarCeros } from '../../../hooks/quitarCeros'
import CustomInput from '../../templates/system/Inputs/CustomInput'
import { useRoundedNumber } from '../../../hooks/useRoundedNumber'
import { fbGetTaxReceipt } from '../../../firebase/taxReceipt/fbGetTaxReceipt'
import { InputV4 } from '../../templates/system/Inputs/InputV4'
export const PaymentArea = () => {
    const ChangeRef = useSelector(SelectChange)

    const selectedNcfStatus = useSelector(selectNcfStatus)
    const TaxesRef = useSelector(SelectTotalTaxes)
    const PaymentValue = useSelector(SelectPaymentValue)
    const DeliveryRef = useSelector(SelectDelivery)
    const dispatch = useDispatch()
    const TotalPurchaseRef = useSelector(SelectTotalPurchase)
    const [NCFStatus, setNCFStatus] = useState(false)

    const taxReceiptData = fbGetTaxReceipt()

    const [paymentMethod, setPaymentMethod] = useState([
        {
            status: true,
            method: 'cash',
            name: 'Efectivo',

        },
        {
            status: false,
            method: 'card',
            name: 'Tarjeta',
        },
        {
            status: false,
            method: 'transfer',
            name: 'Transfer...',
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
                <Group className='tax-discount'>
                    <Group>
                        <Switch checked={selectedNcfStatus ? true : false} onChange={(e) => dispatch(handleNCFStatus(e.target.checked))}></Switch>
                        <STitle>Comp. Fiscal.</STitle>
                    </Group>
                    <Group>
                        <CustomInput options={["10", "20", "30"]} />
                    </Group>
                </Group>
            </Row>
            <Area>
                <Group className='paymentMethod'>
                    {paymentMethod.map((method, index) => {
                        return (
                            <Group grow='2' key={index}>
                                <input type="radio" name="payment-method" id={method.method}
                                    defaultChecked={method.status}
                                    onChange={(e) => { SelectPaymentMethod(method.method, e.target.checked) }}
                                />
                                <label htmlFor={method.method}>{method.name}</label>
                            </Group>
                        )
                    }
                    )}
                </Group>
            </Area>
            <Row margin='bottom'>
                <Group className='option1'>
                    <span><span>ITBIS:</span>  {useFormatPrice(TaxesRef)}</span>
                    <InputV4
                            label='Pago con'
                            labelVariant='primary'
                        
                            type="number"
                            value={useRoundedNumber(quitarCeros(Number(paymentValue)))}
                            onChange={(e) => setPaymentValue(e.target.value)}
                        />
                    {/* <Item>
                        <label htmlFor="">Pago con {monetarySymbols.dollarSign}</label>
                        <input
                            type="number"
                            value={useRoundedNumber(quitarCeros(Number(paymentValue)))}
                            onChange={(e) => setPaymentValue(e.target.value)}
                        />
                    </Item> */}
                </Group>
            </Row>
            <Row margin='bottom'>
                <Group className='option1'>
                    <span><span>Delivery:</span> {useFormatPrice(DeliveryRef.value)}</span>
                    <span><span>Cambio:</span> {useFormatPrice(ChangeRef)}</span>
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

    flex-grow: 1;
    gap: 0.6em;
    span{
        display: flex;
        justify-content: space-between;
    }
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
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    justify-content: space-between;
                    gap: 2em;
                `
            case 'paymentMethod':
                return `
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;

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
            case 'tax-discount':
                return `
                display: grid;
                grid-template-columns: 1fr 1fr;
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
    align-items: center;
    
    label{
        font-size: 11px;
        height: 11px;
        box-sizing: border-box;
        margin: 0;
        padding: 2px 0.6em; 
        position: absolute;
        top: -8px;
        left: 0;
        display: flex;
        align-items: center;
        background-color: var(--color3);
        color: #5c5c5c;
        font-weight: bold;
        border-radius: 3px;
    }
    input{
        border-radius: 6px;
        outline: none;
        border: 1px solid rgba(0, 0, 0, 0.100);
        padding: 0em 0.4em;
        height: 1.8em;
        font-size: 16px;
        line-height: 14px;
        width: 100%;
        justify-self: flex-end;
        color: var(--Gray10);
        text-align: right;
        &:focus{
            text-align: left;
        }
        ::-webkit-outer-spin-button,
        ::-webkit-inner-spin-button {
            -webkit-appearance: none;
        margin: 0;
        -moz-appearance: textfield;
}
        :read-only{
            text-align: right;
        }
    
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
    padding: 0em 0.5em 0.3em;
    //border: 1px solid #0000003d;
    color: #292929;
    background-color: var(--icolor4);
    border-radius: 4px;
    margin: 0.4em 0;

`