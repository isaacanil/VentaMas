import React, { Fragment } from 'react';
import { Card, Badge, Divider, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faBox, faShoppingCart, faDollarSign, faTruck, faCalendar } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';
import { useParams } from 'react-router-dom';
import { useListenProduct } from '../../../../firebase/products/fbGetProduct';
import noImg from '../../../../assets/producto/noImg.png';

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

    return (
        <Container>
            <MenuApp sectionName={"Productos"} />
            <Body>
                <BodyWrapper>
                    <Card title={product.name} extra={<span>ID: {product.id}</span>}>
                        <ProductInfoContainer>
                            <ProductInfoColumn>
                                <ProductImage
                                    noImg={noImg}
                                    src={noImg} alt={product.name} />
                            </ProductInfoColumn>
                            <ProductInfoColumn>
                                <Badge.Ribbon text={product.isVisible ? 'Visible' : 'No Visible'} color={product.isVisible ? 'green' : 'red'}>
                                    <h3>Precios</h3>
                                    <p>Costo: ${product.pricing.cost.toFixed(2)}</p>
                                    <p>Precio: ${product.pricing.price.toFixed(2)}</p>
                                    <p>Precio de Lista: ${product.pricing.listPrice.toFixed(2)}</p>
                                    <p>Precio Promedio: ${product.pricing.avgPrice.toFixed(2)}</p>
                                    <p>Precio Mínimo: ${product.pricing.minPrice.toFixed(2)}</p>
                                    <p>Impuesto: {product.pricing.tax}</p>
                                </Badge.Ribbon>
                                {product.promotions.isActive && (
                                    <>
                                        <Divider />
                                        <h3>Promoción</h3>
                                        <p>Descuento: {product.promotions.discount}%</p>
                                        <p>Inicio: {product.promotions.start || 'No especificado'}</p>
                                        <p>Fin: {product.promotions.end || 'No especificado'}</p>
                                    </>
                                )}
                            </ProductInfoColumn>
                        </ProductInfoContainer>
                        <Divider />
                        <StyledGrid>
                            <Item icon={faTag}>Tipo: {product.type || 'No especificado'}</Item>
                            <Item icon={faBox}>Tamaño: {product.size || 'No especificado'}</Item>
                            <Item icon={faShoppingCart}>Stock: {product.stock}</Item>
                            <Item icon={faDollarSign}>Contenido Neto: {product.netContent || 'No especificado'}</Item>
                            {product.weightDetail.isSoldByWeight && (
                                <Item icon={faTruck}>Peso: {product.weightDetail.weight} {product.weightDetail.weightUnit}</Item>
                            )}
                            {product.warranty.status && (
                                <Item icon={faCalendar}>Garantía: {product.warranty.quantity} {product.warranty.unit}</Item>
                            )}
                        </StyledGrid>
                        <Divider />
                        <StyledGrid>
                            <StyledItem>Creado por: {product.createdBy}</StyledItem>
                            <StyledItem>Rastrear Inventario: {product.trackInventory ? 'Sí' : 'No'}</StyledItem>
                            <StyledItem>Código QR: {product.qrcode || 'No especificado'}</StyledItem>
                            <StyledItem>Código de Barras: {product.barcode || 'No especificado'}</StyledItem>
                            <StyledItem>Orden: {product.order}</StyledItem>
                            <StyledItem>Fecha de Expiración: {product.hasExpirationDate ? 'Sí' : 'No'}</StyledItem>
                        </StyledGrid>
                    </Card>
                </BodyWrapper>
            </Body>
        </Container>
    );
}

export default ProductView;
