const SALES_TERM = {
  SALES: '/sales',
  BILLS: '/bills',
  BILLS_ANALYTICS: '/bills/analytics',
  PREORDERS: '/preorders',
} as const;

const CASH_RECONCILIATION_TERM = {
  CASH_RECONCILIATION_LIST: '/cash-reconciliation',
  CASH_RECONCILIATION_OPENING: '/cash-register-opening',
  CASH_RECONCILIATION_CLOSURE: '/cash-register-closure/:id',
  CASH_RECONCILIATION_INVOICE_OVERVIEW: '/cash-register-invoices-overview',
} as const;

const TREASURY_TERM = {
  TREASURY_HOME: '/treasury',
  TREASURY_BANK_ACCOUNTS: '/treasury/bank-accounts',
  TREASURY_ACCOUNT_DETAIL: '/treasury/accounts/:kind/:accountId',
} as const;

const CHANGELOG_TERM = {
  CHANGELOG_CREATE: '/changelog/create',
  CHANGELOG_MANAGE: '/changelog/manage',
  CHANGELOG_LIST: '/changelogs/list',
} as const;

const DEV_VIEW_TERM = {
  CREATE_BUSINESS: '/business/create',
  BUSINESSES: '/dev/businesses',
  SUBSCRIPTION_MAINTENANCE: '/dev/tools/subscription-maintenance',
  SUBSCRIPTION_MAINTENANCE_OVERVIEW:
    '/dev/tools/subscription-maintenance/resumen',
  SUBSCRIPTION_MAINTENANCE_SANDBOX:
    '/dev/tools/subscription-maintenance/simulaciones',
  SUBSCRIPTION_MAINTENANCE_TOOLS:
    '/dev/tools/subscription-maintenance/herramientas',
  SUBSCRIPTION_MAINTENANCE_PLANS: '/dev/tools/subscription-maintenance/planes',
  ALL_USERS: '/all-users',
  PRUEBA: '/prueba',
  FISCAL_RECEIPTS_AUDIT: '/dev/tools/fiscal-receipts-audit',
  B_SERIES_INVOICES: '/dev/tools/b-series-invoices',
  INVOICE_V2_RECOVERY: '/dev/tools/invoice-v2-recovery',
  INVENTORY_MIGRATION: '/dev/tools/inventory-migration',
  SYNC_DIAGNOSTICS: '/dev/tools/sync-diagnostics',
  PRICE_LIST_AUDIT: '/dev/tools/price-list-audit',
  CASH_COUNT_AUDIT: '/dev/tools/cash-count-audit',
  SELECT_BUSINESS_TEST: '/dev/tools/hub',
  CHANGELOG_CREATE: CHANGELOG_TERM.CHANGELOG_CREATE,
  CHANGELOG_MANAGE: CHANGELOG_TERM.CHANGELOG_MANAGE,
  APP_CONFIG: {
    ROOT: '/dev/app-config',
    LOGIN_IMAGE: '/dev/app-config/login-image',
  } as const,
  SWITCH_BUSINESS: '/dev/business/switch',
  AI_BUSINESS_SEEDING: '/dev/tools/ai-business-seeding',
  PRODUCT_FORM_V2_TEST: '/dev/tools/product-form-v2',
  ACCOUNTING_PILOT_AUDIT: '/dev/tools/accounting-pilot-audit',
} as const;

const UTILITY_TERM = {
  UTILITY: '/utility',
  UTILITY_REPORT: '/utility/report',
} as const;

const BASIC_TERM = {
  HOME: '/home',
  DEVELOPER_HUB: '/developer-hub',
  WELCOME: '/',
  WELCOME_V2: '/welcome-v2',
  CHECKOUT_PROXY: '/checkout',
  BILLING_PORTAL: '/portal',
} as const;

const AUTH_TERM = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  SELECT_BUSINESS: '/hub',
  CLAIM_BUSINESS: '/claim-business',
} as const;

const INVENTORY_BASE_PATH = '/inventory';

