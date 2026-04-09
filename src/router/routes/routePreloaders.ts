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
  ACCOUNT_RECEIVABLE,
  CREDIT_NOTE_TERM,
  AUTHORIZATIONS_TERM,
  INSURANCE_TERM,
  UTILITY_TERM,
  CHANGELOG_TERM,
  SETTING_TERM,
  DEV_VIEW_TERM,
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
} = SETTING_TERM;

const {
  SUBSCRIPTION_MAINTENANCE,
  SUBSCRIPTION_MAINTENANCE_OVERVIEW,
  SUBSCRIPTION_MAINTENANCE_SANDBOX,
  SUBSCRIPTION_MAINTENANCE_TOOLS,
  SUBSCRIPTION_MAINTENANCE_PLANS,
} = DEV_VIEW_TERM;

export const routePreloaders: Record<string, RoutePreloader> = {
  [BASIC_TERM.HOME]: () => import('@/modules/home/pages/Home/Home'),
  [BASIC_TERM.DEVELOPER_HUB]: () =>
    import('@/modules/home/pages/DeveloperHub/DeveloperHub'),
  [AUTH_TERM.LOGIN]: () => import('@/modules/auth/pages/Login/Login'),
  [AUTH_TERM.CLAIM_BUSINESS]: () =>
    import('@/modules/auth/pages/ClaimBusinessPage/ClaimBusinessPage'),

  [SALES_TERM.SALES]: () => import('@/modules/sales/pages/Sale/Sale'),
  [SALES_TERM.BILLS]: () =>
    import('@/modules/invoice/pages/InvoicesPage/InvoicesPage'),
  [SALES_TERM.BILLS_ANALYTICS]: () =>
    import('@/modules/invoice/pages/InvoicesPage/SalesAnalyticsPage'),
  [SALES_TERM.PREORDERS]: () =>
    import('@/modules/sales/pages/PreorderSale/PreorderSale'),

  [PURCHASE_TERM.PURCHASES]: () =>
    import('@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/Purchases'),
  [ORDER_TERM.ORDERS]: () =>
    import('@/modules/orderAndPurchase/pages/OrderAndPurchase/Order/Orders'),
  [PURCHASE_TERM.BACKORDERS]: () =>
    import('@/modules/orderAndPurchase/pages/OrderAndPurchase/BackOrders/BackOrders'),

  [EXPENSES_TERM.EXPENSES_LIST]: () =>
    import('@/modules/expenses/pages/Expenses/ExpensesList/ExpensesList'),
  [EXPENSES_TERM.EXPENSES_CREATE]: () =>
    import('@/modules/expenses/pages/Expenses/ExpensesForm/ExpensesForm'),

  [CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST]: () =>
    import('@/modules/cashReconciliation/pages/CashReconciliation/CashReconciliation'),

  [INVENTORY_TERM.INVENTORY_ITEMS]: () =>
    import('@/modules/inventory/pages/Inventario/pages/ItemsManager/Inventario'),
  [INVENTORY_TERM.INVENTORY_CONTROL]: () =>
    import('@/modules/inventory/pages/InventorySessionsList/InventorySessionsList'),
  [INVENTORY_TERM.INVENTORY_SUMMARY]: () =>
    import('@/modules/inventory/pages/InventorySummary/InventorySummary'),
  [INVENTORY_TERM.WAREHOUSES]: () =>
    import('@/modules/inventory/pages/Inventory/components/Warehouse/Warehouse'),
  [INVENTORY_TERM.INVENTORY_MOVEMENTS]: () =>
    import('@/modules/inventory/pages/Inventory/components/AllMovements/AllMovements'),
  [INVENTORY_TERM.PRODUCT_STUDIO]: () =>
    import('@/modules/dev/pages/DevTools/ProductStudio/ProductStudio'),

  [CONTACT_TERM.CLIENTS]: () =>
    import('@/modules/contacts/pages/Contact/Client/ClientAdmin'),
  [CONTACT_TERM.SUPPLIERS]: () =>
    import('@/modules/contacts/pages/Contact/Provider/ProviderAdmin'),

  [INSURANCE_TERM.INSURANCE_CONFIG]: () =>
    import('@/modules/insurance/pages/Insurance/InsuranceConfig/InsuraceConfig'),

  [ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST]: () =>
    import('@/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList'),
  [ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_AUDIT]: () =>
    import('@/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableAudit/AccountReceivableAudit'),
  [ACCOUNT_RECEIVABLE.RECEIVABLE_PAYMENT_RECEIPTS]: () =>
    import('@/modules/invoice/pages/InvoicesPage/ReceivablePaymentReceipt'),

  [CREDIT_NOTE_TERM.CREDIT_NOTE_LIST]: () =>
    import('@/modules/invoice/pages/CreditNote/CreditNoteList/CreditNoteList'),

  [AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST]: () =>
    import('@/modules/authorizations/pages/Authorizations/AuthorizationsManager'),

  [SETTING_TERM.SETTING]: () =>
    import('@/modules/settings/components/GeneralConfig/GeneralConfig'),
  [ACCOUNT_SUBSCRIPTION]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/SubscriptionLayout'),
      import('@/modules/settings/pages/subscription/SubscriptionOverviewPage'),
    ]);
  },
  [ACCOUNT_SUBSCRIPTION_MANAGE]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/SubscriptionLayout'),
      import('@/modules/settings/pages/subscription/SubscriptionOverviewPage'),
    ]);
  },
  [ACCOUNT_SUBSCRIPTION_SUCCESS]: () =>
    import('@/modules/settings/pages/subscription/SubscriptionSuccessPage'),
  [ACCOUNT_SUBSCRIPTION_PLANS]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/SubscriptionLayout'),
      import('@/modules/settings/pages/subscription/SubscriptionPlansPage'),
    ]);
  },
  [ACCOUNT_SUBSCRIPTION_BILLING]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/SubscriptionLayout'),
      import('@/modules/settings/pages/subscription/SubscriptionBillingPage'),
    ]);
  },
  [ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/SubscriptionLayout'),
      import('@/modules/settings/pages/subscription/SubscriptionPaymentMethodPage'),
    ]);
  },
  [ACCOUNT_SUBSCRIPTION_SETTINGS]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/SubscriptionLayout'),
      import('@/modules/settings/pages/subscription/SubscriptionSettingsPage'),
    ]);
  },
  [ACCOUNT_SUBSCRIPTION_BLOCKED]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/SubscriptionLayout'),
      import('@/modules/settings/pages/subscription/SubscriptionOverviewPage'),
    ]);
  },
  [`${USERS}/${USERS_LIST}`]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/setting/subPage/Users/UserAdmin'),
      import('@/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList'),
    ]);
  },
  [`${USERS}/${USERS_SESSION_LOGS}`]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/setting/subPage/Users/UserAdmin'),
      import('@/modules/settings/pages/setting/subPage/Users/UserSessionLogs'),
    ]);
  },

  [UTILITY_TERM.UTILITY_REPORT]: () =>
    import('@/modules/utility/pages/Utility/Utility'),

  [CHANGELOG_TERM.CHANGELOG_LIST]: () =>
    import('@/modules/controlPanel/ChangeLogControl/ChangelogList/ChangelogList'),

  [DEV_VIEW_TERM.SWITCH_BUSINESS]: () =>
    import('@/modules/dev/pages/dev/SwitchBusiness'),
  [DEV_VIEW_TERM.BUSINESSES]: () =>
    import('@/modules/controlPanel/CreateBusinessControl/BusinessControl'),
  [DEV_VIEW_TERM.ALL_USERS]: () =>
    import('@/modules/controlPanel/AllUsersControl/AllUsersControl'),
  [DEV_VIEW_TERM.CHANGELOG_MANAGE]: () =>
    import('@/modules/controlPanel/ChangeLogControl/ChangelogManage/ChangelogManage'),
  [DEV_VIEW_TERM.CHANGELOG_CREATE]: () =>
    import('@/modules/controlPanel/ChangeLogControl/ChangeLogCreate/ChangeLogCreate'),
  [DEV_VIEW_TERM.APP_CONFIG.ROOT]: () =>
    import('@/modules/controlPanel/AppConfig/AppConfig'),
  [DEV_VIEW_TERM.FISCAL_RECEIPTS_AUDIT]: () =>
    import('@/modules/dev/pages/DevTools/FiscalReceiptsAudit/FiscalReceiptsAudit'),
  [DEV_VIEW_TERM.INVOICE_V2_RECOVERY]: () =>
    import('@/modules/dev/pages/DevTools/InvoiceV2Recovery/InvoiceV2Recovery'),
  [DEV_VIEW_TERM.B_SERIES_INVOICES]: () =>
    import('@/modules/dev/pages/DevTools/BSeriesInvoices/BSeriesInvoices'),
  [DEV_VIEW_TERM.PRUEBA]: () =>
    import('@/modules/dev/pages/DevTools/TestPlayground'),
  [SUBSCRIPTION_MAINTENANCE]: () =>
    import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage'),
  [SUBSCRIPTION_MAINTENANCE_OVERVIEW]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage'),
      import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenanceOverviewPage'),
    ]);
  },
  [SUBSCRIPTION_MAINTENANCE_SANDBOX]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage'),
      import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenanceSandboxPage'),
    ]);
  },
  [SUBSCRIPTION_MAINTENANCE_TOOLS]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage'),
      import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenanceToolsPage'),
    ]);
  },
  [SUBSCRIPTION_MAINTENANCE_PLANS]: async () => {
    await Promise.all([
      import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage'),
      import('@/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePlansPage'),
    ]);
  },
  [DEV_VIEW_TERM.SELECT_BUSINESS_TEST]: () =>
    import('@/modules/auth/pages/BusinessSelectorPage/BusinessSelectorPage'),
};
