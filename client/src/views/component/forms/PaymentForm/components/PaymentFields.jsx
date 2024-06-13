import React, { useState } from 'react'
import * as antd from 'antd'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { clearMethodErrors, selectAccountsReceivablePayment, setMethodError, updatePaymentMethod } from '../../../../../features/accountsReceivable/accountsReceivablePaymentSlice'
import { paymentDescriptions } from '../../../../../constants/paymentDescriptions'
const { Form, Input, Checkbox } = antd
export const PaymentFields = () => {
    const {
        methodErrors: errors,
        paymentDetails
    } = useSelector(selectAccountsReceivablePayment);
    const paymentMethods = paymentDetails.paymentMethods || [];
    const dispatch = useDispatch();
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
            } else if (key === 'reference' && method !== 'cash' && (!value || value.trim() === '')) {
                error = 'La referencia es obligatoria';
            }
            // Extra validation: if method is not 'cash' and value is provided but reference is missing, set error
            const methodData = paymentMethods.find(m => m.method === method);
            if (method !== 'cash' && status && methodData.value > 0 && (!methodData.reference || methodData.reference.trim() === '')) {
                setErrors(method, 'reference', 'La referencia es obligatoria');
            } else {
                clearErrors(method);
            }
        }

        setErrors(method, key, error);

        return error;
    };
    const handleInputChange = (method, key, value) => {
        dispatch(updatePaymentMethod({ method, key, value }));
        const updatedMethods = paymentMethods.map(pm =>
            pm.method === method ? { ...pm, [key]: value } : pm
        );

        const status = updatedMethods.find(m => m.method === method)?.status;

        if (status) {
            validateField(method, key, value, status);
        } else {
            // Limpiar los errores y valores si el método está desactivado
            clearErrors(method);
            if (method === 'cash' ) {
                dispatch(updatePaymentMethod({ method, key: 'value', value: 0 }));
            } else if (method !== 'cash') {
                dispatch(updatePaymentMethod({ method, key: 'reference', value: null }));
                dispatch(updatePaymentMethod({ method, key: 'value', value: 0 }));
            }
        }
    };


    return (
        <div>
            {paymentMethods.map(paymentMethod => (
                <PaymentRefGroup key={paymentMethod.method}>
                    <Form.Item
                        name={paymentMethod.method}
                        validateStatus={errors[`${paymentMethod.method}_value`] ? 'error' : ''}
                        help={errors[`${paymentMethod.method}_value`]}
                        label={<Checkbox
                            checked={paymentMethod.status}
                            onChange={(e) => handleInputChange(paymentMethod.method, 'status', e.target.checked)}
                        >
                            {paymentDescriptions[paymentMethod.method]}
                        </Checkbox>}
                    >
                        <Input
                            type="number"
                            placeholder="$$$"
                            value={paymentMethod.value}
                            disabled={!paymentMethod.status}
                            onChange={(e) => handleInputChange(paymentMethod.method, 'value', parseFloat(e.target.value || 0))}
                        />
                    </Form.Item>
                    {paymentMethod.method !== 'cash' && (
                        <Form.Item
                            name={`${paymentMethod.method}Reference`}
                            label="Referencia"
                            validateStatus={errors[`${paymentMethod.method}_reference`] ? 'error' : ''}
                            help={errors[`${paymentMethod.method}_reference`]}

                        >
                            <Input
                                placeholder="Referencia"
                                value={paymentMethod.reference}
                                disabled={!paymentMethod.status}
                                onChange={(e) => handleInputChange(paymentMethod.method, 'reference', e.target.value)}
                            />
                        </Form.Item>
                    )}
                </PaymentRefGroup>
            ))}
        </div>
    )
}

const PaymentRefGroup = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4em;
`;