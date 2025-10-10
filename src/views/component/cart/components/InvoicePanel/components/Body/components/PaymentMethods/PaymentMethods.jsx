import * as antd from 'antd'
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { icons } from '../../../../../../../../../constants/icons/icons'
import { selectCart, setPaymentMethod, recalcTotals, SelectCxcAutoRemovalNotification, clearCxcAutoRemovalNotification } from '../../../../../../../../../features/cart/cartSlice'

const { Radio, Input, Form, Checkbox, InputNumber, message, notification } = antd

export const PaymentMethods = () => {
    const dispatch = useDispatch()
    const cashInputRef = useRef(null)
    const cart = useSelector(selectCart)
    const showCxcAutoRemovalNotification = useSelector(SelectCxcAutoRemovalNotification)
    const cartData = cart.data;
    const paymentMethods = cartData.paymentMethod;
    const totalPurchase = cartData.totalPurchase.value;
    
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
        },
        creditNote: {
            label: 'Nota de Crédito',
            icon: icons.finances.money
        }
    }
    
    useEffect(() => {
        if (cashInputRef.current && document.activeElement !== cashInputRef.current && paymentMethods.some(method => method.method === 'cash' && method.status)) {
            cashInputRef.current.focus();
            cashInputRef.current.select();
        }
    }, [])
    
    useEffect(() => {
        const totalPaymentValue = paymentMethods.reduce((total, method) => {
            return method.status ? total + (Number(method.value) || 0) : total;
        }, 0);

        if (totalPaymentValue === 0 && totalPurchase > 0) {
            const cashMethod = paymentMethods.find(method => method.method === 'cash' && method.status);
            if (cashMethod && cashMethod.value === 0) {
                dispatch(setPaymentMethod({ ...cashMethod, value: totalPurchase }));
            }
        }
    }, [totalPurchase]);
    useEffect(() => {
        if (cartData.isAddedToReceivables) {
            const anyEnabled = paymentMethods.some(m => m.status);
            if (!anyEnabled) {
                const defaultMethod = paymentMethods.find(m => m.method === 'cash') || paymentMethods[0];
                if (defaultMethod) {
                    dispatch(setPaymentMethod({ ...defaultMethod, status: true, value: 0 }));
                    dispatch(recalcTotals());
                }
            }
        }
    }, [cartData.isAddedToReceivables, paymentMethods, dispatch]);    
    const handleStatusChange = (method, status) => {
        let newValue = method.value;
        
        if (status && (!newValue || newValue === 0)) {
            const currentTotal = paymentMethods.reduce((total, m) => {
                if (m.status && m.method !== method.method) {
                    return total + (Number(m.value) || 0);
                }
                return total;
            }, 0);
            
            const remaining = totalPurchase - currentTotal;
            newValue = remaining > 0 ? remaining : 0;
        }
        
        const isAddedToReceivables = cartData.isAddedToReceivables;
        if (!status && isAddedToReceivables) {
            const enabledCount = paymentMethods.filter(m => m.status).length;
            if (enabledCount === 1) {
                message.warning('Debe seleccionar al menos un método de pago');
                return;
            }
        }
       
        dispatch(setPaymentMethod({ ...method, status, value: status ? newValue : 0 }));
        dispatch(recalcTotals());
    };    const handleValueChange = (method, newValue) => {
        // Validar que el valor no sea negativo
        const validValue = Math.max(0, Number(newValue) || 0);
        
        // Si el usuario intentó ingresar un valor negativo, mostrar advertencia
        if (newValue < 0) {
            message.warning('No se permiten montos negativos en los métodos de pago');
        }
        
        dispatch(setPaymentMethod({ ...method, value: validValue }));
        dispatch(recalcTotals());
    };

    const handleReferenceChange = (method, newReference) => {
        dispatch(setPaymentMethod({ ...method, reference: newReference }));
    };

    // Manejar notificación de auto-removal de CxC
    useEffect(() => {
        if (showCxcAutoRemovalNotification) {
            notification.success({
                message: 'Cuenta por Cobrar Actualizada',
                description: 'La venta se removió automáticamente de Cuentas por Cobrar porque el pago cubre el total de la compra.',
                duration: 6,
                placement: 'topRight'
            });
            
            dispatch(clearCxcAutoRemovalNotification());
        }
    }, [showCxcAutoRemovalNotification, dispatch]);

    return (
        <Container>
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
                                >                                        {method.method === 'cash' ? (
                                        <InputNumber
                                            addonBefore={paymentInfo[method.method].icon}
                                            placeholder='$$$'
                                            value={method.value}
                                            disabled={!method.status}
                                            onChange={(e) => handleValueChange(method, e)}
                                            ref={cashInputRef}
                                            min={0}
                                            precision={2}
                                            step={0.01}
                                            style={{ width: '100%' }}
                                        />
                                    ) : method.method === 'creditNote' ? (
                                        <InputNumber
                                            addonBefore={paymentInfo[method.method].icon}
                                            placeholder='Gestionado por selector'
                                            value={method.value}
                                            disabled={true}
                                            min={0}
                                            precision={2}
                                            step={0.01}
                                            style={{ width: '100%' }}
                                        />
                                    ) : (
                                        <InputNumber
                                            addonBefore={paymentInfo[method.method].icon}
                                            placeholder='$$$'
                                            value={method.value}
                                            disabled={!method.status}
                                            onChange={(e) => handleValueChange(method, e)}
                                            min={0}
                                            precision={2}
                                            step={0.01}
                                            style={{ width: '100%' }}
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

