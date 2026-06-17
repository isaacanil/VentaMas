import {
  loadAccountReceivableAuditRoute,
  loadAccountReceivableListRoute,
} from '@/modules/accountsReceivable/public';
import { loadAccountsPayableListRoute } from '@/modules/accountsPayable/public';
import { loadAccountingWorkspaceRoute } from '@/modules/accounting/public';
import { loadAuthorizationsManagerRoute } from '@/modules/authorizations/public';
import { loadClaimBusinessRoute, loadLoginRoute } from '@/modules/auth/public';
import { loadCashReconciliationListRoute } from '@/modules/cashReconciliation/public';
import { loadCheckoutRedirectRoute } from '@/modules/checkout/public';
import {
  loadClientAdminRoute,
  loadProviderAdminRoute,
} from '@/modules/contacts/public';
import {
  loadAllUsersControlRoute,
  loadAppConfigRoute,
  loadBusinessControlRoute,
  loadChangelogCreateRoute,
  loadChangelogListRoute,
  loadChangelogManageRoute,
  loadLoginImageConfigRoute,
} from '@/modules/controlPanel/public';
import {
  loadAccountingPilotAuditRoute,
  loadAiBusinessSeedingRoute,
  loadBSeriesInvoicesRoute,
  loadCashCountAuditRoute,
  loadCustomHeroUiPlaygroundRoute,
  loadElectronicTaxReceiptProviderConfigRoute,
  loadErrorReportsRoute,
  loadErrorScreenPreviewRoute,
  loadFinanceReadinessAuditRoute,
  loadFiscalReceiptsAuditRoute,
  loadHeroUiPlaygroundRoute,
  loadInventoryMigrationToolRoute,
  loadInvoiceV2RecoveryRoute,
  loadProductFormV2TestBenchRoute,
  loadProductPriceAuditRoute,
  loadProductStudioRoute,
  loadSwitchBusinessRoute,
  loadSyncDiagnosticsRoute,
  loadTestPlaygroundRoute,
} from '@/modules/dev/public';
import {
  loadCreditNoteListRoute,
  loadDebitNoteListRoute,
  loadInvoicesPageRoute,
  loadReceivablePaymentReceiptRoute,
  loadSalesAnalyticsPageRoute,
  loadServiceCommissionsReportRoute,
} from '@/modules/invoice/public';
import { loadDeveloperHubRoute, loadHomeRoute } from '@/modules/home/public';
import {
  loadInventoryItemsRoute,
  loadInventoryMovementsRoute,
  loadInventorySessionsListRoute,
  loadInventorySummaryRoute,
  loadWarehouseRoute,
} from '@/modules/inventory/public';
import {
  loadHrCommissionPeriodsRoute,
  loadHrCommissionsRoute,
  loadHrPayrollWorkspaceRoute,
} from '@/modules/hrPayroll/public';
import {
  loadInsuranceConfigRoute,
  loadInsuranceCreateRoute,
} from '@/modules/insurance/public';
import {
  loadBackOrdersRoute,
  loadOrdersRoute,
  loadPurchasesRoute,
} from '@/modules/orderAndPurchase/public';
import { loadPreorderSaleRoute, loadSalesRoute } from '@/modules/sales/public';
import {
  loadExpensesCreateRoute,
  loadExpensesListRoute,
} from '@/modules/expenses/public';
import {
  loadAccountingConfigRoute,
  loadAccountSubscriptionBillingRoute,
  loadAccountSubscriptionLayoutRoute,
  loadAccountSubscriptionOverviewRoute,
  loadAccountSubscriptionPaymentMethodRoute,
  loadAccountSubscriptionPlansRoute,
  loadAccountSubscriptionSettingsRoute,
  loadAccountSubscriptionSuccessRoute,
  loadDeveloperSubscriptionMaintenancePlansRoute,
  loadDeveloperSubscriptionMaintenanceRoute,
  loadGeneralConfigRoute,
  loadUsersAdminRoute,
  loadUsersListRoute,
  loadUserSessionLogsRoute,
} from '@/modules/settings/public';
import { loadTreasuryBankAccountsRoute } from '@/modules/treasury/public';
import { loadUtilityReportRoute } from '@/modules/utility/public';
import { loadWelcomeRoute, loadWelcomeV2Route } from '@/modules/welcome/public';

