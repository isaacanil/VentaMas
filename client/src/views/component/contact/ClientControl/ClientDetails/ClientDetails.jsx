import React, { Fragment, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
// import Switch from '@mui/material/Switch'
import { addSourceOfPurchase } from '../../../../../features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'
import { monetarySymbols } from '../../../../../constants/monetarySymbols'
import { sourceOfSaleList } from '../../../../../constants/sourceOfSaleList'
import { selectClient, setClient } from '../../../../../features/clientCart/clientCartSlice'
import { updateObject } from '../../../../../utils/object/updateObject'
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4'
import { AnimatePresence, motion } from 'framer-motion'
import { Switch } from '../../../../templates/system/Switch/Switch'
import * as antd from 'antd'
const { Select } = antd
const { Option } = Select
export const ClientDetails = ({ mode }) => {
    const dispatch = useDispatch()
    const deliveryStatusInput = useRef(null)
    const [deliveryData, setDeliveryData] = useState({ value: "", status: false })
    const client = useSelector(selectClient)
    const isMenuVisible = ((client?.name && (client?.name !== 'Generic Client')) || mode)

    const updateClient = (e) => {
        dispatch(setClient(updateObject(client, e)))
    }

    const handleSetSourceOfPurchase = (value) => {
        dispatch(addSourceOfPurchase(value))
    }
    const containerVariants = {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                duration: 0.5
            }
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: { duration: 0.5 }
        }
    };
    return (
        isMenuVisible &&
        <Container>
            <AnimatePresence>
                {isMenuVisible && (
                    <AnimatedWrapper
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                    >
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
                        <AddressWrapper>
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
                        </AddressWrapper>
                    </AnimatedWrapper>
                )}
            </AnimatePresence>
            {/* <Row>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6em'
                    }}
                >
                    <Switch
                        size='small'
                        checked={client?.delivery?.status ? true : false}
                        name='delivery.status'
                        onChange={(e) => updateClient(e)}
                    />
                    <InputV4
                        label='Delivery'
                        labelVariant='primary'
                        size='small'
                        type="number"
                        name='delivery.value'
                        value={client?.delivery?.value || ''}
                        disabled={!client?.delivery?.status}
                        ref={deliveryStatusInput}
                        focusWhen={client?.delivery?.status}
                        onChange={(e) => updateClient(e)}
                    />
                </div>
                <Select
                    name=""
                    id=""
                    style={{
                        width: '160px',
                    }}
                    defaultValue={sourceOfSaleList[0].serviceName}
                    onChange={(e) => handleSetSourceOfPurchase(e.target.value)}>
                    {
                        sourceOfSaleList.map((item, index) => (
                            <Option value={item.serviceName} key={index} >{item.serviceName}</Option>
                        ))
                    }
                </Select>

            </Row> */}
        </Container>
    )
}


const Container = styled.div`
   display: grid;
   gap: 0.6em;
   padding: 0.2em 0.4em 0em;
   border-bottom-left-radius: 6px;
   border-bottom-right-radius: 6px;
`
const AnimatedWrapper = styled(motion.div)`
 display: grid;
   gap: 0.6em;
    
`
const AddressWrapper = styled.div`
display: grid;
gap: 0.6em;
`
const Row = styled.div`
display: flex;
gap: 1em;
width: 100%;
`
const Group = styled.div`
display: flex;
gap: 1em;
align-items: center;
    ${props => {
        switch (props.space) {
            case 'small':
                return `
                gap: 0.6em; 
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
