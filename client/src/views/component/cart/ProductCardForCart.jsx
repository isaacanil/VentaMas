import React from 'react'
import { IoMdClose } from 'react-icons/io'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { separator } from '../../../hooks/separator'
import { Counter } from '../../templates/system/Counter/Counter'
import { totalShoppingItems, deleteProduct, totalPurchase, setChange } from '../../../features/cart/cartSlice'
export const ProductCardForCart = ({ item }) => {
    const dispatch = useDispatch()
    const deleteProductFromCart = (id) => {
        dispatch(
            deleteProduct(id)
        )
        dispatch(
            totalShoppingItems()
        )
        dispatch(
            totalPurchase()
        )
        dispatch(
            setChange()
        )
    }
    return (
        <Container>
            <Row>
                <Title>{item.productName}</Title>
            </Row>
            <Row>
                <Group class='space-between'>
                    <Price>RD$ {separator(item.price.total)}</Price>
                    <Group>
                        <Counter
                            amountToBuyTotal={item.amountToBuy.total}
                            stock={item.stock}
                            id={item.id}
                            product={item}
                        ></Counter>
                        <BtnClose onClick={() => deleteProductFromCart(item.id)}>
                            <IoMdClose />
                        </BtnClose>
                    </Group>
                </Group>
            </Row>
        </Container>
    )
}
const Container = styled.div`
    width: 100% - 0.6em;
    position: relative;
    background-color: #ffffff;
    margin: 0.3em;
    padding: 0 0.4em;
    border: 1px solid #00000024;
    border-radius: 10px;
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
        switch (props.class) {
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
    background-color: #ce4d4d;
    color: white;
    clip-path: circle();
    padding: 0.1em;
`
const Title = styled.span`
    font-weight: 620;
    color: rgb(71, 71, 71);
    text-transform: capitalize;
`
const Price = styled.span`
    max-width: 150px;
    width: 100%;
    border-radius: 10px;
    padding: 0 10px;
    
    color: #6565a5;
 
`