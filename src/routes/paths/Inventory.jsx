import { lazy } from 'react';

import ROUTES_NAME from '../routesName';

const ProductView = lazy(() =>
  import('../../views/component/modals/Product/ProductView'),
);
const CategoryAdmin = lazy(() =>
  import('../../views/pages/Category/CategoryAdmin').then((module) => ({
    default: module.CategoryAdmin,
  })),
);
const ProductStudio = lazy(() =>
  import('../../views/pages/DevTools/ProductStudio/ProductStudio'),
);
const Inventory = lazy(() =>
  import('../../views/pages/Inventario/pages/ItemsManager/Inventario').then(
    (module) => ({ default: module.Inventory }),
  ),
);
const MultimediaManager = lazy(() =>
  import(
    '../../views/pages/Inventario/pages/MultimediaManager/MultimediaManager'
  ).then((module) => ({ default: module.MultimediaManager })),
);
const ProductOutflow = lazy(() =>
  import(
    '../../views/pages/Inventario/pages/ProductOutflow/ProductOutflow'
  ).then((module) => ({ default: module.ProductOutflow })),
);
const AllMovements = lazy(() =>
  import('../../views/pages/Inventory/components/AllMovements/AllMovements'),
);
const DetailView = lazy(() =>
  import(
    '../../views/pages/Inventory/components/Warehouse/components/DetailView/DetailView'
  ),
);
const Warehouse = lazy(() =>
  import('../../views/pages/Inventory/components/Warehouse/Warehouse').then(
    (module) => ({ default: module.Warehouse }),
  ),
);
const WarehouseProductStock = lazy(() =>
  import(
    '../../views/pages/Inventory/components/Warehouse/WarehouseProductStock'
  ),
);
const InventoryControl = lazy(() =>
  import('../../views/pages/InventoryControl/InventoryControl').then(
    (module) => ({ default: module.InventoryControl }),
  ),
);
const InventorySessionsList = lazy(() =>
  import('../../views/pages/InventorySessionsList/InventorySessionsList'),
);
const InventorySummary = lazy(() =>
  import('../../views/pages/InventorySummary/InventorySummary').then(
    (module) => ({ default: module.InventorySummary }),
  ),
);

const {
  INVENTORY_ITEMS,
  CATEGORIES,
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
  PRODUCT_IMAGES_MANAGER,
  PRODUCT_OUTFLOW,
  PRODUCT_STUDIO,
  CREATE_PRODUCT,
  PRODUCT,
  WAREHOUSES,
  INVENTORY_MOVEMENTS,
} = ROUTES_NAME.INVENTORY_TERM;

const Routes = [
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
    path: CATEGORIES,
    element: <CategoryAdmin />,
  },
  {
    path: PRODUCT_IMAGES_MANAGER,
    element: <MultimediaManager />,
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
  {
    path: CREATE_PRODUCT,
    // element: <ProductForm />,
  },
];

export default Routes;
