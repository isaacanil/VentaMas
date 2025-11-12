import { DeleteOutlined, EllipsisOutlined } from '@ant-design/icons';
import { faBoxes, faLocationArrow } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, Tooltip } from 'antd';
import { motion } from 'framer-motion';
import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';

import { LocationDisplay } from './LocationDisplay';

const ProductStock = ({ stock, index, getStockStatus, handleDeleteProductStock, handleLocationClick, locationNames }) => {
  const status = useMemo(() => getStockStatus(stock.quantity), [getStockStatus, stock.quantity]);
  const lifecycleStatus = stock?.status === 'inactive' ? 'inactive' : 'active';
  const lifecycleLabel = lifecycleStatus === 'inactive' ? 'Inactivo' : 'Activo';
  const formattedQuantity = useMemo(
    () => Number(stock.quantity ?? 0).toLocaleString(),
    [stock.quantity]
  );
  const menuItems = useMemo(() => ([
    {
      key: 'delete',
      label: 'Eliminar stock de esta ubicación',
      danger: true,
      icon: <DeleteOutlined />,
    },
  ]), []);

  const handleMenuClick = useCallback(({ key }) => {
    if (key === 'delete') {
      handleDeleteProductStock(stock);
    }
  }, [handleDeleteProductStock, stock]);

  return (
    <StockRow
      key={stock.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="cell cell-location">
        <LocationDisplay
          location={stock.location}
          onClick={() => handleLocationClick(stock.location)}
          locationNames={locationNames}
          variant="inline"
        />
      </div>
      <div className="cell cell-quantity">
        <Tooltip title={status.label}>
          <QuantityBadge $status={status}>
            <div className="quantity-main">
              <FontAwesomeIcon icon={faBoxes} className="quantity-icon" />
              <span className="quantity-value">{formattedQuantity}</span>
              <span className="quantity-unit">uds</span>
            </div>
            <span className="quantity-status">{status.label}</span>
          </QuantityBadge>
        </Tooltip>
      </div>
      <div className="cell cell-actions">
        <ActionButton
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleLocationClick(stock.location);
          }}
          title="Ver esta ubicación"
        >
          <FontAwesomeIcon icon={faLocationArrow} />
        </ActionButton>
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <MenuButton
            type="button"
            aria-label="Acciones de la ubicación"
            onClick={(e) => e.preventDefault()}
          >
            <EllipsisOutlined />
          </MenuButton>
        </Dropdown>
      </div>
      {lifecycleStatus === 'inactive' && (
        <div className="status-footnote">
          <LifecycleBadge $state={lifecycleStatus}>
            <span className="badge-dot" />
            <span className="badge-text">{lifecycleLabel}</span>
          </LifecycleBadge>
        </div>
      )}
    </StockRow>
  );
};

const StockRow = styled(motion.div)`
  display: grid;
  grid-template-columns: minmax(220px, 3fr) minmax(120px, 1fr) 88px;
  gap: 10px;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 5px;
  box-shadow: 0 8px 14px -12px rgba(15, 23, 42, 0.18);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(37, 99, 235, 0.18);
    box-shadow: 0 12px 18px -12px rgba(37, 99, 235, 0.18);
  }

  .cell {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .cell-location {
    align-items: stretch;
  }

  .cell-quantity {
    justify-content: center;
  }

  .cell-actions {
    justify-content: flex-end;
    gap: 6px;
  }

  .status-footnote {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
    padding: 0 5px;
    margin-top: 2px;
    flex-wrap: wrap;
  }

  @media (max-width: 1024px) {
    grid-template-columns: minmax(200px, 2.5fr) minmax(100px, 1fr) 80px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px;

    .cell,
    .cell-quantity,
    .cell-actions {
      justify-content: flex-start;
    }

    .status-footnote {
      padding: 0;
    }
  }
`;

const QuantityBadge = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  padding: 0px 14px;
  border-radius: 16px;
  background: ${props => props.$status.background}18;
  border: 1px solid ${props => props.$status.color}26;
  color: #0f172a;
  font-weight: 600;

  .quantity-main {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
  }

  .quantity-icon {
    color: ${props => props.$status.color};
    font-size: 0.85rem;
  }

  .quantity-value {
    font-size: 1rem;
  }

  .quantity-unit {
    font-size: 0.7rem;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .quantity-status {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: ${props => props.$status.color};
  }
`;

const LifecycleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: ${props => props.$state === 'inactive' ? '#fee2e2' : '#dcfce7'};
  color: ${props => props.$state === 'inactive' ? '#b91c1c' : '#047857'};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .badge-text {
    line-height: 1.2;
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(37, 99, 235, 0.28);
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #dbeafe;
    color: #1d4ed8;
  }

  &:active {
    transform: scale(0.96);
  }
`;

const MenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: #1f2937;
    border-color: rgba(148, 163, 184, 0.4);
  }

  &:active {
    transform: scale(0.96);
  }
`;

export default ProductStock;
