import {
  Card,
  Typography,
  Space,
  Button,
  Table,
  Tag,
  Alert,
} from 'antd';
import React, { useCallback, useReducer } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { syncProductsStockFromProductsStock } from '@/firebase/warehouse/stockSyncService';
import {
  fetchBatches,
  fetchProducts,
  fetchProductsStock,
} from '@/firebase/warehouse/syncDiagnostics.repository';
import {
  computeSyncDiagnostics,
  type BatchDoc,
  type ProductDoc,
  type ProductStockDoc,
  type BatchMismatchRow,
  type DiagnosticsSummary,
  type OrphanStockRow,
  type StockMismatchRow,
} from '@/domain/warehouse/syncDiagnosticsLogic';

import { SyncDiagnosticsActions } from './SyncDiagnostics/SyncDiagnosticsActions';
import { buildProductColumns, batchColumns, orphanColumns } from './SyncDiagnostics/syncDiagnosticsColumns';
import { SyncDiagnosticsSummary } from './SyncDiagnostics/SyncDiagnosticsSummary';

// Developer Sync Diagnostics
// Compares totals and referential integrity across:
// - products (products.stock)
// - batches (batches.quantity & productId)
// - productsStock (per product and per batch)

interface SyncResult {
  updates: Array<{ productId: string; from?: number; to: number }>;
  totalProducts: number;
}

interface SyncResultState extends SyncResult {
  mode: 'dry-run' | 'apply';
}

interface SyncDiagnosticsState {
  loading: boolean;
  summary: DiagnosticsSummary | null;
  productMismatches: StockMismatchRow[];
  batchMismatches: BatchMismatchRow[];
  orphanStocks: OrphanStockRow[];
  error: string | null;
  syncing: boolean;
  syncResult: SyncResultState | null;
}

type SyncDiagnosticsAction =
  | { type: 'startDiagnostics' }
  | {
      type: 'finishDiagnostics';
      summary: DiagnosticsSummary;
      productMismatches: StockMismatchRow[];
      batchMismatches: BatchMismatchRow[];
      orphanStocks: OrphanStockRow[];
    }
  | { type: 'diagnosticsError'; error: string }
  | { type: 'setSyncing'; value: boolean }
  | { type: 'setSyncResult'; value: SyncResultState | null }
  | { type: 'setError'; value: string | null };

const initialSyncDiagnosticsState: SyncDiagnosticsState = {
  loading: false,
  summary: null,
  productMismatches: [],
  batchMismatches: [],
  orphanStocks: [],
  error: null,
  syncing: false,
  syncResult: null,
};

const syncDiagnosticsReducer = (
  state: SyncDiagnosticsState,
  action: SyncDiagnosticsAction,
): SyncDiagnosticsState => {
  switch (action.type) {
    case 'startDiagnostics':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'finishDiagnostics':
      return {
        ...state,
        loading: false,
        summary: action.summary,
        productMismatches: action.productMismatches,
        batchMismatches: action.batchMismatches,
        orphanStocks: action.orphanStocks,
      };
    case 'diagnosticsError':
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    case 'setSyncing':
      return {
        ...state,
        syncing: action.value,
      };
    case 'setSyncResult':
      return {
        ...state,
        syncResult: action.value,
      };
    case 'setError':
      return {
        ...state,
        error: action.value,
      };
    default:
      return state;
  }
};

export default function SyncDiagnostics() {
  const user = useSelector(selectUser);
  const [state, dispatch] = useReducer(
    syncDiagnosticsReducer,
    initialSyncDiagnosticsState,
  );
  const {
    loading,
    summary,
    productMismatches,
    batchMismatches,
    orphanStocks,
    error,
    syncing,
    syncResult,
  } = state;

  const businessID = user?.businessID;

  const runDiagnostics = useCallback(async () => {
    if (!businessID) return;
    dispatch({ type: 'startDiagnostics' });
    Promise.all([
        fetchProducts({ businessId: businessID }),
        fetchBatches({ businessId: businessID }),
        fetchProductsStock({ businessId: businessID }),
      ])
      .then(([productsRaw, batchesRaw, stocksRaw]) => {
        const products: ProductDoc[] = productsRaw.map((p) => ({
          id: p.id,
          ...(p.data as ProductDoc),
        }));
        const batches: BatchDoc[] = batchesRaw.map((b) => ({
          id: b.id,
          ...(b.data as BatchDoc),
        }));
        const stocks: ProductStockDoc[] = stocksRaw.map((s) => ({
          id: s.id,
          ...(s.data as ProductStockDoc),
        }));

        const computed = computeSyncDiagnostics({ products, batches, stocks });
        dispatch({
          type: 'finishDiagnostics',
          summary: computed.summary,
          productMismatches: computed.productMismatches,
          batchMismatches: computed.batchMismatches,
          orphanStocks: computed.orphanStocks,
        });
      })
      .catch((e) => {
        console.error(e);
        dispatch({
          type: 'diagnosticsError',
          error:
            e instanceof Error ? e.message : 'Error al ejecutar diagnósticos',
        });
      })
      .finally(() => undefined);
  }, [businessID]);

  const columnsProducts = buildProductColumns({
    businessID,
    syncing,
    setSyncing: (value) => dispatch({ type: 'setSyncing', value }),
    runDiagnostics,
  });

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3}>
        Diagnóstico de sincronización: Productos vs Batches vs ProductsStock
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Herramienta de desarrollo. Compara totales declarados con agregados
        reales y verifica integridad referencial.
      </Typography.Paragraph>

      {!businessID && (
        <Alert type="warning" message="No hay businessID en sesión" showIcon />
      )}

      <SyncDiagnosticsActions
        businessID={businessID}
        loading={loading}
        syncing={syncing}
        onRunDiagnostics={runDiagnostics}
        onSetSyncing={(value) => dispatch({ type: 'setSyncing', value })}
        onSetSyncResult={(value) =>
          dispatch({ type: 'setSyncResult', value })
        }
        onSetError={(value) => dispatch({ type: 'setError', value })}
      />

      <SyncDiagnosticsSummary summary={summary} />

      <Card title={`Productos con diferencias (${productMismatches.length})`}>
        <Table
          size="small"
          rowKey={(r) => `${r.productId}`}
          dataSource={productMismatches}
          columns={columnsProducts}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card
        title={`Batches con diferencias o referencias inválidas (${batchMismatches.length})`}
      >
        <Table
          size="small"
          rowKey={(r) => `${r.batchId}`}
          dataSource={batchMismatches}
          columns={batchColumns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title={`ProductsStock huérfanos (${orphanStocks.length})`}>
        <Table
          size="small"
          rowKey={(r) => `${r.stockId}`}
          dataSource={orphanStocks}
          columns={orphanColumns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {error && <Alert type="error" message={error} showIcon />}
      {syncResult && (
        <Alert
          type={syncResult.mode === 'apply' ? 'success' : 'info'}
          showIcon
          message={
            syncResult.mode === 'apply'
              ? 'Sincronización aplicada'
              : 'Resultado dry-run'
          }
          description={`${syncResult.updates.length} productos ${syncResult.mode === 'apply' ? 'actualizados' : 'a actualizar'} de ${syncResult.totalProducts}`}
        />
      )}
    </Space>
  );
}
