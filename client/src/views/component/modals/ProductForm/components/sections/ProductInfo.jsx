import React from 'react'
import * as ant from 'antd'
const { Card, Space, Button, Input, Row, Col, Select, Form } = ant
import { icons } from '../../../../../../constants/icons/icons'
import { useFbGetCategories } from '../../../../../../firebase/categories/useFbGetCategories'
import { selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice'
import { useCategoryState } from '../../../../../../Context/CategoryContext/CategoryContext'
export const ProductInfo = ({ product }) => {

    const { categories } = useFbGetCategories()
    const { configureAddProductCategoryModal } = useCategoryState();
    return (
        <Card
            size='small'
            title="Información del producto"
            id="part-1"
        >
            <Form.Item
                name="name"
                label={"Nombre del producto"}
               
                rules={[{ required: true, message: 'Introducir un nombre de producto.'
                 }, { type: 'string', min: 4, message: 'Mínimo 4 caracteres.' }]}
            >
                <Input
                    placeholder="Ingresa el nombre del producto"
                    value={product?.productName}
                />
            </Form.Item>
            <Row
                gutter={16}
            >
                <Col
                    span={12}
                >
                    <Form.Item 
                    name="type" 
                    label="Tipo de Producto" 
                    rules={[{ required: true, message: 'Introducir un tipo de producto.' }]}
                   >
                        <Input placeholder="Ingresa el tipo del producto " />
                    </Form.Item>
                </Col>
                
                <Col
                    span={12}
                >
                    <Form.Item name="netContent" label="Contenido Neto" >
                        <Input placeholder=" " />
                    </Form.Item>
                </Col>
            </Row>
            <Row
                gutter={16}
            >
                <Col
                    span={12}
                >
                    <Form.Item name="size" label="Tamaño" >
                        <Input 
                        placeholder="Ingresa el tamaño"
                        />
                    </Form.Item>
                </Col>
                <Col
                    span={12}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: "1fr min-content",
                        gap: '0.2em'

                    }}
                >
                    <Form.Item
                        name="category"
                        label={"Categoría"}

                        //rules={[{ required: true }]}
                    >
                        <Select
                            defaultValue={"2"}
                        >
                            <Option value="Ninguna">Ninguna</Option>
                            {
                                categories.map(({ category }) => (
                                    <Option value={category.name}>{category.name}</Option>
                                ))
                            }
                        </Select>
                    </Form.Item>
                    <Form.Item label={" "}>
                        <Button 
                        icon={icons.operationModes.add}
                        onClick={configureAddProductCategoryModal}
                        ></Button>
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    )
}
