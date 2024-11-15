import React, { Fragment, useEffect, useMemo, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { addProduct, deleteProduct, SelectProduct, } from '../../../../../features/cart/cartSlice'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import noImg from '../../../../../assets/producto/noimg.png'
import { useProductInCart, useProductStockStatus } from './IsProductSelected'
import { Button } from '../../Button/Button'
import { icons } from '../../../../../constants/icons/icons'
import { useCheckForInternetConnection } from '../../../../../hooks/useCheckForInternetConnection'
import useImageFallback from '../../../../../hooks/image/useImageFallback'
import { motion } from 'framer-motion'
import { getTotalPrice } from '../../../../../utils/pricing'
import { notification } from 'antd'
// import { ProductWeightEntryModal } from '../../../../component/modals/ProductWeightEmtryModal/ProductWeightEntryModal'
// import { BatchSelectorModal } from './BatchSelectorModal'
import { selectTaxReceiptEnabled } from '../../../../../features/taxReceipt/taxReceiptSlice'
import { openProductExpirySelector } from '../../../../../features/warehouse/productExpirySelectionSlice'
import { useFormatNumber } from '../../../../../hooks/useFormatNumber'
import { truncateString } from '../../../../../utils/text/truncateString'

const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
}

export const Product = ({ product, }) => {
    const dispatch = useDispatch();
    const ProductsSelected = useSelector(SelectProduct);
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

    const imageHiddenRef = false;

    const [isOpenBatchModal, setIsOpenBatchModal] = useState(false);
    const [productWeightEntryModal, setProductWeightEntryModal] = useState(false);
    const [isImageLoaded, setImageLoaded] = useState(false);

    const isConnected = useCheckForInternetConnection();
    // const productCheckInCart = isProductSelected(ProductsSelected, product.id);
    const [imageFallback] = useImageFallback(product?.image, noImg);

    const { status: isProductInCart, product: productInCart } = useProductInCart(product.id);

    const { isLowStock, isOutOfStock } = useProductStockStatus(product, productInCart)

    const price = useMemo(() => getTotalPrice(product, taxReceiptEnabled), [product, taxReceiptEnabled]);

    const handleGetThisProduct = (product) => {
        if (isLowStock) {
            notification.warning({
                message: 'Alerta de Stock Bajo',
                description: `El stock de ${product.name} está por debajo del umbral de 20 unidades\nStock actual: ${product?.stock} unidades`,
            });
        }
        if (isOutOfStock) {
            notification.warning({
                message: 'Alerta de Stock Agotado',
                description: `El stock de ${product.name} está agotado\nStock actual: ${product?.stock} unidades`,
            });

            return;
        }
        if (product?.hasBatch) {
            dispatch(openProductExpirySelector(product))
            return
        }
        if (product?.weightDetail?.isSoldByWeight) {
            setProductWeightEntryModal(true);
            return
        }
    
        dispatch(addProduct(product))
    }

    const deleteProductFromCart = (e, id) => {
        if (e) { e.stopPropagation() }
        dispatch(deleteProduct(id))
    }

    // const openBatchModal = () => setIsOpenBatchModal(true);
    // const closeBatchModal = () => setIsOpenBatchModal(false);
    // const getBatch = (batch) => console.log(batch)

    const isDisabled = isOutOfStock || isLowStock
    return (
        <Fragment>
            <Container
                onClick={() => handleGetThisProduct(product)}
                imageHiddenRef={imageHiddenRef}
                isSelected={isProductInCart}
                isDisabled={isDisabled}
                variants={item}
            >
                {
                    <ImageWrapper imageHiddenRef={imageHiddenRef ? true : false}>
                        <ImageContainer imageHiddenRef={imageHiddenRef}>
                            {!isImageLoaded && <Loader isImageLoaded={isImageLoaded} />}
                            {
                                <img
                                    src={(isConnected && imageFallback) || noImg}
                                    onLoad={() => setImageLoaded(true)}
                                />
                            }
                        </ImageContainer>
                    </ImageWrapper>
                }
              {isOutOfStock && <StockWarning>Agotado</StockWarning>}
              {isLowStock && !isOutOfStock && <StockWarning>Pocas unidades</StockWarning>}
                <Content>
                    <Header>
                        <Title isOpen={isProductInCart}>
                            {truncateString(product.name, 53)}
                        </Title>
                        {isProductInCart && (
                            <Button
                                startIcon={icons.operationModes.discard}
                                width='icon24'
                                color={'on-error'}
                                borderRadius='normal'
                                onClick={(e) => deleteProductFromCart(e, product?.id)}
                            />
                        )}
                    </Header>
                    {/* <Body>
                        
                    </Body> */}
                    <Footer imageHiddenRef={imageHiddenRef} isSelected={isProductInCart}>
                        <Group>
                            <AmountToBuy isDisabled={isDisabled} >{isProductInCart && `${useFormatNumber(productInCart?.amountToBuy)} / `} {useFormatNumber(product.stock)}</AmountToBuy>
                        </Group>
                        <Group>
                            {
                                product?.weightDetail?.isSoldByWeight ? (
                                    <Price isDisabled={isDisabled} >
                                        {useFormatPrice(price)} / {product?.weightDetail?.weightUnit}
                                    </Price>
                                ) : (
                                    <Price isDisabled={isDisabled} isSelected={isProductInCart}>{useFormatPrice((price))}</Price>
                                )
                            }
                        </Group>
                    </Footer>
                </Content>

            </Container>
            {/* <ProductWeightEntryModal
                isVisible={productWeightEntryModal}
                product={product}
                onAdd={() => {
                    dispatch(addProduct(product))
                    setProductWeightEntryModal(false);
                }}
                onCancel={() => {
                    setProductWeightEntryModal(false);
                }}
            />
            <BatchSelectorModal
                isOpen={isOpenBatchModal}
                productId={product.id}
                onClose={closeBatchModal}
                onAdd={getBatch}

            /> */}
        </Fragment>

    )
}
const OutOfStockContainer = '#fffcce';
const OutOfStock = '#ffd000';
const Container = styled(motion.li)`
    box-shadow: 2px 2px 10px 2px rgba(0, 0, 0, 0.020);
    height: 80px;
    width: 100%;
    border-radius: var(--border-radius);
    display: flex;
    gap: 6px;
    overflow: hidden;
    transition: 400ms all ease-in-out;
    background-color: ${(props) => (props.isDisabled ? '#ffffff' : '#ffffff')};
    position: relative;
    outline: 2px solid transparent;
    :hover{
        img{
            filter: brightness(105%);
            transition: 300ms filter ease-in-out;
        }
    }
    outline: ${(props) => (props.isSelected ? props.isDisabled ? '2.9px solid black' : '2.9px solid var(--color)' : '2.9px solid transparent')};
   
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
const Content = styled.div`
    display: grid;

    width: 100%;
    grid-template-rows: 1fr min-content;
