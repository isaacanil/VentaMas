import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

// Lazy load components
const Orders = lazy(() =>
  import('@/modules/orderAndPurchase/pages/OrderAndPurchase/Order/Orders').then(
    (module) => ({
      default: module.Orders,
    }),
  ),
);
const OrderManagement = lazy(
  () =>
    import('@/modules/orderAndPurchase/pages/OrderAndPurchase/OrderManagement/OrderManagement'),
);
const PurchaseManagement = lazy(
  () =>
    import('@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/PurchaseManagement'),
);

const { ORDERS, ORDERS_CREATE, ORDERS_UPDATE, ORDERS_CONVERT } =
  ROUTES_NAME.ORDER_TERM;

const routes: AppRoute[] = [
  {
    path: ORDERS,
    element: <Orders />,
    title: 'Pedidos - Ventamax',
    metaDescription: 'Gestiona los pedidos a proveedores en Ventamax POS.',
  },
  {
    path: ORDERS_CREATE,
    element: <OrderManagement />,
    title: 'Nuevo Pedido - Ventamax',
    metaDescription: 'Crea un nuevo pedido a proveedores en Ventamax POS.',
  },
  {
    path: ORDERS_UPDATE,
    element: <OrderManagement />,
    title: 'Editar Pedido - Ventamax',
    metaDescription: 'Edita un pedido existente en Ventamax POS.',
  },
  {
    path: ORDERS_CONVERT,
    element: <PurchaseManagement />,
    title: 'Convertir Pedido - Ventamax',
    metaDescription: 'Convierte un pedido en una compra en Ventamax POS.',
  },
];

export default routes;
