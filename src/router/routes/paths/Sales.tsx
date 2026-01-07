import React, { lazy } from 'react';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

// Lazy load components
const CashReconciliation = lazy(() =>
  import('@/views/pages/CashReconciliation/CashReconciliation').then(
    (module) => ({ default: module.CashReconciliation }),
  ),
);
const InvoicesPage = lazy(() =>
  import('@/views/pages/InvoicesPage/InvoicesPage').then((module) => ({
    default: module.InvoicesPage,
  })),
);
const Preorder = lazy(() =>
  import('@/views/pages/PreorderSale/PreorderSale').then((module) => ({
    default: module.Preorder,
  })),
);
const Sales = lazy(() =>
  import('@/views/pages/Sale/Sale').then((module) => ({
    default: module.Sales,
  })),
);

const { SALES, BILLS, PREORDERS } = ROUTES_NAME.SALES_TERM;
const { CASH_RECONCILIATION_LIST: CASH_RECONCILIATION } =
  ROUTES_NAME.CASH_RECONCILIATION_TERM;

const routes: AppRoute[] = [
  {
    path: SALES,
    element: <Sales />,
    title: 'Ventas - Ventamax',
    metaDescription:
      'Realiza y gestiona ventas con escaneo de códigos de barras y control eficiente.',
  },
  {
    path: BILLS,
    element: <InvoicesPage />,
    title: 'Facturas de Ventas - Ventamax',
    metaDescription:
      'Consulta, registra y gestiona las facturas relacionadas con las ventas en Ventamax POS.',
  },
  {
    path: CASH_RECONCILIATION,
    element: <CashReconciliation />,
    title: 'Cuadre de Caja - Ventamax',
    metaDescription:
      'Realiza el cuadre de caja en Ventamax POS. Revisa, concilia y cierra el flujo de efectivo diario para asegurar la precisión de las transacciones.',
  },
  {
    path: PREORDERS,
    element: <Preorder />,
    title: 'Preventas - Ventamax',
    metaDescription:
      'Revisa, gestiona y convierte las preventas en Ventamax POS. Explora las opciones para cancelar o convertir preventas en facturas fácilmente.',
  },
];

export default routes;

