import React, { useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { Counter } from '../../../templates/system/Counter/Counter'
import { totalShoppingItems, deleteProduct, totalPurchase, setChange, totalPurchaseWithoutTaxes, addPaymentMethodAutoValue, changeProductPrice } from '../../../../features/cart/cartSlice'
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
    const [priceInputFocus, setInputPriceFocus] = useState(false);
    const deleteProductFromCart = (id) => {
        dispatch(totalPurchase())
        dispatch(deleteProduct(id))
        dispatch(totalPurchaseWithoutTaxes())
        dispatch(totalPurchase())
        dispatch(totalShoppingItems())
        dispatch(setChange())
        dispatch(addPaymentMethodAutoValue())
    }

    const handleChangePrice = (e) => {
        dispatch(changeProductPrice({ id: item.id, newPrice: e.target.value }))
    }


    return (
        <Container
            variants={variants}
            initial='initial'
            animate='animate'
            transition={{ duration: 0.6 }}

        >
            <Row>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr min-content',
                    }}
                >

                    <Title>{item.productName}</Title>
                    <Price>{useFormatPrice(item.price.total)}</Price>

                </div>
            </Row>
            <Row>
                <Group >
                    <input
                        type={priceInputFocus ? "number" : "text"}
                        onFocus={() => setInputPriceFocus(true)}
                        onBlur={() => setInputPriceFocus(false)}
                        style={
                            {
                                width: '100%',
                                height: "1.8em",
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '6px',
                                border: 'none',
                                display: 'block',
                                padding: '0 10px',
                                margin: '0',
                                whiteSpace: 'nowrap',
                                backgroundColor: 'var(--White3)',
                                color: 'var(--Gray6)',
                            }
                        }
                        onChange={handleChangePrice}
                        value={priceInputFocus ? item.price.unit : useFormatPrice(item.price.unit)}
                    />
                    {/* <Price>{useFormatPrice(item.price.unit)}</Price>   */}
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
                        color='on-error'
                    />

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
    display: grid;
    align-items: center;
    gap: 1em;
    grid-template-columns: 1fr   0.8fr min-content;
  
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

const Title = styled.span`
    font-weight: 500;
    line-height: 16px;
    font-size: 14px;
    color: rgb(71, 71, 71);
    text-transform: capitalize;
`
const Price = styled.span`
    
    width: 100%;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    display: block;
    padding: 0 10px;
    margin: 0;
    white-space: nowrap;
    background-color: var(--White1);
    color: var(--Gray6);
 
`