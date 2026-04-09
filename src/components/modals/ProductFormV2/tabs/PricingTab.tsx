import React from 'react';
import { Form, InputNumber, Row, Col, Card, Switch, Alert, Table, Space, Typography } from 'antd';

const { Text } = Typography;

const mockColumns = [
    { title: 'Nivel', dataIndex: 'level', key: 'level' },
    {
        title: 'Precio (Sin Imp.)',
        dataIndex: 'price',
        key: 'price',
        render: () => <InputNumber min={0} style={{ width: 120 }} prefix="$" />
    },
    { title: 'Impuesto', dataIndex: 'tax', key: 'tax', render: () => <Text type="secondary">$0.00</Text> },
    { title: 'Total Venta', dataIndex: 'total', key: 'total', render: () => <Text strong>$0.00</Text> },
    {
        title: 'Margen (%)',
        dataIndex: 'margin',
        key: 'margin',
        render: () => <Text type="success">0.0%</Text>
    },
];

const mockData = [
    { key: '1', level: 'Precio Lista (Regular)' },
    { key: '2', level: 'Precio Medio' },
    { key: '3', level: 'Precio Mínimo' },
    { key: '4', level: 'Precio Tarjeta' },
    { key: '5', level: 'Oferta Especial' },
];

export const PricingTab = () => {
    return (
        <Card
            title="Precios e Impuestos"
            bordered={false}
            style={{ boxShadow: 'none' }}
        >
            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Form.Item name="isVisible" valuePropName="checked" label="Visibilidad en facturación">
                        <Space>
                            <Switch defaultChecked />
                            <Text>Disponible para venta</Text>
                        </Space>
                    </Form.Item>
                </Col>
                <Col span={16}>
                    <Alert
                        message="El cálculo de rentabilidad se basará en el costo introducido."
                        type="info"
                        showIcon
                    />
                </Col>
            </Row>

            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Form.Item
                        name="cost"
                        label="Costo Unitario"
                        rules={[{ required: true }]}
                        tooltip="Precio base al que adquieres este producto"
                    >
                        <InputNumber size="large" style={{ width: '100%' }} prefix="$" min={0} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="taxType"
                        label="Tipo de Impuesto"
                        rules={[{ required: true }]}
                    >
                        <InputNumber size="large" style={{ width: '100%' }} max={100} min={0} addonAfter="%" defaultValue={18} />
                    </Form.Item>
                </Col>
            </Row>

            <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>
                Calculadora de Precios
            </Text>
            <Table
                columns={mockColumns}
                dataSource={mockData}
                pagination={false}
                size="middle"
                bordered
            />
        </Card>
    );
};
