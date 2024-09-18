import React from 'react'
import * as ant from 'antd'
import { initTaxes, taxLabel } from '../../../../../component/modals/UpdateProduct/InitializeData'
const { Card, Space, InputNumber, Row, Col, Select, Checkbox, Form } = ant
import { useSelector } from 'react-redux'
import { selectTaxReceiptEnabled } from '../../../../../../features/taxReceipt/taxReceiptSlice'
export const PriceInfo = () => {
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
    return (
        <Card
            title="Información de precio"
            id="part-3"
            size='small'
        >
            <Row gutter={16} >
                <Col>
                    <Form.Item
                        name="isVisible"
                        label=""
                        valuePropName="checked"
                        help="Determina si el producto aparecerá en la facturación."
                    >
                        <Checkbox
                            title='Inventariable'
                            defaultChecked={true}
                        >
                            Facturable
                        </Checkbox>
                    </Form.Item>
                </Col>

            </Row>
            <Row gutter={16}>
                <Col span={12} >
                    <Form.Item name={['pricing', 'cost']} label="Costo" rules={[{ required: true }]}>
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
                        name={["pricing", "tax"]}
                        label="Impuesto"
                        help={taxReceiptEnabled ? "" : "El impuesto no se aplicará a la venta del producto. La facturación de impuestos está desactivada."}
                        rules={[{ required: true }]}>
                        <Select defaultActiveFirstOption >
                            {
                                initTaxes.map((tax, index) => (
                                    <Option
                                        key={tax}
                                        value={JSON.stringify(tax)}
                                    >
                                        {taxLabel(tax)}
                                    </Option>
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
