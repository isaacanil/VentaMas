import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import noImg from '../../../../../../../../assets/producto/noimg.png';
import { icons } from '../../../../../../../../constants/icons/icons';
import { OPERATION_MODES } from '../../../../../../../../constants/modes';
import { handleDeleteProductAlert } from '../../../../../../../../features/Alert/AlertSlice';
import { openModalUpdateProd } from '../../../../../../../../features/modals/modalSlice';
import { ChangeProductData } from '../../../../../../../../features/updateProduct/updateProductSlice';
import useImageFallback from '../../../../../../../../hooks/image/useImageFallback';
import { useCheckForInternetConnection } from '../../../../../../../../hooks/useCheckForInternetConnection';
import {
  Button,
  ButtonGroup,
} from '../../../../../../../templates/system/Button/Button';
import StockIndicator from '../../../../../../../templates/system/labels/StockIndicator';


export const ProductCardRow = ({ product, Col, Row }) => {
  const dispatch = useDispatch();
  const handleDeleteProduct = (id) => {
    dispatch(handleDeleteProductAlert({ id }));
  };
  const handleUpdateProduct = (product) => {
    dispatch(openModalUpdateProd());
    dispatch(
      ChangeProductData({
        product: product,
        status: OPERATION_MODES.UPDATE.label,
      }),
    );
  };
  const isConnected = useCheckForInternetConnection();
  const [imageFallback] = useImageFallback(product?.productImageURL, noImg);
  return (
    <Container onClick={() => handleUpdateProduct(product)}>
      <Row>
        <Col>
          <ImgContainer>
            <Img
              src={(isConnected && imageFallback) || noImg}
              noFound={product?.productImageURL ? false : true}
              alt=""
              style={
                product?.productImageURL === imageFallback
                  ? { objectFit: 'cover' }
                  : { objectFit: 'contain' }
              }
            />
          </ImgContainer>
        </Col>
        <Col>
          <ProductName>{product?.productName}</ProductName>
        </Col>
        <Col position="right">
          <Item position="right">
            <StockIndicator
              stock={product?.stock}
              trackInventory={product?.trackInventory}
            ></StockIndicator>
          </Item>
        </Col>
        <Col position="right">
          <Item position="right">
            <span>{formatPrice(product?.cost?.unit)}</span>
          </Item>
        </Col>
        {/* <Item>
                    <span>Contenido Neto: {product.netContent}</span>
                </Item> */}
        <Col position="right">
          <Item position="right">
            <span>
              {formatPrice(product?.tax?.value * product?.cost?.unit)}
            </span>
          </Item>
        </Col>
        <Col position="right">
          <Item position="right">
            <span>{formatPrice(product?.price?.unit)}</span>
          </Item>
        </Col>
        <Col position="right">
          <ButtonGroup>
            <Button
              startIcon={icons?.operationModes?.edit}
              borderRadius="normal"
              color={'gray-dark'}
              width="icon32"
              bgcolor="editar"
              onClick={() => handleUpdateProduct(product)}
            />
            <Button
              startIcon={icons.operationModes.delete}
              width="icon32"
              color={'gray-dark'}
              borderRadius="normal"
              onClick={() => handleDeleteProduct(product?.id)}
            />
          </ButtonGroup>
        </Col>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  padding-right: 0.6em;
  padding-right: 0;
  background-color: white;
`;
const ImgContainer = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  max-height: 2.75em;
  overflow: hidden;
  border-radius: var(--border-radius-light);
`;
const Img = styled.img`
  height: 100%;
  object-fit: cover;
  object-position: center;
  width: 100%;
  ${(props) => {
    switch (props.noFound) {
      case true:
        return `
        object-fit: contain;`;
      default:
        return ``;
    }
  }}
`;
const ProductName = styled.span`
  padding: 0;
  margin: 0;
  font-weight: 500;
  color: var(--gray7);
`;
const Item = styled.div`
  ${(props) => {
    switch (props.position) {
      case 'right':
        return `
                justify-self: end;
                `;
      default:
        return `
                justify-self: start;
                `;
    }
  }}
`;
