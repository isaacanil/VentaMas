import React from 'react'

export const Product = ({product}) => {
    return (
        <Container key={index}>
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
        </Container>
    )
}


const Container = styled.div`
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
