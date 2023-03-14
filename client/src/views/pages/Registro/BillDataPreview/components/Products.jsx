import React from 'react'
import styled from 'styled-components';

const Products = ({products, Title, Text, Subtitle}) => {
    return (
        <ProductsContainer>
            <Title>Productos comprados</Title>
            {products.map((product) => (
                <div key={product.id}>
                    <Subtitle>{product.productName}</Subtitle>
                    <Text>Tipo: {product.type}</Text>
                    <Text>Categoría: {product.category}</Text>
                    <Text>Cantidad: {product.amountToBuy.total}</Text>
                    <Text>Precio unitario: RD$ {product.price.unit.toFixed(2)}</Text>
                    <Text>Total: RD$ {product.price.total.toFixed(2)}</Text>
                </div>
            ))}
        </ProductsContainer>
    )
}

export default Products

const ProductsContainer = styled.div``;