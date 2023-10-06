

import { Inventory, CategoryAdmin, MultimediaManager } from "../../views";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";
import {ProductOutflow} from "../../views/pages/Inventario/pages/ProductOutflow/ProductOutflow";
import { ProductForm } from "../../views/pages/Inventario/pages/ProductForm/ProductForm";
const { 
    INVENTORY_ITEMS, 
    CATEGORIES, 
    INVENTORY_SERVICES, 
    PRODUCT_IMAGES_MANAGER, 
    PRODUCT_OUTFLOW,
    CREATE_PRODUCT,
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

