import { Purchases, Orders } from "../../views";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";


const {PURCHASES, ORDERS} = ROUTES_NAME.PURCHASE_TERM;

const PurchaseRoutes = [
    { path: "/purchases", element: validateRouteAccess(<Purchases />), name: PURCHASES },
    { path: "/orders", element: validateRouteAccess(<Orders />), name: ORDERS }
]

export default PurchaseRoutes;