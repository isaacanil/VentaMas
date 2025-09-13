import React, { useRef } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faEye, 
  faBox, 
  faTags,
  faBarcode,
  faTrash,
  faPrint,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { Tag } from 'antd';
import { useFormatPrice } from '../../../../../../../../hooks/useFormatPrice';
import { useFormatNumber } from '../../../../../../../../hooks/useFormatNumber';
import { useDispatch } from 'react-redux';
import { openModalUpdateProd } from '../../../../../../../../features/modals/modalSlice';
import { ChangeProductData } from '../../../../../../../../features/updateProduct/updateProductSlice';
import { OPERATION_MODES } from '../../../../../../../../constants/modes';
import { toggleBarcodeModal } from '../../../../../../../../features/barcodePrintModalSlice/barcodePrintModalSlice';
import { handleDeleteProductAlert } from '../../../../../../../../features/Alert/AlertSlice';
import { getTax, getTotalPrice } from '../../../../../../../../utils/pricing';

import { ImgCell } from '../../../../../../../templates/system/AdvancedTable/components/Cells/Img/ImgCell';
import { icons } from '../../../../../../../../constants/icons/icons';

export const ProductItem = ({ data, taxReceiptEnabled }) => {
  const dispatch = useDispatch();
  
  // Data extraction
  const name = data?.name;
  const image = data?.image;
  const stock = data?.stock;
  const trackInventory = data?.trackInventory;
  const cost = data?.pricing?.cost;
  const price = getTotalPrice(data, taxReceiptEnabled);
  const tax = getTax(data);
  const category = data?.category;
  const isVisible = data?.isVisible;
  const unit = data?.weightDetail?.weightUnit;
  const isSoldByWeight = data?.weightDetail?.isSoldByWeight;

  const handleEdit = () => {
    dispatch(openModalUpdateProd());
    dispatch(ChangeProductData({ product: data, status: OPERATION_MODES.UPDATE.label }));
  };

  const handlePrintBarcode = () => {
    dispatch(toggleBarcodeModal(data));
  };

  const handleDelete = () => {
    dispatch(handleDeleteProductAlert({ id: data.id }));
  };

  const getStockStatus = () => {
    if (!trackInventory) return 'no-track';
    if (stock <= 0) return 'out';
    if (stock <= 10) return 'low';
    return 'normal';
  };

  const getStockColor = () => {
    const status = getStockStatus();
    switch (status) {
      case 'out': return '#ff4d4f';
      case 'low': return '#faad14';
      case 'normal': return '#52c41a';
      case 'no-track': return '#8c8c8c';
      default: return '#8c8c8c';
    }
  };

  const getStockIcon = () => {
    const status = getStockStatus();
    switch (status) {
      case 'out': return '⚠️';
      case 'low': return '⚡';
      case 'normal': return '✅';
      case 'no-track': return '📦';
      default: return '📦';
    }
  };
   
    return (
    <Card onClick={handleEdit}>
      {/* Header con imagen y nombre */}
      <CardHeader>
        <ProductInfo>
          <ProductImage>
            <ImgCell img={image} />
          </ProductImage>
          <ProductDetails>
            <ProductName>{name}</ProductName>
            <CategoryTag>{category || 'Sin categoría'}</CategoryTag>
          </ProductDetails>
        </ProductInfo>
        <HeaderMeta>
          <VisibilityIndicator $isVisible={isVisible}>
            {isVisible ? (
              <FontAwesomeIcon icon={faEye} />
            ) : (
              <FontAwesomeIcon icon={faEyeSlash} />
            )}
          </VisibilityIndicator>
        </HeaderMeta>
      </CardHeader>

      {/* Detalles financieros */}
      <FinancialDetails>
        <DetailsRow>
          <DetailItem>
            <DetailLabel>Costo:</DetailLabel>
            <DetailValue>{useFormatPrice(cost)}</DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Impuesto:</DetailLabel>
            <DetailValue>{useFormatPrice(tax)}</DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Stock:</DetailLabel>
            <StockDetailValue $status={getStockStatus()}>
              <StockIcon>{getStockIcon()}</StockIcon>
              <span>{trackInventory ? useFormatNumber(stock) : 'No rastrea'}</span>
            </StockDetailValue>
          </DetailItem>
        </DetailsRow>
      </FinancialDetails>

      {/* Acciones */}
      <ActionBar onClick={(e) => e.stopPropagation()}>
        <TotalPriceSection>
          <TotalLabel>Precio de venta:</TotalLabel>
          <TotalValue>
            {isSoldByWeight ? (
              <span>{useFormatPrice(price)} / {unit}</span>
            ) : (
              <span>{useFormatPrice(price)}</span>
            )}
          </TotalValue>
        </TotalPriceSection>
        <ActionButtons>
          <ActionButton onClick={handleEdit} variant="edit" title="Editar">
            <FontAwesomeIcon icon={faEdit} />
          </ActionButton>
          <ActionButton onClick={handlePrintBarcode} variant="print" title="Imprimir código de barras">
            <FontAwesomeIcon icon={faPrint} />
          </ActionButton>
          <ActionButton onClick={handleDelete} variant="delete" title="Eliminar">
            <FontAwesomeIcon icon={faTrash} />
          </ActionButton>
        </ActionButtons>
      </ActionBar>
    </Card>
  );
};

const Card = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    border-color: #d9d9d9;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

const ProductInfo = styled.div`
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const ProductImage = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
`;

const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CategoryTag = styled.span`
  font-size: 11px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
`;

const VisibilityIndicator = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  ${({ $isVisible }) => $isVisible ? `
    background: #f6ffed;
    color: #389e0d;
  ` : `
    background: #fff2f0;
    color: #cf1322;
  `}
`;

const StockDetailValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: ${({ $status }) => {
    switch ($status) {
      case 'out': return '#ff4d4f';
      case 'low': return '#faad14';
      case 'normal': return '#52c41a';
      case 'no-track': return '#8c8c8c';
      default: return '#8c8c8c';
    }
  }};
  font-weight: 600;
  
  span {
    line-height: 1;
  }
`;

const StockIcon = styled.span`
  font-size: 10px;
  line-height: 1;
`;

const FinancialDetails = styled.div`
  margin-bottom: 12px;
`;

const DetailsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const DetailLabel = styled.span`
  font-size: 10px;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
`;

const DetailValue = styled.span`
  font-size: 12px;
  color: #333;
  font-weight: 600;
`;

const TotalPriceSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
`;

const TotalLabel = styled.span`
  font-size: 10px;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const TotalValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ variant }) => {
    switch(variant) {
      case 'edit':
        return `
          background: #fff;
          border-color: #d9d9d9;
          color: #666;
          
          &:hover {
            background: #f5f5f5;
            border-color: #999;
            color: #333;
          }
        `;
      case 'print':
        return `
          background: #1890ff;
          border-color: #1890ff;
          color: white;
          
          &:hover {
            background: #40a9ff;
            border-color: #40a9ff;
          }
        `;
      case 'delete':
        return `
          background: #fff;
          border-color: #d9d9d9;
          color: #ff4d4f;
          
          &:hover {
            background: #fff2f0;
            border-color: #ff4d4f;
            color: #cf1322;
          }
        `;
      default:
        return '';
    }
  }}
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    font-size: 12px;
  }
`;

