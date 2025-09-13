import React, { useState, useEffect, useRef } from 'react'
import * as antd from 'antd'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { clearMethodErrors, selectAccountsReceivablePayment, setMethodError, updatePaymentMethod } from '../../../../../features/accountsReceivable/accountsReceivablePaymentSlice'
import { formatNumber } from '../../../../../utils/formatNumber'
import { paymentDescriptions } from '../../../../../constants/paymentDescriptions'
import { icons } from '../../../../../constants/icons/icons'
const { Form, Input, Checkbox, InputNumber, Switch, message } = antd
export const PaymentFields = () => {
    const cashInputRef = useRef(null);
    const {
        methodErrors: errors,
        paymentDetails
    } = useSelector(selectAccountsReceivablePayment);
    const paymentMethods = paymentDetails.paymentMethods || [];
    // Filtrar creditNote de la interfaz (se maneja por separado con CreditSelector)
    const visiblePaymentMethods = paymentMethods.filter(method => method.method !== 'creditNote');
    const dispatch = useDispatch();

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
    };        // Auto-focus en efectivo y auto-rellenar al abrir modal
    useEffect(() => {
        if (cashInputRef.current && document.activeElement !== cashInputRef.current) {
            const cashMethod = visiblePaymentMethods.find(method => method.method === 'cash' && method.status);
            if (cashMethod) {
                cashInputRef.current.focus();
                cashInputRef.current.select();
            }
        }
    }, []);

    // Auto-rellenar efectivo si no hay ningún método de pago seleccionado
    useEffect(() => {
        const totalPaymentValue = visiblePaymentMethods.reduce((total, method) => {
            return method.status ? total + (Number(method.value) || 0) : total;
        }, 0);

        const totalAmount = paymentDetails.totalAmount || 0;

        // Solo auto-activar si no hay ningún método activo y hay un monto a pagar
        if (totalPaymentValue === 0 && totalAmount > 0) {
            const cashMethod = visiblePaymentMethods.find(method => method.method === 'cash');
            if (cashMethod && !cashMethod.status) {
                // Activar efectivo automáticamente y asignar el monto total
                handleStatusChange(cashMethod, true, totalAmount);
            } else if (cashMethod && cashMethod.status && cashMethod.value === 0) {
                // Si ya está activo pero sin valor, asignar el monto total
                handleValueChange(cashMethod, totalAmount);
            }
        }
    }, [paymentDetails.totalAmount, visiblePaymentMethods.length]); // Usar visiblePaymentMethods

    const setErrors = (method, key, error) => {
        dispatch(setMethodError({ method, key, error }));
    };

    const clearErrors = (method) => {
        dispatch(clearMethodErrors({ method }));
    };


    const validateField = (method, key, value, status) => {
        let error = null;

        if (status) {
            if (key === 'value' && value <= 0) {
                error = 'El valor debe ser mayor a cero';
            } else if (key === 'reference' && !(method === 'cash' || method === 'creditNote') && (!value || value.trim() === '')) {
                error = 'La referencia es obligatoria';
            }
        }

        setErrors(method, key, error);
        return error;
    };

    const handleStatusChange = (method, status, autoValue = null) => {
        let newValue = method.value;
        
        if (status && (!newValue || newValue === 0 || autoValue)) {
            const currentTotal = visiblePaymentMethods.reduce((total, m) => {
                if (m.status && m.method !== method.method) {
                    return total + (Number(m.value) || 0);
                }
                return total;
            }, 0);
            
            const remaining = (paymentDetails.totalAmount || 0) - currentTotal;
            newValue = autoValue || (remaining > 0 ? remaining : 0);
        }
        
        // Validar que al menos un método esté seleccionado
        if (!status) {
            const enabledCount = visiblePaymentMethods.filter(m => m.status).length;
            if (enabledCount === 1) {
                message.warning('Debe seleccionar al menos un método de pago');
                return;
            }
        }

        dispatch(updatePaymentMethod({ method: method.method, key: 'status', value: status }));
        dispatch(updatePaymentMethod({ method: method.method, key: 'value', value: status ? newValue : 0 }));
        
        if (status) {
            validateField(method.method, 'value', newValue, status);
        } else {
            clearErrors(method.method);
            if (!(method.method === 'cash' || method.method === 'creditNote')) {
                dispatch(updatePaymentMethod({ method: method.method, key: 'reference', value: null }));
            }
        }
    };

    const handleValueChange = (method, newValue) => {
        // Validar que el valor no sea negativo
        const validValue = Math.max(0, Number(newValue) || 0);
        
        // Si el usuario intentó ingresar un valor negativo, mostrar advertencia
        if (newValue < 0) {
            message.warning('No se permiten montos negativos en los métodos de pago');
        }
        
        dispatch(updatePaymentMethod({ method: method.method, key: 'value', value: validValue }));
        
        if (method.status) {
            validateField(method.method, 'value', validValue, method.status);
        }
    };

    const handleReferenceChange = (method, newReference) => {
        dispatch(updatePaymentMethod({ method: method.method, key: 'reference', value: newReference }));
        
        if (method.status) {
            validateField(method.method, 'reference', newReference, method.status);
        }
    };

    const handleInputChange = (method, key, value) => {
        if (key === 'status') {
            handleStatusChange(visiblePaymentMethods.find(m => m.method === method), value);
        } else if (key === 'value') {
            handleValueChange(visiblePaymentMethods.find(m => m.method === method), value);
        } else if (key === 'reference') {
            handleReferenceChange(visiblePaymentMethods.find(m => m.method === method), value);
        }
    };


    return (
        <Container>
            <Form layout='vertical'>
                <Items>
                    {visiblePaymentMethods.map((paymentMethod) => (
                        <Row key={paymentMethod.method}>
                            <SwitchContainer>
                                <Switch
                                    checked={paymentMethod.status}
                                    onChange={(checked) => handleInputChange(paymentMethod.method, 'status', checked)}
                                    
                                />
                            </SwitchContainer>
                            <FormItem
                                label={paymentInfo[paymentMethod.method]?.label || paymentDescriptions[paymentMethod.method]}
                                validateStatus={errors[`${paymentMethod.method}_value`] ? 'error' : ''}
                                help={errors[`${paymentMethod.method}_value`]}
                            >
                                {paymentMethod.method === 'cash' ? (
                                    <InputNumber
                                        addonBefore={paymentInfo[paymentMethod.method]?.icon}
                                        placeholder='$$$'
                                        value={paymentMethod.value}
                                        disabled={!paymentMethod.status}
                                        onChange={(value) => handleInputChange(paymentMethod.method, 'value', value)}
                                        ref={cashInputRef}
                                        min={0}
                                        precision={2}
                                        step={0.01}
                                        formatter={formatNumber}
                                        parser={value => value.replace(/\,/g, '')}
                                        style={{ width: '100%' }}
                                    />
                                ) : (
                                    <InputNumber
                                        addonBefore={paymentInfo[paymentMethod.method]?.icon}
                                        placeholder='$$$'
                                        value={paymentMethod.value}
                                        disabled={!paymentMethod.status}
                                        onChange={(value) => handleInputChange(paymentMethod.method, 'value', value)}
                                        min={0}
                                        precision={2}
                                        step={0.01}
                                        formatter={formatNumber}
                                        parser={value => value.replace(/\,/g, '')}
                                        style={{ width: '100%' }}
                                    />
                                )}
                            </FormItem>
                            {(paymentMethod.reference !== undefined) && (
                                <FormItem
                                    label='Referencia'
                                    validateStatus={errors[`${paymentMethod.method}_reference`] ? 'error' : ''}
                                    help={errors[`${paymentMethod.method}_reference`]}
                                >
                                <Input
                                    placeholder='Referencia'
                                    value={paymentMethod.reference || ''}
                                    disabled={!paymentMethod.status}
                                    onChange={(e) => handleInputChange(paymentMethod.method, 'reference', e.target.value)}
                                   
                                />
                                </FormItem>
                            )}
                        </Row>
                    ))}
                </Items>
            </Form>
        </Container>
    )
}

const Container = styled.div`
    padding: 0em 0em;
`;

const SwitchContainer = styled.div`
    height: 56px;
    display: flex;
    align-items: end;
    justify-content: center;
    padding: 0 0.5em;
`;

const Row = styled.div`
    display: grid;  
    grid-template-columns: min-content 1fr minmax(150px, 0.9fr);
    gap: 0.6em;
`;

const Items = styled.div`
    display: grid;
    gap: 1em;
`;

const FormItem = styled(Form.Item)`
    .ant-form-item-label {
        padding: 0;
    }
    margin: 0;
    svg {
        font-size: 1.2em;
        color: #414141;
    }
`;