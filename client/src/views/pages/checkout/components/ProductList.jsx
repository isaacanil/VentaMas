import React from 'react'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { Col } from './Table/Col'
import { Row } from './Table/Row'
import { getTax, getTotalPrice, resetAmountToBuyForProduct } from '../../../../utils/pricing'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { useDispatch, useSelector } from 'react-redux'
import { selectTaxReceiptEnabled } from '../../../../features/taxReceipt/taxReceiptSlice'
import { setTaxReceiptEnabled } from '../../../../features/cart/cartSlice'
import { convertTimeToSpanish } from '../../../component/modals/ProductForm/components/sections/WarrantyInfo'

export const ProductList = ({ data }) => {
    const { products, NCF } = data
    const taxReceipt = useSelector(selectTaxReceiptEnabled)
    return (
        <Container>
            <Products>
                {
                    products?.length > 0 ? (
                        products?.map((product, index) => (
                            <Product key={index}>
                                <Row cols='3'>
                                    <Col>
                                        {
                                            product?.weightDetail?.isSoldByWeight ? (
                                                <div>
                                                    {product?.weightDetail?.weight} {product?.weightDetail?.weightUnit} X {useFormatPrice(product?.pricing?.price, NCF)}
                                                </div>
                                            ) : (
                                                <div>
                                                    {product?.amountToBuy || 0} x {separator(getTotalPrice(resetAmountToBuyForProduct(product), NCF))}
                                                </div>
                                            )
                                        }
                                    </Col>
                                    <Col textAlign='right'>
                                        {separator(getTax(product, NCF))}
                                    </Col>
                                    <Col textAlign='right'>
                                        {separator(getTotalPrice(product, NCF))}
                                    </Col>
                                </Row>
                                <Row>
                                    <ProductName>{product?.name}</ProductName>
                                </Row>
                                {
                                    product?.warranty?.status && (
                                        <Row>
                                            {convertTimeToSpanish(product?.warranty?.quantity, product?.warranty?.unit)} de Garantía
                                        </Row>
                                    )
                                }
                            </Product>
                        ))
                    ) : null
                }
            </Products>
        </Container>



    )
}
const Container = styled.div`
 
`

const Products = styled.div`
      display: block;
    border: none;
    padding: 0;
    list-style: none;
    line-height: 30px;
`
const Product = styled.div`
    width: 100%;

    &:nth-child(1n) {
            border-bottom: 1px dashed black;
        }

        &:last-child {
            border-bottom: none;
        }
`
const ProductName = styled.div`
        width: 100%;
        grid-column: 1 / 4;
        line-height: 1.4pc;
        text-transform: capitalize;
     
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        //white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
`
