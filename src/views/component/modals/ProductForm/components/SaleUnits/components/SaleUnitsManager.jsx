// SaleUnitsManager.jsx
'use client';

import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { selectUpdateProductData } from '../../../../../../../features/updateProduct/updateProductSlice';
import {
  fbDeleteSaleUnit,
  useListenSaleUnits,
} from '../../../../../../../firebase/products/saleUnits/fbUpdateSaleUnit';

import { SaleUnit } from './SaleUnit';
import SaleUnitForm from './SaleUnitForm';

const ManagerContainer = styled.div`
  margin-bottom: 20px;
`;
const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;
const SaleUnitsManager = ({ onShowPricingModal }) => {
  const {
    product: { id: productId },
  } = useSelector(selectUpdateProductData);
  const user = useSelector(selectUser);

  const { data: saleUnits } = useListenSaleUnits(productId);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUnit, setCurrentUnit] = useState(null);

  const showAddModal = () => {
    setCurrentUnit(null);
    setIsModalVisible(true);
  };

  const showEditModal = (unit) => {
    setCurrentUnit(unit);
    setIsModalVisible(true);
  };

  const handleInfo = (unit) => {
    onShowPricingModal(unit);
  };

  const handleSubmit = (_values) => {
    setIsModalVisible(false);
    setCurrentUnit(null);
  };
  const handleDelete = (id) => {
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
