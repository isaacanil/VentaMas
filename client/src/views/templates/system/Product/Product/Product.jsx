import React, { Fragment, useEffect, useState } from 'react'
import styled from 'styled-components'
import { separator } from '../../../../../hooks/separator'
import { useDispatch, useSelector } from 'react-redux'

import { selectImageHidden, } from '../../../../../features/setting/settingSlice'
import { addPaymentMethodAutoValue, addProduct, addTaxReceiptInState, deleteProduct, SelectDelivery, SelectProduct, setChange, totalPurchase, totalPurchaseWithoutTaxes, totalShoppingItems, totalTaxes } from '../../../../../features/cart/cartSlice'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import noImg from '../../../../../assets/producto/noimg.png'
import { IsProductSelected } from './IsProductSelected'
import { IoMdClose, IoMdTrash } from 'react-icons/io'
import { Button } from '../../Button/Button'
import { icons } from '../../../../../constants/icons/icons'
import { useCheckForInternetConnection } from '../../../../../hooks/useCheckForInternetConnection'
import useImageFallback from '../../../../../hooks/image/useImageFallback'
import { motion } from 'framer-motion'
export const Product = ({ product, }) => {
    const imageHiddenRef = useSelector(selectImageHidden)
    const dispatch = useDispatch();
    const ProductsSelected = useSelector(SelectProduct)
    const deliverySelected = useSelector(SelectDelivery)

    useEffect(() => {
        dispatch(totalShoppingItems())
        dispatch(totalPurchase())
        dispatch(addPaymentMethodAutoValue())
        dispatch(totalTaxes())
        dispatch(setChange())
        // dispatch(addTaxReceiptInState(NCF_code))
    }, [ProductsSelected, deliverySelected])


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

    const deleteProductFromCart = (e, id) => {
        if(e){
            e.stopPropagation()

        }
        dispatch(deleteProduct(id))
    }

    const isConnected = useCheckForInternetConnection()
    const ProductCheckInCart = IsProductSelected(ProductsSelected, product.id)
    const [imageFallback] = useImageFallback(product?.productImageURL, noImg)
    const effectProduct = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
        
    }
    return (
        <Container
            onClick={() => handleGetThisProduct(product)}
            imageHiddenRef={imageHiddenRef}
            isSelected={ProductCheckInCart.status}
            variants={effectProduct}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.8 }}
        >
            {
                <Head imageHiddenRef={imageHiddenRef ? true : false}>
                    <ImageContainer imageHiddenRef={imageHiddenRef}>
                        <img
                            src={(isConnected && imageFallback) || noImg}
                        />
                    </ImageContainer>
                </Head>
            }
            <Body>
                <Title>
                    {product.productName}
                </Title>
                {ProductCheckInCart.status ? (
                    <Button
                        startIcon={icons.operationModes.discard}
                        width='icon32'
                        color={'danger'}
                        borderRadius='normal'
                        // bgcolor='error'
                        variant='contained'
                        onClick={(e) => deleteProductFromCart(e, product?.id)}
                    />
                ) : null}
                <Footer imageHiddenRef={imageHiddenRef} isSelected={ProductCheckInCart.status ? true : false}>

                    {ProductCheckInCart.status ? (
                        <Group>
                            <AmountToBuy>{ProductCheckInCart.productSelectedData.amountToBuy.total}</AmountToBuy>

                        </Group>
                    ) : <Group />}

                    <Group>
                        <Price isSelected={ProductCheckInCart.status ? true : false}>{useFormatPrice(product?.price?.total)}</Price>
                    </Group>
                </Footer>
            </Body>
        </Container>
    )
}
const Container = styled(motion.li)`
    box-shadow: 2px 2px 10px 2px rgba(0, 0, 0, 0.020);
    height: 80px;
    width: 100%;
    background-color: #ffffff;
    border-radius: var(--border-radius);
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
                outline: 2.9px solid var(--color);                
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
    display: grid;
    grid-template-columns: 1fr min-content;
   
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
    pointer-events: none;
    
    border-top-left-radius: ${(props) => {
        return props.imageHiddenRef === false ? '10px' : '0'
    }
    };
transition:  800ms border-radius ease-in-out;
background-color: var(--White1);
font-weight: 400;
color: var(--Gray6);
letter-spacing: 0.2px;
   
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
    background-color: var(--White4);
    color: var(--color);
`

const Group = styled.div`
    display: flex;
    align-items: center;
    gap: 1em;
`
const Title = styled.div`
    color: var(--Gray6);
    width: 100%;
    font-size: 13.4px;
    line-height: 1pc;
    padding: 0 1em;
    padding-top: 0.4em;
    padding-right: 2em;
    display: -webkit-box;
    font-weight: 600;
    letter-spacing: 0.4px;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    //white-space: nowrap;
    text-transform: capitalize;
    text-overflow: ellipsis;
    overflow: hidden;
    
`
const Price = styled.h4`
    line-height: 0;
    font-weight: 550;
    color: #1D69A8;
    transition: color 400ms ease-in-out;
    ${(props) => {
        switch (props.isSelected) {
            case true:
                return `
                    color: var(--color)
                `
            default:
                break;
        }
    }}
`