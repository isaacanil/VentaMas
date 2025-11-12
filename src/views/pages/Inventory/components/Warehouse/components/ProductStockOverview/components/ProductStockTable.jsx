import { DeleteOutlined, EllipsisOutlined } from '@ant-design/icons';
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, Tooltip } from 'antd';
import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';

import { AdvancedTable } from '../../../../../../../templates/system/AdvancedTable/AdvancedTable';

const ProductStockTable = ({
  stocks,
  getStockStatus,
  handleLocationClick,
  handleDeleteProductStock,
  locationNames,
}) => {
  const tableData = useMemo(() => (
    stocks.map((stock, index) => {
      const expirationDateMs = stock?.expirationDate?.seconds
        ? stock.expirationDate.seconds * 1000
        : null;

      return {
        id: stock.id ?? `${stock.batchId || 'stock'}-${index}`,
        ...stock,
        raw: stock,
        expirationDateMs,
        quantityNumber: Number(stock.quantity ?? 0),
      };
    })
  ), [stocks]);

  const menuItems = useMemo(() => ([
    {
      key: 'view',
      label: 'Ver esta ubicación',
      icon: <FontAwesomeIcon icon={faLocationArrow} />,
    },
    {
      key: 'delete',
      label: 'Eliminar stock de esta ubicación',
      danger: true,
      icon: <DeleteOutlined />,
    },
  ]), []);

  const handleMenuClick = useCallback((record) => ({ key }) => {
    if (key === 'view') {
      handleLocationClick(record.raw.location);
    } else if (key === 'delete') {
      handleDeleteProductStock(record.raw);
    }
  }, [handleDeleteProductStock, handleLocationClick]);

  const columns = useMemo(() => ([
    {
      Header: 'Ubicación',
      accessor: 'location',
      minWidth: '300px',
      maxWidth: '1fr',
      sortable: true,
      cell: ({ value }) => {
        return (
          <Tooltip
            title={locationNames?.[value] || value || 'Ubicación no disponible'}
            placement="topLeft"
          >
            <LocationButton
              type="button"
              onClick={() => handleLocationClick(value)}
            >
              <FontAwesomeIcon icon={faLocationArrow} className="location-icon" />
              <LocationText>
                {locationNames?.[value] || value || 'Ubicación no disponible'}
              </LocationText>
            </LocationButton>
          </Tooltip>
        );
      },
    },
    {
      Header: 'Lote',
      accessor: 'batchNumberId',
      minWidth: '120px',
      maxWidth: '100px',
      sortable: true,
      cell: ({ value }) => (
        <BatchBadge $empty={!value}>
          {value ? `#${value}` : 'Sin lote'}
        </BatchBadge>
      ),
    },
    {
      Header: 'Vencimiento',
      accessor: 'expirationDateMs',
      minWidth: '140px',
      maxWidth: '140px',
      sortable: true,
      cell: ({ value }) => (
        <ExpirationBadge $empty={!value}>
          {value ? new Date(value).toLocaleDateString() : 'Sin fecha'}
        </ExpirationBadge>
      ),
    },
    {
      Header: 'Cantidad',
      accessor: 'quantityNumber',
      minWidth: '160px',
      maxWidth: '160px',
      sortable: true,
      cell: ({ value }) => {
        const record = tableData.find(item => item.quantityNumber === value);
        const status = getStockStatus(record?.quantity);
        const formattedQuantity = Number(record?.quantity ?? 0).toLocaleString();
        return (
          <Tooltip title={status.label}>
            <QuantityBadge $status={status}>
              <div className="quantity-main">
                <span className="quantity-value">{formattedQuantity}</span>
                <span className="quantity-unit">uds</span>
              </div>
              <span className="quantity-status">{status.label}</span>
            </QuantityBadge>
          </Tooltip>
        );
      },
    },
    {
      Header: '',
      accessor: 'actions',
      minWidth: '40px',
      maxWidth: '40px',
      align: 'right',
      sortable: false,
      clickable: false,
      cell: ({ value }) => {
        const record = tableData.find(item => item.id === value);
        return (
          <ActionCluster>
            <Dropdown
              menu={{ items: menuItems, onClick: handleMenuClick(record || {}) }}
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
          </ActionCluster>
        );
      },
    },
  ]), [getStockStatus, handleLocationClick, handleMenuClick, locationNames, menuItems, tableData]);

  // Añadir el id de acciones a cada fila para el render
  const enrichedData = useMemo(() => 
    tableData.map(item => ({
      ...item,
      actions: item.id
    })),
    [tableData]
  );

  return (
    <TableWrapper>
      <AdvancedTable
        columns={columns}
        data={enrichedData}
        numberOfElementsPerPage={50}
        emptyText="No hay stock disponible para este producto"
        rowSize="large"
        tableName="product-stock-table"
      />
    </TableWrapper>
  );
};

const TableWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const QuantityBadge = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  padding: 2px 2px;
  border-radius: 16px;
  background: ${props => props.$status.background}1f;
  border: 1px solid ${props => props.$status.color}30;
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

const BatchBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: ${props => props.$empty ? '#f1f5f9' : '#dbeafe'};
  color: ${props => props.$empty ? '#64748b' : '#1d4ed8'};
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ExpirationBadge = styled.span`
  display: inline-block;
  padding: 6px 10px;
  border-radius: 10px;
  background: ${props => props.$empty ? '#f8fafc' : '#ecfccb'};
  color: ${props => props.$empty ? '#94a3b8' : '#4d7c0f'};
  font-weight: 600;
  font-size: 0.78rem;
`;

const ActionCluster = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
`;

const LocationButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: #f8fafc;
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;

  .location-icon {
    font-size: 0.75rem;
  }

  &:hover {
    background: #dbeafe;
    color: #1d4ed8;
    border-color: rgba(37, 99, 235, 0.32);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const LocationText = styled.span`
  flex: 1;
  min-width: 0;
  color: #0f172a;
  font-weight: 500;
  font-size: 0.8rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  word-break: break-word;
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

export default ProductStockTable;
