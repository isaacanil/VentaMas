import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import { loadProductStudioRoute } from '@/modules/dev/public';
import {
  loadInventoryControlRoute,
  loadInventoryItemsRoute,
  loadInventoryMovementsRoute,
  loadInventorySessionsListRoute,
  loadInventorySummaryRoute,
  loadProductViewRoute,
  loadProductOutflowRoute,
  loadWarehouseDetailRoute,
  loadWarehouseProductStockRoute,
  loadWarehouseRoute,
} from '@/modules/inventory/public';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const ProductView = lazy(loadProductViewRoute);
const ProductStudio = lazy(loadProductStudioRoute);
const Inventory = lazy(loadInventoryItemsRoute);
const ProductOutflow = lazy(loadProductOutflowRoute);
const AllMovements = lazy(loadInventoryMovementsRoute);
const DetailView = lazy(loadWarehouseDetailRoute);
const Warehouse = lazy(loadWarehouseRoute);
const WarehouseProductStock = lazy(loadWarehouseProductStockRoute);
const InventoryControl = lazy(loadInventoryControlRoute);
const InventorySessionsList = lazy(loadInventorySessionsListRoute);
const InventorySummary = lazy(loadInventorySummaryRoute);

const {
  INVENTORY_ITEMS,
  WAREHOUSE,
  SHELF,
  ROW,
  SEGMENT,
  PRODUCTS_STOCK,
  PRODUCT_STOCK,
  INVENTORY_SERVICES,
  INVENTORY_CONTROL,
  INVENTORY_SUMMARY,
  INVENTORY_CONTROL_SESSION,
  PRODUCT_OUTFLOW,
  PRODUCT_STUDIO,
  PRODUCT,
  WAREHOUSES,
  INVENTORY_MOVEMENTS,
} = ROUTES_NAME.INVENTORY_TERM;

const Routes: AppRoute[] = [
  {
    path: INVENTORY_ITEMS,
    element: <Inventory />,
  },
  {
    path: INVENTORY_MOVEMENTS,
    element: <AllMovements />,
  },
  {
    path: INVENTORY_CONTROL,
    element: <InventorySessionsList />,
  },
  {
    path: INVENTORY_SUMMARY,
    element: <InventorySummary />,
  },
  {
    path: INVENTORY_CONTROL_SESSION,
    element: <InventoryControl />,
  },
  {
    path: PRODUCT,
    element: <ProductView />,
  },
  {
    path: WAREHOUSES,
    element: <Warehouse />,
    children: [
      { path: WAREHOUSE, element: <DetailView /> },
      { path: SHELF, element: <DetailView /> },
      { path: ROW, element: <DetailView /> },
      { path: SEGMENT, element: <DetailView /> },
    ],
  },
  {
    path: PRODUCTS_STOCK,
    element: <WarehouseProductStock />,
  },
  {
    path: PRODUCT_STOCK,
    element: <WarehouseProductStock />,
  },
  {
    path: INVENTORY_SERVICES,
    element: <Inventory />,
  },
  {
    path: PRODUCT_OUTFLOW,
    element: <ProductOutflow />,
  },
  {
    path: PRODUCT_STUDIO,
    requiresDevAccess: true,
    element: <ProductStudio />,
  },
];

export default Routes;
