import { Modal, Form, InputNumber, Switch, Button, Typography } from 'antd';
import { useState } from 'react';

const { Text } = Typography;

const CreditLimitModal = ({ isOpen, onClose, onSave, currentCreditLimit }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            if (onSave) {
                await onSave(values);
            }
            form.resetFields();
            onClose();
        } catch (error) {
            console.error('Error al guardar límite de crédito:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Configurar Límite de Crédito"
            open={isOpen}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancelar
                </Button>,
                <Button
                    key="save"
                    type="primary"
                    loading={loading}
                    onClick={handleSave}
                >
                    Guardar
                </Button>
            ]}
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    creditLimitEnabled: currentCreditLimit?.creditLimit?.status || false,
                    creditLimitValue: currentCreditLimit?.creditLimit?.value || 0,
                    invoiceLimitEnabled: currentCreditLimit?.invoice?.status || false,
                    invoiceLimitValue: currentCreditLimit?.invoice?.value || 1,
                }}
            >
                <Form.Item
                    name="creditLimitEnabled"
                    valuePropName="checked"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Switch />
                        <Text strong>Habilitar límite de crédito</Text>
                    </div>
                </Form.Item>

                <Form.Item
                    name="creditLimitValue"
                    label="Límite de crédito"
                    rules={[
                        {
                            required: true,
                            message: 'Por favor ingresa el límite de crédito'
                        },
                        {
                            type: 'number',
                            min: 0,
                            message: 'El límite debe ser mayor o igual a 0'
                        }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Ingresa el límite de crédito"
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        min={0}
                    />
                </Form.Item>

                <Form.Item
                    name="invoiceLimitEnabled"
                    valuePropName="checked"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Switch />
                        <Text strong>Habilitar límite de facturas</Text>
                    </div>
                </Form.Item>

                <Form.Item
                    name="invoiceLimitValue"
                    label="Límite de facturas por cobrar"
                    rules={[
                        {
                            required: true,
                            message: 'Por favor ingresa el límite de facturas'
                        },
                        {
                            type: 'number',
                            min: 1,
                            message: 'El límite debe ser mayor a 0'
                        }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Número máximo de facturas"
                        min={1}
                    />
                </Form.Item>

                <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f6f8fa', 
                    borderRadius: '6px',
                    marginTop: '16px'
                }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        <strong>Nota:</strong> Los límites se aplicarán inmediatamente después de guardar los cambios.
                    </Text>
                </div>
            </Form>
        </Modal>
    );
};

export default CreditLimitModal;
