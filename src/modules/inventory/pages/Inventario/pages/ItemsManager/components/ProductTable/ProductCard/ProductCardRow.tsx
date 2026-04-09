import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import noImg from '@/assets/producto/noimg.png';
import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { handleDeleteProductAlert } from '@/features/Alert/AlertSlice';
import { openModalUpdateProd } from '@/features/modals/modalSlice';
import { ChangeProductData } from '@/features/updateProduct/updateProductSlice';
import useImageFallback from '@/hooks/image/useImageFallback';
import { useCheckForInternetConnection } from '@/hooks/useCheckForInternetConnection';
import { formatPrice } from '@/utils/format';
import { Button, ButtonGroup } from '@/components/ui/Button/Button';
import StockIndicator from '@/components/ui/labels/StockIndicator';
import type { ProductRecord } from '@/types/products';

type LegacyProductRecord = ProductRecord & {
  productImageURL?: string;
  productName?: string;
  cost?: { unit?: number };
  tax?: { value?: number };
  price?: { unit?: number };
};

type GridComponentProps = {
  children: React.ReactNode;
  position?: string;
};

const DefaultRow = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const DefaultCol = ({ children }: GridComponentProps) => <div>{children}</div>;

type ProductCardRowProps = {
  product: LegacyProductRecord;
  Col?: React.ComponentType<GridComponentProps>;
  Row?: React.ComponentType<{ children: React.ReactNode }>;
  handleUpdateProduct?: (product: LegacyProductRecord) => void;
  handleDeleteProduct?: (id?: string | number | null) => void;
};

export const ProductCardRow = ({
  product,
  Col,
  Row,
  handleUpdateProduct,
  handleDeleteProduct,
}: ProductCardRowProps) => {
  const RowComponent = Row ?? DefaultRow;
  const ColComponent = Col ?? DefaultCol;
  const dispatch = useDispatch();
  const defaultHandleDeleteProduct = (
    id: string | number | null | undefined,
  ) => {
    dispatch(handleDeleteProductAlert({ id: id as string | null, user: null }));
  };
  const defaultHandleUpdateProduct = (product: LegacyProductRecord) => {
    dispatch(openModalUpdateProd());
    dispatch(
      ChangeProductData({
        product: product,
        status: OPERATION_MODES.UPDATE.label,
      }),
    );
  };
  const onDelete = handleDeleteProduct ?? defaultHandleDeleteProduct;
  const onUpdate = handleUpdateProduct ?? defaultHandleUpdateProduct;

  const isConnected = useCheckForInternetConnection();
  const [imageFallback] = useImageFallback(product?.productImageURL, noImg);
  return (
    <Container onClick={() => onUpdate(product)}>
      <RowComponent>
        <ColComponent>
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
        </ColComponent>
        <ColComponent>
          <ProductName>{product?.productName}</ProductName>
        </ColComponent>
        <ColComponent position="right">
          <Item position="right">
            <StockIndicator
              stock={product?.stock}
              trackInventory={product?.trackInventory}
            ></StockIndicator>
          </Item>
        </ColComponent>
        <ColComponent position="right">
          <Item position="right">
            <span>{formatPrice(product?.cost?.unit)}</span>
          </Item>
        </ColComponent>
        {/* <Item>
                    <span>Contenido Neto: {product.netContent}</span>
                </Item> */}
        <ColComponent position="right">
          <Item position="right">
            <span>
              {formatPrice(
                (product?.tax?.value ?? 0) * (product?.cost?.unit ?? 0),
              )}
            </span>
          </Item>
        </ColComponent>
        <ColComponent position="right">
          <Item position="right">
            <span>{formatPrice(product?.price?.unit)}</span>
          </Item>
        </ColComponent>
        <ColComponent position="right">
          <ButtonGroup>
            <Button
              startIcon={icons?.operationModes?.edit}
              borderRadius="normal"
              color={'gray-dark'}
              width="icon32"
              bgcolor="editar"
              onClick={() => onUpdate(product)}
            />
            <Button
              startIcon={icons.operationModes.delete}
              width="icon32"
              color={'gray-dark'}
              borderRadius="normal"
              onClick={() => onDelete(product?.id as any)}
            />
          </ButtonGroup>
        </ColComponent>
      </RowComponent>
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
const Img = styled.img<{ noFound?: boolean }>`
  height: 100%;
  object-fit: cover;
  object-position: center;
  width: 100%;
  ${({ noFound }: { noFound?: boolean }) => {
    switch (noFound) {
      case true:
        return `
        object-fit: contain;`;
      default:
        return ``;
    }
  }}
`;

const ProductName = styled.span`
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  font-weight: 500;
  color: var(--gray7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Item = styled.div<{ position?: string }>`
  ${({ position }: { position?: string }) => {
    switch (position) {
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
