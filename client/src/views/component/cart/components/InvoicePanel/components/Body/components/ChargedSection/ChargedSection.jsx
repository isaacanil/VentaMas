import React from 'react'
import styled from 'styled-components'
import { Showcase } from '../../../../../../../../templates/system/ShowCase/ShowCase'
import { selectCart } from '../../../../../../../../../features/cart/cartSlice';
import { useSelector } from 'react-redux';

export const ChargedSection = () => {
  const cart = useSelector(selectCart);
  const cartData = cart.data;
  const total = cartData.totalPurchase.value;
  return (
    <Container>
        <Showcase
                title='Total a cobrar'
                valueType='price'
                value={total}
            />
    </Container>
  )
}

const Container = styled.div`
    background-color: var(--White2);
    display: grid;
`