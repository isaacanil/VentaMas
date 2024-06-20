import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import * as antd from 'antd'
import { icons } from '../../../../../../../../../constants/icons/icons'
import { useDispatch, useSelector } from 'react-redux'
import { selectCart, setPaymentMethod } from '../../../../../../../../../features/cart/cartSlice'
const { Radio, Input, Form, Checkbox, InputNumber } = antd

export const PaymentMethods = () => {
    const dispatch = useDispatch()
    const cashInputRef = useRef(null)
    const cart = useSelector(selectCart)
    const cartData = cart.data;
    const paymentMethods = cartData.paymentMethod;
    const paymentInfo = {
        cash: {
            label: 'Efectivo',
            icon: icons.finances.money
        },
        card: {
            label: 'Tarjeta',
            icon: icons.finances.card
        },
        transfer: {
            label: 'Transferencia',
            icon: icons.finances.transfer
        }
    }
    useEffect(() => {
        if (cashInputRef.current && document.activeElement !== cashInputRef.current && paymentMethods.some(method => method.method === 'cash' && method.status)) {
            cashInputRef.current.focus();
            cashInputRef.current.select();
        }
    }, [])
    const handleStatusChange = (method, status) => {
        dispatch(setPaymentMethod({ ...method, status }));
    };

    const handleValueChange = (method, newValue) => {
        dispatch(setPaymentMethod({ ...method, value: newValue }));
    };

    const handleReferenceChange = (method, newReference) => {
        dispatch(setPaymentMethod({ ...method, reference: newReference }));
    };

    return (
        <Container>
            <Form
                layout='vertical'
            >
                <Items>
                    {
                        paymentMethods.map((method) => {
                            return (
                                <Row
                                    key={method.method}
                                >
                                    <Checkbox
                                        checked={method.status}
                                        onChange={(e) => handleStatusChange(method, e.target.checked)}
                                    />
                                    <FormItem
                                        placeholder='Método de pago'
                                        label={paymentInfo[method.method].label}
                                    >
                                        {method.method === 'cash' ? (
                                            <InputNumber
                                                addonBefore={paymentInfo[method.method].icon}
                                                placeholder='$$$'
                                                value={method.value}
                                                disabled={!method.status}
                                                onChange={(e) => handleValueChange(method, e)}
                                                ref={cashInputRef} // Aplicar la referencia aquí
                                            />
                                        ) : (
                                            <InputNumber
                                                addonBefore={paymentInfo[method.method].icon}
                                                placeholder='$$$'
                                                value={method.value}
                                                disabled={!method.status}
                                                onChange={(e) => handleValueChange(method, e)}
                                            />
                                        )}
                                    </FormItem>
                                    {
                                        (method.reference !== undefined) && (
                                            <FormItem
                                                placeholder='Método de pago'
                                                label='Referencia'
                                            >
                                                <Input
                                                    placeholder='Referencia'
                                                    disabled={!method.status}
                                                    onChange={(e) => handleReferenceChange(method, e.target.value)}
                                                />
                                            </FormItem>
                                        )
                                    }
                                </Row>
                            )
                        })
                    }
                </Items>
            </Form>
        </Container>
    )
}
const Container = styled.div`
    padding: 0em 0em;
   
`
const Row = styled.div`
    display: grid;  
    grid-template-columns: min-content 0.8fr 1fr;
    gap: 0.6em;
`
const Items = styled.div`

    display: grid;
    gap: 1em;
`
const FormItem = styled(Form.Item)`
            .ant-form-item-label {
                padding: 0;
            }
                margin: 0 ;
            svg{
                font-size: 1.2em;
                color: #414141;
            }
`

