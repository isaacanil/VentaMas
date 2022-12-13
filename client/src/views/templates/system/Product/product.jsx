import React, {useEffect} from 'react'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { useDispatch, useSelector } from 'react-redux'
import { selectImageHidden } from '../../../../features/setting/settingSlice'
import { useState } from 'react'
import { addProduct, SelectProduct, setChange, totalPurchase, totalPurchaseWithoutTaxes, totalShoppingItems, totalTaxes } from '../../../../features/cart/cartSlice'
export const Product = ({ product, }) => {
    const [ isTrue, setIsTrue ] = useState(false)
    const imageHiddenRef = useSelector(selectImageHidden)
    const dispatch = useDispatch();
    const ProductSelected = useSelector(SelectProduct);
    const handleGetThisProduct = (product) => {
        dispatch(
            addProduct(
                product
            )
        )
        dispatch(
            totalShoppingItems()
        )
        dispatch(
            totalPurchaseWithoutTaxes()
        )
        dispatch(
            totalShoppingItems()
        )
        dispatch(
            totalTaxes()
        )
        dispatch(
            totalPurchase()
        )
        dispatch(
            setChange()
        )
        console.log(product)

    }


   
    return (
        <Container onClick={() => handleGetThisProduct(product)}>
            {
                <Head>
                    <ImageContainer>
                        <img src={product.productImageURL} alt="" />
                    </ImageContainer>
                </Head>
            }
            <Body>
                <Title>
                    {product.productName}
                </Title>
                <Price>
                    RD${separator(product.price.total)}
                </Price>
            </Body>
        </Container>
    )
}
const Container = styled.div`
    height: 90px;
    width: 100%;
    background-color: #ffffff;
    border-radius: 4px;
    display: flex;
    gap: 10px;
    overflow: hidden;
    transition: 400ms all ease-in-out;
`
const Head = styled.div`
    transform: translate();
    ${() => {
        const imageHiddenRef = useSelector(selectImageHidden)
        return imageHiddenRef === !false ? (
            `
                    display: none;
                    visibility: hidden;
                    z-index: 0;
                    transform: translate()
                
                    `
        ) : null
    }}
    transition: visibility 4000ms ease-in-out;
    
`
const Body = styled.div`
    height: 100%;
    width: 100%;
    background-color: #ffffff;
    padding: 4px 0;
    position: relative;
   
`
const ImageContainer = styled.div`
    height: 100%;
    width: 90px;
    overflow: hidden;
    transform: ${() => {
        const imageHiddenRef = useSelector(selectImageHidden)
        return imageHiddenRef === false ? "scale(1)" : "scale(0)"
    }};
    transition: transform 400ms ease-in-out;
    img{
        height: 100%;
        width: 100%;
        object-fit: cover;
        object-position: center;
    }

`
const Price = styled.div`
    position: absolute;
    bottom: 0;
    padding: 0 1em;
    text-align: end;
    width: 100%;
    font-weight: 500;
    border-top-left-radius: ${() => {
        const imageHiddenRef = useSelector(selectImageHidden)
        return imageHiddenRef === false ? '10px' : 'none'
    }

    };
    transition:  800ms border-radius ease-in-out;
    background-color: rgb(216,216,216);
`
const Title = styled.h5`
    color: rgba(49, 49, 49, 0.966);
    width: 100%;
    font-size: 12px;
    line-height: 1pc;
    padding: 0 1em;
    padding-top: 0.4em;
    padding-right: 2em;
    display: -webkit-box;
    font-weight: 650;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    //white-space: nowrap;
    text-transform: uppercase;
    text-overflow: ellipsis;
    overflow: hidden;
    
`