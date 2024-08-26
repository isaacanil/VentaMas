import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as antd from 'antd';
import { useFormatPrice } from '../../../../../../../../../hooks/useFormatPrice';
import { fbGetCreditLimit } from '../../../../../../../../../firebase/accountsReceivable/fbGetCreditLimit';
import { selectUser } from '../../../../../../../../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

const { Checkbox, Input, Form, InputNumber, Alert } = antd;

export const CreditLimits = ({ creditLimitForm, arBalance = 800, client }) => {
    const [invoiceStatus, setInvoiceStatus] = useState(creditLimitForm.getFieldValue(['invoice', 'status']));
    const [creditLimitStatus, setCreditLimitStatus] = useState(creditLimitForm.getFieldValue(['creditLimit', 'status']));
    const user = useSelector(selectUser);
    const clientId = client.id;
    
    const { data: creditLimitState, error, isLoading } = useQuery({
        queryKey: ['creditLimit', user, clientId],
        queryFn: () => fbGetCreditLimit({ user, clientId }),
        enabled: !!user && !!clientId,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (creditLimitState) {
            creditLimitForm.setFieldsValue(creditLimitState);
            setInvoiceStatus(creditLimitState?.invoice?.status);
            setCreditLimitStatus(creditLimitState?.creditLimit?.status);
        }
    }, [creditLimitState]);
    
    const handleFormChange = (changedValues, allValues) => {
        setInvoiceStatus(allValues.invoice?.status);
        setCreditLimitStatus(allValues.creditLimit?.status);
        clearValidationErrors(allValues);
    };
    const clearValidationErrors = (allValues) => {
        if (!allValues.invoice?.status) {
            creditLimitForm.setFieldsValue({
                invoice: { value: null }
            });
            creditLimitForm.setFields([
                {
                    name: ['invoice', 'value'],
                    errors: [],
                },
            ]);
        }
        if (!allValues.creditLimit?.status) {
            creditLimitForm.setFieldsValue({
                creditLimit: { value: null }
            });
            creditLimitForm.setFields([
                {
                    name: ['creditLimit', 'value'],
                    errors: [],
                },
            ]);
        }
    };
    const validateMinLength = (rule, value) => {
        if (value == null && !creditLimitStatus || !invoiceStatus) {
            return Promise.resolve()
        }
        if (value && value.toString().length < 0) {
            return Promise.reject('El valor debe tener al menos 6 caracteres');
        }
        return Promise.resolve();
    };
    const validatePositiveNumber = (rule, value) => {
        if (value == null && !creditLimitStatus || !invoiceStatus) {
            return Promise.resolve()
        }
        if (value <= 0) {
            return Promise.reject('El valor debe ser mayor a cero');
        }
        return Promise.resolve();
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }
    
    if (error) {
        return <div>Error loading credit limit</div>;
    }
    
    
    return (
        <div>

        <Form
            form={creditLimitForm}
            layout="vertical"
            name="creditLimitForm"
            onValuesChange={handleFormChange}
        >
            <Container>
                <Title>Límites de crédito</Title>
                <Content>
                    <FormItem
                        label="Facturas"
                        valuePropNameStatus={'checked'}
                        nameStatus={["invoice", "status"]}
                        nameValue={["invoice", "value"]}
                        type='number'
                        rules={invoiceStatus ? [
                            { required: true, message: 'Por favor, ingresa el valor de la factura' },
                            { validator: validateMinLength },
                            { validator: validatePositiveNumber}
                        ] : []}
                        disabled={!invoiceStatus}
                        checkboxLabel={true}
                    />

                    <FormItem
                        label={"Límite de crédito"}
                        type='number'
                        valuePropNameStatus={'checked'}
                        checkboxLabel={true}
                        rules={creditLimitStatus ? [
                            { required: true, message: 'Por favor, ingresa el límite de crédito' },
                            { validator: validateMinLength },
                            { validator: validatePositiveNumber}
                        ] : []}
                        nameStatus={['creditLimit', 'status']}
                        nameValue={["creditLimit", "value"]}
                        disabled={!creditLimitStatus}
                    />
                    <FormItem
                        label="Crédito disponible"
                        readOnly={true}
                        value={useFormatPrice(creditLimitState?.creditLimit?.value - arBalance || 0)}
                    />
                </Content>
            </Container>
        </Form>
        {
           creditLimitState?.creditLimit?.status && (creditLimitState?.creditLimit?.value < arBalance)  && (
                <Alert
                message="Advertencia"
                description="El límite de crédito es menor que el balance disponible."
                type="warning"
                showIcon
            />
            )
        }
          {!creditLimitStatus && (
                        <Alert
                            message="Advertencia"
                            description={`El límite de crédito no está activado para el cliente ${client.name}. No podrás usar las funcionalidades de cuentas por cobrar hasta que actives el límite de crédito.`}
                            type="warning"
                            showIcon
                        />
                    )}
        </div>
    );
};

// Estilos con Styled Components
const Container = styled.div`
  border: 1px solid #ccc;
  border-left: 0;
    border-right: 0;
  padding: 16px 0;

`;

const Title = styled.h2`
  margin-bottom: 16px;
  font-size: 18px;
  color: #333;
`;

const Content = styled.div`
  display: grid;
    grid-template-columns: min-content  1fr 1fr;
    gap: 1em;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Label = styled.label`
  margin-left: 8px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FormItem = ({
    label,
    value,
    type = "text",
    checkboxLabel = false,
    valuePropNameStatus,
    disabled = false,
    readOnly = false,
    rules = [],
    nameValue,
    nameStatus,
}) => {

    return (
        <Form.Item
            name={nameValue}
            rules={rules}
            label={
                checkboxLabel ?
                    <Form.Item
                        name={nameStatus}
                        valuePropName={valuePropNameStatus}
                        noStyle
                    >
                        <Checkbox
                            style={{
                                whiteSpace: "nowrap"
                            }}
                        >
                            {label}
                        </Checkbox>
                    </Form.Item>
                    : label
            }
        >
            {
                type === "number" ?
                    <InputNumber
                        readOnly={readOnly}
                        disabled={disabled}
                        value={value}
                        style={{
                            width: '100%'

                        }}
                    />
                    :
                    <Input
                        readOnly={readOnly}
                        disabled={disabled}
                        value={value}
                    />
            }

        </Form.Item>
    )
}

