import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { handleDeleteProductAlert } from '../../../../../../../../features/Alert/AlertSlice';
import { openModalUpdateProd } from '../../../../../../../../features/modals/modalSlice';
import { ChangeProductData } from '../../../../../../../../features/updateProduct/updateProductSlice';
import { useCheckForInternetConnection } from '../../../../../../../../hooks/useCheckForInternetConnection';
import useImageFallback from '../../../../../../../../hooks/image/useImageFallback';
import { Button, ButtonGroup } from '../../../../../../../templates/system/Button/Button';
import noImg from '../../../../../../../../assets/producto/noImg.png';
import StockIndicator from '../../../../../../../templates/system/labels/StockIndicator';
import { useFormatPrice } from '../../../../../../../../hooks/useFormatPrice';
import { icons } from '../../../../../../../../constants/icons/icons';
import { OPERATION_MODES } from '../../../../../../../../constants/modes';


export const ProductCardRow = ({ product, Col, Row }) => {
  
    const dispatch = useDispatch();
    const handleDeleteProduct = (id) => {
        dispatch(handleDeleteProductAlert({id}));
    };
    const handleUpdateProduct = (product) => {
        dispatch(openModalUpdateProd());
        dispatch(ChangeProductData({ product: product, status: OPERATION_MODES.UPDATE.label }));
    };
    const isConnected = useCheckForInternetConnection()
    const [imageFallback] = useImageFallback(product?.productImageURL, noImg)
    return (
        <Container onClick={() => handleUpdateProduct(product)}>
            <Row>
                <Col>
                    <ImgContainer>
                        <Img
                            src={(isConnected && imageFallback) || noImg}
                            noFound={product?.productImageURL ? false : true}
                            alt=""
                            style={product?.productImageURL === imageFallback ? { objectFit: "cover" } : { objectFit: 'contain' }}

                        />
                    </ImgContainer>
                </Col>
                <Col>
                    <ProductName>
                        {product?.productName}
                    </ProductName>
                </Col>
                <Col position='right'>
                    <Item position='right'>
                        <StockIndicator stock={product?.stock} trackInventory={product?.trackInventory}></StockIndicator>
                    </Item>
                </Col>
                <Col position='right'>
                    <Item position='right'>
                        <span>{useFormatPrice(product?.cost?.unit)}</span>
                    </Item>
                </Col>
                {/* <Item>
                    <span>Contenido Neto: {product.netContent}</span>
                </Item> */}
                <Col position='right'>
                    <Item position='right'>
                        <span>{useFormatPrice(product?.tax?.value * product?.cost?.unit)}</span>
                    </Item>
                </Col>
                <Col position='right'>
                    <Item position='right'>
                        <span>{useFormatPrice(product?.price?.unit)}</span>
                    </Item>
                </Col>
                <Col position='right'>
                    <ButtonGroup>
                        <Button
                            startIcon={icons?.operationModes?.edit}
                            borderRadius='normal'
                            color={'gray-dark'}
                            width='icon32'
                            bgcolor='editar'
                            onClick={() => handleUpdateProduct(product)}
                        />
                        <Button
                            startIcon={icons.operationModes.delete}
                            width='icon32'
                            color={'gray-dark'}
                            borderRadius='normal'
                            onClick={() => handleDeleteProduct(product?.id)}
                        />
                    </ButtonGroup>
                </Col>
            </Row>
        </Container>
    )
}

const Container = styled.div`
 background-color: white;
 padding-right: 0.6em;
 padding-right: 0px;
`
const Head = styled.div`
   display: flex;
   align-items: center;

   justify-content: space-between;
   height: min-content;
`
const ImgContainer = styled.div`
    width: 100%;
    max-height: 2.75em;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    border-radius: var(--border-radius-light);
    
`
const Img = styled.img`
  object-fit: cover;
  object-position: center;
  width: 100%;
  height: 100%;
  ${props => {
        switch (props.noFound) {
            case true:
                return `
        object-fit: contain;`;
            default:
                return ``;
        }
    }}
`;
const Body = styled.div`
    display: grid;
    grid-template-columns: 
    minmax(200px, 1fr) //name
    minmax(100px, 0.4fr)  //cost
    minmax(100px, 0.4fr) //stock
    minmax(100px, 200px); //price
    align-items: center;
    gap: 1em;
    color: var(--Gray7);
    font-size: 14px;

`
const ProductName = styled.span`
    color: var(--Gray7);
        margin: 0;
        padding: 0;
        font-weight: 500;
        
    
`
const Group = styled.div`
    display: flex;
    justify-content: space-between;
`
const Item = styled.div`
    ${props => {
        switch (props.position) {
            case 'right':
                return `
                justify-self: end;
                `
            default:
                return `
                justify-self: start;
                `
        }
    }}
`