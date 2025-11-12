import { faTag, faBox, faShoppingCart, faDollarSign, faTruck, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Badge, Divider, Spin } from 'antd';
import React, { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import noImg from '../../../../assets/producto/noimg.png';
import { useListenProduct } from '../../../../firebase/products/fbGetProduct';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';

const defaultProduct = {
    name: 'Producto No Encontrado',
    image: '',
    category: 'Desconocido',
    pricing: {
        cost: 0,
        price: 0,
        listPrice: 0,
        avgPrice: 0,
        minPrice: 0,
        tax: 'N/A',
    },
    promotions: {
        start: null,
        end: null,
        discount: 0,
        isActive: false,
    },
    weightDetail: {
        isSoldByWeight: false,
        weightUnit: 'kg',
        weight: 0,
    },
    warranty: {
        status: false,
        unit: '',
        quantity: 0,
    },
    size: '',
    type: '',
    stock: 0,
    netContent: '',
    createdBy: 'desconocido',
    id: 'no-encontrado',
    isVisible: false,
    trackInventory: false,
    qrcode: '',
    barcode: '',
    order: 0,
    hasExpirationDate: false,
};

const Container = styled.div`
display: grid;
grid-template-rows: auto 1fr;
max-height: 100vh;
overflow: hidden;
`
// Styled components
const Body = styled.div`
    padding: 20px;
    overflow-y: auto;
    `;

const BodyWrapper = styled.div`
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    gap: 1em;
    `;

const ProductInfoContainer = styled.div`
    display: flex;
    gap: 20px;
`;

const ProductInfoColumn = styled.div`
    flex: 1;
`;

const StyledGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
`;

const StyledItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const ProductImage = styled.img`
    width: 100%;
    height: 200px;
    background-color: #f5f5f5;
    object-fit: ${noImg ? "contain" : "cover"};
    border-radius: 8px;
`;
const Item = ({ icon, children }) => (
    <StyledItem>
        <FontAwesomeIcon icon={icon} />
        <span>{children}</span>
    </StyledItem>
);

function ProductView() {
    const { productId } = useParams();
    const { data: product, loading, error } = useListenProduct(productId);

    if (loading) {
        return <Spin size="large" />; // Muestra un indicador de carga mientras se obtiene el producto
    }

    if (error) {
        return <div>Error: {error}</div>; // Muestra un mensaje de error si ocurre algún problema
    }

    const productData = product ?? defaultProduct;

    return (
        <Container>
            <MenuApp sectionName={"Productos"} />
            <Body>
                <BodyWrapper>
                    <Card title={productData.name} extra={<span>ID: {productData.id}</span>}>
                        <ProductInfoContainer>
                            <ProductInfoColumn>
                                <ProductImage
                                    noImg={noImg}
                                    src={noImg} alt={productData.name} />
                            </ProductInfoColumn>
                            <ProductInfoColumn>
                                <Badge.Ribbon text={productData.isVisible ? 'Visible' : 'No Visible'} color={productData.isVisible ? 'green' : 'red'}>
                                    <h3>Precios</h3>
                                    <p>Costo: ${productData.pricing.cost.toFixed(2)}</p>
                                    <p>Precio: ${productData.pricing.price.toFixed(2)}</p>
                                    <p>Precio de Lista: ${productData.pricing.listPrice.toFixed(2)}</p>
                                    <p>Precio Promedio: ${productData.pricing.avgPrice.toFixed(2)}</p>
                                    <p>Precio Mínimo: ${productData.pricing.minPrice.toFixed(2)}</p>
                                    <p>Impuesto: {productData.pricing.tax}</p>
                                </Badge.Ribbon>
                                {productData.promotions.isActive && (
                                    <>
                                        <Divider />
                                        <h3>Promoción</h3>
                                        <p>Descuento: {productData.promotions.discount}%</p>
                                        <p>Inicio: {productData.promotions.start || 'No especificado'}</p>
                                        <p>Fin: {productData.promotions.end || 'No especificado'}</p>
                                    </>
                                )}
                            </ProductInfoColumn>
                        </ProductInfoContainer>
                        <Divider />
                        <StyledGrid>
                            <Item icon={faTag}>Tipo: {productData.type || 'No especificado'}</Item>
                            <Item icon={faBox}>Tamaño: {productData.size || 'No especificado'}</Item>
                            <Item icon={faShoppingCart}>Stock: {productData.stock}</Item>
                            <Item icon={faDollarSign}>Contenido Neto: {productData.netContent || 'No especificado'}</Item>
                            {productData.weightDetail.isSoldByWeight && (
                                <Item icon={faTruck}>Peso: {productData.weightDetail.weight} {productData.weightDetail.weightUnit}</Item>
                            )}
                            {productData.warranty.status && (
                                <Item icon={faCalendar}>Garantía: {productData.warranty.quantity} {productData.warranty.unit}</Item>
                            )}
                        </StyledGrid>
                        <Divider />
                        <StyledGrid>
                            <StyledItem>Creado por: {productData.createdBy}</StyledItem>
                            <StyledItem>Rastrear Inventario: {productData.trackInventory ? 'Sí' : 'No'}</StyledItem>
                            <StyledItem>Código QR: {productData.qrcode || 'No especificado'}</StyledItem>
                            <StyledItem>Código de Barras: {productData.barcode || 'No especificado'}</StyledItem>
                            <StyledItem>Orden: {productData.order}</StyledItem>
                            <StyledItem>Fecha de Expiración: {productData.hasExpirationDate ? 'Sí' : 'No'}</StyledItem>
                        </StyledGrid>
                    </Card>
                </BodyWrapper>
            </Body>
        </Container>
    );
}

export default ProductView;