import ROUTES_NAME from './routesName';

type RoutePreloader = () => Promise<unknown>;

const {
  BASIC_TERM,
  AUTH_TERM,
  SALES_TERM,
  INVENTORY_TERM,
  CONTACT_TERM,
  PURCHASE_TERM,
  ORDER_TERM,
  EXPENSES_TERM,
  CASH_RECONCILIATION_TERM,
  TREASURY_TERM,
  ACCOUNT_RECEIVABLE,
  CREDIT_NOTE_TERM,
  DEBIT_NOTE_TERM,
  AUTHORIZATIONS_TERM,
  INSURANCE_TERM,
  UTILITY_TERM,
  CHANGELOG_TERM,
  SETTING_TERM,
  DEV_VIEW_TERM,
  ACCOUNTING_TERM,
  HR_PAYROLL_TERM,
  LAB_TERM,
  ACCOUNT_PAYABLE,
} = ROUTES_NAME;

const {
  USERS,
  USERS_LIST,
  USERS_SESSION_LOGS,
  ACCOUNT_SUBSCRIPTION,
  ACCOUNT_SUBSCRIPTION_MANAGE,
  ACCOUNT_SUBSCRIPTION_SUCCESS,
  ACCOUNT_SUBSCRIPTION_PLANS,
  ACCOUNT_SUBSCRIPTION_BILLING,
  ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS,
  ACCOUNT_SUBSCRIPTION_SETTINGS,
  ACCOUNT_SUBSCRIPTION_BLOCKED,
  GENERAL_CONFIG_EXCHANGE_RATES,
  GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
} = SETTING_TERM;

const {
  ACCOUNTING_PILOT_AUDIT,
  SUBSCRIPTION_MAINTENANCE,
  SUBSCRIPTION_MAINTENANCE_PLANS,
} = DEV_VIEW_TERM;

const {
  ACCOUNTING,
  ACCOUNTING_JOURNAL_BOOK,
  ACCOUNTING_GENERAL_LEDGER,
  ACCOUNTING_MANUAL_ENTRIES,
  ACCOUNTING_REPORTS,
  ACCOUNTING_FISCAL_COMPLIANCE,
  ACCOUNTING_MONITOR,
  ACCOUNTING_PERIOD_CLOSE,
} = ACCOUNTING_TERM;

const preloadAccountingSettingsWorkspace = async () => {
  await Promise.all([loadGeneralConfigRoute(), loadAccountingConfigRoute()]);
};

const preloadAccountSubscriptionWithLayout =
  (loadPageRoute: RoutePreloader) => async () => {
    await Promise.all([loadAccountSubscriptionLayoutRoute(), loadPageRoute()]);
  };

