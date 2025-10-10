import { DeleteOutlined } from '@ant-design/icons';
import { CalendarOutlined } from '@ant-design/icons';
import { faBoxes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

import ProductStock from './ProductStock';

const BatchContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  margin-bottom: 0px;
  
  .batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;

    .batch-info {
      .batch-number {
        font-size: 1.2rem;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 6px;
        letter-spacing: -0.01em;
      }

      .batch-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #64748b;
        font-size: 0.85rem;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }
      }
    }

    .batch-total {
      padding: 6px 12px;
      border-radius: 30px;
      font-weight: 600;
      font-size: 0.9rem;
      letter-spacing: 0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${props => props.$status.background}50;
      color: ${props => props.$status.color};
      border: 1px solid ${props => props.$status.color}20;

      .status-icon {
        font-size: 0.9rem;
      }
    }
  }

  .locations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 12px;
    padding: 0px;
  }
`;

const BatchActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DeleteButton = styled(Button)`
  &.ant-btn {
    border: none;
    background: transparent;
    color: #64748b;
    padding: 4px 8px;
    
    &:hover {
      color: #dc2626;
      background: #fee2e2;
    }
  }
`;

const BatchGroup = ({ 
  group, 
  getStockStatus, 
  handleDeleteBatch, 
  handleDeleteProductStock, 
  handleLocationClick,
  locationNames 
}) => {
  return (
    <BatchContainer $status={getStockStatus(group.total)}>
      <div className="batch-header">
        <div className="batch-info">
          <div className="batch-number">
            {group.batchNumberId ? `Lote #${group.batchNumberId}` : 'Sin lote asignado'}
          </div>
          <div className="batch-meta">
            {group.expirationDate && (
              <span className="meta-item">
                <CalendarOutlined />
                Vence: {new Date(group.expirationDate.seconds * 1000).toLocaleDateString()}
              </span>
            )}
            <span className="meta-item">
              <FontAwesomeIcon icon={faBoxes} />
              {group.items.length} ubicaciones
            </span>
          </div>
        </div>
        <BatchActions>
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBatch(group)}
            title="Eliminar batch completo"
          />
          <div className="batch-total">
            <FontAwesomeIcon
              icon={getStockStatus(group.total).icon}
              className="status-icon"
            />
            {group.total} unidades
          </div>
        </BatchActions>
      </div>
      <div className="locations-grid">
        {group.items.map((stock, index) => (
          <ProductStock
            key={stock.id}
            getStockStatus={getStockStatus}
            handleDeleteProductStock={handleDeleteProductStock}
            handleLocationClick={handleLocationClick}
            index={index}
            locationNames={locationNames}
            stock={stock}
          />
        ))}
      </div>
    </BatchContainer>
  );
};

export default BatchGroup;