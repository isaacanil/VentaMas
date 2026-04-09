import React, { useState } from 'react';
import { Form, Modal, Button, Tabs, Layout, Typography, Space } from 'antd';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { PricingTab } from './tabs/PricingTab';
import { InventoryTab } from './tabs/InventoryTab';
import { CodesTab } from './tabs/CodesTab';

const { Title } = Typography;

export const ProductFormV2 = ({ visible = true, onClose }: { visible?: boolean; onClose?: () => void }) => {
    const [form] = Form.useForm();
    const [activeKey, setActiveKey] = useState('1');

    const onFinish = (values: any) => {
        console.log('Form values:', values);
    };

    const handleNext = () => {
        setActiveKey(String(Number(activeKey) + 1));
    };

    const isLastTab = activeKey === '4';

    const items = [
        {
            key: '1',
            label: (
                <span style={{ fontSize: '15px' }}>
                    📱 Información Básica
                </span>
            ),
            children: <BasicInfoTab />,
        },
        {
            key: '2',
            label: (
                <span style={{ fontSize: '15px' }}>
                    📦 Inventario y Logística
                </span>
            ),
            children: <InventoryTab />,
        },
        {
            key: '3',
            label: (
                <span style={{ fontSize: '15px' }}>
                    💰 Precios e Impuestos
                </span>
            ),
            children: <PricingTab />,
        },
        {
            key: '4',
            label: (
                <span style={{ fontSize: '15px' }}>
                    🏷️ Códigos y Garantía
                </span>
            ),
            children: <CodesTab />,
        },
    ];

    return (
        <Modal
            title={
                <Space align="center" style={{ marginBottom: 10 }}>
                    <Title level={4} style={{ margin: 0 }}>Gestión de Producto</Title>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            width={1000}
            style={{ top: 20 }}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                    <Button onClick={onClose} size="large">
                        Cancelar
                    </Button>
                    <Space>
                        {activeKey !== '1' && (
                            <Button onClick={() => setActiveKey(String(Number(activeKey) - 1))} size="large">
                                Atrás
                            </Button>
                        )}
                        {!isLastTab && (
                            <Button type="primary" onClick={handleNext} size="large">
                                Siguiente
                            </Button>
                        )}
                        {isLastTab && (
                            <Button type="primary" size="large" onClick={() => form.submit()} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                                Guardar Producto
                            </Button>
                        )}
                    </Space>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    trackInventory: true,
                    restrictSaleWithoutStock: true,
                    taxType: 18,
                    packSize: 1,
                }}
                requiredMark="optional"
            >
                <Tabs
                    tabPosition="left"
                    activeKey={activeKey}
                    onChange={setActiveKey}
                    items={items}
                    size="large"
                    style={{ height: '600px', overflowY: 'auto' }}
                />
            </Form>
        </Modal>
    );
};
