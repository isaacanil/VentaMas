import { EditOutlined, DeleteOutlined } from '@/constants/icons/antd';
import { Button, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import type { ProductPricing, ProductSaleUnit } from '@/types/products';
import { formatPrice } from '@/utils/format';

export type SaleUnitPricing = ProductPricing & {
  cost: number;
  price: number;
  listPrice: number;
  avgPrice: number;
  minPrice: number;
  tax?: ProductPricing['tax'];
  listPriceEnabled?: boolean;
  avgPriceEnabled?: boolean;
  minPriceEnabled?: boolean;
};

export type SaleUnitRecord = Omit<ProductSaleUnit, 'pricing'> & {
  pricing: SaleUnitPricing;
  packSize?: number;
  active?: boolean;
};

type SaleUnitProps = {
  unit?: SaleUnitRecord | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onInfo?: () => void;
};

export const SaleUnit = ({ unit, onEdit, onDelete, onInfo }: SaleUnitProps) => {
  const handleEdit = () => onEdit?.();
  const handleDelete = () => onDelete?.();
  const handleInfo = () => onInfo?.();
  const listPrice = Number(unit?.pricing?.listPrice ?? 0);

  return (
    <CustomCardContainer>
      <CardHeader>
        <div>
          <CardTitle>{unit?.unitName || 'Unidad de venta'}</CardTitle>
          {Number.isFinite(Number(unit?.packSize)) && (
            <CardSubtitle>Paquete: {unit.packSize}</CardSubtitle>
          )}
        </div>
        <Actions>
          {onInfo && (
            <Tooltip title="Info">
              <Button type="text" onClick={handleInfo} size="small">
                Ver
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              type="link"
              danger
              onClick={handleDelete}
              icon={<DeleteOutlined />}
              size="small"
            />
          </Tooltip>
        </Actions>
      </CardHeader>
      <CardFooter>
        {unit?.quantity != null && <p>Cantidad: {unit.quantity}</p>}
        <p>Precio: {formatPrice(listPrice)}</p>
      </CardFooter>
    </CustomCardContainer>
  );
};

const CustomCardContainer = styled.div`
  display: grid;
  gap: 12px;
  min-width: 240px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
`;

const CardHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const CardTitle = styled.div`
  font-weight: 600;
`;

const CardSubtitle = styled.div`
  font-size: 12px;
  color: #8c8c8c;
`;

const CardFooter = styled.div`
  display: grid;
  gap: 4px;

  p {
    margin: 0;
  }
`;
