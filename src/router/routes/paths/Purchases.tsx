import { lazy } from 'react';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

// Lazy load components
const Purchases = lazy(() =>
  import('@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/Purchases').then((module) => ({
    default: module.Purchases,
  })),
);
const PurchaseManagement = lazy(() =>
  import(
    '@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/PurchaseManagement'
  ),
);
const BackOrders = lazy(() =>
  import('@/modules/orderAndPurchase/pages/OrderAndPurchase/BackOrders/BackOrders'),
);

const { PURCHASES, PURCHASES_CREATE, PURCHASES_UPDATE, PURCHASES_COMPLETE, BACKORDERS } =
  ROUTES_NAME.PURCHASE_TERM;

const routes: AppRoute[] = [
  {
    path: PURCHASES,
    element: <Purchases />,
    title: 'Compras - Ventamax',
    metaDescription:
      'Gestiona las compras de inventario y proveedores en Ventamax POS.',
  },
  {
    path: PURCHASES_CREATE,
    element: <PurchaseManagement />,
    title: 'Nueva Compra - Ventamax',
    metaDescription: 'Crea una nueva orden de compra en Ventamax POS.',
  },
  {
    path: PURCHASES_UPDATE,
    element: <PurchaseManagement />,
    title: 'Editar Compra - Ventamax',
    metaDescription: 'Edita una orden de compra existente en Ventamax POS.',
  },
  {
    path: PURCHASES_COMPLETE,
    element: <PurchaseManagement />,
    title: 'Completar Compra - Ventamax',
    metaDescription: 'Completa una orden de compra en Ventamax POS.',
  },
  {
    path: BACKORDERS,
    element: <BackOrders />,
    title: 'Pedidos Pendientes - Ventamax',
    metaDescription:
      'Gestiona los pedidos pendientes de completar en Ventamax POS.',
  },
];

export default routes;
