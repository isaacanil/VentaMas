

import { Inventory, CategoryAdmin, MultimediaManager } from "../../views";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";
import { ProductOutflow } from "../../views/pages/Inventario/pages/ProductOutflow/ProductOutflow";
import { ProductForm } from "../../views/pages/Inventario/pages/ProductForm/ProductForm";
import { Warehouse } from "../../views/pages/Inventory/components/Warehouse/Warehouse";
import { chain } from "lodash";
import WarehouseContent from "../../views/pages/Inventory/components/Warehouse/components/WarehouseContent";
import ShelfContent from "../../views/pages/Inventory/components/Warehouse/components/ShelfContent";
import RowShelfContent from "../../views/pages/Inventory/components/Warehouse/components/RowShelfContent";
import SegmentContent from "../../views/pages/Inventory/components/Warehouse/components/SegmentContent";
import WarehouseLayout from "../../views/pages/Inventory/components/Warehouse/components/WarehouseLayout";

const {
    INVENTORY_ITEMS,
    CATEGORIES,
    WAREHOUSE,
    SHELF,
    ROW,
    SEGMENT,
    INVENTORY_SERVICES,
    PRODUCT_IMAGES_MANAGER,
    PRODUCT_OUTFLOW,
    CREATE_PRODUCT,
    WAREHOUSES
} = ROUTES_NAME.INVENTORY_TERM;

const Routes = [
    {
        path: INVENTORY_ITEMS,
        element: validateRouteAccess(<Inventory />),
    },
    {
        path: CATEGORIES,
        element: validateRouteAccess(<CategoryAdmin />),
    },
    {
        path: PRODUCT_IMAGES_MANAGER,
        element: validateRouteAccess(<MultimediaManager />),
    },
    {
        path: WAREHOUSES,
        element: validateRouteAccess(<Warehouse />),
    },
    {
        path: WAREHOUSE,
        element: validateRouteAccess(<WarehouseLayout />),
        children: [
            {
                path: "",
                element: validateRouteAccess(<WarehouseContent />),
            },
            {
                path: SHELF,
                element: validateRouteAccess(<ShelfContent />),
            },
            {
                path: ROW,
                element: validateRouteAccess(<RowShelfContent />),
            },
            {
                path: SEGMENT,
                element: validateRouteAccess(<SegmentContent />),
            }
        ]
    },
    {
        path: INVENTORY_SERVICES,
        element: validateRouteAccess(<Inventory />),
    },
    {
        path: PRODUCT_OUTFLOW,
        element: validateRouteAccess(<ProductOutflow />),
    },
    {
        path: CREATE_PRODUCT,
        element: validateRouteAccess(<ProductForm />),
    }
]

export default Routes;

