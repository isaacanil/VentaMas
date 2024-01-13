import React from 'react'
import * as ant from 'antd'
import { initTaxes } from '../../../../../component/modals/UpdateProduct/InitializeData'
const { Card, Space, InputNumber, Row, Col, Select, Checkbox, Form } = ant

export const PriceInfo = () => {

    return (
        <Card
            title="Información de precio"
            id="part-3"
            size='small'
        >
            <Row
                gutter={16}
            >
                <Col
                    span={12}
                >
                    <Form.Item
                        name="isVisible"
                        label="Visibilidad en Facturación"
                        valuePropName="checked" // Esto es necesario para los Checkbox
                        help="Si se activa, se mostrará en la facturación."
                    >
                        <Checkbox
                            title='Inventariable'
                            defaultChecked={true}
                        >
                            Facturable
                        </Checkbox>
                    </Form.Item>
                </Col>
                <Col
                    span={12}
                >
                </Col>
            </Row>
            <Row
                gutter={16}
            >
                <Col
                    span={12}
                >
                    <Form.Item name={['cost', 'unit']} label="Costo" rules={[{ required: true }]}>
                        <InputNumber
                            placeholder=""
                            style={{
                                width: "100%"
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col
                    span={12}
                >
                    <Form.Item
                        name="tax"
                        label="Impuesto"
                        rules={[{ required: true }]}>
                        <Select
                            defaultActiveFirstOption
                            //defaultValue={initTaxes[0]?.tax?.ref }
                            
                        >
                            {
                                initTaxes.map(({ tax }) => (
                                    <Option value={JSON.stringify(tax)}>{tax?.ref}</Option>
                                ))
                            }

                        </Select>
                    </Form.Item>
                </Col>
              
            </Row>
            <Row
                gutter={16}
            >

            </Row>
        </Card>
    )
}
