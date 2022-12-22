import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'
import { Input } from '../../../templates/system/Inputs/InputV2'
import { addClient, addDelivery, SelectClient, setChange, totalPurchase } from '../../../../features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'
import { nanoid } from 'nanoid'
import { monetarySymbols } from '../../../../constants/monetarySymbols'
export const ClientDetails = ({ client }) => {
    const dispatch = useDispatch()
    const ClientSelected = useSelector(SelectClient)
    const deliveryStatusInput = useRef(null)
    const defaultData = {
        cash: 0.00,
        status: false
    }
    const [deliveryData, setDeliveryData] = useState({
        cash: defaultData.cash,
        status: defaultData.cash
    })
    const [shouldDispatch, setShouldDispatch] = useState(false);
    const [clientData, setClientData] = useState({
        name: "",
        tel: "",
        address: "",
        personalID: "",
        delivery: "",
    })
    const focusOnDeliveryInput = () => {
        ClientSelected ? (
            deliveryStatusInput.current.focus()
        ) : null
    }
    const updateClient = (e) => {
        setClientData({
            ...clientData,
            [e.target.name]: e.target.value
        })
        setShouldDispatch(true);
    }
    useEffect(() => {
        if (shouldDispatch) {
            dispatch(addClient(clientData));
            setShouldDispatch(false);
        }
    }, [clientData, shouldDispatch])

    const getClientProperty = (client, property, defaultValue = null) => (
        client ? client[property] : defaultValue
    )
    useEffect(() => {
        deliveryData.status ? focusOnDeliveryInput() : null
        dispatch(addDelivery(deliveryData))
        dispatch(totalPurchase())
        dispatch(setChange())
    }, [deliveryData])

    useEffect(() => {
        setClientData({
            ...client,
            name: getClientProperty(client, 'name'),
            tel: getClientProperty(client, 'tel'),
            address: getClientProperty(client, 'address'),
            personalID: getClientProperty(client, 'personalID'),

        })
    }, [client])
    console.log(clientData)
    return (
        <Container>
            <Row>
                <Group>
                    <Item>
                        <label htmlFor="">Teléfono :</label>
                        <input
                            type="text"
                            name='tel'
                            value={clientData ? (clientData.tel !== "" ? clientData.tel : "") : undefined}
                            onChange={(e) => {
                                updateClient(e)
                            }}
                        />
                    </Item>
                    <Item>
                        <label htmlFor="">RNC/Cédula :</label>
                        <input
                            type="text"
                            name='personalID'
                            value={clientData ? (clientData.personalID !== "" ? (clientData.personalID) : "") : undefined}
                            onChange={(e) => updateClient(e)}
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
                        value={clientData ? (clientData.address !== '' ? clientData.address : "") : undefined}
                        onChange={(e) => updateClient(e)
                        }
                    />
                </Item>
            </Row>
            <Row>
                <Group>
                    <Switch
                        checked={deliveryData ? deliveryData.status : undefined}
                        onChange={(e) => setDeliveryData({
                            ...deliveryData,
                            status: e.target.checked
                        })} />
                    <Item>
                        <label htmlFor="">Delivery: {monetarySymbols.dollarSign}</label>
                        <input
                            type="text"
                            onClick={(e) => setDeliveryData({
                                ...deliveryData,
                                status: true
                            })}
                            ref={deliveryStatusInput}
                            onChange={(e) => setDeliveryData({
                                ...deliveryData,
                                cash: Number(e.target.value)
                            })} />
                    </Item>

                    <select name="" id="">
                        <option value="">Presencial</option>
                        <option value="">WhatsApp</option>
                        <option value="">Teléfono</option>
                        <option value="">PedidosYa</option>
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