import {
  DeleteOutlined,
  EllipsisOutlined,
  CalendarOutlined,
} from '@/constants/icons/antd';
import { faBoxes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo, useCallback } from 'react';
import styled from 'styled-components';

import type { LocationNamesMap, TimestampLike } from '@/utils/inventory/types';
import { formatLocaleDate } from '@/utils/date/dateUtils';

import ProductStock from './ProductStock';
import type { BatchGroupData, ProductStockItem, StockStatus } from '../types';

const toDateMs = (value: TimestampLike): number | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  return null;
};

const BatchContainer = styled.div`
  padding: 6px;
  margin-bottom: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);

  .batch-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    margin-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;

    .batch-info {
      .batch-number {
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
        letter-spacing: -0.01em;
      }

      .batch-meta {
        display: flex;
        gap: 12px;
        align-items: center;
        font-size: 0.85rem;
        color: #64748b;

        .meta-item {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 4px 0;
        }
      }
    }

    .batch-total {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #0f172a;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
  }

  .locations-section {
    display: flex;
    flex-direction: column;
  }

  .locations-header {
    display: grid;
    grid-template-columns: minmax(200px, 3fr) minmax(120px, 1fr) 88px;
    gap: 16px;
    align-items: center;
    padding: 0 6px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;

    span:nth-child(2) {
      text-align: center;
    }

    span:last-child {
      text-align: right;
    }
  }

  .locations-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  @media (width <= 768px) {
    .locations-header {
      display: none;
    }

    .locations-section {
      padding: 0 12px;
    }
  }
`;

const BatchActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionMenuButton = styled.button`
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

type BatchGroupProps = {
  group: BatchGroupData;
  getStockStatus: (quantity: number | string | null | undefined) => StockStatus;
  handleDeleteBatch: (group: BatchGroupData) => void;
  handleDeleteProductStock: (stock: ProductStockItem) => void;
  handleLocationClick: (locationPath: string) => void;
  locationNames?: LocationNamesMap;
};

const BatchGroup = ({
  group,
  getStockStatus,
  handleDeleteBatch,
  handleDeleteProductStock,
  handleLocationClick,
  locationNames,
}: BatchGroupProps) => {
  const batchStatus = useMemo(
    () => getStockStatus(group.total),
    [getStockStatus, group.total],
  );
  const formattedTotal = useMemo(
    () => Number(group.total ?? 0).toLocaleString(),
    [group.total],
  );
  const expirationDateMs = useMemo(
    () => toDateMs(group.expirationDate),
    [group.expirationDate],
  );

  const menuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'delete',
        label: 'Eliminar lote completo',
        danger: true,
        icon: <DeleteOutlined />,
      },
    ],
    [],
  );

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (key === 'delete') {
        handleDeleteBatch(group);
      }
    },
    [group, handleDeleteBatch],
  );

  return (
    <BatchContainer>
      <div className="batch-header">
        <div className="batch-info">
          <div className="batch-number">
            {group.batchNumberId
              ? `Lote #${group.batchNumberId}`
              : 'Sin lote asignado'}
          </div>
          <div className="batch-meta">
            {expirationDateMs ? (
              <span className="meta-item">
                <CalendarOutlined />
                Vence: {formatLocaleDate(expirationDateMs)}
              </span>
            ) : null}
            <span className="meta-item">
              <FontAwesomeIcon icon={faBoxes} />
              {group.items.length} ubicaciones
            </span>
          </div>
        </div>
        <BatchActions>
          <Tooltip title={batchStatus.label} placement="left">
            <div className="batch-total">{formattedTotal} uds</div>
          </Tooltip>
          <Dropdown
            menu={{ items: menuItems, onClick: handleMenuClick }}
            trigger={['click']}
            placement="bottomRight"
          >
            <ActionMenuButton
              type="button"
              aria-label="Acciones del lote"
              onClick={(e) => e.preventDefault()}
            >
              <EllipsisOutlined />
            </ActionMenuButton>
          </Dropdown>
        </BatchActions>
      </div>
      <div className="locations-section">
        <div className="locations-header">
          <span>Ubicación</span>
          <span>Cantidad</span>
          <span>Acciones</span>
        </div>
        <div className="locations-list">
          {group.items.map((stock, index) => (
            <ProductStock
              key={stock.id ?? `${group.batchId ?? 'stock'}-${index}`}
              getStockStatus={getStockStatus}
              handleDeleteProductStock={handleDeleteProductStock}
              handleLocationClick={handleLocationClick}
              index={index}
              locationNames={locationNames}
              stock={stock}
            />
          ))}
        </div>
      </div>
    </BatchContainer>
  );
};

export default BatchGroup;
