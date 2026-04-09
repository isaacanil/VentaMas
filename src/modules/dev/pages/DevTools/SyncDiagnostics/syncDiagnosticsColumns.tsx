import { Button, Popconfirm, Space, Tag, message } from 'antd';
import React from 'react';
import type { ColumnsType } from 'antd/es/table';

import { syncProductsStockFromProductsStock } from '@/firebase/warehouse/stockSyncService';

import type {
  BatchMismatchRow,
  OrphanStockRow,
  StockMismatchRow,
} from '@/domain/warehouse/syncDiagnosticsLogic';

export const buildProductColumns = ({
  businessID,
  syncing,
  setSyncing,
  runDiagnostics,
}: {
  businessID?: string | null;
  syncing: boolean;
  setSyncing: (value: boolean) => void;
  runDiagnostics: () => Promise<void> | void;
}): ColumnsType<StockMismatchRow> => [
  { title: 'Producto', dataIndex: 'name', key: 'name' },
  { title: 'Producto ID', dataIndex: 'productId', key: 'productId' },
  {
    title: 'Declarado (product.stock)',
    dataIndex: 'declaredStock',
    key: 'declaredStock',
  },
  {
    title: 'Suma productsStock',
    dataIndex: 'stockFromProductsStock',
    key: 'stockFromProductsStock',
  },
  {
    title: 'Delta',
    dataIndex: 'delta',
    key: 'delta',
    render: (v) => (
      <Tag color={v === 0 ? 'green' : v > 0 ? 'blue' : 'red'}>{v}</Tag>
    ),
  },
  {
    title: 'Acciones',
    key: 'actions',
    render: (_, row) => (
      <Space>
        <Popconfirm
          title="Sincronizar este producto"
          description="Actualizar product.stock con la suma de productsStock"
          okText="Si, sincronizar"
          cancelText="Cancelar"
          onConfirm={async () => {
            if (!businessID) return;
            setSyncing(true);
            syncProductsStockFromProductsStock(businessID, {
              productIds: [row.productId],
              dryRun: false,
            })
              .then(async () => {
                message.success(`Producto ${row.productId} sincronizado`);
                await runDiagnostics();
              })
              .catch((e) => {
                console.error(e);
                message.error(
                  e instanceof Error
                    ? e.message
                    : 'Error al sincronizar el producto',
                );
              })
              .finally(() => {
                setSyncing(false);
              });
          }}
        >
          <Button size="small" loading={syncing} disabled={!businessID}>
            Sincronizar
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];

export const batchColumns: ColumnsType<BatchMismatchRow> = [
  { title: 'Batch ID', dataIndex: 'batchId', key: 'batchId' },
  { title: 'Producto ID', dataIndex: 'productId', key: 'productId' },
  { title: 'BatchNumber', dataIndex: 'numberId', key: 'numberId' },
  {
    title: 'Declarado (batch.quantity)',
    dataIndex: 'declaredQuantity',
    key: 'declaredQuantity',
  },
  {
    title: 'Suma productsStock',
    dataIndex: 'stockFromProductsStock',
    key: 'stockFromProductsStock',
  },
  {
    title: 'Delta',
    dataIndex: 'delta',
    key: 'delta',
    render: (v) => (
      <Tag color={v === 0 ? 'green' : v > 0 ? 'blue' : 'red'}>{v}</Tag>
    ),
  },
  {
    title: 'Producto existe',
    dataIndex: 'productMissing',
    key: 'productMissing',
    render: (m) =>
      m ? <Tag color="red">Missing</Tag> : <Tag color="green">OK</Tag>,
  },
];

export const orphanColumns: ColumnsType<OrphanStockRow> = [
  { title: 'Stock ID', dataIndex: 'stockId', key: 'stockId' },
  { title: 'Producto ID', dataIndex: 'productId', key: 'productId' },
  { title: 'Batch ID', dataIndex: 'batchId', key: 'batchId' },
  { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
  {
    title: 'Razon',
    dataIndex: 'reason',
    key: 'reason',
    render: (r) => <Tag color="red">{r}</Tag>,
  },
];
