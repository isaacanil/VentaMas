import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import {
  loadInvoicesPageRoute,
  loadSalesAnalyticsPageRoute,
  loadServiceCommissionsReportRoute,
} from '@/modules/invoice/public';
import { loadPreorderSaleRoute, loadSalesRoute } from '@/modules/sales/public';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

// Lazy load components
const InvoicesPage = lazy(loadInvoicesPageRoute);
const SalesAnalyticsPage = lazy(loadSalesAnalyticsPageRoute);
const ServiceCommissionsReport = lazy(loadServiceCommissionsReportRoute);
const Preorder = lazy(loadPreorderSaleRoute);
const Sales = lazy(loadSalesRoute);

const { SALES, BILLS, BILLS_ANALYTICS, SERVICE_COMMISSIONS, PREORDERS } =
  ROUTES_NAME.SALES_TERM;

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
