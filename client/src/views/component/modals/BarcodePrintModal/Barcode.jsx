import React, { forwardRef } from 'react'
import * as ant from 'antd'
import Barcode from 'react-barcode'
const { Typography } = ant
import styled from 'styled-components'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'

export const BarCode = forwardRef(({ product }, ref) => {
    const priceWithUnit = `${useFormatPrice(product?.pricing?.price)} / ${product?.weightDetail?.weightUnit}`;
    const priceWithoutUnit = useFormatPrice(product?.pricing?.price);
    const price = product?.weightDetail?.isSoldByWeight ? priceWithUnit : priceWithoutUnit;

    return (
        <Container > {/* Asigna la ref al contenedor */}
        <Wrapper ref={ref} >

                <ProductRef>
                    {product?.name}  ({price || ''})
                </ProductRef>
                <Barcode
                    marginTop={3}
                    width={1.6}
                    height={50}
                    value={product?.barcode || '-'}
                />
        </Wrapper>
        </Container>
    );
});

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
`
const Wrapper = styled.div`
   
    width: min-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 0.8em;
    justify-content: center;
 
`
const ProductRef = styled(Typography.Text)`
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 0;
    white-space: nowrap;
`