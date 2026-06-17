export { ProductBatchModal } from './pages/Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal';
export {
  default as barcodePrintModalReducer,
  SelectBarcodePrintModal,
  toggleBarcodeModal,
} from './state/barcodePrintModalSlice';
export { InventoryFilterAndSort } from './pages/Inventario/pages/ItemsManager/components/InventoryFilterAndSort/InventoryFilterAndSort';
export { default as InventoryMenu } from './pages/Inventory/components/Warehouse/components/DetailView/InventoryMenu';
export {
  useInventoryProductIds,
  useListenAllActiveProductsStock,
} from './hooks/useProductStock';
export { useStockAlertThresholds } from './hooks/useStockAlertThresholds';
export { useLocationNames } from './hooks/useLocationNames';

export const loadInventoryItemsRoute = () =>
  import('./pages/Inventario/pages/ItemsManager/Inventario').then((module) => ({
    default: module.Inventory,
  }));

export const loadProductOutflowRoute = () =>
  import('./pages/Inventario/pages/ProductOutflow/ProductOutflow').then(
    (module) => ({
      default: module.ProductOutflow,
    }),
  );

export const loadProductViewRoute = () =>
  import('./pages/ProductView/ProductView');

export const loadProductOutflowModal = () =>
  import(
    './pages/Inventario/pages/ProductOutflow/components/ProductOutflowModal/ProductOutflowModal'
  ).then((module) => ({ default: module.ProductOutflowModal }));

export const loadBarcodePrintModal = () =>
  import(
    './pages/Inventario/pages/ItemsManager/components/BarcodePrintModal/BarcodePrintModal'
  ).then((module) => ({ default: module.BarcodePrintModal }));

export const loadInventoryMovementsRoute = () =>
  import('./pages/Inventory/components/AllMovements/AllMovements');

export const loadWarehouseDetailRoute = () =>
  import('./pages/Inventory/components/Warehouse/components/DetailView/DetailView');

export const loadWarehouseRoute = () =>
  import('./pages/Inventory/components/Warehouse/Warehouse').then((module) => ({
    default: module.Warehouse,
  }));

export const loadWarehouseProductStockRoute = () =>
  import('./pages/Inventory/components/Warehouse/WarehouseProductStock');

export const loadInventoryControlRoute = () =>
  import('./pages/InventoryControl/InventoryControl');

export const loadInventorySessionsListRoute = () =>
  import('./pages/InventorySessionsList/InventorySessionsList');

export const loadInventorySummaryRoute = () =>
  import('./pages/InventorySummary/InventorySummary');

export const loadDeleteProductStockModal = () =>
  import('./pages/Inventory/components/Warehouse/components/DeleteProductStock/DeleteProductStockModal').then(
    (module) => ({ default: module.DeleteProductStockModal }),
  );

export const loadProductStockForm = () =>
  import('./pages/Inventory/components/Warehouse/forms/ProductStockForm/ProductStockForm').then(
    (module) => ({ default: module.ProductStockForm }),
  );

export const loadRowShelfForm = () =>
  import('./pages/Inventory/components/Warehouse/forms/RowShelfForm/RowShelfForm');

export const loadSegmentForm = () =>
  import('./pages/Inventory/components/Warehouse/forms/SegmentForm/SegmentForm');

export const loadShelfForm = () =>
  import('./pages/Inventory/components/Warehouse/forms/ShelfForm/ShelfForm').then(
    (module) => ({ default: module.ShelfForm }),
  );

export const loadWarehouseForm = () =>
  import('./pages/Inventory/components/Warehouse/forms/WarehouseForm/WarehouseForm').then(
    (module) => ({ default: module.WarehouseForm }),
  );
