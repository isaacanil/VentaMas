const SALES_TERM = {
    SALES: '/sales',
    BILLS: '/bills',
    PREORDERS: '/preorders',
};
const CASH_RECONCILIATION_TERM = {
    CASH_RECONCILIATION_LIST: '/cash-reconciliation',
    CASH_RECONCILIATION_OPENING: '/cash-register-opening',
    CASH_RECONCILIATION_CLOSURE: '/cash-register-closure/:id',
    CASH_RECONCILIATION_INVOICE_OVERVIEW: '/cash-register-invoices-overview',
};
const CHANGELOG_TERM = {
    CHANGELOG_CREATE: '/changelog/create',
    CHANGELOG_MANAGE: '/changelog/manage',
    CHANGELOG_LIST: '/changelogs/list',
};
const DEV_VIEW_TERM = {
    CREATE_BUSINESS: '/dev/business/create',
    BUSINESSES: '/dev/businesses',
    ALL_USERS: '/all-users',
    PRUEBA: '/prueba',
    FISCAL_RECEIPTS_AUDIT: '/dev/tools/fiscal-receipts-audit',
    B_SERIES_INVOICES: '/dev/tools/b-series-invoices',
    INVENTORY_MIGRATION: '/dev/tools/inventory-migration',
    SYNC_DIAGNOSTICS: '/dev/tools/sync-diagnostics',
    CHANGELOG_CREATE: CHANGELOG_TERM.CHANGELOG_CREATE,
    CHANGELOG_MANAGE: CHANGELOG_TERM.CHANGELOG_MANAGE,
    APP_CONFIG: {
        ROOT: '/dev/app-config',
        LOGIN_IMAGE: '/dev/app-config/login-image',
    },
    SWITCH_BUSINESS: '/dev/business/switch',
};
const UTILITY_TERM = {
    UTILITY: '/utility',
    UTILITY_REPORT: '/utility/report',
};
const BASIC_TERM = {
    HOME: '/home',
    WELCOME: '/',
};
const AUTH_TERM = {
    LOGIN: '/login',
    SIGNUP: '/signup',
};
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
    CATEGORIES: '/inventory/categories',
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
    PRODUCT_IMAGES_MANAGER: '/inventory/product-images-manager',
    PRODUCT_OUTFLOW: '/inventory/product_outflow',
    SERVICE_OUTFLOW: '/inventory/service_outflow',
    INVENTORY_MOVEMENTS: '/inventory/movements',
};
const CONTACT_TERM = {
    CLIENTS: '/contact',
    SUPPLIERS: '/suppliers',
};
const SETTING_TERM = {
    SETTINGS: '/settings',
    SETTING: '/general-config',
    USERS: '/users',
    USERS_LIST: 'list',
    USERS_SESSION_LOGS: 'session-logs',
    CREATE_USER: 'create-user/',
    UPDATE_USER: 'update-user/:id',
    APP_INFO: '/app-info',
    BUSINESS_INFO: '/business-info',
    TAX_RECEIPT: '/tax-receipt',
    AUTHORIZATION_CONFIG: '/authorization-config',
    GENERAL_CONFIG_BILLING: '/general-config/billing',
    GENERAL_CONFIG_BUSINESS: '/general-config/business',
    GENERAL_CONFIG_TAX_RECEIPT: '/general-config/tax-receipt',
    GENERAL_CONFIG_USERS: '/general-config/users',
    GENERAL_CONFIG_APP_INFO: '/general-config/app-info',
    GENERAL_CONFIG_AUTHORIZATION: '/general-config/authorization',
};
const PURCHASE_TERM = {
    PURCHASES: '/purchases',
    PURCHASES_CREATE: '/purchases/create',
    PURCHASES_UPDATE: '/purchases/update/:id',
    PURCHASES_COMPLETE: '/purchases/complete/:id',
    BACKORDERS: '/backorders',
};
const ORDER_TERM = {
    ORDERS: '/orders',
    ORDERS_CREATE: '/orders/create',
    ORDERS_UPDATE: '/orders/update/:id',
    ORDERS_CONVERT: '/orders/convert-to-purchase/:id',
};
const EXPENSES_TERM = {
    EXPENSES: '/expenses',
    EXPENSES_CREATE: '/expenses/new',
    EXPENSES_UPDATE: '/expenses/update/:id',
    EXPENSES_LIST: '/expenses/list',
    EXPENSES_CATEGORY: '/expenses/categories',
};
const ACCOUNT_RECEIVABLE_TERM = {
    ACCOUNT_RECEIVABLE_LIST: '/account-receivable/list',
    ACCOUNT_RECEIVABLE_INFO: '/account-receivable/info/:id',
    RECEIVABLE_PAYMENT_RECEIPTS: '/account-receivable/receipts',
};
const CREDIT_NOTE_TERM = {
    CREDIT_NOTE_LIST: '/credit-note',
};
const AUTHORIZATIONS_TERM = {
    AUTHORIZATIONS_LIST: '/authorizations',
    AUTHORIZATION_CONFIG: '/settings/authorization-config',
};
const INSURANCE_TERM = {
    INSURANCE_CONFIG: '/insurance/config',
    INSURANCE_LIST: '/insurance/list',
    INSURANCE_CREATE: '/insurance/create',
    INSURANCE_EDIT: '/insurance/edit/:id',
    INSURANCE_DETAILS: '/insurance/details/:id',
};
export const ROUTES_PATH = {
    UTILITY_TERM,
    BASIC_TERM,
    AUTH_TERM,
    CASH_RECONCILIATION_TERM,
    EXPENSES_TERM,
    ACCOUNT_RECEIVABLE: ACCOUNT_RECEIVABLE_TERM,
    SALES_TERM,
    INVENTORY_TERM,
    CONTACT_TERM,
    SETTING_TERM,
    PURCHASE_TERM,
    ORDER_TERM,
    DEV_VIEW_TERM,
    CHANGELOG_TERM,
    CREDIT_NOTE_TERM,
    AUTHORIZATIONS_TERM,
    INSURANCE_TERM,
};
export const ROUTES = {
    ...ROUTES_PATH,
};
export default ROUTES_PATH;
