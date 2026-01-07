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

const { USERS, USERS_LIST, USERS_SESSION_LOGS } = SETTING_TERM;

export const routePreloaders: Record<string, RoutePreloader> = {
  [BASIC_TERM.HOME]: () => import('@/views/pages/Home/Home'),
  [AUTH_TERM.LOGIN]: () => import('@/views/pages/Login/Login'),

  [SALES_TERM.SALES]: () => import('@/views/pages/Sale/Sale'),
  [SALES_TERM.BILLS]: () => import('@/views/pages/InvoicesPage/InvoicesPage'),
  [SALES_TERM.PREORDERS]: () => import('@/views/pages/PreorderSale/PreorderSale'),

  [PURCHASE_TERM.PURCHASES]: () => import('@/views/pages/OrderAndPurchase/Compra/Purchases'),
  [ORDER_TERM.ORDERS]: () => import('@/views/pages/OrderAndPurchase/Order/Orders'),
  [PURCHASE_TERM.BACKORDERS]: () => import('@/views/pages/OrderAndPurchase/BackOrders/BackOrders'),

  [EXPENSES_TERM.EXPENSES_LIST]: () => import('@/views/pages/Expenses/ExpensesList/ExpensesList'),
  [EXPENSES_TERM.EXPENSES_CREATE]: () => import('@/views/pages/Expenses/ExpensesForm/ExpensesForm'),

  [CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST]: () =>
    import('@/views/pages/CashReconciliation/CashReconciliation'),

  [INVENTORY_TERM.INVENTORY_ITEMS]: () =>
    import('@/views/pages/Inventario/pages/ItemsManager/Inventario'),
  [INVENTORY_TERM.INVENTORY_CONTROL]: () =>
    import('@/views/pages/InventorySessionsList/InventorySessionsList'),
  [INVENTORY_TERM.INVENTORY_SUMMARY]: () =>
    import('@/views/pages/InventorySummary/InventorySummary'),
  [INVENTORY_TERM.WAREHOUSES]: () =>
    import('@/views/pages/Inventory/components/Warehouse/Warehouse'),
  [INVENTORY_TERM.INVENTORY_MOVEMENTS]: () =>
    import('@/views/pages/Inventory/components/AllMovements/AllMovements'),
  [INVENTORY_TERM.PRODUCT_STUDIO]: () =>
    import('@/views/pages/DevTools/ProductStudio/ProductStudio'),

  [CONTACT_TERM.CLIENTS]: () =>
    import('@/views/pages/Contact/Client/ClientAdmin'),
  [CONTACT_TERM.SUPPLIERS]: () =>
    import('@/views/pages/Contact/Provider/ProviderAdmin'),

  [INSURANCE_TERM.INSURANCE_CONFIG]: () =>
    import('@/views/pages/Insurance/InsuranceConfig/InsuraceConfig'),

  [ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST]: () =>
    import('@/views/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList'),
  [ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_AUDIT]: () =>
    import('@/views/pages/AccountReceivable/pages/AccountReceivableAudit/AccountReceivableAudit'),
  [ACCOUNT_RECEIVABLE.RECEIVABLE_PAYMENT_RECEIPTS]: () =>
    import('@/views/pages/InvoicesPage/ReceivablePaymentReceipt'),

  [CREDIT_NOTE_TERM.CREDIT_NOTE_LIST]: () =>
    import('@/views/pages/CreditNote/CreditNoteList/CreditNoteList'),

  [AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST]: () =>
    import('@/views/pages/Authorizations/AuthorizationsManager'),

  [SETTING_TERM.SETTING]: () =>
    import('@/views/component/GeneralConfig/GeneralConfig'),
  [`${USERS}/${USERS_LIST}`]: async () => {
    await Promise.all([
      import('@/views/pages/setting/subPage/Users/UserAdmin'),
      import('@/views/pages/setting/subPage/Users/components/UsersList/UserList'),
    ]);
  },
  [`${USERS}/${USERS_SESSION_LOGS}`]: async () => {
    await Promise.all([
      import('@/views/pages/setting/subPage/Users/UserAdmin'),
      import('@/views/pages/setting/subPage/Users/UserSessionLogs'),
    ]);
  },

  [UTILITY_TERM.UTILITY_REPORT]: () =>
    import('@/views/pages/Utility/Utility'),

  [CHANGELOG_TERM.CHANGELOG_LIST]: () =>
    import('@/views/controlPanel/ChangeLogControl/ChangelogList/ChangelogList'),

  [DEV_VIEW_TERM.SWITCH_BUSINESS]: () =>
    import('@/views/pages/dev/SwitchBusiness'),
  [DEV_VIEW_TERM.BUSINESSES]: () =>
    import('@/views/controlPanel/CreateBusinessControl/BusinessControl'),
  [DEV_VIEW_TERM.ALL_USERS]: () =>
    import('@/views/controlPanel/AllUsersControl/AllUsersControl'),
  [DEV_VIEW_TERM.CHANGELOG_MANAGE]: () =>
    import('@/views/controlPanel/ChangeLogControl/ChangelogManage/ChangelogManage'),
  [DEV_VIEW_TERM.CHANGELOG_CREATE]: () =>
    import('@/views/controlPanel/ChangeLogControl/ChangeLogCreate/ChangeLogCreate'),
  [DEV_VIEW_TERM.APP_CONFIG.ROOT]: () =>
    import('@/views/controlPanel/AppConfig/AppConfig'),
  [DEV_VIEW_TERM.FISCAL_RECEIPTS_AUDIT]: () =>
    import('@/views/pages/DevTools/FiscalReceiptsAudit/FiscalReceiptsAudit'),
  [DEV_VIEW_TERM.INVOICE_V2_RECOVERY]: () =>
    import('@/views/pages/DevTools/InvoiceV2Recovery/InvoiceV2Recovery'),
  [DEV_VIEW_TERM.B_SERIES_INVOICES]: () =>
    import('@/views/pages/DevTools/BSeriesInvoices/BSeriesInvoices'),
  [DEV_VIEW_TERM.PRUEBA]: () =>
    import('@/views/pages/DevTools/TestPlayground'),
};
