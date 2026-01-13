import {
  faEdit,
  faEye,
  faTrash,
  faPrint,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { OPERATION_MODES } from '@/constants/modes';
import { handleDeleteProductAlert } from '@/features/Alert/AlertSlice';
import { toggleBarcodeModal } from '@/features/barcodePrintModalSlice/barcodePrintModalSlice';
import { openModalUpdateProd } from '@/features/modals/modalSlice';
import { ChangeProductData } from '@/features/updateProduct/updateProductSlice';
import { formatPrice } from '@/utils/format';
import { formatNumber } from '@/utils/format';
import { getTax, getTotalPrice } from '@/utils/pricing';
import { ImgCell } from '@/components/ui/AdvancedTable/components/Cells/Img/ImgCell';
import type { ProductRecord } from '@/types/products';

type ProductItemProps = {
  data: ProductRecord;
  taxReceiptEnabled: boolean;
};

type StockStatus = 'no-track' | 'out' | 'low' | 'normal';

type ActionVariant = 'edit' | 'print' | 'delete';


export const ProductItem = ({ data, taxReceiptEnabled }: ProductItemProps) => {
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
    dispatch(
      ChangeProductData({
        product: data,
        status: OPERATION_MODES.UPDATE.label,
      }),
    );
  };

  const handlePrintBarcode = () => {
    dispatch(toggleBarcodeModal(data));
  };

  const handleDelete = () => {
    dispatch(handleDeleteProductAlert({ id: data.id }));
  };

  const getStockStatus = (): StockStatus => {
    const stockValue = Number(stock ?? 0);
    if (!trackInventory) return 'no-track';
    if (stockValue <= 0) return 'out';
    if (stockValue <= 10) return 'low';
    return 'normal';
  };

  const getStockIcon = () => {
    const status = getStockStatus();
    switch (status) {
      case 'out':
        return '⚠️';
      case 'low':
        return '⚡';
      case 'normal':
        return '✅';
      case 'no-track':
        return '📦';
      default:
        return '📦';
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
            <DetailValue>{formatPrice(cost)}</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Impuesto:</DetailLabel>
            <DetailValue>{formatPrice(tax)}</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Stock:</DetailLabel>
            <StockDetailValue $status={getStockStatus()}>
              <StockIcon>{getStockIcon()}</StockIcon>
              <span>
                {trackInventory ? formatNumber(Number(stock ?? 0)) : 'No rastrea'}
              </span>
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
              <span>
                {formatPrice(price)} / {unit}
              </span>
            ) : (
              <span>{formatPrice(price)}</span>
            )}
          </TotalValue>
        </TotalPriceSection>
        <ActionButtons>
          <ActionButton onClick={handleEdit} variant="edit" title="Editar">
            <FontAwesomeIcon icon={faEdit} />
          </ActionButton>
          <ActionButton
            onClick={handlePrintBarcode}
            variant="print"
            title="Imprimir código de barras"
          >
            <FontAwesomeIcon icon={faPrint} />
          </ActionButton>
          <ActionButton
            onClick={handleDelete}
            variant="delete"
            title="Eliminar"
          >
            <FontAwesomeIcon icon={faTrash} />
          </ActionButton>
        </ActionButtons>
      </ActionBar>
    </Card>
  );
};

const Card = styled.div`
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
  transition: all 0.2s ease;

  &:hover {
    border-color: #d9d9d9;
    box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
`;

const ProductInfo = styled.div`
  display: flex;
  flex: 1;
  gap: 12px;
  min-width: 0;
`;

const ProductImage = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
`;

const ProductDetails = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const ProductName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: #1a1a1a;
  white-space: nowrap;
`;

const CategoryTag = styled.span`
  width: fit-content;
  max-width: 100%;
  padding: 2px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  background: #f5f5f5;
  border-radius: 3px;
`;

const HeaderMeta = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
`;

const VisibilityIndicator = styled.div<{ $isVisible?: boolean }>`
  align-items: center;
  border-radius: 4px;
  display: flex;
  font-size: 12px;
  height: 24px;
  justify-content: center;
  width: 24px;

  ${({ $isVisible }) =>
    $isVisible
      ? `
    background: #f6ffed;
    color: #389e0d;
  `
      : `
    background: #fff2f0;
    color: #cf1322;
  `}
`;

const StockDetailValue = styled.div<{ $status: StockStatus }>`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $status }) => {
    switch ($status) {
      case 'out':
        return '#ff4d4f';
      case 'low':
        return '#faad14';
      case 'normal':
        return '#52c41a';
      case 'no-track':
        return '#8c8c8c';
      default:
        return '#8c8c8c';
    }
  }};

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
  margin-bottom: 2px;
  font-size: 10px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const DetailValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #333;
`;

const TotalPriceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
`;

const TotalLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const TotalValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  color: #1a1a1a;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button<{ variant: ActionVariant }>`
  align-items: center;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  height: 32px;
  justify-content: center;
  transition: all 0.2s ease;
  width: 32px;

  ${({ variant }) => {
    switch (variant) {
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
