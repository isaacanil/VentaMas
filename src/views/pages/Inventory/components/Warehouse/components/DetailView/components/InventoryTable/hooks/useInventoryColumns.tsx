import { InfoCircleOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import React, { useMemo } from 'react';

import { ActionContainer, ActionButton, ExpirationDateText } from '@/views/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/styles';

import type { GetActionMenu, InventoryRow } from '@/views/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/types';

interface UseInventoryColumnsParams {
  onViewBatch: (batchId: string) => void | Promise<void>;
  getActionMenu: GetActionMenu;
}

export const useInventoryColumns = ({
  onViewBatch,
  getActionMenu,
}: UseInventoryColumnsParams) =>
  useMemo(
    () => [
      {
        Header: 'Producto',
        accessor: 'productName',
        minWidth: '200px',
      },
      {
        Header: 'Cantidad Existente',
        accessor: 'quantity',
        align: 'right',
        minWidth: '100px',
      },
      {
        Header: 'Batch',
        accessor: 'batch',
        minWidth: '150px',
        cell: ({ value }: { value: InventoryRow['batch'] }) => {
          if (!value) return 'N/A';
          const displayLabel = value.batchNumberId
            ? `# ${value.batchNumberId}`
            : 'N/A';

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{displayLabel}</span>
              {value.batchId && (
                <Button
                  type="text"
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    void onViewBatch(value.batchId);
                  }}
                />
              )}
            </div>
          );
        },
      },
      {
        Header: 'Fecha de Vencimiento',
        accessor: 'expiryDate',
        minWidth: '150px',
        cell: ({ value }: { value: InventoryRow['expiryDate'] }) => {
          if (!value) return 'N/A';
          const { label, isExpired } = value;
          return (
            <ExpirationDateText $expired={isExpired}>
              {label}
            </ExpirationDateText>
          );
        },
      },
      {
        Header: 'Acciones',
        accessor: 'actions',
        align: 'right',
        minWidth: '80px',
        cell: ({ value }: { value: InventoryRow['actions'] }) => (
          <ActionContainer>
            <Dropdown
              menu={getActionMenu(value)}
              placement="bottomRight"
              trigger={['click']}
            >
              <ActionButton icon={<EllipsisOutlined />} size="small" />
            </Dropdown>
          </ActionContainer>
        ),
      },
    ],
    [getActionMenu, onViewBatch],
  );
