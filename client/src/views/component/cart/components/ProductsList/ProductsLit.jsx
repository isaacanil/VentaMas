import React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { SelectProduct } from '../../../../../features/cart/cartSlice'
import { ProductCardForCart } from '../ProductCardForCart'
import { AnimatePresence, motion } from 'framer-motion'
import Typography from '../../../../templates/system/Typografy/Typografy'

export const ProductsList = () => {
    const ProductSelected = useSelector(SelectProduct)
    const EMPTY_CART_MESSAGE = "Los productos seleccionados aparecerán aquí...";
    return (
        <Container>
            {
                ProductSelected.length > 0 ?
                    (<AnimatePresence>
                            {ProductSelected.map((item, Index) => (
                                <ProductCardForCart item={item} key={item.cartRef} />
                            ))}
                        </AnimatePresence>)
                    :
                    (<EmptyCartMessage
                        key="empty-message"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Typography variant='body1'>

                        {EMPTY_CART_MESSAGE}
                        </Typography>
                    </EmptyCartMessage>)
            }
        </Container>
    )
}
const Container = styled.ul`
    background-color: ${props => props.theme.bg.color2}; 
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
    border: 1px solid rgba(0, 0, 0, 0.121);
`
const EmptyCartMessage = styled(motion.div)`
  margin: 1em;
`;