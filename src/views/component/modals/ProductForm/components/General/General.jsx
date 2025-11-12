import { LoadingOutlined } from '@ant-design/icons';
import { Form, Button, Spin, Card, Space, Row, Col, notification, Image as AntdImage } from 'antd';
import { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components';

import { selectUser } from '../../../../../../features/auth/userSlice';
import { closeModalUpdateProd } from '../../../../../../features/modals/modalSlice';
import { ChangeProductData, PRODUCT_BRAND_DEFAULT, changeProductPrice, clearUpdateProductData, selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice'
import { useListenProductBrands } from '../../../../../../firebase/products/brands/productBrands';
import { fbAddProduct } from '../../../../../../firebase/products/fbAddProduct';
import { fbUpdateProduct } from '../../../../../../firebase/products/fbUpdateProduct';
import { initTaxes } from '../../../UpdateProduct/InitializeData';
import { BRAND_DEFAULT_OPTION_VALUE, BRAND_LEGACY_OPTION_VALUE } from '../../constants/brandOptions';
import { imgFailed } from '../../ImageManager/ImageManager';
import { buildNormalizedProductSnapshot, buildSanitizedProductForSubmit, normalizeItemType, normalizeTrackInventoryValue } from '../../utils/productNormalization';
import { BarCode } from '../sections/BarCode';
import { InventoryInfo } from '../sections/InventoryInfo';
import { PriceCalculator } from '../sections/PriceCalculator';
import { PriceInfo } from '../sections/PriceInfo';
import { ProductInfo } from '../sections/ProductInfo';
import { QRCode } from '../sections/QRCode';
import { WarrantyInfo } from '../sections/WarrantyInfo';

export const General = ({ showImageManager }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [submit, setSubmit] = useState(false)
    const [form] = Form.useForm(); 
    const { product, status } = useSelector(selectUpdateProductData);
    const { data: productBrands = [] } = useListenProductBrands();

    const normalizedProduct = useMemo(() => {
        return buildNormalizedProductSnapshot(product);
    }, [product]);

    const getSanitizedProduct = () => buildSanitizedProductForSubmit(product);

    // Actualizar los valores del formulario cuando cambie el producto
    useEffect(() => {
        if (!normalizedProduct) return;
        form.setFieldsValue(normalizedProduct);
    }, [normalizedProduct, form]);

    const handleChangeValues = (changeValue) => {
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
        if (key === 'itemType') {
            const normalizedItemType = normalizeItemType(value);
            const trackInventoryValue = normalizedItemType === 'service'
                ? false
                : normalizeTrackInventoryValue(product?.trackInventory, normalizedItemType);

            dispatch(ChangeProductData({
                product: {
                    itemType: normalizedItemType,
                    trackInventory: trackInventoryValue
                }
            }));
            form.setFieldsValue({
                itemType: normalizedItemType,
                trackInventory: trackInventoryValue
            });
            return;
        }
        if (key === 'brand') {
            const normalizedBrand = typeof value === 'string'
                ? value.replace(/\s+/g, ' ').trim()
                : '';
            const sanitizedBrand = normalizedBrand || PRODUCT_BRAND_DEFAULT;
            dispatch(ChangeProductData({ product: { brand: sanitizedBrand } }));
            if (value !== sanitizedBrand) {
                form.setFieldsValue({ brand: sanitizedBrand });
            }
            return;
        }
        if (key === 'brandId') {
            const normalizedId = typeof value === 'string' ? value.trim() : null;
            let resolvedBrand = PRODUCT_BRAND_DEFAULT;

            if (normalizedId && normalizedId !== BRAND_DEFAULT_OPTION_VALUE) {
                if (normalizedId === BRAND_LEGACY_OPTION_VALUE && product?.brand) {
                    resolvedBrand = product.brand;
                } else {
                    const brandMatch = productBrands?.find((brand) => brand?.id === normalizedId);
                    if (brandMatch?.name) {
                        resolvedBrand = brandMatch.name.trim();
                    }
                }
            }

            dispatch(ChangeProductData({
                product: {
                    brandId: normalizedId,
                    brand: resolvedBrand || PRODUCT_BRAND_DEFAULT,
                }
            }));

            if (!normalizedId || normalizedId === BRAND_DEFAULT_OPTION_VALUE) {
                form.setFieldsValue({ brandId: BRAND_DEFAULT_OPTION_VALUE });
            }
            return;
        }
        dispatch(ChangeProductData({ product: { ...changeValue } }));
    }
    const onFinish = async (_values) => {
        setSubmit(true)
        try {
            await form.validateFields();

            if (status === "update") {
                if (!product?.id) {
                    throw new Error('El producto no tiene un identificador válido para actualizar.');
                }
                const sanitizedProduct = getSanitizedProduct();
                if (!sanitizedProduct) {
                    throw new Error('No hay datos de producto para guardar.');
                }
                await fbUpdateProduct(sanitizedProduct, user)
                notification.success({
                    message: 'Producto Actualizado',
                    description: 'El producto ha sido actualizado correctamente.',
                });
            } else {
                const sanitizedProduct = getSanitizedProduct();
                if (!sanitizedProduct) {
                    throw new Error('No hay datos de producto para guardar.');
                }
                await fbAddProduct(sanitizedProduct, user)
                notification.success({
                    message: 'Producto Creado',
                    description: 'El producto ha sido creado correctamente.',
                });
            }
            dispatch(closeModalUpdateProd())
            dispatch(clearUpdateProductData())
        } catch (err) {
            if (err?.errorFields?.length) {
                err.errorFields.forEach((error) => {
                    notification.error({
                        message: 'Error',
                        description: error.errors?.[0] || 'Revisa los valores ingresados.',
                        duration: 10
                    })
                })
                return;
            }
            console.error('Error al guardar el producto:', err);
            notification.error({
                message: 'No se pudo completar la operación',
                description: err?.message || 'Intenta de nuevo más tarde.',
                duration: 10
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
                initialValues={normalizedProduct}
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
                                productBrands={productBrands}
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
