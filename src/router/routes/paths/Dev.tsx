import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Navigate } from 'react-router-dom';

import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import RoutesName from '@/router/routes/routesName';
import {
  loadAccountingPilotAuditRoute,
  loadAiBusinessSeedingRoute,
  loadBSeriesInvoicesRoute,
  loadCashCountAuditRoute,
  loadElectronicTaxReceiptProviderConfigRoute,
  loadErrorReportsRoute,
  loadErrorScreenPreviewRoute,
  loadFinanceReadinessAuditRoute,
  loadFiscalReceiptsAuditRoute,
  loadInventoryMigrationToolRoute,
  loadInvoiceV2RecoveryRoute,
  loadProductFormV2TestBenchRoute,
  loadProductPriceAuditRoute,
  loadSyncDiagnosticsRoute,
  loadTestPlaygroundRoute,
} from '@/modules/dev/public';
import {
  loadAllUsersControlRoute,
  loadAppConfigRoute,
  loadBusinessControlRoute,
  loadChangelogCreateRoute,
  loadLoginImageConfigRoute,
} from '@/modules/controlPanel/public';
import {
  loadDeveloperSubscriptionMaintenancePlansRoute,
  loadDeveloperSubscriptionMaintenanceRoute,
} from '@/modules/settings/public';
import type { AppRoute } from '@/router/types/routeTypes';

const AllUsersControl = lazy(loadAllUsersControlRoute);
const AppConfig = lazy(loadAppConfigRoute);
const LoginImageConfig = lazy(loadLoginImageConfigRoute);
const ChangeLogCreate = lazy(loadChangelogCreateRoute);
const BusinessControl = lazy(loadBusinessControlRoute);
const AiBusinessSeeding = lazy(loadAiBusinessSeedingRoute);
const BSeriesInvoices = lazy(loadBSeriesInvoicesRoute);
const CashCountAudit = lazy(loadCashCountAuditRoute);
const FiscalReceiptsAudit = lazy(loadFiscalReceiptsAuditRoute);
const InventoryMigrationTool = lazy(loadInventoryMigrationToolRoute);
const InvoiceV2Recovery = lazy(loadInvoiceV2RecoveryRoute);
const SyncDiagnostics = lazy(loadSyncDiagnosticsRoute);
const TestPlayground = lazy(loadTestPlaygroundRoute);
const ErrorScreenPreview = lazy(loadErrorScreenPreviewRoute);
const ErrorReports = lazy(loadErrorReportsRoute);
const ElectronicTaxReceiptProviderConfigPage = lazy(
  loadElectronicTaxReceiptProviderConfigRoute,
);
const CheckProductPriceAudit = lazy(loadProductPriceAuditRoute);
const Doc = lazy(() =>
  import('@/components/ui/AdvancedTable/Doc').then((module) => ({
    default: module.Doc,
  })),
);
const ProductFormV2TestBench = lazy(loadProductFormV2TestBenchRoute);
const DeveloperSubscriptionMaintenancePage = lazy(
  loadDeveloperSubscriptionMaintenanceRoute,
);
const DeveloperSubscriptionMaintenancePlansPage = lazy(
  loadDeveloperSubscriptionMaintenancePlansRoute,
);
const AccountingPilotAudit = lazy(loadAccountingPilotAuditRoute);
const FinanceReadinessAudit = lazy(loadFinanceReadinessAuditRoute);

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
  ERROR_SCREEN_PREVIEW,
  ERROR_REPORTS,
  AI_BUSINESS_SEEDING,
  CASH_COUNT_AUDIT,
  PRODUCT_FORM_V2_TEST,
  ACCOUNTING_PILOT_AUDIT,
  FINANCE_READINESS_AUDIT,
  ELECTRONIC_TAX_RECEIPT_PROVIDER,
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
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: RoutesName.DEV_VIEW_TERM.FISCAL_RECEIPTS_AUDIT,
    element: <FiscalReceiptsAudit />,
    requiresDevAccess: true,
    // enabledEnvs: ['development'] // Ejemplo: sólo en dev incluso si se fuerza dev routes en staging
  },
  {
    path: ELECTRONIC_TAX_RECEIPT_PROVIDER,
    element: <ElectronicTaxReceiptProviderConfigPage />,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
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
    path: ERROR_SCREEN_PREVIEW,
    element: <ErrorScreenPreview />,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: ERROR_REPORTS,
    element: <ErrorReports />,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: PRICE_LIST_AUDIT,
    element: <CheckProductPriceAudit />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: CASH_COUNT_AUDIT,
    element: <CashCountAudit />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.WIP,
  },
  {
    path: INVENTORY_MIGRATION,
    element: <InventoryMigrationTool />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.WIP,
    // Para habilitar en staging usar VITE_ENABLE_DEV_ROUTES=true
    // enabledEnvs: ['development']
  },
  {
    path: SYNC_DIAGNOSTICS,
    element: <SyncDiagnostics />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.WIP,
  },
  {
    path: ALL_USERS,
    element: <AllUsersControl />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: CHANGELOG_CREATE,
    element: <ChangeLogCreate />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: APP_CONFIG.ROOT,
    element: <AppConfig />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: APP_CONFIG.LOGIN_IMAGE,
    element: <LoginImageConfig />,
    devOnly: true,
    requiresDevAccess: true,
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
    requiresDevAccess: true,
    status: ROUTE_STATUS.BETA,
  },
  {
    path: ACCOUNTING_PILOT_AUDIT,
    element: <AccountingPilotAudit />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.WIP,
  },
  {
    path: FINANCE_READINESS_AUDIT,
    element: <FinanceReadinessAudit />,
    devOnly: true,
    requiresDevAccess: true,
    status: ROUTE_STATUS.WIP,
  },
];
export default Routes;
