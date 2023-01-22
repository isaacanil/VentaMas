import React, { Fragment, useEffect, useState } from 'react'
import styled from 'styled-components'
import { separator } from '../../../../../hooks/separator'
import { useDispatch, useSelector } from 'react-redux'

import { selectImageHidden, } from '../../../../../features/setting/settingSlice'
import { addPaymentMethodAutoValue, addProduct, deleteProduct, SelectProduct, setChange, totalPurchase, totalPurchaseWithoutTaxes, totalShoppingItems, totalTaxes } from '../../../../../features/cart/cartSlice'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import noImg from '../../../../../assets/producto/noimg.png'
import { IsProductSelected } from './IsProductSelected'
import { IoMdClose } from 'react-icons/io'
export const Product = ({ product, }) => {
    const imageHiddenRef = useSelector(selectImageHidden)
    const dispatch = useDispatch();
    const ProductsSelected = useSelector(SelectProduct);
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
 
    const deleteProductFromCart = (e, id) => {
        e.stopPropagation()
        dispatch(totalPurchase())
        dispatch(deleteProduct(id))
        dispatch(totalPurchaseWithoutTaxes())
        dispatch(totalPurchase())
        dispatch(totalShoppingItems())
        dispatch(setChange())
        dispatch(addPaymentMethodAutoValue())
       
    }

    const ProductCheckInCart = IsProductSelected(ProductsSelected, product.id)
    return (
        <Container onClick={() => handleGetThisProduct(product)} imageHiddenRef={imageHiddenRef} isSelected={ProductCheckInCart.status ? true : false}>
            {
                <Head imageHiddenRef={imageHiddenRef ? true : false}>
                    <ImageContainer imageHiddenRef={imageHiddenRef}>
                        <img src={product.productImageURL} alt=""
                        // onError={({ currentTarget }) => {
                        //     currentTarget.onerror = null;
                        //     currentTarget.src = noImg;
                        //     currentTarget.style.objectFit = 'contain'
                        // }}
                        />
                    </ImageContainer>
                </Head>
            }
            <Body>
                <Title>
                    {product.productName}
                </Title>
                <Footer imageHiddenRef={imageHiddenRef} isSelected={ProductCheckInCart.status ? true : false}>


                    {ProductCheckInCart.status ? (
                        <Group>
                            <AmountToBuy>{ProductCheckInCart.productSelectedData.amountToBuy.total}</AmountToBuy>

                            {/* <DeleteProduct>
                                <IoMdClose />
                            </DeleteProduct> */}
                        </Group>
                    ) : <Group />}

                    <Group>
                        <Price>{useFormatPrice(product.price.total)}</Price>
                        {ProductCheckInCart.status ? (
                            <DeleteProduct onClick={(e) => deleteProductFromCart(e, product.id)}>
                                <IoMdClose />
                            </DeleteProduct>
                        ) : null}
                    </Group>
                </Footer>
            </Body>
        </Container>
    )
}
const Container = styled.div`

    height: 80px;
    width: 100%;
    background-color: #ffffff;
    border-radius: 6px;
    display: flex;
    gap: 10px;
    overflow: hidden;
    transition: 400ms all ease-in-out;
    position: relative;
    outline: 2px solid transparent;
    :hover{
        img{
            filter: brightness(105%);
            transition: 300ms filter ease-in-out;
        }
    }
    ${(props) => {
        switch (props.isSelected) {
            case true:
                return `
                outline: 3px solid var(--color1);   

                      
                `


            default:
                break;
        }
    }}
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
    transform:  translateX(-90px) scale(0);
    transition-property: transform;
    transition-delay: 20ms;
    transition-duration: 600ms;
    transition-timing-function: ease-in-out;
    ${(props) => {
        switch (props.imageHiddenRef) {
            case false:
                return `
                position: relative;
                transform: translateX(0px) scale(1);
                transition-property: transform;
                transition-delay: 20ms;
                transition-duration: 1s;
                transition-timing-function: ease-in-out;
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
   
    transition: transform 400ms ease-in-out;
    img{
        height: 100%;
        width: 100%;
        object-fit: cover;
        object-position: center;
        border-radius: 7px;
    }
`
const Footer = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 0 0.8em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 1.6em;
    font-weight: 500;
    pointer-events: none;
    border-top-left-radius: ${(props) => {
        return props.imageHiddenRef === false ? '10px' : '0'
    }
    };
    transition:  800ms border-radius ease-in-out;
    background-color: var(--White3);
    color: var(--Gray7);
   
`
const AmountToBuy = styled.div`
    padding: 0 0.4em;
    height: 1.4em;
    width: 2em;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    background-color: var(--color1);
    color: white;
`
const DeleteProduct = styled.button`
height: 1.4em;
width: 1.4em;
border-radius: 4px;
display: flex;
align-items: center;
outline: 0;
border: 0;
padding: 0;
line-height: 0;
font-weight: bold;
justify-content: center;
background-color: var(--color-error);
color: white;
pointer-events: all;
`
const Group = styled.div`
    display: flex;
    align-items: center;
    gap: 1em;
`
const Title = styled.h5`
    color: rgba(49, 49, 49, 0.966);
    width: 100%;
    font-size: 13px;
    line-height: 1pc;
    padding: 0 1em;
    padding-top: 0.4em;
    padding-right: 2em;
    display: -webkit-box;
    font-weight: 600;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    //white-space: nowrap;
    text-transform: uppercase;
    text-overflow: ellipsis;
    overflow: hidden;
    
`
const Price = styled.h4`
    line-height: 0;
`