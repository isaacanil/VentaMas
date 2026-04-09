// InventoryCard.js
import {
  faWarehouse,
  faBox,
  faCalendarAlt,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal } from 'antd';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { addProduct } from '@/features/cart/cartSlice';
import type { Product as CartProduct } from '@/features/cart/types';
import {
  clearProductExpirySelector,
  selectProduct,
} from '@/features/warehouse/productExpirySelectionSlice';

import type { InventoryDisplayItem } from '../fbFetchAllInventoryData';
import type { ProductRecord } from '@/types/products';

const StyledCard = styled.div`
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
`;

const StyledCardContent = styled.div`
  padding: 1rem;
`;

const StyledCardHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const StyledCardInfo = styled.div`
  display: flex;
  align-items: center;
`;

const StyledIconWrapper = styled.div<{
  size?: string;
  marginRight?: string;
  color?: string;
}>`
  width: ${(props) => props.size || '1rem'};
  height: ${(props) => props.size || '1rem'};
  margin-right: ${(props) => props.marginRight || '0.5rem'};
  color: ${(props) => props.color};
`;

const StyledBadge = styled.span<{ variant?: string }>`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #fff;
  background-color: ${(props) =>
    props.variant === 'default' ? '#1890ff' : '#faad14'};
  border-radius: 12px;
`;

const StyledCardDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

const StyledLoteDetails = styled.div`
  display: flex;
  grid-column: span 2;
  align-items: center;
`;

const StyledProgressBar = styled.div`
  width: 100%;
  height: 6px;
  margin-top: 0.5rem;
  background-color: #e0e0e0;
  border-radius: 8px;
`;

const StyledProgress = styled.div<{ width?: number }>`
  width: ${(props) => props.width}%;
  height: 6px;
  background-color: #1890ff;
  border-radius: 8px;
`;

interface InventoryCardProps {
  item: InventoryDisplayItem;
}

type ProductBase = ProductRecord | null;

const InventoryCard = ({ item }: InventoryCardProps) => {
  const dispatch = useDispatch();
  const product: ProductBase = useSelector(selectProduct);
  const getDateIsoFromTimestamp = (timestamp: unknown): string => {
    if (!timestamp) return '';
    if (timestamp instanceof Date) {
      if (Number.isNaN(timestamp.getTime())) return '';
      return timestamp.toISOString().split('T')[0];
    }
    if (
      typeof timestamp === 'object' &&
      timestamp !== null &&
      'seconds' in timestamp &&
      typeof (timestamp as { seconds?: number }).seconds === 'number'
    ) {
      const seconds = (timestamp as { seconds: number }).seconds;
      const dateObject = new Date(seconds * 1000);
      if (Number.isNaN(dateObject.getTime())) return '';
      return dateObject.toISOString().split('T')[0];
    }
    if (typeof timestamp === 'number') {
      const dateObject = new Date(timestamp);
      if (Number.isNaN(dateObject.getTime())) return '';
      return dateObject.toISOString().split('T')[0];
    }
    return '';
  };
  const { productStock, batch } = item;
  const buildCartProduct = (base: ProductRecord): CartProduct => {
    const resolvedId = String(base.id ?? '');
    const resolvedName = base.name ?? base.productName ?? '';
    const resolvedBatchId =
      base.batchId !== undefined && base.batchId !== null
        ? String(base.batchId)
        : undefined;
    const pricing = base.pricing ?? {};
    const priceValue = Number(
      (pricing as { price?: number | string }).price ?? 0,
    );
    const listPriceValue = Number(
      (pricing as { listPrice?: number | string }).listPrice ?? priceValue,
    );
    const taxValue = (pricing as { tax?: number | string }).tax;
    const costTotal = Number(
      (base as { cost?: { total?: number } }).cost?.total ??
        (pricing as { cost?: number }).cost ??
        0,
    );

    return {
      ...(base as ProductRecord),
      id: resolvedId,
      cid: resolvedId,
      name: resolvedName,
      batchId: resolvedBatchId,
      amountToBuy: Number((base as { amountToBuy?: number }).amountToBuy ?? 1),
      pricing: {
        ...(pricing as Record<string, unknown>),
        listPrice: listPriceValue,
        price: priceValue,
        currency: (pricing as { currency?: string }).currency,
        tax: taxValue,
      },
      cost: { total: costTotal },
    };
  };
  const handleSelect = () => {
    try {
      Modal.confirm({
        title: 'Confirmación',
        content: `¿Está seguro que desea seleccionar el producto?`,
        okText: 'Sí',
        cancelText: 'No',
        onOk: () => {
          if (!product?.id) {
            console.warn('Producto no válido para agregar al carrito.');
            return;
          }
          const cartProduct = buildCartProduct(product);
          const newItem = {
            ...cartProduct,
            productStock,
            batch,
          };

          dispatch(addProduct(newItem));
          dispatch(clearProductExpirySelector());
        },
        onCancel: () => {
          // Opcional: manejar acción si se cancela
        },
      });
    } catch (err) {
      console.error('Error selecting inventory product', err);
    }
  };

  return (
    <StyledCard onClick={handleSelect}>
      <StyledCardContent>
        <StyledCardHeader>
          <StyledCardInfo>
            <StyledIconWrapper size="1rem" marginRight="0.5rem" color="#1890ff">
              <FontAwesomeIcon icon={faWarehouse} />
            </StyledIconWrapper>
            <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
              {item.warehouse}
            </span>
          </StyledCardInfo>
          <StyledBadge
            variant={(item.stock ?? 0) > 50 ? 'default' : 'secondary'}
          >
            {item?.productStock?.stock}
          </StyledBadge>
        </StyledCardHeader>
        <StyledCardDetails>
          <StyledCardInfo>
            <StyledIconWrapper
              size="0.75rem"
              marginRight="0.25rem"
              color="#52c41a"
            >
              <FontAwesomeIcon icon={faBox} />
            </StyledIconWrapper>
            {item.shortName ? item.shortName : ''}
            {item.shelf ? `-${item.shelf}` : ''}
            {item.row ? `-${item.row}` : ''}
            {item.segment ? `-${item.segment}` : ''}
          </StyledCardInfo>
          {item?.batch?.expirationDate && (
            <StyledCardInfo>
              <StyledIconWrapper
                size="0.75rem"
                marginRight="0.25rem"
                color="#ff4d4f"
              >
                <FontAwesomeIcon icon={faCalendarAlt} />
              </StyledIconWrapper>
              <span>
                {getDateIsoFromTimestamp(item?.batch?.expirationDate)}
              </span>
            </StyledCardInfo>
          )}
          <StyledLoteDetails>
            <StyledIconWrapper
              size="0.75rem"
              marginRight="0.25rem"
              color="#faad14"
            >
              <FontAwesomeIcon icon={faChartBar} />
            </StyledIconWrapper>
            <span>Lote: {item?.batch?.shortName}</span>
          </StyledLoteDetails>
        </StyledCardDetails>
        <StyledProgressBar>
          <StyledProgress width={Math.min(item.productStock.stock, 100)} />
        </StyledProgressBar>
      </StyledCardContent>
    </StyledCard>
  );
};

export default InventoryCard;
