import React, { useEffect } from 'react'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { useDispatch, useSelector } from 'react-redux'
import nombre from '../../../../assets/producto/noimg.png'
import { selectImageHidden, } from '../../../../features/setting/settingSlice'
import { useState } from 'react'
import { addPaymentMethodAutoValue, addProduct, SelectProduct, setChange, totalPurchase, totalPurchaseWithoutTaxes, totalShoppingItems, totalTaxes } from '../../../../features/cart/cartSlice'
import { display, positions } from '@mui/system'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import noImg from '../../../../assets/producto/noimg.png'
export const Product = ({ product, }) => {
    const imageHiddenRef = useSelector(selectImageHidden)
    const dispatch = useDispatch();
    const ProductSelected = useSelector(SelectProduct);
    const handleGetThisProduct = (product) => {
        dispatch(addProduct(product))
        dispatch(totalShoppingItems())
        dispatch(totalPurchaseWithoutTaxes())
        dispatch(totalShoppingItems())
        dispatch(totalTaxes())
        dispatch(totalPurchase())
       // dispatch(addPaymentMethodAutoValue())
        dispatch(setChange())
    }
    // const handleImgError = (e) => {
    //     e.currentTarget.onerror = null;
    //     e.currentTarget.src = noImgFound;
    //     //currentTarget.style.objectFit = 'contain'
    //     //e.target.src = noImgFound
    // }
    return (
        <Container onClick={() => handleGetThisProduct(product)} imageHiddenRef={imageHiddenRef}>
            {
                <Head imageHiddenRef={imageHiddenRef ? true : false}>
                    <ImageContainer imageHiddenRef={imageHiddenRef}>
                        <img src={product.productImageURL} alt="" onError={({ currentTarget }) => {
                            currentTarget.onerror = null;
                            currentTarget.src = noImg;
                            currentTarget.style.objectFit = 'contain'
                          }}/>
                    </ImageContainer>
                </Head>
            }
            <Body>
                <Title>
                    {product.productName}
                </Title>
                <Price imageHiddenRef={imageHiddenRef}>
                    {useFormatPrice(product.price.total)}
                </Price>
            </Body>
        </Container>
    )
}
const Container = styled.div`
    height: 80px;
    width: 100%;
    background-color: #ffffff;
    border-radius: 8px;
    display: flex;
    gap: 10px;
    overflow: hidden;
    transition: 400ms all ease-in-out;
    position: relative;
    :hover{
        img{
            filter: brightness(105%);
            transition: 300ms filter ease-in-out;
        }
    }
    ${(props) => {
        switch (props.imageHiddenRef) {
            case true:
                return `
                    height: 60px;
                `
            case false:
                return `
                `
            default:
                break;
        }
    }
    }
`
const Head = styled.div`
    position: absolute;
    transform: translateX(-90px);
    transition: all 400ms ease-in-out;
    
    ${(props) => {
        switch (props.imageHiddenRef) {
            case false:
                return `
                position: relative;
                transform: translateX(0px);
                transition: all 400ms ease-in-out;
                `
            default:
                break;
        }
    }}
    
    
`
const Body = styled.div`
    height: 100%;
    width: 100%;
    background-color: #ffffff;
    padding: 4px 0;
    position: relative;
    transition: 4000ms all ease-in-out;
   
`
const ImageContainer = styled.div`
    height: 80px;
    width: 80px;
    overflow: hidden;
    padding: 4px;
    ${(props) => {
        switch (props.imageHiddenRef) {
            case true:
                return `
                    transform: scale(0);
                `

            case false:
                return `
                    transfrom: scale(0);
                `

            default:
                break;
        }
    }};
    transition: transform 400ms ease-in-out;
    img{
        height: 100%;
        width: 100%;
        object-fit: cover;
        object-position: center;
        border-radius: 7px;
    }

`
const Price = styled.div`
    position: absolute;
    bottom: 0;
    padding: 0 1em;
    text-align: end;
    width: 100%;
    font-weight: 500;
    border-top-left-radius: ${(props) => {
        return props.imageHiddenRef === false ? '10px' : '0'
    }

    };
    transition:  800ms border-radius ease-in-out;
    background-color: var(--White1);
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