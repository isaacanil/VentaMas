import React from 'react'
import { IoMdClose } from 'react-icons/io'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { Counter } from '../../../templates/system/Counter/Counter'
import { totalShoppingItems, deleteProduct, totalPurchase, setChange, totalPurchaseWithoutTaxes, addPaymentMethodAutoValue } from '../../../../features/cart/cartSlice'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { icons } from '../../../../constants/icons/icons'
import { Button } from '../../../templates/system/Button/Button'
import { motion } from 'framer-motion'

const variants = {
    initial: { opacity: 0, y: -90 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 150, transition: { duration: 0.5 } },  // nueva propiedad
};

export const ProductCardForCart = ({ item }) => {
    const dispatch = useDispatch()

    const deleteProductFromCart = (id) => {
        dispatch(totalPurchase())
        dispatch(deleteProduct(id))
        dispatch(totalPurchaseWithoutTaxes())
        dispatch(totalPurchase())
        dispatch(totalShoppingItems())
        dispatch(setChange())
        dispatch(addPaymentMethodAutoValue())
    }

    return (
        <Container
            variants={variants}
            initial='initial'
            animate='animate'
            transition={{ duration: 0.6 }}

        >
            <Row>
                <Title>{item.productName}</Title>
            </Row>
            <Row>
                <Group justifyContent='space-between'>
                    <Price>{useFormatPrice(item.price.total)}</Price>
                    <Group>
                        <Counter
                            amountToBuyTotal={item.amountToBuy.total}
                            stock={item.stock}
                            id={item.id}
                            product={item}
                        ></Counter>
                        <Button
                            title={icons.operationModes.discard}
                            onClick={() => deleteProductFromCart(item.id)}
                            width='icon24'
                            borderRadius={'normal'}
                            color='danger'
                        />
                    </Group>
                </Group>
            </Row>
        </Container>
    )
}
const Container = styled(motion.div)`
    width: 100%;
    height: min-content;
    position: relative;
    background-color: #ffffff;
    padding: 0.2em 0.4em;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 8px;
    overflow: hidden;
    display: grid;
    border: none;
    border: 1px solid rgba(0, 0, 0, 0.121);
    gap: 0.3em;

`
const Row = styled.div`
 
    display: grid;
    align-items: center;
`
const Group = styled.div`
    display: flex;
    align-items: center;
    gap: 1em;
  
    ${props => {
        switch (props.justifyContent) {
            case 'space-between':
                return `
                    justify-content: space-between;
                `


            default:
                break;
        }
    }}
`
const BtnClose = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    align-items: center;
    background-color: #ce4d4d;
    color: var(--color-error);
    border-radius: 6px;
  
`
const Title = styled.span`
    font-weight: 500;
    line-height: 16px;
    font-size: 14px;
    color: rgb(71, 71, 71);
    text-transform: capitalize;
`
const Price = styled.span`
    max-width: 130px;
    width: 100%;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    display: block;
    padding: 0 10px;
    margin: 0;
    background-color: var(--White1);
    color: var(--Gray6);
 
`