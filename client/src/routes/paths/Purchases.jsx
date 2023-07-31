import { Purchases, Orders } from "../../views";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";


const {PURCHASES, ORDERS} = ROUTES_NAME.PURCHASE_TERM;

const PurchaseRoutes = [
    { path: PURCHASES, element: validateRouteAccess(<Purchases />) },
    { path: ORDERS, element: validateRouteAccess(<Orders />) }
]

export default PurchaseRoutes;