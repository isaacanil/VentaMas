import { Modal, Form, Checkbox, InputNumber, notification, Alert } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../../../features/auth/userSlice';
import { fbUpsertCreditLimit } from '../../../../../../../../../firebase/accountsReceivable/fbUpsertCreditLimit';

const CreditLimitModal = ({ 
    visible, 
    onClose, 
    onSave, 
    initialValues,
    client,
    arBalance = 0 // Balance de cuentas por cobrar actual
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const user = useSelector(selectUser);

    useEffect(() => {
        if (visible && initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [visible, initialValues, form]);

    const handleSave = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            
            // Validaciones de negocio adicionales
            if (values.creditLimit?.status && values.creditLimit?.value) {
                const creditLimit = values.creditLimit.value;
                
                // Validar que el límite de crédito no sea menor que el balance actual
                if (creditLimit < arBalance) {
                    notification.warning({
                        message: 'Límite de Crédito Insuficiente',
                        description: `El límite de crédito ($${creditLimit.toLocaleString()}) no puede ser menor que el balance actual de cuentas por cobrar ($${arBalance.toLocaleString()}). Por favor, ingresa un valor mayor o igual a $${arBalance.toLocaleString()}.`
                    });
                    return;
                }
                
                // Advertencia si el límite está muy cerca del balance
                const availableCredit = creditLimit - arBalance;
                if (availableCredit > 0 && availableCredit < (creditLimit * 0.1)) { // Menos del 10% disponible
                    const result = await new Promise((resolve) => {
                        Modal.confirm({
                            title: 'Límite de Crédito Bajo',
                            content: `El crédito disponible será muy bajo ($${availableCredit.toLocaleString()}). ¿Estás seguro de que quieres continuar?`,
                            okText: 'Sí, continuar',
                            cancelText: 'Cancelar',
                            onOk: () => resolve(true),
                            onCancel: () => resolve(false),
                        });
                    });
                    
                    if (!result) return;
                }
            }
            
            // Guardar directamente en Firebase
            await fbUpsertCreditLimit({
                user,
                client,
                creditLimitData: values
            });

            notification.success({
                message: 'Límites Actualizados',
                description: 'Los límites de crédito han sido actualizados exitosamente.'
            });

            // Llamar al callback para actualizar la UI padre
            onSave(values);
            onClose();
        } catch (error) {
            console.error('Error saving credit limits:', error);
            if (error?.name !== 'ValidationError') {
                notification.error({
                    message: 'Error al Guardar',
                    description: 'Hubo un error al guardar los límites de crédito. Por favor, inténtelo de nuevo.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <StyledModal
            title="Configurar límites de crédito"
            open={visible}
            onCancel={handleCancel}
            onOk={handleSave}
            confirmLoading={loading}
            width={500}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    invoice: { status: false, value: null },
                    creditLimit: { status: false, value: null }
                }}
            >
                {arBalance > 0 && (
                    <Alert
                        message="Información del Cliente"
                        description={`Balance actual de cuentas por cobrar: $${arBalance.toLocaleString()}. El límite de crédito debe ser mayor o igual a este valor.`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <FormSection>
                    <Form.Item
                        name={['invoice', 'status']}
                        valuePropName="checked"
                        noStyle
                    >
                        <Checkbox>
                            Límite de facturas
                        </Checkbox>
                    </Form.Item>
                    
                    <Form.Item
                        name={['invoice', 'value']}
                        dependencies={[['invoice', 'status']]}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const isEnabled = getFieldValue(['invoice', 'status']);
                                    if (isEnabled && (!value || value <= 0)) {
                                        return Promise.reject('Por favor, ingresa un valor válido mayor a cero');
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <StyledInputNumber
                            placeholder="Ingresa el límite de facturas"
                            min={1}
                            precision={0}
                            style={{ width: '100%', marginTop: 8 }}
                        />
                    </Form.Item>
                </FormSection>

                <FormSection>
                    <Form.Item
                        name={['creditLimit', 'status']}
                        valuePropName="checked"
                        noStyle
                    >
                        <Checkbox>
                            Límite de crédito
                        </Checkbox>
                    </Form.Item>
                    
                    <Form.Item
                        name={['creditLimit', 'value']}
                        dependencies={[['creditLimit', 'status']]}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const isEnabled = getFieldValue(['creditLimit', 'status']);
                                    if (isEnabled) {
                                        if (!value || value <= 0) {
                                            return Promise.reject('Por favor, ingresa un valor válido mayor a cero');
                                        }
                                        if (value < arBalance) {
                                            return Promise.reject(`El límite de crédito debe ser mayor o igual al balance actual ($${arBalance.toLocaleString()})`);
                                        }
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <StyledInputNumber
                            placeholder="Ingresa el límite de crédito"
                            min={0.01}
                            precision={2}
                            style={{ width: '100%', marginTop: 8 }}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>
                </FormSection>
            </Form>
        </StyledModal>
    );
};

export default CreditLimitModal;

const StyledModal = styled(Modal)`

    

`;

const FormSection = styled.div`
    margin-bottom: 24px;
`;

const StyledInputNumber = styled(InputNumber)`
    &.ant-input-number {
        width: 100%;
    }
`;
