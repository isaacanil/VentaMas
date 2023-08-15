import { Purchases, Orders } from "../../views";
import { AddPurchase } from "../../views/pages/Compra/page/CreatePurchase/CreatePurchase";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";


const {PURCHASES, ORDERS, ORDERS_CREATE, PURCHASES_CREATE} = ROUTES_NAME.PURCHASE_TERM;

const PurchaseRoutes = [
    { path: PURCHASES, element: validateRouteAccess(<Purchases />) },
    { path: PURCHASES_CREATE, element: validateRouteAccess(<AddPurchase/>)},
    { path: ORDERS, element: validateRouteAccess(<Orders />) }
]

export default PurchaseRoutes;