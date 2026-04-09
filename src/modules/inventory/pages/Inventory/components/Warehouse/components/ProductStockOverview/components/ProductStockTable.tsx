import { DeleteOutlined, EllipsisOutlined } from '@/constants/icons/antd';
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo, useCallback } from 'react';
import styled from 'styled-components';

import type { LocationNamesMap, TimestampLike } from '@/utils/inventory/types';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import {
  AdvancedTable,
  type AdvancedTableColumn,
} from '@/components/ui/AdvancedTable/AdvancedTable';

import type { ProductStockItem, StockStatus } from '../types';

type ProductStockTableProps = {
  stocks: ProductStockItem[];
  getStockStatus: (quantity: number | string | null | undefined) => StockStatus;
  handleLocationClick: (locationPath: string) => void;
  handleDeleteProductStock: (stock: ProductStockItem) => void;
  locationNames?: LocationNamesMap;
};

type ProductStockRow = ProductStockItem & {
  id: string;
  raw: ProductStockItem;
  expirationDateMs: number | null;
  quantityNumber: number;
  actions: string;
};

const toDateMs = (value: TimestampLike | undefined | null): number | null => {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.getTime();
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

const ProductStockTable = ({
  stocks,
  getStockStatus,
  handleLocationClick,
  handleDeleteProductStock,
  locationNames,
}: ProductStockTableProps) => {
  const tableData = useMemo<ProductStockRow[]>(
    () =>
      stocks.map((stock, index) => {
        const batchKey =
          stock.batchId != null ? String(stock.batchId) : 'stock';
        const rowId =
          stock.id != null ? String(stock.id) : `${batchKey}-${index}`;
        return {
          ...stock,
          id: rowId,
          raw: stock,
          expirationDateMs: toDateMs(stock.expirationDate),
          quantityNumber: Number(stock.quantity ?? 0),
          actions: rowId,
        };
      }),
    [stocks],
  );

  const menuItems: MenuProps['items'] = useMemo(
    () => [
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
    ],
    [],
  );

  const handleMenuClick = useCallback(
    (record?: ProductStockRow) =>
      ({ key }: { key: string }) => {
        if (!record?.raw) return;
        if (key === 'view') {
          const locationPath = record.raw.location
            ? String(record.raw.location)
            : '';
          if (locationPath) {
            handleLocationClick(locationPath);
          }
        } else if (key === 'delete') {
          handleDeleteProductStock(record.raw);
        }
      },
    [handleDeleteProductStock, handleLocationClick],
  );

  const columns = useMemo<AdvancedTableColumn<ProductStockRow>[]>(
    () => [
      {
        Header: 'ubicación',
        accessor: 'location',
        minWidth: '300px',
        maxWidth: '1fr',
        sortable: true,
        cell: ({ value }) => {
          const locationValue =
            typeof value === 'string' ? value : value ? String(value) : '';
          const locationLabel =
            locationNames?.[locationValue] ||
            locationValue ||
            'ubicación no disponible';

          return (
            <Tooltip title={locationLabel} placement="topLeft">
              <LocationButton
                type="button"
                onClick={() =>
                  locationValue ? handleLocationClick(locationValue) : undefined
                }
              >
                <FontAwesomeIcon
                  icon={faLocationArrow}
                  className="location-icon"
                />
                <LocationText>{locationLabel}</LocationText>
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
            {value ? formatLocaleDate(value as number) : 'Sin fecha'}
          </ExpirationBadge>
        ),
      },
      {
        Header: 'Cantidad',
        accessor: 'quantityNumber',
        minWidth: '160px',
        maxWidth: '160px',
        sortable: true,
        cell: ({ row }) => {
          const record = row?.raw;
          const status = getStockStatus(record?.quantity);
          const formattedQuantity = Number(
            record?.quantity ?? 0,
          ).toLocaleString();
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
        cell: ({ row }) => (
          <ActionCluster>
            <Dropdown
              menu={{
                items: menuItems,
                onClick: handleMenuClick(row),
              }}
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
          </ActionCluster>
        ),
      },
    ],
    [
      getStockStatus,
      handleLocationClick,
      handleMenuClick,
      locationNames,
      menuItems,
    ],
  );

  return (
    <TableWrapper>
      <AdvancedTable
        columns={columns}
        data={tableData}
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

const QuantityBadge = styled.div<{ $status: StockStatus }>`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  padding: 2px;
  font-weight: 600;
  color: #0f172a;
  background: ${({ $status }: { $status: StockStatus }) =>
    `${$status.background}1f`};
  border: 1px solid
    ${({ $status }: { $status: StockStatus }) => `${$status.color}30`};
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

const BatchBadge = styled.span<{ $empty?: boolean }>`
  display: inline-block;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $empty }: { $empty?: boolean }) =>
    $empty ? '#64748b' : '#1d4ed8'};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ $empty }: { $empty?: boolean }) =>
    $empty ? '#f1f5f9' : '#dbeafe'};
  border-radius: 999px;
`;

const ExpirationBadge = styled.span<{ $empty?: boolean }>`
  display: inline-block;
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ $empty }: { $empty?: boolean }) =>
    $empty ? '#94a3b8' : '#4d7c0f'};
  background: ${({ $empty }: { $empty?: boolean }) =>
    $empty ? '#f8fafc' : '#ecfccb'};
  border-radius: 10px;
`;

const ActionCluster = styled.div`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
`;

const LocationButton = styled.button`
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 4px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2563eb;
  text-align: left;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid rgb(37 99 235 / 18%);
  border-radius: 12px;
  transition: all 0.15s ease;

  .location-icon {
    font-size: 0.75rem;
  }

  &:hover {
    color: #1d4ed8;
    background: #dbeafe;
    border-color: rgb(37 99 235 / 32%);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const LocationText = styled.span`
  display: -webkit-box;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.3;
  color: #0f172a;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
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

export default ProductStockTable;
