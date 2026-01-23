import { Card } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  selectIsSoldInUnits,
  selectSelectedSaleUnit,
} from '@/features/updateProduct/updateProductSlice';
import type { SaleUnitRecord } from './SaleUnit';

const PricesContainer = styled.div`
  margin-top: 20px;
`;

const SaleUnitsPrices = () => {
  const selectedSaleUnit = useSelector(selectSelectedSaleUnit) as
    | SaleUnitRecord
    | null;
  const isSoldInUnits = useSelector(selectIsSoldInUnits) as boolean;

  if (!isSoldInUnits || !selectedSaleUnit) return null;

  const { pricing } = selectedSaleUnit;
  const cost = Number(pricing.cost ?? 0);
  const price = Number(pricing.price ?? 0);
  const listPrice = Number(pricing.listPrice ?? 0);
  const avgPrice = Number(pricing.avgPrice ?? 0);
  const minPrice = Number(pricing.minPrice ?? 0);

  return (
    <PricesContainer>
      <Card title={`Precios para ${selectedSaleUnit.unitName}`}>
        <p>Costo: ${cost.toFixed(2)}</p>
        <p>Precio: ${price.toFixed(2)}</p>
        <p>Precio de Lista: ${listPrice.toFixed(2)}</p>
        <p>Precio Promedio: ${avgPrice.toFixed(2)}</p>
        <p>Precio MÃ­nimo: ${minPrice.toFixed(2)}</p>
        <p>Impuesto: {pricing.tax}</p>
      </Card>
    </PricesContainer>
  );
};

export default SaleUnitsPrices;
