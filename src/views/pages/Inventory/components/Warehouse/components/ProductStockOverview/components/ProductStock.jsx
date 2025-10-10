import { DeleteOutlined } from '@ant-design/icons';
import { faBoxes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

import { LocationDisplay } from './LocationDisplay';

const StockInfo = ({ stock, status, onDelete }) => (
    <StockInfoWrapper $status={status}>
        <div className="stock-header">
            <div className="stock-quantity">
                <div>
                    <FontAwesomeIcon icon={faBoxes} className="boxes-icon" />
                    <span className="quantity-value">{stock.quantity}</span>
                </div>
            </div>
            <div className="stock-footer">
                <div className="status-pill">
                    <FontAwesomeIcon icon={status.icon} />
                    <span>{status.label}</span>
                </div>
            </div>
        </div>
        <DeleteOutlined
            className="delete-button"
            onClick={(e) => {
                e.stopPropagation();
                onDelete(stock);
            }}
            title="Eliminar stock de esta ubicación"
        />
    </StockInfoWrapper>
);

const StockInfoWrapper = styled.div`
  padding: 0px 2px;
  background: ${props => props.$status.background}10;
  border-radius: 12px;
  align-items: center;
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: 1em;

  .stock-header {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .stock-quantity {
    /* display: flex; */
    align-items: center;
    gap: 8px;

    .boxes-icon {
      color: ${props => props.$status.color};
      font-size: 1.2rem;
    }

    .quantity-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${props => props.$status.color};
    }

    .quantity-label {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }
  }

  .stock-footer {
    display: flex;
    justify-content: flex-start;

  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    padding: 4px 10px;
    border-radius: 16px;
    background: ${props => props.$status.background};
    color: ${props => props.$status.color};
    font-weight: 600;
  }

  .delete-button {
    color: #94a3b8;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      color: #dc2626;
      background: #fee2e2;
    }
  }
`;

const StockCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.03);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
  }
`;

const ProductStock = ({ stock, index, getStockStatus, handleDeleteProductStock, handleLocationClick, locationNames }) => {
    const status = getStockStatus(stock.quantity);

    return (
        <StockCard
            key={stock.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            $status={status}
        >
            <div className="card-content">
                <StockInfo
                    stock={stock}
                    status={status}
                    onDelete={handleDeleteProductStock}
                />
                <LocationDisplay
                    location={stock.location}
                    onClick={() => handleLocationClick(stock.location)}
                    locationNames={locationNames}
                />
            </div>
        </StockCard>
    );
};

export default ProductStock;