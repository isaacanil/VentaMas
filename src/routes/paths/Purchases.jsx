import BackOrders from "../../views/pages/OrderAndPurchase/BackOrders/BackOrders";
import { Purchases } from "../../views/pages/OrderAndPurchase/Compra/Purchases";
import { Orders } from "../../views/pages/OrderAndPurchase/Order/Orders";
import OrderManagement from "../../views/pages/OrderAndPurchase/OrderManagement/OrderManagement";
import PurchaseManagement from "../../views/pages/OrderAndPurchase/PurchaseManagement/PurchaseManagement";
import { ROUTE_STATUS } from "../routeMeta"; // Para usar los estados de ruta
import ROUTES_NAME from "../routesName";

const { PURCHASES, PURCHASES_CREATE, PURCHASES_UPDATE, PURCHASES_COMPLETE, BACKORDERS } = ROUTES_NAME.PURCHASE_TERM;
const { ORDERS, ORDERS_CREATE, ORDERS_CONVERT, ORDERS_UPDATE } = ROUTES_NAME.ORDER_TERM;

const PurchaseRoutes = [
    // purchase routes
    { path: PURCHASES, element: <Purchases /> },
    { path: PURCHASES_CREATE, element: <PurchaseManagement />, status: ROUTE_STATUS.WIP },
    { path: PURCHASES_UPDATE, element: <PurchaseManagement /> },
    { path: PURCHASES_COMPLETE, element: <PurchaseManagement /> },

    // order routes
    { path: ORDERS, element: <Orders /> },
    { path: ORDERS_CREATE, element: <OrderManagement /> },
    { path: ORDERS_UPDATE, element: <OrderManagement /> },
    { path: ORDERS_CONVERT, element: <PurchaseManagement /> },

    // backorders route (feature en beta)
    { path: BACKORDERS, element: <BackOrders />, status: ROUTE_STATUS.BETA },
];

export default PurchaseRoutes;
