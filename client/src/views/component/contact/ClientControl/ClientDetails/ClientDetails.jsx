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
import { Button } from '../../../../templates/system/Button/Button'
import { fbGetPendingBalance } from '../../../../../firebase/accountsReceivable/fbGetPendingBalance'
import { selectUser } from '../../../../../features/auth/userSlice'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { setAccountPayment } from '../../../../../features/accountsReceivable/accountsReceivablePaymentSlice'
const { Select } = antd
const { Option } = Select
export const ClientDetails = ({ mode }) => {
    const dispatch = useDispatch()
    const deliveryStatusInput = useRef(null)
    const [deliveryData, setDeliveryData] = useState({ value: "", status: false })
    const client = useSelector(selectClient)
    const isMenuVisible = ((client?.name && (client?.name !== 'Generic Client')) || mode)
    const [pendingBalance, setPendingBalance] = useState(0)
    const user = useSelector(selectUser)
    const businessID = user.businessID


    useEffect(() => {
        const fetchPendingBance = async () => {
            if (!client || !businessID) return
            const unsubscribe = fbGetPendingBalance(businessID, client.id, setPendingBalance)
            return () => {
                unsubscribe()
            }
       
        }
        fetchPendingBance()
    }, [client])

    const handlePayment = () => {
        dispatch(setAccountPayment({
            isOpen: true,
            paymentDetails: {
                paymentScope: 'balance',
                paymentOption: 'installment',
                totalAmount: pendingBalance,
                clientId: client.id,

            }
        }))
    }

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
                                <div>
                                 {`#${client?.numberId}`}
                                </div>
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
                                <div
                                style={{
                                    display: 'flex',
                                    gap: '0.2em',
                                    alignItems: 'center'
                                }}
                                >
                                <InputV4
                                    type="text"
                                    label='Bal general'
                                    size='small'
                                    labelVariant='primary'
                                    value={useFormatPrice(pendingBalance)}
                                    autoComplete='off'
                                />
                                <Button
                                    title="Pagar"
                                    type="text"
                                    color="primary"
                                    onClick={handlePayment}
                                    disabled={pendingBalance === 0}
                                />
                                </div>
                            </Group>
                        </Row>
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
                                    label='Teléfono 2'
                                    size='small'
                                    labelVariant='primary'
                                    value={client?.tel2}
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
gap: 0.6em;
width: 100%;
`
const Group = styled.div`
display: flex;
gap: 0.8em;
align-items: center;
                
    `
