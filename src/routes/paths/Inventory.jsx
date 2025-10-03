import ROUTES_NAME from "../routesName";
import { ROUTE_STATUS } from "../routeMeta";
import { lazyImport } from "../lazyImport";

const Inventory = lazyImport(() => import("../../views/pages/Inventario/pages/ItemsManager/Inventario"), "Inventory");
const CategoryAdmin = lazyImport(() => import("../../views/pages/Category/CategoryAdmin"), "CategoryAdmin");
const MultimediaManager = lazyImport(() => import("../../views/pages/Inventario/pages/MultimediaManager/MultimediaManager"), "MultimediaManager");
const InventoryControl = lazyImport(() => import("../../views/pages/InventoryControl/InventoryControl"), "InventoryControl");
const InventorySummary = lazyImport(() => import("../../views/pages/InventorySummary/InventorySummary"), "InventorySummary");
const InventorySessionsList = lazyImport(() => import("../../views/pages/InventorySessionsList/InventorySessionsList"));
const ProductOutflow = lazyImport(() => import("../../views/pages/Inventario/pages/ProductOutflow/ProductOutflow"), "ProductOutflow");
// const ProductForm = lazyImport(() => import("../../views/pages/Inventario/pages/ProductForm/ProductForm"), "ProductForm");
const Warehouse = lazyImport(() => import("../../views/pages/Inventory/components/Warehouse/Warehouse"), "Warehouse");
const ProductView = lazyImport(() => import("../../views/component/modals/Product/ProductView"));
const DetailView = lazyImport(() => import("../../views/pages/Inventory/components/Warehouse/components/DetailView/DetailView"));
const ProductStockOverview = lazyImport(() => import("../../views/pages/Inventory/components/Warehouse/components/ProductStockOverview/ProductStockOverview"));
const AllMovements = lazyImport(() => import("../../views/pages/Inventory/components/AllMovements/AllMovements"));

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
    CREATE_PRODUCT,
    PRODUCT,
    WAREHOUSES,
    INVENTORY_MOVEMENTS
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
            
            // { path: ':warehouseId', element: <DetailView /> },
            { path: SHELF, element: <DetailView /> },
            { path: ROW, element: <DetailView /> },
            { path: SEGMENT, element: <DetailView /> },
            { path: PRODUCTS_STOCK, element: <ProductStockOverview /> },
            { path: PRODUCT_STOCK, element: <ProductStockOverview /> },
        ]
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
        path: CREATE_PRODUCT,
        // element: <ProductForm />,
    }
]

export default Routes;
