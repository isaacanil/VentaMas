import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

type RuntimeExportKind = 'defined' | 'function' | 'object';

type PublicBarrelCase = {
  moduleName: string;
  load: () => Promise<Record<string, unknown>>;
  exports: Record<string, RuntimeExportKind>;
};

const publicBarrels: PublicBarrelCase[] = [
  {
    moduleName: '@/modules/accountsPayable/public',
    load: () => import('@/modules/accountsPayable/public'),
    exports: {
      loadAccountsPayableListRoute: 'function',
      useAccountsPayablePayments: 'function',
      useListenVendorBills: 'function',
    },
  },
  {
    moduleName: '@/modules/accounting/public',
    load: () => import('@/modules/accounting/public'),
    exports: {
      AddBankAccountModal: 'function',
      BankPaymentPolicySection: 'function',
      useAccountingConfig: 'function',
      useAccountingPostingProfiles: 'function',
      useActiveBankAccounts: 'function',
      useActiveBankAccountsState: 'function',
      useCashAccounts: 'function',
      useChartOfAccounts: 'function',
      useOpenAccountingEntry: 'function',
      loadAccountingWorkspaceRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/auth/public',
    load: () => import('@/modules/auth/public'),
    exports: {
      ClaimOwnershipModal: 'function',
      RequireAuth: 'function',
      SessionExpiredAlertDialog: 'function',
      buildAccessControlFromBusinesses: 'function',
      hasBusinessManagerQuery: 'function',
      loadClaimBusinessRoute: 'function',
      loadLoginRoute: 'function',
      loadSignUpRoute: 'function',
      normalizeAvailableBusinesses: 'function',
      resolveAutoSelectedBusiness: 'function',
      resolveBusinessPreferenceId: 'function',
      resolveBusinessDevIdLabel: 'function',
      resolveBusinessDisplayName: 'function',
      resolveCurrentActiveBusinessId: 'function',
      resolveCurrentActiveRole: 'function',
      resolveDefaultHomeRoute: 'function',
      setStoredActiveBusinessId: 'function',
      useAutomaticLogin: 'function',
      useBusinessMetadata: 'function',
      useUserDocListener: 'function',
      withBusinessManagerQuery: 'function',
      withoutBusinessManagerQuery: 'function',
    },
  },
  {
    moduleName: '@/modules/cashReconciliation/public',
    load: () => import('@/modules/cashReconciliation/public'),
    exports: {
      loadCashReconciliationClosureRoute: 'function',
      loadCashReconciliationInvoiceOverviewRoute: 'function',
      loadCashReconciliationListRoute: 'function',
      loadCashReconciliationOpeningRoute: 'function',
      useOpenCashRegisters: 'function',
    },
  },
  {
    moduleName: '@/modules/treasury/public',
    load: () => import('@/modules/treasury/public'),
    exports: {
      loadTreasuryBankAccountsRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/expenses/public',
    load: () => import('@/modules/expenses/public'),
    exports: {
      loadExpensesCreateRoute: 'function',
      loadExpensesListRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/settings/public',
    load: () => import('@/modules/settings/public'),
    exports: {
      loadAccountingConfigRoute: 'function',
      loadAccountSubscriptionBillingRoute: 'function',
      loadAccountSubscriptionLayoutRoute: 'function',
      loadAccountSubscriptionOverviewRoute: 'function',
      loadAccountSubscriptionPaymentMethodRoute: 'function',
      loadAccountSubscriptionPlansRoute: 'function',
      loadAccountSubscriptionSettingsRoute: 'function',
      loadAccountSubscriptionSuccessRoute: 'function',
      loadAppInfoRoute: 'function',
      loadAuthorizationFlowConfigRoute: 'function',
      loadBillingConfigRoute: 'function',
      loadBusinessCreateRoute: 'function',
      loadBusinessEditRoute: 'function',
      loadDeveloperSubscriptionMaintenancePlansRoute: 'function',
      loadDeveloperSubscriptionMaintenanceRoute: 'function',
      loadGeneralConfigRoute: 'function',
      loadInventoryConfigRoute: 'function',
      loadModulesConfigRoute: 'function',
      loadSignUpUserModal: 'function',
      loadSubscriptionConfigRoute: 'function',
      loadTaxReceiptSettingRoute: 'function',
      loadUserActivityRoute: 'function',
      loadUsersAdminRoute: 'function',
      loadUsersLandingRedirectRoute: 'function',
      loadUsersListRoute: 'function',
      loadUserSessionLogsRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/inventory/public',
    load: () => import('@/modules/inventory/public'),
    exports: {
      InventoryFilterAndSort: 'function',
      InventoryMenu: 'function',
      ProductBatchModal: 'function',
      useInventoryProductIds: 'function',
      useListenAllActiveProductsStock: 'function',
      useLocationNames: 'function',
      useStockAlertThresholds: 'function',
      loadBarcodePrintModal: 'function',
      loadDeleteProductStockModal: 'function',
      loadInventoryControlRoute: 'function',
      loadInventoryItemsRoute: 'function',
      loadInventoryMovementsRoute: 'function',
      loadInventorySessionsListRoute: 'function',
      loadInventorySummaryRoute: 'function',
      loadProductOutflowModal: 'function',
      loadProductViewRoute: 'function',
      loadProductStockForm: 'function',
      loadProductOutflowRoute: 'function',
      loadRowShelfForm: 'function',
      loadSegmentForm: 'function',
      loadShelfForm: 'function',
      loadWarehouseForm: 'function',
      loadWarehouseDetailRoute: 'function',
      loadWarehouseProductStockRoute: 'function',
      loadWarehouseRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/invoice/public',
    load: () => import('@/modules/invoice/public'),
    exports: {
      CreditNotesInfoCard: 'function',
      CreditSelector: 'function',
      ElectronicTaxReceiptInfoCard: 'function',
      Invoice: 'object',
      InvoiceDocumentHeader: 'function',
      InvoiceTemplates: 'function',
      loadCreditNoteListRoute: 'function',
      loadCreditNoteModal: 'function',
      loadDebitNoteListRoute: 'function',
      loadInvoiceFormModal: 'function',
      loadInvoicePreviewModal: 'function',
      loadInvoicesPageRoute: 'function',
      loadInvoiceWorkspaceModal: 'function',
      loadReceivablePaymentReceiptRoute: 'function',
      loadSaleReportTableComponent: 'function',
      loadSalesAnalyticsPageRoute: 'function',
      loadServiceCommissionsReportRoute: 'function',
      PaymentMethodInfoCard: 'function',
      ReceivablePaymentsInfoCard: 'function',
      TaxReceiptDepletedModal: 'function',
    },
  },
  {
    moduleName: '@/modules/home/public',
    load: () => import('@/modules/home/public'),
    exports: {
      loadDeveloperHubRoute: 'function',
      loadHomeRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/insurance/public',
    load: () => import('@/modules/insurance/public'),
    exports: {
      loadInsuranceConfigRoute: 'function',
      loadInsuranceCreateRoute: 'function',
      useInsuranceEnabled: 'function',
      useIsPharmacy: 'function',
    },
  },
  {
    moduleName: '@/modules/hrPayroll/public',
    load: () => import('@/modules/hrPayroll/public'),
    exports: {
      loadHrCommissionPeriodsRoute: 'function',
      loadHrCommissionsRoute: 'function',
      loadHrPayrollWorkspaceRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/navigation/public',
    load: () => import('@/modules/navigation/public'),
    exports: {
      MenuApp: 'function',
      MenuAppUI: 'function',
      NotificationButton: 'function',
      useMenuData: 'function',
    },
  },
  {
    moduleName: '@/modules/notification/public',
    load: () => import('@/modules/notification/public'),
    exports: {
      NotificationCenter: 'function',
    },
  },
  {
    moduleName: '@/modules/orderAndPurchase/public',
    load: () => import('@/modules/orderAndPurchase/public'),
    exports: {
      FilterBar: 'object',
      RegisterSupplierPaymentModal: 'function',
      SupplierPaymentHistoryModal: 'function',
      loadBackOrdersRoute: 'function',
      loadEvidenceUploadDrawer: 'function',
      loadOrderManagementRoute: 'function',
      loadOrdersRoute: 'function',
      loadPurchaseManagementRoute: 'function',
      loadPurchasesAnalyticsRoute: 'function',
      loadPurchasesRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/contacts/public',
    load: () => import('@/modules/contacts/public'),
    exports: {
      ClientControl: 'function',
      ClientSelector: 'function',
      Payment: 'function',
      loadClientAdminRoute: 'function',
      loadClientFormModal: 'function',
      loadLegacyAddClientModal: 'function',
      loadProviderAdminRoute: 'function',
      loadProviderFormModal: 'function',
    },
  },
  {
    moduleName: '@/modules/controlPanel/public',
    load: () => import('@/modules/controlPanel/public'),
    exports: {
      loadAllUsersControlRoute: 'function',
      loadAppConfigRoute: 'function',
      loadBusinessControlRoute: 'function',
      loadChangelogCreateRoute: 'function',
      loadChangelogListRoute: 'function',
      loadChangelogManageRoute: 'function',
      loadLoginImageConfigRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/dev/public',
    load: () => import('@/modules/dev/public'),
    exports: {
      loadAccountingPilotAuditRoute: 'function',
      loadAiBusinessSeedingRoute: 'function',
      loadBSeriesInvoicesRoute: 'function',
      loadCashCountAuditRoute: 'function',
      loadCustomHeroUiPlaygroundRoute: 'function',
      loadDeveloperConsoleModal: 'function',
      loadElectronicTaxReceiptProviderConfigRoute: 'function',
      loadErrorReportsRoute: 'function',
      loadErrorScreenPreviewRoute: 'function',
      loadFinanceReadinessAuditRoute: 'function',
      loadFiscalReceiptsAuditRoute: 'function',
      loadHeroUiPlaygroundRoute: 'function',
      loadInventoryMigrationToolRoute: 'function',
      loadInvoiceV2RecoveryRoute: 'function',
      loadProductFormV2TestBenchRoute: 'function',
      loadProductPriceAuditRoute: 'function',
      loadProductStudioRoute: 'function',
      loadSwitchBusinessRoute: 'function',
      loadSyncDiagnosticsRoute: 'function',
      loadTestPlaygroundRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/accountsReceivable/public',
    load: () => import('@/modules/accountsReceivable/public'),
    exports: {
      ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM: 'defined',
      buildAccountReceivableListUrl: 'function',
      loadAccountReceivableAuditRoute: 'function',
      loadAccountReceivableInfoRoute: 'function',
      loadAccountReceivableListRoute: 'function',
      loadAccountReceivableSummaryModal: 'function',
      loadAccountsReceivablePaymentForm: 'function',
      useCreditLimitCheck: 'function',
      useCreditLimitRealtime: 'function',
      useDueDatesReceivable: 'function',
    },
  },
  {
    moduleName: '@/modules/products/public',
    load: () => import('@/modules/products/public'),
    exports: {
      AddProductButton: 'function',
      Carrusel: 'function',
      ProductCategoryBar: 'function',
      ProductEditorBarcode: 'object',
      ProductEditorImageManager: 'function',
      ProductQRCode: 'object',
      loadActiveIngredientModal: 'function',
      loadProductEditorModal: 'function',
      loadProductBrandModal: 'function',
    },
  },
  {
    moduleName: '@/modules/sales/public',
    load: () => import('@/modules/sales/public'),
    exports: {
      loadPreorderSaleRoute: 'function',
      loadSalesRoute: 'function',
      loadSetCustomProductModal: 'function',
    },
  },
  {
    moduleName: '@/modules/authorizations/public',
    load: () => import('@/modules/authorizations/public'),
    exports: {
      GeneratePinModal: 'function',
      PinDetailsModal: 'function',
      PinAuthorizationModal: 'function',
      loadAuthorizationsManagerRoute: 'function',
      resolveModuleMeta: 'function',
      useAuthorizationModules: 'function',
      useAuthorizationPin: 'function',
    },
  },
  {
    moduleName: '@/modules/app/public',
    load: () => import('@/modules/app/public'),
    exports: {
      ErrorBoundary: 'function',
      ErrorElement: 'function',
      NotFound: 'function',
    },
  },
  {
    moduleName: '@/modules/checkout/public',
    load: () => import('@/modules/checkout/public'),
    exports: {
      AccountsReceivablePaymentReceipt: 'object',
      loadCheckoutRedirectRoute: 'function',
      Receipt: 'object',
    },
  },
  {
    moduleName: '@/modules/utility/public',
    load: () => import('@/modules/utility/public'),
    exports: {
      loadUtilityReportRoute: 'function',
    },
  },
  {
    moduleName: '@/modules/welcome/public',
    load: () => import('@/modules/welcome/public'),
    exports: {
      loadWelcomeRoute: 'function',
      loadWelcomeV2Route: 'function',
    },
  },
];

const modulesDir = path.dirname(fileURLToPath(import.meta.url));

const listModuleNames = () =>
  readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

const listModulePublicBarrels = () =>
  listModuleNames()
    .filter((moduleName) =>
      existsSync(path.join(modulesDir, moduleName, 'public.ts')),
    )
    .map((moduleName) => `@/modules/${moduleName}/public`)
    .sort();

const expectRuntimeExport = (
  barrel: Record<string, unknown>,
  exportName: string,
  expectedKind: RuntimeExportKind,
) => {
  const value = barrel[exportName];

  expect(value, exportName).toBeDefined();

  if (expectedKind === 'defined') {
    return;
  }

  if (expectedKind === 'object') {
    expect(value, exportName).not.toBeNull();
  }

  expect(typeof value, exportName).toBe(expectedKind);
};

describe('module public barrels', () => {
  test('requires every module directory to expose a public barrel', () => {
    const modulesMissingPublicBarrel = listModuleNames().filter(
      (moduleName) =>
        !existsSync(path.join(modulesDir, moduleName, 'public.ts')),
    );

    expect(modulesMissingPublicBarrel).toEqual([]);
  });

  test('registers every module public barrel contract', () => {
    expect(publicBarrels.map(({ moduleName }) => moduleName).sort()).toEqual(
      listModulePublicBarrels(),
    );
  });

  test.each(publicBarrels)(
    '$moduleName exports the runtime public contract',
    async ({ exports, load }) => {
      const barrel = await load();

      expect(Object.keys(barrel).sort()).toEqual(Object.keys(exports).sort());

      for (const [exportName, expectedKind] of Object.entries(exports)) {
        expectRuntimeExport(barrel, exportName, expectedKind);
      }
    },
    90_000,
  );
});
