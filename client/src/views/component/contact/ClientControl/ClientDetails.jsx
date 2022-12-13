import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'
import { Input } from '../../../templates/system/Inputs/InputV2'
import { addDelivery, SelectClient, setChange, totalPurchase } from '../../../../features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'
export const ClientDetails = ({ client }) => {
    const dispatch = useDispatch()
    const ClientSelected = useSelector(SelectClient)
    const [deliveryData, setDeliveryData] = useState({
        cash: 0.00,
        status: false
    })
    const deliveryStatusInput = useRef(null)
    const focusOnDeliveryInput = () => {
        ClientSelected ? (
            deliveryStatusInput.current.focus()
        ) : null
    }
    useEffect(() =>{
        deliveryData.status ? focusOnDeliveryInput() : null
        dispatch(
            addDelivery(deliveryData)
        )
        dispatch(
            totalPurchase()
        )
        dispatch(
            setChange()
        )
    }, [deliveryData])
    //console.log(deliveryData)
    const [clientData, setClientData] = useState({
        name: "",
        tel: "",
        address: "",
        personalID: "",
        delivery: "",
    })
    useEffect(() => {

        setClientData({
            name: client ? client.name : null,
            tel: client ? client.tel : null,
            address: client ? client.address : null,
            personalID: client ? client.personalID : null,
            delivery: client ? client.delivery : null,
        })
    }, [client])

    return (
        <Container>
            <Row>
                <Group>
                    <Item>
                        <label htmlFor="">Teléfono :</label>
                        <input
                            type="text"
                            value={clientData ? (clientData.tel !== "" ? clientData.tel : "") : undefined}
                            onChange={(e) => setClientData({
                                ...clientData,
                                tel: [e.target.value]
                            })}
                        />
                    </Item>
                    <Item>
                        <label htmlFor="">RNC/Cédula :</label>
                        <input
                            type="text"
                            value={clientData ? (clientData.personalID !== "" ? (clientData.personalID) : "") : undefined}
                            onChange={(e) => setClientData({
                                ...clientData,
                                personalID: [e.target.value]
                            })}
                        />
                    </Item>
                </Group>
            </Row>
            <Row>
                <Item>
                    <label htmlFor="">Dirección :</label>
                    <input
                        type="text"
                        value={clientData ? (clientData.address !== '' ? clientData.address : "") : undefined}
                        onChange={(e) =>
                            setClientData({
                                ...clientData,
                                address: e.target.value
                            })
                        }
                    />
                </Item>
                <Group>
                    <Switch
                        checked={deliveryData ? deliveryData.status : undefined}
                        onChange={(e) => setDeliveryData({
                            ...deliveryData,
                            status: e.target.checked
                        })} />
                    <Item>
                        <label htmlFor="">Delivery</label>
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
   gap: 0.2em;
   padding: 0.6em 0.4em;
`
const Group = styled.div`
display: flex;
gap: 1em;
align-items: center;
`
const Row = styled.div``

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
        border: none;
        padding: 0.2em 0.4em;
        font-size: 14px;
}
`