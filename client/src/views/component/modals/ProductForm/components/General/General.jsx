import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeProductData, changeProductPrice, clearUpdateProductData, selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice'
import { Form, Button, Spin, Card, Space, Row, Col, }  from 'antd';
import styled from 'styled-components';
import { ProductInfo } from '../sections/ProductInfo';
import { InventoryInfo } from '../sections/InventoryInfo';
import { PriceInfo } from '../sections/PriceInfo';
import { QRCode } from '../sections/QRCode';
import { BarCode } from '../sections/BarCode';
import { WarrantyInfo } from '../sections/WarrantyInfo';
import { LoadingOutlined } from '@ant-design/icons';
import { PriceCalculator } from '../sections/PriceCalculator';
import { imgFailed } from '../../ImageManager/ImageManager';
import { closeModalUpdateProd } from '../../../../../../features/modals/modalSlice';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { fbUpdateProduct } from '../../../../../../firebase/products/fbUpdateProduct';
import { fbAddProduct } from '../../../../../../firebase/products/fbAddProduct';

export const General = ({ showImageManager }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [submit, setSubmit] = useState(false)
    const [form] = Form.useForm();
    const { product, status } = useSelector(selectUpdateProductData);
    const handleChangeValues = (changeValue, allValues) => {
        // Suponiendo que 'stock' es el nombre del campo que debe ser un número
        const key = Object.keys(changeValue)[0]; // Obtiene la clave del valor que cambió
        const value = changeValue[key];
        console.log(changeValue)
        // Verifica si el campo que cambió es 'stock' y convierte su valor a número
        if (key === 'cost') {
            changeValue[key] = value ? { unit: value.unit, total: value.unit } : 0; // Convertir a número o cero si es vacío
        }
        if (key === 'tax') {
            changeValue[key] = value ? JSON.parse(value) : initTaxes[0]?.tax; // Convertir a número o cero si es vacío
        }
        if (key === 'pricing') {
            changeValue[key] = value ? value : 0; // Convertir a número o cero si es vacío
            dispatch(changeProductPrice({ ...changeValue }));
            return
        }
        if (key === 'weightDetail') {
            dispatch(ChangeProductData({ product: { weightDetail: { ...product?.weightDetail, ...changeValue?.weightDetail } } }));
            return
        }
        if (key === 'warranty') {
            dispatch(ChangeProductData({ product: { warranty: { ...product?.warranty, ...changeValue?.warranty } } }))
            return
        }
        // Despacha la acción con el valor actualizado
        dispatch(ChangeProductData({ product: { ...changeValue } }));
    }
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
                initialValues={{ ...product }}
                style={{
                    gap: '10px',
                    display: 'grid',
                }}
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
                                            product?.image &&
                                            <ant.Image
                                                height={150}
                                                src={product?.image}
                                            />
                                        }
                                        {
                                            !product?.image &&
                                            <ImageContainer>
                                                <Image
                                                    src={imgFailed}
                                                />
                                            </ImageContainer>
                                        }
                                    </ImageContent>

                                    <Button
                                        style={{
                                            width: '100%'
                                        }}
                                        onClick={showImageManager}
                                    >
                                        {product?.productImageURL ? "Actualizar" : "Agregar"} imagen
                                    </Button>

                                </Space>
                            </Card>
                            <QRCode product={product} />
                            <BarCode product={product} />
                            <WarrantyInfo />
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