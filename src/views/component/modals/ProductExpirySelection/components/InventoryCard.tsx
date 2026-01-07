// @ts-nocheck
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
import {
  clearProductExpirySelector,
  selectProduct,
} from '@/features/warehouse/productExpirySelectionSlice';

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

const StyledIconWrapper = styled.div`
  width: ${({ size }) => size || '1rem'};
  height: ${({ size }) => size || '1rem'};
  margin-right: ${({ marginRight }) => marginRight || '0.5rem'};
  color: ${({ color }) => color};
`;

const StyledBadge = styled.span`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #fff;
  background-color: ${({ variant }) =>
    variant === 'default' ? '#1890ff' : '#faad14'};
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

const StyledProgress = styled.div`
  width: ${({ width }) => width}%;
  height: 6px;
  background-color: #1890ff;
  border-radius: 8px;
`;

const InventoryCard = ({ item }) => {
  const dispatch = useDispatch();
  const product = useSelector(selectProduct);
  const getDateIsoFromTimestamp = (timestamp) => {
    const milliseconds = timestamp?.seconds * 1000;
    const dateObject = new Date(milliseconds);
    return dateObject.toISOString().split('T')[0];
  };
  const { productStock, batch } = item;
  const handleSelect = () => {
    try {
      Modal.confirm({
        title: 'Confirmación',
        content: `¿Está seguro que desea seleccionar el producto?`,
        okText: 'Sí',
        cancelText: 'No',
        onOk: () => {
          const newItem = {
            ...product,
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
          <StyledBadge variant={item.stock > 50 ? 'default' : 'secondary'}>
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
