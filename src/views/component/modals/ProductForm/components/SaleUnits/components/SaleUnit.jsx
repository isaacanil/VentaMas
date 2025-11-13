import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';

const CustomCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 300px;
  height: 100%;
  padding: 16px;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
`;
const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const CardFooter = styled.div`
  margin-top: 16px;
`;

export const SaleUnit = ({ unit, onEdit, onDelete, onInfo }) => {
  const handleViewInfo = (e) => {
    e.stopPropagation();
    onInfo();
  };
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };
  return (
    <CustomCardContainer onClick={handleViewInfo}>
      <CardHeader>
        <span>{unit?.unitName}</span>
        <div>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="small"
              style={{ marginRight: '8px' }}
            />
          </Tooltip>
          <Button
            type="link"
            danger
            onClick={handleDelete}
            icon={<DeleteOutlined />}
            size="small"
          />
        </div>
      </CardHeader>
      <CardFooter>
        <p>Cantidad: {unit?.quantity}</p>
        <p>Precio: {useFormatPrice(unit?.pricing?.listPrice)}</p>
      </CardFooter>
    </CustomCardContainer>
  );
};
