
import { Inventory, CategoryAdmin } from "../../views";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";

const { INVENTORY_ITEMS, CATEGORIES, INVENTORY_SERVICES, PRODUCT_IMAGES_MANAGER, PRODUCT_OUTFLOW } = ROUTES_NAME.INVENTORY_TERM;

const basePath = "inventory"

const Routes = [
    {
        path: `/${basePath}/items`,
        element: validateRouteAccess(<Inventory />),
        name: INVENTORY_ITEMS
    },
    {
        path: `/${basePath}/categories`,
        element: validateRouteAccess(<CategoryAdmin />),
        name: CATEGORIES
    },
    {
        path: `/${basePath}/multimedia-manager`,
        element: validateRouteAccess(<Inventory />),
        name: PRODUCT_IMAGES_MANAGER
    },
    {
        path: `/${basePath}/services`,
        element: validateRouteAccess(<Inventory />),
        name: INVENTORY_SERVICES
    },
    {
        path: `/${basePath}/product-outflow`,
        element: validateRouteAccess(<Inventory />),
        name: PRODUCT_OUTFLOW
    },
]

export default Routes;

