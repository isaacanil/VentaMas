import { DeleteOutlined, EllipsisOutlined } from '@/constants/icons/antd';
import { faBoxes, faLocationArrow } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, Tooltip } from 'antd';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useMemo, useCallback } from 'react';
import styled from 'styled-components';

import type { LocationNamesMap } from '@/utils/inventory/types';

import { LocationDisplay } from './LocationDisplay';
import type { ProductStockItem, StockStatus } from '../types';

type ProductStockProps = {
  stock: ProductStockItem;
  index: number;
  getStockStatus: (quantity: number | string | null | undefined) => StockStatus;
  handleDeleteProductStock: (stock: ProductStockItem) => void;
  handleLocationClick: (locationPath: string) => void;
  locationNames?: LocationNamesMap;
};

const ProductStock = ({
  stock,
  index,
  getStockStatus,
  handleDeleteProductStock,
  handleLocationClick,
  locationNames,
}: ProductStockProps) => {
  const status = useMemo(
    () => getStockStatus(stock.quantity),
    [getStockStatus, stock.quantity],
  );
  const lifecycleStatus = stock?.status === 'inactive' ? 'inactive' : 'active';
  const lifecycleLabel = lifecycleStatus === 'inactive' ? 'Inactivo' : 'Activo';
  const formattedQuantity = useMemo(
    () => Number(stock.quantity ?? 0).toLocaleString(),
    [stock.quantity],
  );
  const locationPath = stock.location ? String(stock.location) : '';

  const menuItems = useMemo(
    () => [
      {
        key: 'delete',
        label: 'Eliminar stock de esta ubicación',
        danger: true,
        icon: <DeleteOutlined />,
      },
    ],
    [],
  );

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (key === 'delete') {
        handleDeleteProductStock(stock);
      }
    },
    [handleDeleteProductStock, stock],
  );

  const handleLocationPress = () => {
    if (!locationPath) return;
    handleLocationClick(locationPath);
  };

  return (
    <LazyMotion features={domAnimation}>
      <StockRow
        key={stock.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="cell cell-location">
          <LocationDisplay
            location={locationPath}
            onClick={handleLocationPress}
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
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleLocationPress();
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
              onClick={(e: React.MouseEvent) => e.preventDefault()}
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
    </LazyMotion>
  );
};

const StockRow = styled(m.div)`
  display: grid;
  grid-template-columns: minmax(220px, 3fr) minmax(120px, 1fr) 88px;
  gap: 10px;
  align-items: center;
  padding: 10px 5px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 14px -12px rgb(15 23 42 / 18%);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    border-color: rgb(37 99 235 / 18%);
    box-shadow: 0 12px 18px -12px rgb(37 99 235 / 18%);
    transform: translateY(-1px);
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
    gap: 6px;
    justify-content: flex-end;
  }

  .status-footnote {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    gap: 10px;
    align-items: center;
    justify-content: flex-start;
    padding: 0 5px;
    margin-top: 2px;
  }

  @media (width <= 1024px) {
    grid-template-columns: minmax(200px, 2.5fr) minmax(100px, 1fr) 80px;
  }

  @media (width <= 768px) {
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

const QuantityBadge = styled.div<{ $status: StockStatus }>`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  padding: 0 14px;
  font-weight: 600;
  color: #0f172a;
  background: ${({ $status }: { $status: StockStatus }) =>
    `${$status.background}18`};
  border: 1px solid
    ${({ $status }: { $status: StockStatus }) => `${$status.color}26`};
  border-radius: 16px;

  .quantity-main {
    display: inline-flex;
    gap: 6px;
    align-items: baseline;
  }

  .quantity-icon {
    font-size: 0.85rem;
    color: ${({ $status }: { $status: StockStatus }) => $status.color};
  }

  .quantity-value {
    font-size: 1rem;
  }

  .quantity-unit {
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .quantity-status {
    font-size: 0.7rem;
    font-weight: 600;
    color: ${({ $status }: { $status: StockStatus }) => $status.color};
    text-transform: uppercase;
  }
`;

const LifecycleBadge = styled.span<{ $state: 'inactive' | 'active' }>`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 3px 10px;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ $state }: { $state: 'inactive' | 'active' }) =>
    $state === 'inactive' ? '#b91c1c' : '#047857'};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ $state }: { $state: 'inactive' | 'active' }) =>
    $state === 'inactive' ? '#fee2e2' : '#dcfce7'};
  border-radius: 999px;

  .badge-dot {
    width: 6px;
    height: 6px;
    background: currentcolor;
    border-radius: 50%;
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
  color: #2563eb;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgb(37 99 235 / 28%);
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    color: #1d4ed8;
    background: #dbeafe;
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
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    color: #1f2937;
    background: #f1f5f9;
    border-color: rgb(148 163 184 / 40%);
  }

  &:active {
    transform: scale(0.96);
  }
`;

export default ProductStock;
