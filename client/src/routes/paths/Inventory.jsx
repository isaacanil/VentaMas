

import { Inventory, CategoryAdmin } from "../../views";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";
import {ProductOutflow} from "../../views/pages/Inventario/pages/ProductOutflow/ProductOutflow";
const { INVENTORY_ITEMS, CATEGORIES, INVENTORY_SERVICES, PRODUCT_IMAGES_MANAGER, PRODUCT_OUTFLOW } = ROUTES_NAME.INVENTORY_TERM;

const basePath = "inventory"

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
        element: validateRouteAccess(<Inventory />),
    },
    {
        path: INVENTORY_SERVICES,
        element: validateRouteAccess(<Inventory />),
    },
    {
        path: PRODUCT_OUTFLOW,
        element: validateRouteAccess(<ProductOutflow />),
    },
]

export default Routes;