`
const Header = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0.1em 0.4em 0;
    font-size: 14px;
    font-weight: 600;
    
    color: var(--Gray6);
    letter-spacing: 0.4px;
`
const StockWarning = styled.div`
position: absolute;
bottom: 0;
width: 90px;
text-align: center;
line-height: 1.2em;
left: 0;

padding: 0.6em 0.4em 0.2em;
/* background-color: #ffcece; */
background: linear-gradient(180deg, rgba(255, 77, 80, 0), #000000 50%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    border-radius: 0 10px 0 0;

`
const ImageWrapper = styled.div`
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
    padding: 4px 0;
    position: relative;
    transition: 4000ms all ease-in-out;
    display: grid;

    grid-template-rows: 1fr min-content min-content;
    transition: all 400ms ease-in-out;
   
`
const ImageContainer = styled.div`
    height: 80px;
    width: 80px;
    overflow: hidden;
    position: relative;
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
    padding: 0 0.8em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    pointer-events: none;
    
    border-top-left-radius: ${(props) => {
        return props.imageHiddenRef === false ? '10px' : '0'
    }
    };
transition:  800ms border-radius ease-in-out;

font-weight: 400;
color: var(--Gray6);
letter-spacing: 0.2px;
   
`
const AmountToBuy = styled.div`
    padding: 0 0.4em;
    height: 1.4em;
    width: min-content;
    border-radius: 4px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    background-color: var(--White4);
    background-color: ${props => props.isDisabled ? 'var(--White4)' : 'var(--White4)'};
    color: ${props => props.isDisabled ? 'black' : 'var(--color)'};
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
    padding: 0.4em 0.4em 0;  
    display: -webkit-box;
    font-weight: 600;
    letter-spacing: 0.4px;
    /* -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;   */
    
    overflow: hidden;
    /* word-wrap: break-word; */
    /* overflow-wrap: break-word; */
    hyphens: auto; 
    /* text-overflow: ellipsis; */

    /* ${(props) => {
        switch (props.isOpen) {
            case false:
                return `
                    padding: 0.4em 1em 0 0em;

                `
            default:
                break;
        }
    }} */
`;
const Price = styled.div`
  display: block;
  height: 100%;
    font-weight: 550;
    color: ${(props) => (props.isSelected ? (props.isDisabled ? 'black' : 'var(--color)') : 'var(--color)')};
    font-size: 14px;
    transition: color 400ms ease-in-out;

`
const loadingAnimation = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const Loader = styled.div`
position: absolute;
top: 0;
left: 0;
    background-size: 200% 100%;
    animation: ${props => props.isImageLoaded ? 'none' : css`${loadingAnimation} 1.5s infinite`};
    background: ${props => props.isImageLoaded ? 'none' : 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)'};
`