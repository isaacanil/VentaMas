import React from 'react'
import styled from 'styled-components'
import { ProductCardColumn } from './ProductCardColumn'
import { ProductCardRow } from './ProductCardRow'
export const ProductInventoryCard = ({ product, handleUpdateProduct, handleDeleteProduct }) => {
    return (
        <Container>
            {/* <ProductCardColumn
                product={product}
                handleDeleteProduct={handleDeleteProduct}
                handleUpdateProduct={handleUpdateProduct}
            /> */}
            <ProductCardRow
                product={product}
                handleDeleteProduct={handleDeleteProduct}
                handleUpdateProduct={handleUpdateProduct}
            />
        </Container>
    )
}
const Container = styled.div`
`

