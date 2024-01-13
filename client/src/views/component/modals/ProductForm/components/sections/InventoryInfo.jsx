import React from 'react'
import * as ant from 'antd'
const { Card, Space, InputNumber, Row, Col, Select, Checkbox, Form } = ant
export const InventoryInfo = () => {
    return (
        <Card
            title="Gestión de Inventarios"
            id="part-2"
            size='small'
        >
            <Row
                gutter={16}
            >
                <Col
                    span={12}
                >
                    <Form.Item 
                        name="trackInventory"
                        label="Seguimiento de inventario"
                        valuePropName="checked" // Esto es necesario para los Checkbox
                        help="Si se activa, se llevará un control de inventario para este producto."
                        >
                        <Checkbox
                            title='Inventariable'
                            defaultChecked={true}
                            
                        >
                            Inventariable
                        </Checkbox>
                    </Form.Item>
                </Col>
                <Col
                    span={12}
                >
                    <Form.Item 
                    name="stock" 
                    label="Cantidad" 
                    rules={[
                        { required: true, message: 'Introducir una cantidad.' }, 
                        { type: 'number', min: 0, message: 'Mínimo 0.' }, 
                        { type: 'number', max: 1000000, message: 'Máximo 1000000.' }, 
                        { type: 'number', message: 'Introducir un número.' }
                    ]}
                    >
                        <InputNumber style={{
                            width: '100%'
                        }} type='number' placeholder="" />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    )
}
