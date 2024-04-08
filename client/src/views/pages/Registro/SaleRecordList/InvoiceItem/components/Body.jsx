import React from 'react'
import styled from 'styled-components';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
import { abbreviatePaymentMethods, getActivePaymentMethods, translatePaymentMethods } from '../../../../../../utils/invoice';
import { Items } from './Items';

export const Body = ({ data }) => {
    const delivery = data?.delivery;
    const totalPurchaseWithoutTaxes = data?.totalPurchaseWithoutTaxes;
    const discount = data?.discount;
    const totalTaxes = data?.totalTaxes;
    const totalPurchase = data?.totalPurchase;
    const methodActive = getActivePaymentMethods(data);
    const methodActiveArray = methodActive.split(', ');
    const totalShoppingItems = data?.totalShoppingItems;
    const paymentMethods = abbreviatePaymentMethods(methodActiveArray);

    return (
        <Container>
            <OrderDetails>
                <Items
                    label="Subtotal"
                    value={useFormatPrice(totalPurchaseWithoutTaxes?.value)}
                />
                
                <Items
                    abbreviate={"Desc"}
                    label="Descuento"
                    value={`${discount?.value}%`}
                    align={"center"}
                />
                <Items
                    abbreviate={"Deliv"}
                    label="Delivery"
                    value={useFormatPrice(delivery.value)}
                    align={"center"}
                />
                <Items
                    label="Itbis"
                    value={useFormatPrice(totalTaxes?.value)}
                    align="right"
                />
            </OrderDetails>
            <OrderTotal>
                <Items
                    label="Items"
                    value={totalShoppingItems?.value}
                />
                <Items
                    value={paymentMethods}
                />
                <Items
                 
                    value={ <TotalAmount>{useFormatPrice(totalPurchase?.value)}</TotalAmount>}
                />
            </OrderTotal>
        </Container>
    )
}
const Container = styled.div`
height: min-content;
`
const OrderDetails = styled.div`
display: grid;
gap: 1rem;
grid-template-columns: repeat(4, minmax(min-content, 1fr));
`
const OrderTotal = styled.div`
display: grid;
grid-template-columns: 1fr 1fr 1fr;
`
const TotalAmount = styled.div`
font-weight: 700;
`;

