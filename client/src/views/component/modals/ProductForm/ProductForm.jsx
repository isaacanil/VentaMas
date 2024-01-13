import React, { useEffect, useState } from 'react'
import * as ant from 'antd';
const { Form, Button, Spin, Radio, InputNumber, Card, Space, Row, Col, Divider, Flex, Affix, Checkbox, Anchor } = ant;
import { LoadingOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { QRCode } from './components/sections/QRCode';
import { BarCode } from './components/sections/BarCode';
import { ProductInfo } from './components/sections/ProductInfo';
import { InventoryInfo } from './components/sections/InventoryInfo';
import { PriceInfo } from './components/sections/PriceInfo';
import { ChangeProductData, clearUpdateProductData, selectUpdateProductData } from '../../../../features/updateProduct/updateProductSlice';
import { PriceCalculator } from './components/sections/PriceCalculator';
import { initTaxes } from '../../../component/modals/UpdateProduct/InitializeData';
import { imgFailed } from './ImageManager/ImageManager';
import styled from 'styled-components';
import { selectUser } from '../../../../features/auth/userSlice';
import { fbAddProduct } from '../../../../firebase/products/fbAddProduct';
import { fbUpdateProduct } from '../../../../firebase/products/fbUpdateProduct';
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice';

export const ProductForm = ({ showImageManager }) => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const user = useSelector(selectUser);
    const [submit, setSubmit] = useState(false)
    const { product, status } = useSelector(selectUpdateProductData)
    // Effect to recalculate data when cost changes
    const onFinish = async (values) => {
        setSubmit(true)
        try {
            await form.validateFields();
            if (status === "update") {
                await fbUpdateProduct(product, dispatch, user)
            } else {
                await fbAddProduct(product, dispatch, user)
            }
            dispatch(closeModalUpdateProd())
            dispatch(clearUpdateProductData())
        } catch (err) {
            console.log(err)
            err.errorFields && err.errorFields.forEach((error) => {
                ant.notification.error({
                    message: 'Error',
                    description: error.errors[0],
                   duration: 10

            })
            })



        } finally {
            setSubmit(false)
        }
    }

    const handleChangeValues = (changeValue, allValues) => {
        // Suponiendo que 'stock' es el nombre del campo que debe ser un número
        const key = Object.keys(changeValue)[0]; // Obtiene la clave del valor que cambió
        const value = changeValue[key];

        // Verifica si el campo que cambió es 'stock' y convierte su valor a número
        if (key === 'cost') {
            changeValue[key] = value ? { unit: value.unit, total: value.unit } : 0; // Convertir a número o cero si es vacío
        }
        if (key === 'tax') {
            changeValue[key] = value ? JSON.parse(value) : initTaxes[0]?.tax; // Convertir a número o cero si es vacío
        }
        if (key === 'listPrice') {
            changeValue[key] = value ? value : { unit: 0, total: 0 }; // Convertir a número o cero si es vacío
        }


        // Despacha la acción con el valor actualizado
        dispatch(ChangeProductData({ product: { ...changeValue } }));
    }

    const handleReset = () => {
        form.resetFields();
        dispatch(closeModalUpdateProd())
        dispatch(clearUpdateProductData())
    }

    return (
        <Spin
            tip="Cargando..."
            spinning={submit}
            indicator={
                <LoadingOutlined
                    style={{
                        fontSize: 24,
                    }}
                    spin
                />
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={handleChangeValues}
                initialValues={{ ...product, tax: product?.tax.ref }}
            >
                <Row gutter={16}
                >
                    <Col span={16}
                        style={{
                            display: 'grid',
                        }}
                    >
                        <Space
                            direction='vertical'
                            style={{
                                width: '100%'
                            }}
                        >
                            <ProductInfo
                                product={product}
                            />
                            <InventoryInfo
                                product={product}
                            />
                            <PriceInfo product={product} />
                        </Space>
                    </Col>
                    <Col span={8}
                        style={{

                            display: 'grid',
                        }}
                    >
                        <Space
                            direction='vertical'
                        >
                            <Card
                                title="Imagen del producto"
                                size='small'
                            >
                                <Space
                                    direction='vertical'
                                    style={{
                                        width: '100%',

                                    }}
                                >
                                    <ImageContent>
                                        {
                                            product?.productImageURL &&
                                            <ant.Image
                                                height={150}
                                                src={product?.productImageURL}
                                            />
                                        }
                                        {
                                            !product?.productImageURL &&
                                            <ImageContainer>
                                                <Image
                                                
                                                 
                                                    src={imgFailed}
                                                />
                                            </ImageContainer>
                                        }
                                    </ImageContent>
                                    <Form.Item
                                        name="upload"
                                        label=""
                                    >
                                        <Button
                                            style={{
                                                width: '100%'
                                            }}
                                            onClick={showImageManager}
                                        >
                                            {product?.productImageURL ? "Actualizar" : "Agregar"} imagen
                                        </Button>
                                    </Form.Item>
                                </Space>
                            </Card>
                            <QRCode product={product} />
                            <BarCode product={product} />
                        </Space>
                    </Col>
                </Row>
                <PriceCalculator />
                <Footer>
                    <Form.Item>
                        <Button
                            htmlType="button"
                            onClick={handleReset}
                        >
                            Cancelar
                        </Button>
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            onClick={onFinish}
                            disabled={submit}
                        >
                            {status === "update" ? 'Actualizar' : 'Crear'}
                        </Button>
                    </Form.Item>
                </Footer>
            </Form>
        </Spin>
    )
}

const ImageContent = styled.div`

   
    border-radius: 5px;
    height: 150px;
    overflow: hidden;
    
  
`
const ImageContainer = styled.div`
    height: 100%;
   width: 100%;
  `;

const Image = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  `;
const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    align-items: center;
    padding: 10px 0px 0px;
    margin-top: 20px;
    width: 100%;
    `