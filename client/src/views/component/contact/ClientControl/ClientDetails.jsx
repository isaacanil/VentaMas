import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'
import { Input } from '../../../templates/system/Inputs/InputV2'
import { handleClient, addDelivery, SelectClient, setChange, totalPurchase, addSourceOfPurchase, SelectDelivery } from '../../../../features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'
import { nanoid } from 'nanoid'
import { monetarySymbols } from '../../../../constants/monetarySymbols'
import { quitarCeros } from '../../../../hooks/quitarCeros'
export const ClientDetails = ({ createClientMode, clientSelected, client, setClient }) => {
    const dispatch = useDispatch()
    const deliveryRef = useSelector(SelectDelivery)
    const deliveryStatusInput = useRef(null)
    const defaultData = {
        cash: 0.00,
        status: false
    }
    const [sourceOfSaleList, setSourceOfSaleList] = useState([
        {
            serviceName: 'Presencial',
        },
        {
            serviceName: 'WhatsApp',
        },
        {
            serviceName: 'Teléfono',
        },
        {
            serviceName: 'Teléfono',
        }
    ])
    const [deliveryData, setDeliveryData] = useState({
        cash: defaultData.cash,
        status: defaultData.cash
    })
    const focusOnDeliveryInput = () => {
        clientSelected ? (
            deliveryStatusInput.current.focus()
        ) : null
    }
    const updateClient = (e) => {
        setClient({
            ...client,
            [e.target.name]: e.target.value
        })
    }
    useEffect(() => {
        deliveryData.status ? focusOnDeliveryInput() : null
        setClient({
            ...client,
            delivery: deliveryData
        })
        dispatch(addDelivery(deliveryData))
        dispatch(totalPurchase())
        dispatch(setChange())
    }, [deliveryData])
    const handleSetSourceOfPurchase = (value) => {
        dispatch(addSourceOfPurchase(value))
    }
    return (
        <Container>
            <Row>
                <Group>
                    <Item>
                        <label htmlFor="">Teléfono :</label>
                        <input
                            type="text"
                            name='tel'
                            value={client.tel}
                            onChange={e => updateClient(e)}
                        />
                    </Item>
                    <Item>
                        <label htmlFor="">RNC/Cédula :</label>
                        <input
                            type="text"
                            name='personalID'
                            value={client.personalID}
                            onChange={e => updateClient(e)}
                        />
                    </Item>
                </Group>
            </Row>
            <Row>
                <Item>
                    <label htmlFor="">Dirección :</label>
                    <input
                        type="text"
                        name="address"
                        value={client.address}
                        onChange={(e) => updateClient(e)
                        }
                    />
                </Item>
            </Row>
            <Row>
                <Group>
                    <Switch
                        checked={deliveryRef.status ? true : false}
                        name='delivery'
                        onChange={(e) => {
                            if (e.target.checked) {
                                setDeliveryData({
                                    ...deliveryData,
                                    status: e.target.checked,
                                })
                            }
                            if (e.target.checked === false) {
                                setDeliveryData({
                                    ...deliveryData,
                                    status: e.target.checked,
                                    cash: ''
                                })
                            }

                        }} />
                    <Item>
                        <label htmlFor="">Delivery: {monetarySymbols.dollarSign}</label>
                        <input
                            type="number"
                            onClick={(e) => {
                                setDeliveryData({
                                    ...deliveryData,
                                    status: true
                                })
                                updateClient(e)
                            }
                            }
                            value={quitarCeros(Number(deliveryRef.value))}
                            name='delivery'
                            ref={deliveryStatusInput}
                            onChange={(e) => {
                                setDeliveryData({
                                    ...deliveryData,
                                    cash: Number(e.target.value)
                                })
                                updateClient(e)
                            }} />
                    </Item>
                    <select name="" id="" onChange={(e) => handleSetSourceOfPurchase(e.target.value)}>
                        {
                            sourceOfSaleList.map((item, index) => (
                                <option value={item.serviceName} key={index} >{item.serviceName}</option>
                            ))
                        }
                    </select>
                </Group>

            </Row>
        </Container>
    )
}


const Container = styled.div`
   display: grid;
   gap: 0.4em;
   padding: 0.6em 0.4em 0.2em;
   border-bottom-left-radius: 6px;
   border-bottom-right-radius: 6px;
`
const Group = styled.div`
display: flex;
gap: 1em;
align-items: center;
`
const Row = styled.div`

`
const Item = styled.div`
flex-shrink: 1;
height: 2em;
display: flex;
align-items: center;
position: relative;
padding: 0;
label{
    height: 12px;
    box-sizing: border-box;
    margin: 0;
    padding: 0 0.4em;
    position: absolute;
    top: -4px;
    display: flex;
    align-items: center;
    background-color: white;
    color: #353535;
    font-weight: 600;
    border-radius: 3px;
    font-size: 11px;
}
input{
    border-radius: 6px;
    outline: none;
    border: 1px solid rgba(0, 0, 0, 0.100);
    padding: 0.2em 0.4em;
    height: 2em;
    font-size: 14px;
    color: var(--Black4);
    width: 100%;
    }
`