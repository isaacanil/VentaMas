import { Inventory } from "../../views/pages/Inventario/pages/ItemsManager/Inventario";
import { CategoryAdmin } from "../../views/pages/Category/CategoryAdmin";
import { MultimediaManager } from "../../views/pages/Inventario/pages/MultimediaManager/MultimediaManager";
import ROUTES_NAME from "../routesName";
import { ProductOutflow } from "../../views/pages/Inventario/pages/ProductOutflow/ProductOutflow";
// import { ProductForm } from "../../views/pages/Inventario/pages/ProductForm/ProductForm";
import { Warehouse } from "../../views/pages/Inventory/components/Warehouse/Warehouse";
import ProductView from "../../views/component/modals/Product/ProductView";
import DetailView from "../../views/pages/Inventory/components/Warehouse/components/DetailView/DetailView";
import ProductStockOverview from "../../views/pages/Inventory/components/Warehouse/components/ProductStockOverview/ProductStockOverview";

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
    PRODUCT_IMAGES_MANAGER,
    PRODUCT_OUTFLOW,
    CREATE_PRODUCT,
    PRODUCT,
    WAREHOUSES
} = ROUTES_NAME.INVENTORY_TERM;

const Routes = [
    {
        path: INVENTORY_ITEMS,
        element: <Inventory />,
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

