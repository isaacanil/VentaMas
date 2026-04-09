import React from 'react';
import { Form, Input, InputNumber, Row, Col, Card, Switch, Space, Typography, Button, Select } from 'antd';

const { Text } = Typography;
const { Option } = Select;

export const CodesTab = () => {
    return (
        <Card
            title="Identificadores y Garantía"
            bordered={false}
            style={{ boxShadow: 'none' }}
        >
            <Row gutter={24}>
                <Col span={12}>
                    <Card type="inner" title="Código de Barras (UPC/EAN)" style={{ marginBottom: 24 }}>
                        <Form.Item name="barcode">
                            <Input size="large" placeholder="Escanea o escribe el código de barras" />
                        </Form.Item>
                        <Space>
                            <Button type="primary">Generar Código Interno</Button>
                            <Button>Imprimir Etiqueta</Button>
                        </Space>
                    </Card>

                    <Card type="inner" title="Código QR">
                        <Row align="middle" gutter={16}>
                            <Col>
                                <div style={{ width: 100, height: 100, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                    <Text type="secondary">QR Preview</Text>
                                </div>
                            </Col>
                            <Col flex={1}>
                                <Form.Item name="qrcode" style={{ marginBottom: 0 }}>
                                    <Input size="large" placeholder="Link o contenido del QR" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col span={12}>
                    <Card type="inner" title="Políticas de Garantía">
                        <Form.Item name="hasWarranty" valuePropName="checked" style={{ marginBottom: 16 }}>
                            <Space>
                                <Switch />
                                <Text>Este producto ofrece garantía</Text>
                            </Space>
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="warrantyQuantity" label="Duración">
                                    <InputNumber size="large" style={{ width: '100%' }} min={1} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="warrantyUnit" label="Escala">
                                    <Select size="large" defaultValue="months">
                                        <Option value="days">Días</Option>
                                        <Option value="months">Meses</Option>
                                        <Option value="years">Años</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card type="inner" title="Configuraciones Avanzadas" style={{ marginTop: 24 }}>
                        <Form.Item name="footerNote" label="Nota al pie en facturas">
                            <Input.TextArea placeholder="Ej. No se aceptan devoluciones..." rows={2} />
                        </Form.Item>
                        <Form.Item name="activeIngredient" label="Principio Activo (Farmacias)">
                            <Select showSearch size="large" placeholder="Seleccione principio activo">
                                <Option value="p1">Paracetamol</Option>
                                <Option value="p2">Ibuprofeno</Option>
                            </Select>
                        </Form.Item>
                    </Card>
                </Col>
            </Row>
        </Card>
    );
};
