import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeProductData, changeProductPrice, clearUpdateProductData, selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice'
import { Form, Button, Spin, Card, Space, Row, Col, notification, Image as AntdImage } from 'antd';
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
import { initTaxes } from '../../../UpdateProduct/InitializeData';

export const General = ({ showImageManager }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [submit, setSubmit] = useState(false)
    const [form] = Form.useForm(); 
    const { product, status } = useSelector(selectUpdateProductData);

    // Actualizar los valores del formulario cuando cambie el producto
    useEffect(() => {
        form.setFieldsValue(product);
    }, [product, form]);

    const handleChangeValues = (changeValue, allValues) => {
        const key = Object.keys(changeValue)[0];
        const value = changeValue[key];

        // Normalización específica de campos anidados dentro de pricing
        if (key === 'pricing') {
            const normalizedPricing = { ...value };
            // Asegurar que tax sea numérico
            if (normalizedPricing?.tax !== undefined) {
                const t = normalizedPricing.tax;
                normalizedPricing.tax = typeof t === 'string' ? parseFloat(t) || initTaxes[0] : Number(t);
            }
            // Asegurar que cost sea numérico
            if (normalizedPricing?.cost !== undefined) {
                normalizedPricing.cost = typeof normalizedPricing.cost === 'string'
                    ? parseFloat(normalizedPricing.cost) || 0
                    : Number(normalizedPricing.cost || 0);
            }
            dispatch(changeProductPrice({ pricing: normalizedPricing }));
            return;
        }
        if (key === 'weightDetail') {
            dispatch(ChangeProductData({ product: { weightDetail: { ...product?.weightDetail, ...changeValue?.weightDetail } } }));
            return
        }
        if (key === 'warranty') {
            dispatch(ChangeProductData({ product: { warranty: { ...product?.warranty, ...changeValue?.warranty } } }))
            return
        }
        dispatch(ChangeProductData({ product: { ...changeValue } }));
    }
    const onFinish = async (values) => {
        setSubmit(true)
        try {
            await form.validateFields();

            if (status === "update") {
                await fbUpdateProduct(product, user)
                notification.success({
                    message: 'Producto Actualizado',
                    description: 'El producto ha sido actualizado correctamente.',
                });
            } else {
                await fbAddProduct(product, user)
                notification.success({
                    message: 'Producto Creado',
                    description: 'El producto ha sido creado correctamente.',
                });
            }
            dispatch(closeModalUpdateProd())
            dispatch(clearUpdateProductData())
        } catch (err) {
            err.errorFields && err.errorFields.forEach((error) => {
                notification.error({
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
                                            <AntdImage
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
                                        {product?.image ? "Actualizar" : "Agregar"} imagen
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

                    <Button
                        htmlType="button"
                        onClick={handleReset}
                    >
                        Cancelar
                    </Button>


                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={submit}
                    >
                        {status === "update" ? 'Actualizar' : 'Crear'}
                    </Button>

                </Footer>
            </Form>
        </Spin>
    )
}

const ImageContent = styled.div`
    border-radius: 5px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
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
   
 height: min-content;
    width: 100%;
    `