import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

// Lazy load components
const InvoicesPage = lazy(() =>
  import('@/modules/invoice/pages/InvoicesPage/InvoicesPage').then(
    (module) => ({
      default: module.InvoicesPage,
    }),
  ),
);
const SalesAnalyticsPage = lazy(() =>
  import('@/modules/invoice/pages/InvoicesPage/SalesAnalyticsPage').then(
    (module) => ({
      default: module.SalesAnalyticsPage,
    }),
  ),
);
const ServiceCommissionsReport = lazy(() =>
  import(
    '@/modules/invoice/pages/ServiceCommissionsReport/ServiceCommissionsReport'
  ).then((module) => ({
    default: module.ServiceCommissionsReport,
  })),
);
const Preorder = lazy(() =>
  import('@/modules/sales/pages/PreorderSale/PreorderSale').then((module) => ({
    default: module.Preorder,
  })),
);
const Sales = lazy(() =>
  import('@/modules/sales/pages/Sale/Sale').then((module) => ({
    default: module.Sales,
  })),
);

const {
  SALES,
  BILLS,
  BILLS_ANALYTICS,
  SERVICE_COMMISSIONS,
  PREORDERS,
} = ROUTES_NAME.SALES_TERM;

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
    path: BILLS_ANALYTICS,
    element: <SalesAnalyticsPage />,
    title: 'Análisis de Ventas - Ventamax',
    metaDescription:
      'Explora tendencias, clientes, categorías y comportamiento de facturación en Ventamax POS.',
  },
  {
    path: SERVICE_COMMISSIONS,
    element: <ServiceCommissionsReport />,
    title: 'Comisiones de Servicios - Ventamax',
    metaDescription:
      'Consulta comisiones generadas por colaborador y servicios facturados en Ventamax POS.',
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
