import React from 'react';
import { Form, Input, InputNumber, Row, Col, Card, Switch, Space, Typography, Divider } from 'antd';

const { Text } = Typography;

export const InventoryTab = () => {
    return (
        <Card
            title="Inventario y Logística"
            bordered={false}
            style={{ boxShadow: 'none' }}
        >
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item name="trackInventory" valuePropName="checked">
                        <Space>
                            <Switch defaultChecked />
                            <Text strong>Habilitar control de inventario</Text>
                        </Space>
                    </Form.Item>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24, paddingLeft: 45 }}>
                        Al activar, el sistema descontará stock por cada venta.
                    </Text>

                    <Form.Item name="restrictSaleWithoutStock" valuePropName="checked">
                        <Space>
                            <Switch defaultChecked />
                            <Text>Restringir venta si no hay stock</Text>
                        </Space>
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item name="isSoldByWeight" valuePropName="checked">
                        <Space>
                            <Switch />
                            <Text strong>El producto se vende por peso</Text>
                        </Space>
                    </Form.Item>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24, paddingLeft: 45 }}>
                        Ideal para carnicerías, supermercados y productos a granel.
                    </Text>
                </Col>
            </Row>

            <Divider />

            <Row gutter={24}>
                <Col span={8}>
                    <Form.Item
                        name="stock"
                        label="Stock Inicial / Actual"
                        rules={[{ required: true }]}
                    >
                        <InputNumber size="large" style={{ width: '100%' }} min={0} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="packSize"
                        label="Unidades por paquete"
                        tooltip="Útil si el producto se vende al por mayor o en cajas"
                        rules={[{ required: true }]}
                    >
                        <InputNumber size="large" style={{ width: '100%' }} min={1} defaultValue={1} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="minStock"
                        label="Stock de alerta (Mínimo)"
                        tooltip="Te notificaremos cuando el stock baje de este número"
                    >
                        <InputNumber size="large" style={{ width: '100%' }} min={0} defaultValue={5} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col span={8}>
                    <Form.Item name="weightUnit" label="Unidad de Medida">
                        <Input size="large" placeholder="Ej. Kg, Lb, Litro" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="netContent" label="Contenido Neto">
                        <Input size="large" placeholder="Ej. 500g, 1L" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="size" label="Tamaño / Dimensiones">
                        <Input size="large" placeholder="Ej. XL, 15x15x20" />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
};
