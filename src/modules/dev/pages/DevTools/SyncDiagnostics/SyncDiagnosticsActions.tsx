import { Button, Card, Popconfirm, Space, message } from 'antd';
import React from 'react';

import { syncProductsStockFromProductsStock } from '@/firebase/warehouse/stockSyncService';

type SyncResult = {
  updates: Array<{ productId: string; from?: number; to: number }>;
  totalProducts: number;
};

export const SyncDiagnosticsActions = ({
  businessID,
  loading,
  syncing,
  onRunDiagnostics,
  onSetSyncing,
  onSetSyncResult,
  onSetError,
}: {
  businessID?: string | null;
  loading: boolean;
  syncing: boolean;
  onRunDiagnostics: () => Promise<void> | void;
  onSetSyncing: (value: boolean) => void;
  onSetSyncResult: (
    value:
      | ({ mode: 'dry-run' | 'apply' } & SyncResult)
      | null,
  ) => void;
  onSetError: (value: string | null) => void;
}) => (
  <Card>
    <Space wrap>
      <Button
        type="primary"
        loading={loading}
        onClick={onRunDiagnostics}
        disabled={!businessID}
      >
        Ejecutar diagnostico
      </Button>
      <Button
        onClick={async () => {
          if (!businessID) return;
          onSetSyncResult(null);
          onSetError(null);
          onSetSyncing(true);
          syncProductsStockFromProductsStock(businessID, { dryRun: true })
            .then((res) => {
              onSetSyncResult({ mode: 'dry-run', ...(res as SyncResult) });
              message.info(
                `Dry-run: ${res.updates.length} productos quedarian actualizados`,
              );
            })
            .catch((e) => {
              console.error(e);
              onSetError(e instanceof Error ? e.message : 'Error en dry-run');
            })
            .finally(() => {
              onSetSyncing(false);
            });
        }}
        loading={syncing}
        disabled={!businessID}
      >
        Dry-run sincronizacion (productsStock → product.stock)
      </Button>
      <Popconfirm
        title="Aplicar sincronizacion"
        description="Actualizar product.stock con la suma de productsStock para todos los productos"
        okText="Si, aplicar"
        cancelText="Cancelar"
        onConfirm={async () => {
          if (!businessID) return;
          onSetSyncResult(null);
          onSetError(null);
          onSetSyncing(true);
          syncProductsStockFromProductsStock(businessID, { dryRun: false })
            .then(async (res) => {
              onSetSyncResult({ mode: 'apply', ...(res as SyncResult) });
              message.success(`Sincronizados ${res.updates.length} productos`);
              await onRunDiagnostics();
            })
            .catch((e) => {
              console.error(e);
              onSetError(
                e instanceof Error
                  ? e.message
                  : 'Error al aplicar sincronizacion',
              );
            })
            .finally(() => {
              onSetSyncing(false);
            });
        }}
      >
        <Button type="primary" danger loading={syncing} disabled={!businessID}>
          Aplicar sincronizacion global
        </Button>
      </Popconfirm>
    </Space>
  </Card>
);