export const routePreloaders: Record<string, RoutePreloader> = {
  [BASIC_TERM.HOME]: loadHomeRoute,
  [BASIC_TERM.DEVELOPER_HUB]: loadDeveloperHubRoute,
  [BASIC_TERM.WELCOME]: loadWelcomeRoute,
  [BASIC_TERM.WELCOME_V2]: loadWelcomeV2Route,
  [BASIC_TERM.CHECKOUT_PROXY]: loadCheckoutRedirectRoute,
  [AUTH_TERM.LOGIN]: loadLoginRoute,
  [AUTH_TERM.CLAIM_BUSINESS]: loadClaimBusinessRoute,

  [SALES_TERM.SALES]: loadSalesRoute,
  [SALES_TERM.BILLS]: loadInvoicesPageRoute,
  [SALES_TERM.BILLS_ANALYTICS]: loadSalesAnalyticsPageRoute,
  [SALES_TERM.SERVICE_COMMISSIONS]: loadServiceCommissionsReportRoute,
  [SALES_TERM.PREORDERS]: loadPreorderSaleRoute,

  [PURCHASE_TERM.PURCHASES]: loadPurchasesRoute,
  [ORDER_TERM.ORDERS]: loadOrdersRoute,
  [PURCHASE_TERM.BACKORDERS]: loadBackOrdersRoute,

  [EXPENSES_TERM.EXPENSES_LIST]: loadExpensesListRoute,
  [EXPENSES_TERM.EXPENSES_CREATE]: loadExpensesCreateRoute,

  [CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST]:
    loadCashReconciliationListRoute,
  [TREASURY_TERM.TREASURY_BANK_ACCOUNTS]: loadTreasuryBankAccountsRoute,
  [TREASURY_TERM.TREASURY_ACCOUNT_DETAIL]: loadTreasuryBankAccountsRoute,

  [ACCOUNT_PAYABLE.ACCOUNT_PAYABLE_LIST]: loadAccountsPayableListRoute,

  [ACCOUNTING]: loadAccountingWorkspaceRoute,
  [ACCOUNTING_JOURNAL_BOOK]: loadAccountingWorkspaceRoute,
  [ACCOUNTING_GENERAL_LEDGER]: loadAccountingWorkspaceRoute,
  [ACCOUNTING_MANUAL_ENTRIES]: loadAccountingWorkspaceRoute,
  [ACCOUNTING_REPORTS]: loadAccountingWorkspaceRoute,
  [ACCOUNTING_FISCAL_COMPLIANCE]: loadAccountingWorkspaceRoute,
  [ACCOUNTING_MONITOR]: loadAccountingWorkspaceRoute,
  [ACCOUNTING_PERIOD_CLOSE]: loadAccountingWorkspaceRoute,
  [HR_PAYROLL_TERM.HR_PAYROLL]: loadHrPayrollWorkspaceRoute,
  [HR_PAYROLL_TERM.HR_EMPLOYEES]: loadHrPayrollWorkspaceRoute,
  [HR_PAYROLL_TERM.HR_COMMISSIONS]: loadHrCommissionsRoute,
  [HR_PAYROLL_TERM.HR_COMMISSION_PERIODS]: loadHrCommissionPeriodsRoute,
  [HR_PAYROLL_TERM.HR_COMMISSION_PERIOD_DETAIL]: loadHrCommissionPeriodsRoute,

  [INVENTORY_TERM.INVENTORY_ITEMS]: loadInventoryItemsRoute,
  [INVENTORY_TERM.INVENTORY_CONTROL]: loadInventorySessionsListRoute,
  [INVENTORY_TERM.INVENTORY_SUMMARY]: loadInventorySummaryRoute,
  [INVENTORY_TERM.WAREHOUSES]: loadWarehouseRoute,
  [INVENTORY_TERM.INVENTORY_MOVEMENTS]: loadInventoryMovementsRoute,
  [INVENTORY_TERM.PRODUCT_STUDIO]: loadProductStudioRoute,

  [CONTACT_TERM.CLIENTS]: loadClientAdminRoute,
  [CONTACT_TERM.SUPPLIERS]: loadProviderAdminRoute,

  [INSURANCE_TERM.INSURANCE_CONFIG]: loadInsuranceConfigRoute,
  [INSURANCE_TERM.INSURANCE_CREATE]: loadInsuranceCreateRoute,

  [ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST]: loadAccountReceivableListRoute,
  [ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_AUDIT]:
    loadAccountReceivableAuditRoute,
  [ACCOUNT_RECEIVABLE.RECEIVABLE_PAYMENT_RECEIPTS]:
    loadReceivablePaymentReceiptRoute,

  [CREDIT_NOTE_TERM.CREDIT_NOTE_LIST]: loadCreditNoteListRoute,
  [DEBIT_NOTE_TERM.DEBIT_NOTE_LIST]: loadDebitNoteListRoute,

  [AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST]: loadAuthorizationsManagerRoute,

  [SETTING_TERM.SETTING]: loadGeneralConfigRoute,
  [GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS]:
    preloadAccountingSettingsWorkspace,
  [GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES]:
    preloadAccountingSettingsWorkspace,
  [GENERAL_CONFIG_EXCHANGE_RATES]: preloadAccountingSettingsWorkspace,
  [ACCOUNT_SUBSCRIPTION]: preloadAccountSubscriptionWithLayout(
    loadAccountSubscriptionOverviewRoute,
  ),
  [ACCOUNT_SUBSCRIPTION_MANAGE]: preloadAccountSubscriptionWithLayout(
    loadAccountSubscriptionOverviewRoute,
  ),
  [ACCOUNT_SUBSCRIPTION_SUCCESS]: loadAccountSubscriptionSuccessRoute,
  [ACCOUNT_SUBSCRIPTION_PLANS]: preloadAccountSubscriptionWithLayout(
    loadAccountSubscriptionPlansRoute,
  ),
  [ACCOUNT_SUBSCRIPTION_BILLING]: preloadAccountSubscriptionWithLayout(
    loadAccountSubscriptionBillingRoute,
  ),
  [ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS]: preloadAccountSubscriptionWithLayout(
    loadAccountSubscriptionPaymentMethodRoute,
  ),
  [ACCOUNT_SUBSCRIPTION_SETTINGS]: preloadAccountSubscriptionWithLayout(
    loadAccountSubscriptionSettingsRoute,
  ),
  [ACCOUNT_SUBSCRIPTION_BLOCKED]: preloadAccountSubscriptionWithLayout(
    loadAccountSubscriptionOverviewRoute,
  ),
  [`${USERS}/${USERS_LIST}`]: async () => {
    await Promise.all([loadUsersAdminRoute(), loadUsersListRoute()]);
  },
  [`${USERS}/${USERS_SESSION_LOGS}`]: async () => {
    await Promise.all([loadUsersAdminRoute(), loadUserSessionLogsRoute()]);
  },

  [UTILITY_TERM.UTILITY_REPORT]: loadUtilityReportRoute,

  [CHANGELOG_TERM.CHANGELOG_LIST]: loadChangelogListRoute,

  [DEV_VIEW_TERM.SWITCH_BUSINESS]: loadSwitchBusinessRoute,
  [DEV_VIEW_TERM.BUSINESSES]: loadBusinessControlRoute,
  [DEV_VIEW_TERM.ALL_USERS]: loadAllUsersControlRoute,
  [DEV_VIEW_TERM.CHANGELOG_MANAGE]: loadChangelogManageRoute,
  [DEV_VIEW_TERM.CHANGELOG_CREATE]: loadChangelogCreateRoute,
  [DEV_VIEW_TERM.APP_CONFIG.ROOT]: loadAppConfigRoute,
  [DEV_VIEW_TERM.APP_CONFIG.LOGIN_IMAGE]: loadLoginImageConfigRoute,
  [DEV_VIEW_TERM.FISCAL_RECEIPTS_AUDIT]: loadFiscalReceiptsAuditRoute,
  [DEV_VIEW_TERM.ELECTRONIC_TAX_RECEIPT_PROVIDER]:
    loadElectronicTaxReceiptProviderConfigRoute,
  [DEV_VIEW_TERM.INVOICE_V2_RECOVERY]: loadInvoiceV2RecoveryRoute,
  [DEV_VIEW_TERM.B_SERIES_INVOICES]: loadBSeriesInvoicesRoute,
  [DEV_VIEW_TERM.PRICE_LIST_AUDIT]: loadProductPriceAuditRoute,
  [DEV_VIEW_TERM.CASH_COUNT_AUDIT]: loadCashCountAuditRoute,
  [DEV_VIEW_TERM.INVENTORY_MIGRATION]: loadInventoryMigrationToolRoute,
  [DEV_VIEW_TERM.SYNC_DIAGNOSTICS]: loadSyncDiagnosticsRoute,
  [DEV_VIEW_TERM.AI_BUSINESS_SEEDING]: loadAiBusinessSeedingRoute,
  [DEV_VIEW_TERM.PRODUCT_FORM_V2_TEST]: loadProductFormV2TestBenchRoute,
  [ACCOUNTING_PILOT_AUDIT]: loadAccountingPilotAuditRoute,
  [DEV_VIEW_TERM.FINANCE_READINESS_AUDIT]: loadFinanceReadinessAuditRoute,
  [DEV_VIEW_TERM.PRUEBA]: loadTestPlaygroundRoute,
  [DEV_VIEW_TERM.ERROR_SCREEN_PREVIEW]: loadErrorScreenPreviewRoute,
  [DEV_VIEW_TERM.ERROR_REPORTS]: loadErrorReportsRoute,
  [LAB_TERM.HEROUI]: loadHeroUiPlaygroundRoute,
  [LAB_TERM.HEROUI_CUSTOM]: loadCustomHeroUiPlaygroundRoute,
  [SUBSCRIPTION_MAINTENANCE]: loadDeveloperSubscriptionMaintenanceRoute,
  [SUBSCRIPTION_MAINTENANCE_PLANS]: async () => {
    await Promise.all([
      loadDeveloperSubscriptionMaintenanceRoute(),
      loadDeveloperSubscriptionMaintenancePlansRoute(),
    ]);
  },
};
