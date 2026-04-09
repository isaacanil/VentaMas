import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const ProductView = lazy(
  () => import('@/components/modals/Product/ProductView'),
);
const ProductStudio = lazy(
  () => import('@/modules/dev/pages/DevTools/ProductStudio/ProductStudio'),
);
const Inventory = lazy(() =>
  import('@/modules/inventory/pages/Inventario/pages/ItemsManager/Inventario').then(
    (module) => ({ default: module.Inventory }),
  ),
);
const ProductOutflow = lazy(() =>
  import('@/modules/inventory/pages/Inventario/pages/ProductOutflow/ProductOutflow').then(
    (module) => ({ default: module.ProductOutflow }),
  ),
);
const AllMovements = lazy(
  () =>
    import('@/modules/inventory/pages/Inventory/components/AllMovements/AllMovements'),
);
const DetailView = lazy(
  () =>
    import('@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/DetailView'),
);
const Warehouse = lazy(() =>
  import('@/modules/inventory/pages/Inventory/components/Warehouse/Warehouse').then(
    (module) => ({ default: module.Warehouse }),
  ),
);
const WarehouseProductStock = lazy(
  () =>
    import('@/modules/inventory/pages/Inventory/components/Warehouse/WarehouseProductStock'),
);
const InventoryControl = lazy(() =>
  import('@/modules/inventory/pages/InventoryControl/InventoryControl').then(
    (module) => ({ default: module.InventoryControl }),
  ),
);
const InventorySessionsList = lazy(
  () =>
    import('@/modules/inventory/pages/InventorySessionsList/InventorySessionsList'),
);
const InventorySummary = lazy(() =>
  import('@/modules/inventory/pages/InventorySummary/InventorySummary').then(
    (module) => ({ default: module.InventorySummary }),
  ),
);

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
    element: <ProductStudio />,
  },
  // {
  //   path: CREATE_PRODUCT,
  //   // element: <ProductForm />,
  // },
];

export default Routes;
