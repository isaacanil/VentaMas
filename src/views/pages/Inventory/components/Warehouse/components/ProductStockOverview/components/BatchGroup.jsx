import { DeleteOutlined, EllipsisOutlined } from '@ant-design/icons';
import { CalendarOutlined } from '@ant-design/icons';
import { faBoxes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, Tooltip } from 'antd';
import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';

import ProductStock from './ProductStock';

const BatchContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  margin-bottom: 0px;

  .batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    padding-bottom: 12px;
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
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #0f172a;
      font-weight: 500;
      font-size: 0.8rem;
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
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    padding: 0 6px;

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

  @media (max-width: 768px) {
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
  align-items: center;
  gap: 8px;
`;

const ActionMenuButton = styled.button`
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

const BatchGroup = ({
  group,
  getStockStatus,
  handleDeleteBatch,
  handleDeleteProductStock,
  handleLocationClick,
  locationNames,
}) => {
  const batchStatus = useMemo(
    () => getStockStatus(group.total),
    [getStockStatus, group.total],
  );
  const formattedTotal = useMemo(
    () => Number(group.total ?? 0).toLocaleString(),
    [group.total],
  );

  const menuItems = useMemo(
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
    ({ key }) => {
      if (key === 'delete') {
        handleDeleteBatch(group);
      }
    },
    [group, handleDeleteBatch],
  );

  return (
    <BatchContainer $status={batchStatus}>
      <div className="batch-header">
        <div className="batch-info">
          <div className="batch-number">
            {group.batchNumberId
              ? `Lote #${group.batchNumberId}`
              : 'Sin lote asignado'}
          </div>
          <div className="batch-meta">
            {group.expirationDate && (
              <span className="meta-item">
                <CalendarOutlined />
                Vence:{' '}
                {new Date(
                  group.expirationDate.seconds * 1000,
                ).toLocaleDateString()}
              </span>
            )}
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
      </div>
    </BatchContainer>
  );
};

export default BatchGroup;
