import ProductView from '../../views/component/modals/Product/ProductView';
import { CategoryAdmin } from '../../views/pages/Category/CategoryAdmin';
import ProductStudio from '../../views/pages/DevTools/ProductStudio/ProductStudio';
import { Inventory } from '../../views/pages/Inventario/pages/ItemsManager/Inventario';
import { MultimediaManager } from '../../views/pages/Inventario/pages/MultimediaManager/MultimediaManager';
import { ProductOutflow } from '../../views/pages/Inventario/pages/ProductOutflow/ProductOutflow';
import AllMovements from '../../views/pages/Inventory/components/AllMovements/AllMovements';
import DetailView from '../../views/pages/Inventory/components/Warehouse/components/DetailView/DetailView';
import { Warehouse } from '../../views/pages/Inventory/components/Warehouse/Warehouse';
import WarehouseProductStock from '../../views/pages/Inventory/components/Warehouse/WarehouseProductStock';
import { InventoryControl } from '../../views/pages/InventoryControl/InventoryControl';
import InventorySessionsList from '../../views/pages/InventorySessionsList/InventorySessionsList';
import { InventorySummary } from '../../views/pages/InventorySummary/InventorySummary';
import ROUTES_NAME from '../routesName';
// import { ProductForm } from "../../views/pages/Inventario/pages/ProductForm/ProductForm";

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
