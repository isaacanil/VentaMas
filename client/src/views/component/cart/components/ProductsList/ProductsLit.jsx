import React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { SelectProduct } from '../../../../../features/cart/cartSlice'
import { ProductCardForCart } from '../ProductCardForCart'

export const ProductsList = () => {
    const ProductSelected = useSelector(SelectProduct)
    return (
        <Container>
            {
                ProductSelected.length > 0 ?
                    (
                        ProductSelected.map((item, Index) => (
                            <ProductCardForCart item={item} key={Index} />
                        ))
                    )
                    :
                    (<h4 style={{ margin: '1em' }}>Los productos seleccionados aparecerán aquí</h4>)
            }
        </Container>
    )
}
const Container = styled.ul`
    background-color: var(--color2);
    display: grid;
    gap: 0.4em;
    align-items: flex-start;
    align-content: flex-start;
    width: 100%;
    margin: 0;
    padding: 0.4em;
    overflow-y: scroll;
    position: relative;
    //border-radius: 10px;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
`