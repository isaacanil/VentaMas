import {
  DeleteOutlined,
  SwapOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from '@/constants/icons/antd';
import { notification, type MenuProps } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice.js';
import { openDeleteModal } from '@/features/productStock/deleteProductStockSlice';
import { reconcileBatchStatus } from '@/firebase/functions/inventory/reconcileBatchStatus.js';
import { getBatchById } from '@/firebase/warehouse/batchService';

import { useInventoryFilters } from './useInventoryFilters';
import { useProductFilterOptions } from './useProductFilterOptions';
import { useProductsStock } from './useProductsStock';
import { buildInventoryRows, getActiveDateRange } from '../utils/buildInventoryRows';
import type {
  DateRangeValue,
  GetActionMenu,
  InventoryRow,
  InventoryTableProps,
  ProductStockLike,
  SortConfig,
  SortMenuItems,
} from '../types';
import type { InventoryUser } from '@/utils/inventory/types';
import type { BatchData } from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/BatchViewModal';
import type { MovementProduct } from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/ProductMovementModal';
import { MenuItemContent } from '../styles';

interface ReconcileBatchStatusResult {
  batchesUpdated?: number;
  activatedBatches?: number;
  deactivatedBatches?: number;
}

interface InventoryTableState {
  syncingBatches: boolean;
  moveModalVisible: boolean;
  selectedProduct: MovementProduct | null;
  dateFilter: DateRangeValue;
  sortConfig: SortConfig;
  batchModalVisible: boolean;
  selectedBatch: BatchData | null;
}

type InventoryTableAction =
  | { type: 'setSyncingBatches'; value: boolean }
  | { type: 'openMoveModal'; product: MovementProduct }
  | { type: 'closeMoveModal' }
  | { type: 'setDateFilter'; value: DateRangeValue }
  | { type: 'setSortConfig'; value: SortConfig }
  | { type: 'openBatchModal'; batch: BatchData }
  | { type: 'closeBatchModal' };

const initialInventoryTableState: InventoryTableState = {
  syncingBatches: false,
  moveModalVisible: false,
  selectedProduct: null,
  dateFilter: null,
  sortConfig: { field: null, order: null },
  batchModalVisible: false,
  selectedBatch: null,
};

const inventoryTableReducer = (
  state: InventoryTableState,
  action: InventoryTableAction,
): InventoryTableState => {
  switch (action.type) {
    case 'setSyncingBatches':
      return { ...state, syncingBatches: action.value };
    case 'openMoveModal':
      return { ...state, selectedProduct: action.product, moveModalVisible: true };
    case 'closeMoveModal':
      return { ...state, moveModalVisible: false };
    case 'setDateFilter':
      return { ...state, dateFilter: action.value };
    case 'setSortConfig':
      return { ...state, sortConfig: action.value };
    case 'openBatchModal':
      return { ...state, selectedBatch: action.batch, batchModalVisible: true };
    case 'closeBatchModal':
      return { ...state, batchModalVisible: false, selectedBatch: null };
    default:
      return state;
  }
};

const dateRangePresets = [
  { label: 'Sin filtro', value: null },
  {
    label: 'Hoy',
    value: [DateTime.now().startOf('day'), DateTime.now().endOf('day')] as [
      DateTime,
      DateTime,
    ],
  },
  {
    label: 'Ultimos 7 dias',
    value: [
      DateTime.now().minus({ days: 6 }).startOf('day'),
      DateTime.now().endOf('day'),
    ] as [DateTime, DateTime],
  },
  {
    label: 'Este mes',
    value: [
      DateTime.now().startOf('month'),
      DateTime.now().endOf('month'),
    ] as [DateTime, DateTime],
  },
  {
    label: 'Proximo mes',
    value: [
      DateTime.now().plus({ months: 1 }).startOf('month'),
      DateTime.now().plus({ months: 1 }).endOf('month'),
    ] as [DateTime, DateTime],
  },
] as const;

const describeSyncResult = (result?: ReconcileBatchStatusResult) => {
  if (!result) return undefined;
  const {
    batchesUpdated = 0,
    activatedBatches = 0,
    deactivatedBatches = 0,
  } = result;
  return `Actualizados: ${batchesUpdated} · Activados: ${activatedBatches} · Desactivados: ${deactivatedBatches}`;
};

export const useInventoryTableController = ({
  searchTerm,
  setSearchTerm,
  setDateRange,
  location,
}: Pick<
  InventoryTableProps,
  'searchTerm' | 'setSearchTerm' | 'setDateRange' | 'location'
>) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as InventoryUser | null;
  const { productsStock, loading } = useProductsStock(location);
  const [state, dispatchState] = useReducer(
    inventoryTableReducer,
    initialInventoryTableState,
  );
  const {
    syncingBatches,
    moveModalVisible,
    selectedProduct,
    dateFilter,
    sortConfig,
    batchModalVisible,
    selectedBatch,
  } = state;
  const { productOptions, productBatchMap } =
    useProductFilterOptions(productsStock);
  const filters = useInventoryFilters({ productOptions, productBatchMap });
  const activeDateRange = useMemo(
    () => getActiveDateRange(dateFilter),
    [dateFilter],
  );

  const handleMove = useCallback((record: ProductStockLike) => {
    dispatchState({
      type: 'openMoveModal',
      product: {
        id: record.id,
        productId: record.productId,
        productName: record.productName,
        productStockId: record.id,
        batchId: record.batchId ?? undefined,
        quantity: record.quantity,
      },
    });
  }, []);

  const handleMoveSubmit = useCallback(() => {
    dispatchState({ type: 'closeMoveModal' });
  }, []);

  const handleDateRangeChange = useCallback(
    (dates: DateRangeValue) => {
      if (!dates || (!dates[0] && !dates[1])) {
        dispatchState({ type: 'setDateFilter', value: null });
        setDateRange(null);
        return;
      }

      dispatchState({ type: 'setDateFilter', value: dates });
      setDateRange(dates);
    },
    [setDateRange],
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    dispatchState({ type: 'setDateFilter', value: null });
    setDateRange(null);
    filters.clearAdvancedFilters();
    dispatchState({
      type: 'setSortConfig',
      value: { field: null, order: null },
    });
  }, [filters, setDateRange, setSearchTerm]);

  const handleViewProductStock = useCallback(
    (productId?: string) => {
      if (!productId) return;
      void navigate(`/inventory/warehouses/products-stock/${productId}`);
    },
    [navigate],
  );

  const handleDeleteBatch = useCallback(
    (record: ProductStockLike) => {
      dispatch(
        openDeleteModal({
          productStockId: record.id,
          batchId: record.batchId,
          actionType: 'productStock',
        }),
      );
    },
    [dispatch],
  );

  const handleViewBatch = useCallback(
    async (batchId?: string | null | undefined) => {
      if (!batchId || !user) return;
      const batchData = await getBatchById(user, batchId);
      if (batchData) {
        dispatchState({
          type: 'openBatchModal',
          batch: batchData as unknown as BatchData,
        });
      }
    },
    [user],
  );

  const getActionMenu = useCallback<GetActionMenu>(
    (record) => ({
      items: [
        {
          key: 'view-stock',
          label: (
            <MenuItemContent>
              <UnorderedListOutlined />
              Ver todas las ubicaciones
            </MenuItemContent>
          ),
          onClick: () => handleViewProductStock(record.productId),
        },
        {
          key: 'move',
          label: (
            <MenuItemContent>
              <SwapOutlined />
              Mover producto
            </MenuItemContent>
          ),
          onClick: () => handleMove(record),
        },
        {
          key: 'delete',
          danger: true,
          label: (
            <MenuItemContent>
              <DeleteOutlined />
              Eliminar batch
            </MenuItemContent>
          ),
          onClick: () => handleDeleteBatch(record),
        },
      ],
    }),
    [handleDeleteBatch, handleMove, handleViewProductStock],
  );

  const handleSyncBatches = useCallback(
    async (dryRun = false) => {
      if (!user?.businessID) {
        notification.error({
          title: 'Usuario sin negocio',
          description: 'No se pudo determinar el businessID para sincronizar.',
        });
        return;
      }

      dispatchState({ type: 'setSyncingBatches', value: true });
      const syncResult = await reconcileBatchStatus({
        businessId: user.businessID,
        dryRun,
      })
        .then((result) => ({
          result: result as ReconcileBatchStatusResult,
          error: null,
        }))
        .catch((error) => ({
          result: null,
          error,
        }));

      if (syncResult.error || !syncResult.result) {
        notification.error({
          title: 'Error al sincronizar lotes',
          description:
            syncResult.error instanceof Error
              ? syncResult.error.message
              : 'No se pudo completar la accion',
        });
        dispatchState({ type: 'setSyncingBatches', value: false });
        return;
      }

      notification.success({
        title: dryRun
          ? 'Simulacion completada'
          : 'Lotes sincronizados correctamente',
        description: describeSyncResult(syncResult.result),
      });
      dispatchState({ type: 'setSyncingBatches', value: false });
    },
    [user],
  );

  const toolbarMenuItems = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'sync-batches',
        label: (
          <MenuItemContent>
            <SyncOutlined spin={syncingBatches} />
            {syncingBatches ? 'Sincronizando...' : 'Sincronizar lotes'}
          </MenuItemContent>
        ),
        disabled: syncingBatches,
      },
      {
        key: 'sync-batches-dry',
        label: (
          <MenuItemContent>
            <SyncOutlined />
            Simular sincronizacion
          </MenuItemContent>
        ),
        disabled: syncingBatches,
      },
    ],
    [syncingBatches],
  );

  const handleToolbarMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      if (key === 'sync-batches') {
        void handleSyncBatches(false);
      }
      if (key === 'sync-batches-dry') {
        void handleSyncBatches(true);
      }
    },
    [handleSyncBatches],
  );

  const handleSort = useCallback(
    (field: SortConfig['field'], order: SortConfig['order']) => {
      dispatchState({
        type: 'setSortConfig',
        value: { field, order },
      });
    },
    [],
  );

  const sortMenuItems: SortMenuItems = useMemo(
    () => [
      {
        key: 'productName-asc',
        label: 'Nombre de Producto (A-Z)',
        onClick: () => handleSort('productName', 'asc'),
      },
      {
        key: 'productName-desc',
        label: 'Nombre de Producto (Z-A)',
        onClick: () => handleSort('productName', 'desc'),
      },
      {
        key: 'batchNumberId-asc',
        label: 'Numero de Lote (Ascendente)',
        onClick: () => handleSort('batchNumberId', 'asc'),
      },
      {
        key: 'expirationDate-asc',
        label: 'Fecha de Vencimiento (Proximos)',
        onClick: () => handleSort('expirationDate', 'asc'),
      },
      {
        key: 'expirationDate-desc',
        label: 'Fecha de Vencimiento (Lejanos)',
        onClick: () => handleSort('expirationDate', 'desc'),
      },
      {
        key: 'createdAt-desc',
        label: 'Mas recientes primero',
        onClick: () => handleSort('createdAt', 'desc'),
      },
      {
        key: 'createdAt-asc',
        label: 'Mas antiguos primero',
        onClick: () => handleSort('createdAt', 'asc'),
      },
    ],
    [handleSort],
  );

  const inventoryData: InventoryRow[] = useMemo(
    () =>
      buildInventoryRows({
        productsStock,
        showOnlyWithExpiration: filters.showOnlyWithExpiration,
        selectedProductFilter: filters.selectedProductFilter,
        selectedBatches: filters.selectedBatches,
        searchTerm,
        activeDateRange,
        sortConfig,
      }),
    [
      activeDateRange,
      filters.selectedBatches,
      filters.selectedProductFilter,
      filters.showOnlyWithExpiration,
      productsStock,
      searchTerm,
      sortConfig,
    ],
  );

  return {
    loading,
    inventoryData,
    dateFilter,
    dateRangePresets,
    batchModalVisible,
    handleClearFilters,
    handleDateRangeChange,
    handleMoveSubmit,
    handleToolbarMenuClick,
    getActionMenu,
    moveModalVisible,
    productOptions,
    selectedBatch,
    selectedProduct,
    sortMenuItems,
    syncingBatches,
    toolbarMenuItems,
    filters,
    closeBatchModal: () => dispatchState({ type: 'closeBatchModal' }),
    closeMoveModal: () => dispatchState({ type: 'closeMoveModal' }),
    handleViewBatch,
  };
};
