import { Purchases, Orders, AddPurchase } from "../../views";
import { CreateOrder } from "../../views/pages/OrderAndPurchase/CreateOrder/CreateOrder";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";


const { PURCHASES, ORDERS, ORDERS_CREATE, PURCHASES_CREATE } = ROUTES_NAME.PURCHASE_TERM;

const PurchaseRoutes = [
    { path: PURCHASES, element: validateRouteAccess(<Purchases />) },
    { path: PURCHASES_CREATE, element: validateRouteAccess(<AddPurchase />) },
    { path: ORDERS, element: validateRouteAccess(<Orders />) },
    { path: ORDERS_CREATE, element: validateRouteAccess(<CreateOrder />)}
]

export default PurchaseRoutes;