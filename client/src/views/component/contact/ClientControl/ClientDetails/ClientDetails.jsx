import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Switch from '@mui/material/Switch'
import { setChange, totalPurchase, addSourceOfPurchase } from '../../../../../features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'
import { monetarySymbols } from '../../../../../constants/monetarySymbols'
import { sourceOfSaleList } from '../../../../../constants/sourceOfSaleList'
import { selectClient, setClient } from '../../../../../features/clientCart/clientCartSlice'
import { updateObject } from '../../../../../utils/object/updateObject'
import { InputV4 } from '../../../../templates/system/Inputs/InputV4'

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
                    <InputV4
                        size='small'
                        type="text"
                        name='tel'
                        label='Teléfono'
                        labelVariant='primary'
                        value={client.tel}
                        onChange={e => updateClient(e)}
                        autoComplete='off'
                    />


                    <InputV4
                        type="text"
                        name='personalID'
                        label='Cédula/RNC'
                        size='small'
                        labelVariant='primary'
                        value={client.personalID}
                        onChange={e => updateClient(e)}
                        autoComplete='off'
                    />

                </Group>
            </Row>
            <Row>

                <InputV4
                    type="text"
                    name="address"
                    label='Dirección'
                    labelVariant='primary'
                    size='small'
                    value={client.address}
                    onChange={(e) => updateClient(e)}
                    autoComplete="off"
                />

            </Row>
            <Row>
                <Group>
                    <Group space={'small'}>
                        <Switch
                            checked={client?.delivery?.status ? true : false}
                            name='delivery.status'
                            onChange={(e) => updateClient(e)} />

                        <InputV4
                            label='Delivery'
                            labelVariant='primary'
                            size='small'
                            type="number"
                            name='delivery.value'
                            value={client?.delivery?.value}
                            ref={deliveryStatusInput}
                            onChange={(e) => updateClient(e)}
                        />
                    </Group>


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
   gap: 0.6em;
   padding: 0.6em 0.4em 0em;
   border-bottom-left-radius: 6px;
   border-bottom-right-radius: 6px;
`
const Group = styled.div`
display: flex;
gap: 1em;
align-items: center;
    ${props => {
        switch (props.space) {
            case 'small':
                return `
                gap: 0.2em; 
                `
            case 'medium':
                return `
                gap: 0.8em;
                `
            case 'large':
                return `
                gap: 1em;
                `
            default:
                return `
                    gap: 1em;
                `
        }
    }
    }
                
    `
const Row = styled.div`

    `