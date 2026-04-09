import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Navigate } from 'react-router-dom';

import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import RoutesName from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const AllUsersControl = lazy(() =>
  import('@/modules/controlPanel/AllUsersControl/AllUsersControl').then(
    (module) => ({ default: module.AllUsersControl }),
  ),
);
const AppConfig = lazy(
  () => import('@/modules/controlPanel/AppConfig/AppConfig'),
);
const LoginImageConfig = lazy(
  () => import('@/modules/controlPanel/AppConfig/LoginImageConfig'),
);
const ChangeLogCreate = lazy(
  () =>
    import('@/modules/controlPanel/ChangeLogControl/ChangeLogCreate/ChangeLogCreate'),
);
const BusinessControl = lazy(() =>
  import('@/modules/controlPanel/CreateBusinessControl/BusinessControl').then(
    (module) => ({ default: module.BusinessControl }),
  ),
);
const AiBusinessSeeding = lazy(
  () => import('@/modules/dev/pages/dev/AiBusinessSeeding/AiBusinessSeeding'),
);
const BSeriesInvoices = lazy(
  () => import('@/modules/dev/pages/DevTools/BSeriesInvoices/BSeriesInvoices'),
);
const CashCountAudit = lazy(
  () => import('@/modules/dev/pages/DevTools/CashCountAudit/CashCountAudit'),
);
const FiscalReceiptsAudit = lazy(() =>
  import('@/modules/dev/pages/DevTools/FiscalReceiptsAudit/FiscalReceiptsAudit').then(
    (module) => ({ default: module.FiscalReceiptsAudit }),
  ),
);
const InventoryMigrationTool = lazy(
  () => import('@/modules/dev/pages/DevTools/InventoryMigrationTool'),
);
const InvoiceV2Recovery = lazy(
  () =>
    import('@/modules/dev/pages/DevTools/InvoiceV2Recovery/InvoiceV2Recovery'),
);
const SyncDiagnostics = lazy(
  () => import('@/modules/dev/pages/DevTools/SyncDiagnostics'),
);
const TestPlayground = lazy(
  () => import('@/modules/dev/pages/DevTools/TestPlayground'),
);
const BusinessSelectorPage = lazy(() =>
  import('@/modules/auth/pages/BusinessSelectorPage/BusinessSelectorPage').then(
    (module) => ({ default: module.BusinessSelectorPage }),
  ),
);
const CheckProductPriceAudit = lazy(
  () =>
    import('@/modules/dev/pages/test/pages/checkProductPriceField/CheckProductPriceAudit'),
);
const Doc = lazy(() =>
  import('@/components/ui/AdvancedTable/Doc').then((module) => ({
    default: module.Doc,
  })),
);
const Menu = lazy(() => import('@/components/ui/Menu/Menu'));
const ProductFormV2TestBench = lazy(
  () =>
    import('@/modules/dev/pages/DevTools/ProductFormV2Test/ProductFormV2TestBench'),
);
const DeveloperSubscriptionMaintenancePage = lazy(
  () =>
    import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage'),
);
const DeveloperSubscriptionMaintenancePlansPage = lazy(
  () =>
    import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePlansPage'),
);
const AccountingPilotAudit = lazy(
  () => import('@/modules/dev/pages/DevTools/AccountingPilotAudit/AccountingPilotAudit'),
);

const {
  BUSINESSES,
  SUBSCRIPTION_MAINTENANCE,
  SUBSCRIPTION_MAINTENANCE_PLANS,
  CHANGELOG_CREATE,
  ALL_USERS,
  APP_CONFIG,
  INVENTORY_MIGRATION,
  SYNC_DIAGNOSTICS,
  INVOICE_V2_RECOVERY,
  PRICE_LIST_AUDIT,
  AI_BUSINESS_SEEDING,
  CASH_COUNT_AUDIT,
  SELECT_BUSINESS_TEST,
  PRODUCT_FORM_V2_TEST,
  ACCOUNTING_PILOT_AUDIT,
} = RoutesName.DEV_VIEW_TERM;

// Todas estas rutas se consideran de desarrollo; se filtrarán en producción salvo que se active VITE_ENABLE_DEV_ROUTES
// Puedes granular alguna con enabledEnvs: ['development','staging'] si quieres que salga en staging únicamente.
const Routes: AppRoute[] = [
  {
    path: BUSINESSES,
    element: <BusinessControl />,
    requiresDevAccess: true,
    status: ROUTE_STATUS.WIP,
  },
  {
    path: SUBSCRIPTION_MAINTENANCE,
    element: <DeveloperSubscriptionMaintenancePage />,
    children: [
      {
        index: true,
        element: <Navigate to={SUBSCRIPTION_MAINTENANCE_PLANS} replace />,
      },
      {
        path: 'planes',
        element: <DeveloperSubscriptionMaintenancePlansPage />,
      },
      {
        path: '*',
        element: <Navigate to={SUBSCRIPTION_MAINTENANCE_PLANS} replace />,
      },
    ],
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: '/doc',
    element: <Doc />,
    devOnly: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: '/menu',
    element: <Menu />,
    devOnly: true,
  },
  {
    path: RoutesName.DEV_VIEW_TERM.FISCAL_RECEIPTS_AUDIT,
    element: <FiscalReceiptsAudit />,
    requiresDevAccess: true,
    // enabledEnvs: ['development'] // Ejemplo: sólo en dev incluso si se fuerza dev routes en staging
  },
  {
    path: RoutesName.DEV_VIEW_TERM.B_SERIES_INVOICES,
    element: <BSeriesInvoices />,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: INVOICE_V2_RECOVERY,
    element: <InvoiceV2Recovery />,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: RoutesName.DEV_VIEW_TERM.PRUEBA,
    element: <TestPlayground />,
    requiresDevAccess: true,
  },
  {
    path: SELECT_BUSINESS_TEST,
    element: <BusinessSelectorPage />,
    devOnly: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: PRICE_LIST_AUDIT,
    element: <CheckProductPriceAudit />,
    devOnly: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: CASH_COUNT_AUDIT,
    element: <CashCountAudit />,
    devOnly: true,
    status: ROUTE_STATUS.WIP,
  },
  {
    path: INVENTORY_MIGRATION,
    element: <InventoryMigrationTool />,
    devOnly: true,
    status: ROUTE_STATUS.WIP,
    // Para habilitar en staging usar VITE_ENABLE_DEV_ROUTES=true
    // enabledEnvs: ['development']
  },
  {
    path: SYNC_DIAGNOSTICS,
    element: <SyncDiagnostics />,
    devOnly: true,
    status: ROUTE_STATUS.WIP,
  },
  {
    path: ALL_USERS,
    element: <AllUsersControl />,
    devOnly: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: CHANGELOG_CREATE,
    element: <ChangeLogCreate />,
    devOnly: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: APP_CONFIG.ROOT,
    element: <AppConfig />,
    devOnly: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: APP_CONFIG.LOGIN_IMAGE,
    element: <LoginImageConfig />,
    devOnly: true,
  },
  {
    path: AI_BUSINESS_SEEDING,
    element: <AiBusinessSeeding />,
    requiresDevAccess: true,
    // Disponible también en hosting; el acceso real se protege por permisos de desarrollador
    // en frontend y backend (Cloud Functions).
    status: ROUTE_STATUS.BETA,
  },
  {
    path: PRODUCT_FORM_V2_TEST,
    element: <ProductFormV2TestBench />,
    devOnly: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: ACCOUNTING_PILOT_AUDIT,
    element: <AccountingPilotAudit />,
    devOnly: true,
    status: ROUTE_STATUS.WIP,
  },
];
export default Routes;
