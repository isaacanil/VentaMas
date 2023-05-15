import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'
import { setChange, totalPurchase, addSourceOfPurchase  } from '../../../../../features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'
import { monetarySymbols } from '../../../../../constants/monetarySymbols'
import { sourceOfSaleList } from '../../../../../constants/sourceOfSaleList'
import { selectClient, setClient } from '../../../../../features/clientCart/clientCartSlice'
import { updateObject } from '../../../../../utils/object/updateObject'

export const ClientDetails = () => {
    const dispatch = useDispatch()
    const deliveryStatusInput = useRef(null)
    const [deliveryData, setDeliveryData] = useState({ value: "", status: false })

    const client = useSelector(selectClient)

    const updateClient = (e) => {
        dispatch(setClient(updateObject(client, e)))
    }

    useEffect(() => {
       
        dispatch(totalPurchase())
        dispatch(setChange())
    }, [deliveryData])

    useEffect(() => {
        client?.delivery && dispatch(totalPurchase())
    }, [client])

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
                            autocomplete='off'
                        />
                    </Item>
                    <Item>
                        <label htmlFor="">RNC/Cédula :</label>
                        <input
                            type="text"
                            name='personalID'
                            value={client.personalID}
                            onChange={e => updateClient(e)}
                            autocomplete='off'
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
                        onChange={(e) => updateClient(e)}
                        autocomplete="off"
                    />
                </Item>
            </Row>
            <Row>
                <Group>
                    <Switch
                        checked={client?.delivery?.status ? true : false}
                        name='delivery.status'
                        onChange={(e) => updateClient(e)} />
                    <Item>
                        <label htmlFor="">Delivery: {monetarySymbols.dollarSign}</label>
                        <input
                            type="number"
                            name='delivery.value'
                            value={client?.delivery?.value}
                            ref={deliveryStatusInput}
                            onChange={(e) => updateClient(e)}
                        />
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
    color: var(--Gray5);
    width: 100%;
    }
`