const WAREHOUSES_PATH = `${INVENTORY_BASE_PATH}/warehouses`;
const PRODUCTS_STOCK = `${WAREHOUSES_PATH}/products-stock`;
const PRODUCT_STOCK = `${PRODUCTS_STOCK}/:productId`;
const WAREHOUSE_BASE_PATH = `${WAREHOUSES_PATH}/warehouse/:warehouseId`;
const SHELVE_BASE_PATH = `${WAREHOUSE_BASE_PATH}/shelf/:shelfId`;
const ROW_BASE_PATH = `${SHELVE_BASE_PATH}/row/:rowId`;
const SEGMENT_BASE_PATH = `${ROW_BASE_PATH}/segment/:segmentId`;

const INVENTORY_TERM = {
  CREATE_PRODUCT: `${INVENTORY_BASE_PATH}/create-product`,
  PRODUCT: `${INVENTORY_BASE_PATH}/product/:productId`,
  INVENTORY_ITEMS: '/inventory/items',
  INVENTORY_SUMMARY: '/inventory/summary',
  INVENTORY_CONTROL: '/inventory/control',
  INVENTORY_CONTROL_SESSION: '/inventory/control/:sessionId',
  WAREHOUSES: WAREHOUSES_PATH, // Listado de almacenes
  WAREHOUSE: WAREHOUSE_BASE_PATH, // Detalle de un almacén
  SHELF: SHELVE_BASE_PATH, // Detalle de un estante
  ROW: ROW_BASE_PATH, // Detalle de una fila
  SEGMENT: SEGMENT_BASE_PATH, // Detalle de un segmento
  PRODUCTS_STOCK: PRODUCTS_STOCK, // Resumen de stock de productos
  PRODUCT_STOCK: PRODUCT_STOCK, // Resumen de stock de un producto
  CREATE_WAREHOUSE: `${INVENTORY_BASE_PATH}/warehouses/create`, // Crear un nuevo almacén
  EDIT_WAREHOUSE: `${INVENTORY_BASE_PATH}/warehouses/edit/:id`,
  INVENTORY_SERVICES: '/inventory/services',
  PRODUCT_STUDIO: '/inventory/product-studio',
  PRODUCT_OUTFLOW: '/inventory/product_outflow',
  SERVICE_OUTFLOW: '/inventory/service_outflow',
  INVENTORY_MOVEMENTS: '/inventory/movements',
} as const;

const CONTACT_TERM = {
  CLIENTS: '/contact',
  SUPPLIERS: '/suppliers',
} as const;

const SETTING_TERM = {
  SETTINGS: '/settings',
  SETTING: '/settings',
  USERS: '/users',
  USERS_LIST: 'list',
  USERS_SESSION_LOGS: 'session-logs',
  USERS_ACTIVITY: 'activity',
  USERS_ACTIVITY_DETAIL: 'activity/:userId',
  CREATE_USER: 'create-user/',
  UPDATE_USER: 'update-user/:id',
  APP_INFO: '/app-info',
  BUSINESS_INFO: '/business-info',
  TAX_RECEIPT: '/tax-receipt',
  AUTHORIZATION_CONFIG: '/authorization-config',
  GENERAL_CONFIG_BILLING: '/settings/billing',
  GENERAL_CONFIG_MODULES: '/settings/modules',
  GENERAL_CONFIG_SUBSCRIPTION: '/settings/subscription',
  GENERAL_CONFIG_SUBSCRIPTION_PLANS: '/settings/subscription/plans',
  GENERAL_CONFIG_SUBSCRIPTION_BILLING: '/settings/subscription/billing',
  GENERAL_CONFIG_SUBSCRIPTION_BLOCKED: '/settings/subscription/blocked-preview',
  ACCOUNT_SUBSCRIPTION: '/account/subscription',
  ACCOUNT_SUBSCRIPTION_MANAGE: '/account/subscription/resumen',
  ACCOUNT_SUBSCRIPTION_SUCCESS: '/account/subscription/success',
  ACCOUNT_SUBSCRIPTION_PLANS: '/account/subscription/plans',
  ACCOUNT_SUBSCRIPTION_BILLING: '/account/subscription/billing',
  ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS: '/account/subscription/payment-methods',
  ACCOUNT_SUBSCRIPTION_SETTINGS: '/account/subscription/settings',
  ACCOUNT_SUBSCRIPTION_BLOCKED: '/account/subscription/blocked-preview',
  GENERAL_CONFIG_BUSINESS: '/settings/business',
  GENERAL_CONFIG_ACCOUNTING: '/settings/accounting',
  GENERAL_CONFIG_EXCHANGE_RATES: '/settings/exchange-rates',
  GENERAL_CONFIG_ACCOUNTING_EXCHANGE_RATES: '/settings/accounting/exchange-rates',
  GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS:
    '/settings/accounting/chart-of-accounts',
  GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES:
    '/settings/accounting/posting-profiles',
  GENERAL_CONFIG_INVENTORY: '/settings/inventory',
  GENERAL_CONFIG_TAX_RECEIPT: '/settings/tax-receipt',
  GENERAL_CONFIG_USERS: '/settings/users',
  GENERAL_CONFIG_APP_INFO: '/settings/app-info',
  GENERAL_CONFIG_AUTHORIZATION: '/settings/authorization',
} as const;

