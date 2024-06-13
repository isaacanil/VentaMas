import React from 'react'
import * as andt from 'antd'
import styled from 'styled-components'
import { Showcase } from '../../../../../../../../templates/system/Showcase/Showcase'
import { useFormatPrice } from '../../../../../../../../../hooks/useFormatPrice'
import { useSelector } from 'react-redux'
import { selectCart } from '../../../../../../../../../features/cart/cartSlice'
const { Statistic } = andt
export const PaymentSummary = () => {
    const cart = useSelector(selectCart);
    const cartData = cart.data;
    const total = cartData?.payment?.value;
    const change = cartData?.change?.value;
    const isChangeNegative = change < 0;
    return (
        <Container>
            <Showcase 
                title='Total Pagado'
                valueType='price'
                value={total}
            />
            <Showcase 
                title={isChangeNegative ? 'Faltante' : 'Devuelta'}
                valueType='price'
                value={change}
                color={true}
            />
        </Container>
    )
}
const Container = styled.div`
 
    display: grid;
    gap: 1em;
    grid-template-columns: 1fr 1fr;
`

