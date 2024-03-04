import React from 'react'
import * as ant from 'antd'
import { unitsOfMeasure } from '../../../../../../constants/unitsOfMeasure'
import { selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice'
import { useSelector } from 'react-redux'
const { Card, Space, InputNumber, Row, Col, Select, Checkbox, Form } = ant
export const InventoryInfo = () => {
    const { product } = useSelector(selectUpdateProductData)

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
                        label=""
                        valuePropName="checked" // Esto es necesario para los Checkbox
                        help="Activa o desactiva el seguimiento de inventario para este producto."
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
                            { required: true, },
                            { type: 'number', message: 'Introducir un número.' }
                        ]}
                    >
                        <InputNumber style={{
                            width: '100%'
                        }} type='number' placeholder="" />
                    </Form.Item>
                </Col>

            </Row>
            <Row
                gutter={16}
            >
                <Col
                    span={12}
                >
                    <Form.Item
                        name={["weightDetail", "isSoldByWeight"]}
                        label=""

                        valuePropName="checked" // Esto es necesario para los Checkbox
                        help="El precio se calcula por el peso en el momento de la venta."
                    >
                        <Checkbox
                            title='Se vende por peso'
                            defaultChecked={true}

                        >
                            Se vende por peso
                        </Checkbox>
                    </Form.Item>
                </Col>
                {
                    product?.weightDetail?.isSoldByWeight ? (
                        <Col span={12}>
                            <Form.Item
                                name={["weightDetail", "weightUnit"]}
                                label="Unidad de Medida"
                                rules={[
                                    { required: true, message: 'Seleccionar una unidad de medida.' }
                                ]}
                            >
                                <Select>
                                    {
                                        unitsOfMeasure.map((unit) => (
                                            <Select.Option value={unit.unit}>
                                                {unit.unit}
                                            </Select.Option>
                                        ))
                                    }
                                </Select>
                            </Form.Item>
                        </Col>
                    ) : (
                        <Col col={12}>
                        </Col>
                    )
                }



            </Row>

        </Card>
    )
}