const PURCHASE_TERM = {
  PURCHASES: '/purchases',
  PURCHASES_ANALYTICS: '/purchases/analytics',
  PURCHASES_CREATE: '/purchases/create',
  PURCHASES_UPDATE: '/purchases/update/:id',
  PURCHASES_COMPLETE: '/purchases/complete/:id',
  BACKORDERS: '/backorders',
} as const;

const ORDER_TERM = {
  ORDERS: '/orders',
  ORDERS_CREATE: '/orders/create',
  ORDERS_UPDATE: '/orders/update/:id',
  ORDERS_CONVERT: '/orders/convert-to-purchase/:id',
} as const;

const EXPENSES_TERM = {
  EXPENSES: '/expenses',
  EXPENSES_CREATE: '/expenses/new',
  EXPENSES_UPDATE: '/expenses/update/:id',
  EXPENSES_LIST: '/expenses/list',
} as const;

const ACCOUNTING_TERM = {
  ACCOUNTING: '/accounting',
  ACCOUNTING_JOURNAL_BOOK: '/accounting/journal-book',
  ACCOUNTING_GENERAL_LEDGER: '/accounting/general-ledger',
  ACCOUNTING_MANUAL_ENTRIES: '/accounting/manual-entries',
  ACCOUNTING_REPORTS: '/accounting/reports',
  ACCOUNTING_PERIOD_CLOSE: '/accounting/period-close',
} as const;

const ACCOUNT_RECEIVABLE_TERM = {
  ACCOUNT_RECEIVABLE_LIST: '/account-receivable/list',
  ACCOUNT_RECEIVABLE_INFO: '/account-receivable/info/:id',
  RECEIVABLE_PAYMENT_RECEIPTS: '/account-receivable/receipts',
  ACCOUNT_RECEIVABLE_AUDIT: '/account-receivable/audit',
} as const;

const ACCOUNT_PAYABLE_TERM = {
  ACCOUNT_PAYABLE_LIST: '/accounts-payable/list',
} as const;

const CREDIT_NOTE_TERM = {
  CREDIT_NOTE_LIST: '/credit-note',
} as const;

const AUTHORIZATIONS_TERM = {
  AUTHORIZATIONS_LIST: '/authorizations',
  AUTHORIZATION_CONFIG: '/settings/authorization-config',
} as const;

const INSURANCE_TERM = {
  INSURANCE_CONFIG: '/insurance/config',
  INSURANCE_LIST: '/insurance/list',
  INSURANCE_CREATE: '/insurance/create',
  INSURANCE_EDIT: '/insurance/edit/:id',
  INSURANCE_DETAILS: '/insurance/details/:id',
} as const;

export const ROUTES_PATH = {
  UTILITY_TERM,
  BASIC_TERM,
  AUTH_TERM,
  CASH_RECONCILIATION_TERM,
  TREASURY_TERM,
  EXPENSES_TERM,
  ACCOUNT_PAYABLE: ACCOUNT_PAYABLE_TERM,
  ACCOUNT_RECEIVABLE: ACCOUNT_RECEIVABLE_TERM,
  SALES_TERM,
  INVENTORY_TERM,
  CONTACT_TERM,
  SETTING_TERM,
  PURCHASE_TERM,
  ORDER_TERM,
  ACCOUNTING_TERM,
  DEV_VIEW_TERM,
  CHANGELOG_TERM,
  CREDIT_NOTE_TERM,
  AUTHORIZATIONS_TERM,
  INSURANCE_TERM,
} as const;

export type RoutesPath = typeof ROUTES_PATH;

export const ROUTES = {
  ...ROUTES_PATH,
} as const;

export default ROUTES_PATH;
