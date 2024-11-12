import React, { useState } from 'react'
import * as ant from 'antd'
import { unitsOfMeasure } from '../../../../../../constants/unitsOfMeasure'
import { selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice'
import { useSelector } from 'react-redux'
import AdjustInventoryModal from './AdjustInventoryModal'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice'
const { Card, Space, InputNumber, Row, Button, Col, Select, Checkbox, Form } = ant
export const InventoryInfo = () => {
    const { product } = useSelector(selectUpdateProductData)
    const [isModalVisible, setIsModalVisible] = useState(false);
    // Abre el modal de ajuste de inventario
    const showModal = () => {
        setIsModalVisible(true);
    };

    // Cierra el modal de ajuste de inventario
    const closeModal = () => {
        setIsModalVisible(false);
    };

    // Guarda los cambios de ajuste de inventario
    const saveAdjustments = (newStock, newTotalUnit) => {

    };
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
                        tooltip="Si está activado, se llevará un control del inventario de este producto."
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
                        name="restrictSaleWithoutStock"
                        label=""
                        tooltip="Si está activado, no se podrá vender este producto si no hay stock."
                        valuePropName="checked"
                        help="Si está activado, no se podrá vender este producto si no hay stock."
                    >
                        <Checkbox
                            title='Inventariable'
                            defaultChecked={true}

                        >
                            Restringir venta sin stock
                        </Checkbox>
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
                        name="stock"
                        label="Stock"
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
                <Col
                    span={12}
                >
                    <Form.Item
                        name="packSize"
                        label="Cantidad de Productos por Paquete"
                        help="Especifica el número de unidades que incluye cada paquete de este producto."
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
            {/* <Grid
            >
                <Form.Item

                    label="Total Unidades"
                    rules={[
                        { required: true, },
                        { type: 'number', message: 'Introducir un número.' }
                    ]}
                >
                   {product.totalUnits || useFormatNumber(product.stock * product.packSize)}
                </Form.Item>
                <Form.Item
                    label="Ajustar Inventario"
                    rules={[
                        { required: true, },
                        { type: 'number', message: 'Introducir un número.' }
                    ]}
                >
                    <Button type="primary" onClick={showModal}>Ajustar Inventario</Button>
                </Form.Item>
            </Grid> */}

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

                <AdjustInventoryModal
                    visible={isModalVisible}
                    onClose={closeModal}
                    stock={product?.stock}
                    packSize={product?.packSize}
                    onSave={saveAdjustments}
                />

            </Row>

        </Card>
    )
}

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: end;
    /* align-content: center; */
`;