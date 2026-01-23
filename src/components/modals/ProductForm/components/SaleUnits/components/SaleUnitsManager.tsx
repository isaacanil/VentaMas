// SaleUnitsManager.tsx
'use client';

import { PlusOutlined } from '@/constants/icons/antd';
import { Button } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { selectUpdateProductData } from '@/features/updateProduct/updateProductSlice';
import {
  fbDeleteSaleUnit,
  useListenSaleUnits,
} from '@/firebase/products/saleUnits/fbUpdateSaleUnit';
import type { ProductRecord } from '@/types/products';
import type { InventoryUser } from '@/utils/inventory/types';

import { SaleUnit } from './SaleUnit';
import type { SaleUnitRecord } from './SaleUnit';
import SaleUnitForm from './SaleUnitForm';

const ManagerContainer = styled.div`
  margin-bottom: 20px;
`;
const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;
type SaleUnitsManagerProps = {
  onShowPricingModal: (unit: SaleUnitRecord) => void;
};

const SaleUnitsManager = ({ onShowPricingModal }: SaleUnitsManagerProps) => {
  const {
    product: { id: productId },
  } = useSelector(selectUpdateProductData) as { product: ProductRecord };
  const user = useSelector(selectUser) as InventoryUser | null;

  const { data: saleUnits } = useListenSaleUnits(productId) as {
    data: SaleUnitRecord[];
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<SaleUnitRecord | null>(null);

  const showAddModal = () => {
    setCurrentUnit(null);
    setIsModalVisible(true);
  };

  const showEditModal = (unit: SaleUnitRecord) => {
    setCurrentUnit(unit);
    setIsModalVisible(true);
  };

  const handleInfo = (unit: SaleUnitRecord) => {
    onShowPricingModal(unit);
  };

  const handleSubmit = (_values: unknown) => {
    setIsModalVisible(false);
    setCurrentUnit(null);
  };
  const handleDelete = (id: string) => {
    fbDeleteSaleUnit(user, productId, id);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentUnit(null);
  };

  return (
    <ManagerContainer>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showAddModal}
          style={{ marginBottom: '20px' }}
        >
          Unidad de Venta
        </Button>
      </div>
      <CardsContainer>
        {saleUnits.map((unit) => (
          <SaleUnit
            key={unit?.id}
            unit={unit}
            onEdit={() => showEditModal(unit)}
            onDelete={() => handleDelete(unit?.id)}
            onInfo={() => handleInfo(unit)}
          />
        ))}
        {saleUnits.length === 0 && (
          <EmptySaleUnitsMessage>
            No hay unidades de venta configuradas.
          </EmptySaleUnitsMessage>
        )}
      </CardsContainer>
      <SaleUnitForm
        initialValues={currentUnit}
        isOpen={isModalVisible}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </ManagerContainer>
  );
};

export default SaleUnitsManager;

const EmptySaleUnitsMessage = styled.p`
  padding: 15px;
  font-size: 1rem;
  color: #666;
  text-align: center;
  background-color: #f9f9f9;
  border: 1px dashed #ccc;
  border-radius: 8px;
`;
