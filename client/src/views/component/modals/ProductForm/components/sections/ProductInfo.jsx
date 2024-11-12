import React, { useState } from 'react'
import * as ant from 'antd'
const { Card, Space, Button, Input, Row, Col, Select, Form } = ant
import { icons } from '../../../../../../constants/icons/icons'
import { useFbGetCategories } from '../../../../../../firebase/categories/useFbGetCategories'
import { useCategoryState } from '../../../../../../Context/CategoryContext/CategoryContext'
import { openModal } from '../../../../../../features/activeIngredients/activeIngredientsSlice'
import { useDispatch } from 'react-redux'
import { useListenActiveIngredients } from '../../../../../../firebase/products/activeIngredient/activeIngredients'

export const ProductInfo = ({ product }) => {
    const { categories } = useFbGetCategories()
    const {data: activeIngredients } = useListenActiveIngredients()
    // const [activeIngredients, setActiveIngredients] = useState([])
    const dispatch = useDispatch();
    const { configureAddProductCategoryModal } = useCategoryState();
    const configureAddActiveIngredientModal = () => {
        // Lógica para abrir modal de agregar principio activo
        console.log('Abrir modal para agregar principio activo');
    }
 
    const handleOpenActiveIngredientModal = () => {
        dispatch(openModal({ initialValues: null }));
      };
    return (
        <Card
            size='small'
            title="Información del producto"
            id="part-1"
        >
            <Form.Item
                name="name"
                label={"Nombre del producto"}

                rules={[{
                    required: true, message: 'Introducir un nombre de producto.'
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
                    >
                        <Select
                            showSearch
                            placeholder="Selecciona una categoría"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                            defaultValue="none"
                        >
                            <Option key="none" value="none">Ninguna</Option>
                            {
                                categories.map(({ category }) => (
                                    <Option
                                        key={category?.name}
                                        value={category.name}
                                    >
                                        {category.name}
                                    </Option>
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
            <Row gutter={16}>
                <Col span={12} style={{
                    display: 'grid',
                    gridTemplateColumns: "1fr min-content",
                    gap: '0.2em'
                }}>
                    <Form.Item
                        name="activeIngredients"
                        label={"Principio Activo"}
                    >
                        <Select
                             showSearch
                             placeholder="Selecciona el principio activo"
                             optionFilterProp="children"
                             filterOption={(input, option) =>
                                 option.children.toLowerCase().includes(input.toLowerCase())
                             }
                        >
                            <Option key="none" value="none">Ninguno</Option>
                            {
                                activeIngredients.map((ingredient) => (
                                    <Option
                                    key={ingredient.id}
                                    value={ingredient.name} // Usar id como valor
                                >
                                    {ingredient.name}
                                </Option>
                                ))
                            }
                        </Select>
                    </Form.Item>
                    <Form.Item label={" "}>
                        <Button
                            icon={icons.operationModes.add}
                            onClick={handleOpenActiveIngredientModal}
                        ></Button>
                    </Form.Item>
                </Col>
            </Row>
            {/* Nuevos campos de Medida y Pie */}
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="measurement" label="Medida">
                        <Input placeholder="Ingresa la medida" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="footer" label="Pie">
                        <Input placeholder="Ingresa el pie" />
                    </Form.Item>
                </Col>
            </Row>

            {/* Descripción dinámica basada en Medida y Pie */}
            {/* {product?.medida || product?.pie ? (
                <div style={{ marginTop: 16 }}>
                    <p>
                    {product?.measurement && `Medida: [${product.measurement}]`}
                    {product?.measurement && product?.footer && ', '}
                    {product?.footer && `Pie: [${product.footer}]`}
                    </p>
                </div>
            ) : null} */}
        </Card>
    )
}
