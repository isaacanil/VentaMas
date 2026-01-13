import {
  DeleteOutlined,
  MoreOutlined,
  SwapOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from '@/constants/icons/antd';
import { Dropdown, notification, type MenuProps } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';


import { selectUser } from '@/features/auth/userSlice.js';
import { openDeleteModal } from '@/features/productStock/deleteProductStockSlice';
import { reconcileBatchStatus } from '@/firebase/functions/inventory/reconcileBatchStatus.js';
import { getBatchById } from '@/firebase/warehouse/batchService';
import BatchViewModal from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/BatchViewModal';
import { ProductMovementModal } from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/ProductMovementModal';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';

import { AdvancedFilterModal } from './components/AdvancedFilterModal';
import { SearchControls } from './components/SearchControls';
import { useInventoryColumns } from './hooks/useInventoryColumns';
import { useInventoryFilters } from './hooks/useInventoryFilters';
import { useProductFilterOptions } from './hooks/useProductFilterOptions';
import { useProductsStock } from './hooks/useProductsStock';
import {
  Container,
  MenuItemContent,
  Title,
  TitleActions,
  TitleSection,
  ToolbarButton,
} from './styles';
import { normalizeToDateTime, toMillis } from '@/utils/inventory/dates';
import {
  NO_BATCH_VALUE,
  getProductFilterKey,
} from './utils/productFilterUtils';

import type {
  DateRangeValue,
  GetActionMenu,
  InventoryRow,
  InventoryTableProps,
  ProductStockLike,
  SortConfig,
  SortMenuItems,
} from './types';

interface AppUser {
  uid?: string;
  businessID?: string | null;
  [key: string]: unknown;
}

const isAppUser = (value: unknown): value is AppUser =>
  typeof value === 'object' && value !== null;

interface ReconcileBatchStatusResult {
  batchesUpdated?: number;
  activatedBatches?: number;
  deactivatedBatches?: number;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  currentNode,
  searchTerm,
  setSearchTerm,
  setDateRange,
  location,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const rawUser: unknown = useSelector(selectUser);
  const user = isAppUser(rawUser) ? rawUser : null;
  const { productsStock, loading } = useProductsStock(location);
  const [syncingBatches, setSyncingBatches] = useState(false);
  const { productOptions, productBatchMap } =
    useProductFilterOptions(productsStock);
  const {
    showOnlyWithExpiration,
    selectedProductFilter,
    selectedBatches,
    hasAdvancedFilters,
    filterDraft,
    draftBatchOptions,
    isFilterModalOpen,
    openFilterModal,
    cancelFilterModal,
    applyFilterModal,
    resetFilterModal,
    updateFilterDraft,
    clearAdvancedFilters,
  } = useInventoryFilters({
    productOptions,
    productBatchMap,
  });

  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductStockLike | null>(null);
  const [dateFilter, setDateFilter] = useState<DateRangeValue>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    order: null,
  });
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<unknown>(null);

  const dateRangePresets = useMemo(
    () => [
      { label: 'Sin filtro', value: null },
      {
        label: 'Hoy',
        value: [
          DateTime.now().startOf('day'),
          DateTime.now().endOf('day'),
        ] as [DateTime, DateTime],
      },
      {
        label: 'Últimos 7 días',
        value: [
          DateTime.now().minus({ days: 6 }).startOf('day'),
          DateTime.now().endOf('day'),
        ] as [DateTime, DateTime],
      },
      {
        label: 'Este mes',
        value: [DateTime.now().startOf('month'), DateTime.now().endOf('month')] as [
          DateTime,
          DateTime,
        ],
      },
      {
        label: 'Próximo mes',
        value: [
          DateTime.now().plus({ months: 1 }).startOf('month'),
          DateTime.now().plus({ months: 1 }).endOf('month'),
        ] as [DateTime, DateTime],
      },
    ],
    [],
  );

  const activeDateRange = useMemo(() => {
    if (!Array.isArray(dateFilter) || !dateFilter[0] || !dateFilter[1]) {
      return null;
    }

    return {
      start: dateFilter[0].startOf('day').toMillis(),
      end: dateFilter[1].endOf('day').toMillis(),
    };
  }, [dateFilter]);

  const handleMove = useCallback((record: ProductStockLike) => {
    setSelectedProduct(record);
    setMoveModalVisible(true);
  }, []);

  const handleMoveSubmit = useCallback(() => {
    setMoveModalVisible(false);
  }, []);

  const handleDateRangeChange = useCallback(
    (dates: DateRangeValue) => {
      if (!dates || (!dates[0] && !dates[1])) {
        setDateFilter(null);
        setDateRange(null);
        return;
      }

      const normalizedDates = Array.isArray(dates)
        ? (dates.map((date) =>
          date ? normalizeToDateTime(date) : null,
        ) as DateRangeValue)
        : null;

      if (!normalizedDates || (!normalizedDates[0] && !normalizedDates[1])) {
        setDateFilter(null);
        setDateRange(null);
        return;
      }

      setDateFilter(normalizedDates);
      setDateRange(normalizedDates);
    },
    [setDateRange],
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setDateFilter(null);
    setDateRange(null);
    clearAdvancedFilters();
    setSortConfig({ field: null, order: null });
  }, [clearAdvancedFilters, setDateRange, setSearchTerm]);

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
    async (batchId?: string | null) => {
      if (!batchId || !user) return;
      const batchData = await getBatchById(user, batchId);
      if (batchData) {
        setSelectedBatch(batchData);
        setBatchModalVisible(true);
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

  const describeSyncResult = useCallback(
    (result?: ReconcileBatchStatusResult) => {
      if (!result) return undefined;
      const {
        batchesUpdated = 0,
        activatedBatches = 0,
        deactivatedBatches = 0,
      } = result;
      return `Actualizados: ${batchesUpdated} Â· Activados: ${activatedBatches} Â· Desactivados: ${deactivatedBatches}`;
    },
    [],
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

      setSyncingBatches(true);
      try {
        const result = (await reconcileBatchStatus({
          businessId: user.businessID,          dryRun,
        })) as ReconcileBatchStatusResult;

        notification.success({
          title: dryRun
            ? 'Simulación completada'
            : 'Lotes sincronizados correctamente',
          description: describeSyncResult(result),
        });
      } catch (err) {
        notification.error({
          title: 'Error al sincronizar lotes',
          description:
            err instanceof Error ? err.message : 'No se pudo completar la acción',
        });
      } finally {
        setSyncingBatches(false);
      }
    },
    [describeSyncResult, user],
  );

  const toolbarMenuItems = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'sync-batches',
        label: (
          <MenuItemContent>
            <SyncOutlined spin={syncingBatches} />
            {syncingBatches ? 'Sincronizandoâ€¦' : 'Sincronizar lotes'}
          </MenuItemContent>
        ),
        disabled: syncingBatches,
      },
      {
        key: 'sync-batches-dry',
        label: (
          <MenuItemContent>
            <SyncOutlined />
            Simular sincronización
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
      setSortConfig({ field, order });
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
        label: 'Número de Lote (Ascendente)',
        onClick: () => handleSort('batchNumberId', 'asc'),
      },
      {
        key: 'expirationDate-asc',
        label: 'Fecha de Vencimiento (Próximos)',
        onClick: () => handleSort('expirationDate', 'asc'),
      },
      {
        key: 'expirationDate-desc',
        label: 'Fecha de Vencimiento (Lejanos)',
        onClick: () => handleSort('expirationDate', 'desc'),
      },
      {
        key: 'createdAt-desc',
        label: 'Más recientes primero',
        onClick: () => handleSort('createdAt', 'desc'),
      },
      {
        key: 'createdAt-asc',
        label: 'Más antiguos primero',
        onClick: () => handleSort('createdAt', 'asc'),
      },
    ],
    [handleSort],
  );

  const getSortedData = useCallback(
    (data: InventoryRow[]) => {
      if (!sortConfig.field) return data;

      const { field, order } = sortConfig;
      const direction = order === 'desc' ? -1 : 1;

      return [...data].sort((a, b) => {
        if (field === 'expirationDate') {
          const aMillis = a.expirationDateMillis ?? Number.POSITIVE_INFINITY;
          const bMillis = b.expirationDateMillis ?? Number.POSITIVE_INFINITY;
          return direction * (aMillis - bMillis);
        }

        if (field === 'createdAt') {
          const aMillis = toMillis(a.createdAt);
          const bMillis = toMillis(b.createdAt);

          const aValid = aMillis !== null;
          const bValid = bMillis !== null;

          if (!aValid && !bValid) return 0;
          if (!aValid) return 1;
          if (!bValid) return -1;

          return direction * ((aMillis ?? 0) - (bMillis ?? 0));
        }

        if (field === 'productName') {
          return direction * a.productName.localeCompare(b.productName);
        }

        if (field === 'batchNumberId') {
          const batchA = a.batch?.batchNumberId ?? '';
          const batchB = b.batch?.batchNumberId ?? '';
          return direction * batchA.localeCompare(batchB);
        }

        return 0;
      });
    },
    [sortConfig],
  );

  const inventoryData: InventoryRow[] = useMemo(() => {
    const filtered = productsStock
      .filter((stock) => {
        const expirationMillis = toMillis(stock.expirationDate);
        if (showOnlyWithExpiration && expirationMillis === null) return false;
        if (selectedProductFilter) {
          const productKey = getProductFilterKey(stock);
          if (!productKey || productKey !== selectedProductFilter) return false;
        }
        if (selectedBatches.length) {
          const batchValue = stock?.batchNumberId || NO_BATCH_VALUE;
          if (!selectedBatches.includes(batchValue)) return false;
        }

        if (searchTerm) {
          const normalizedSearch = searchTerm.toLowerCase();
          const productName = stock.productName?.toLowerCase() ?? '';
          const batchValue = (() => {
            if (!stock.batch) return '';
            if (typeof stock.batch === 'string')
              return stock.batch.toLowerCase();
            if (typeof stock.batch === 'number')
              return String(stock.batch).toLowerCase();
            if (
              'batchNumberId' in stock.batch &&
              typeof stock.batch.batchNumberId === 'string'
            ) {
              return stock.batch.batchNumberId.toLowerCase();
            }
            return '';
          })();

          const productNameMatch = productName.includes(normalizedSearch);
          const batchMatch = batchValue.includes(normalizedSearch);
          if (!productNameMatch && !batchMatch) return false;
        }

        if (activeDateRange) {
          if (expirationMillis === null) return false;
          return (
            expirationMillis >= activeDateRange.start &&
            expirationMillis <= activeDateRange.end
          );
        }

        return true;
      })
      .map((stock): InventoryRow => {
        const expirationDateMillis = toMillis(stock.expirationDate);
        const todayStartMillis = DateTime.now().startOf('day').toMillis();
        const isExpired = expirationDateMillis
          ? DateTime.fromMillis(expirationDateMillis)
              .startOf('day')
              .toMillis() < todayStartMillis
          : false;
        const expiryDate = expirationDateMillis
          ? {
            label: DateTime.fromMillis(expirationDateMillis).toFormat(
              'dd/MM/yyyy',
            ),
            isExpired,
          }
          : { label: 'N/A', isExpired: false };

        return {
          ...stock,
          id: stock.id ?? '',
          key: stock.id ?? '',
          productName: stock.productName || 'Producto sin nombre',
          productId: stock.productId || '',
          quantity: stock.quantity ?? 0,
          batch: {
            batchNumberId: stock.batchNumberId || 'Sin lote',
            batchId: stock.batchId ?? null,
          },
          batchId: stock.batchId ?? null,
          actions: stock,
          expirationDateMillis,
          expiryDate,
        };
      });

    return getSortedData(filtered);
  }, [
    productsStock,
    showOnlyWithExpiration,
    selectedProductFilter,
    selectedBatches,
    searchTerm,
    activeDateRange,
    getSortedData,
  ]);

  const columns = useInventoryColumns({
    onViewBatch: (batchId) => void handleViewBatch(batchId),
    getActionMenu,
  });

  return (
    <>
      <Container>
        <TitleSection>
          <Title>Gestión de Inventario</Title>
          <TitleActions>
            <Dropdown
              trigger={['click']}
              menu={{
                items: toolbarMenuItems,
                onClick: handleToolbarMenuClick,
              }}
              placement="bottomRight"
            >
              <ToolbarButton
                aria-label="Acciones avanzadas"
                icon={<MoreOutlined />}
                loading={syncingBatches}
              />
            </Dropdown>
          </TitleActions>
        </TitleSection>

        <SearchControls
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          dateFilter={dateFilter}
          onDateRangeChange={handleDateRangeChange}
          dateRangePresets={dateRangePresets}
          sortMenuItems={sortMenuItems}
          onOpenAdvancedFilters={openFilterModal}
          hasAdvancedFilters={hasAdvancedFilters}
          onClearFilters={handleClearFilters}
        />

        <AdvancedTable
          columns={columns}
          data={inventoryData}
          loading={loading}
          numberOfElementsPerPage={8}
          emptyText="No hay registros para mostrar"
        />

        <AdvancedFilterModal
          open={isFilterModalOpen}
          filterDraft={filterDraft}
          onCancel={cancelFilterModal}
          onReset={resetFilterModal}
          onApply={applyFilterModal}
          onToggleExpiration={(checked) =>
            updateFilterDraft((prev) => ({
              ...prev,
              showOnlyWithExpiration: checked,
            }))
          }
          productOptions={productOptions}
          onProductChange={(value) =>
            updateFilterDraft((prev) => ({
              ...prev,
              product: value,
              batches: [],
            }))
          }
          draftBatchOptions={draftBatchOptions}
          onToggleBatch={(batchValue, checked) =>
            updateFilterDraft((prev) => ({
              ...prev,
              batches: checked
                ? [...prev.batches, batchValue]
                : prev.batches.filter((value) => value !== batchValue),
            }))
          }
        />
      </Container>

      <ProductMovementModal
        visible={moveModalVisible}
        onCancel={() => setMoveModalVisible(false)}
        onOk={handleMoveSubmit}
        product={selectedProduct}
        currentNode={currentNode}
      />

      <BatchViewModal
        visible={batchModalVisible}
        onClose={() => setBatchModalVisible(false)}
        batchData={selectedBatch}
      />
    </>
  );
};



