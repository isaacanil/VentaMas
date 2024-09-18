const SALES_TERM = {
    SALES: '/sales',
    BILLS: '/bills',
    
}
const CASH_RECONCILIATION_TERM = {
    CASH_RECONCILIATION_LIST: '/cash-reconciliation',
    CASH_RECONCILIATION_OPENING: '/cash-register-opening',
    CASH_RECONCILIATION_CLOSURE: '/cash-register-closure/:id',
    CASH_RECONCILIATION_INVOICE_OVERVIEW: '/cash-register-invoices-overview',
}
const CHANGELOG_TERM = {
    CHANGELOG_CREATE: '/changelog/create',
    CHANGELOG_MANAGE: '/changelog/manage',
    CHANGELOG_LIST: '/changelogs/list'
}
const DEV_VIEW_TERM = {
    CREATE_BUSINESS: '/create-business',
    MANAGE_BUSINESS: '/manage-business',
    ALL_USERS: '/all-users',
    CHANGELOG_CREATE: CHANGELOG_TERM.CHANGELOG_CREATE,
    CHANGELOG_MANAGE: CHANGELOG_TERM.CHANGELOG_MANAGE,
}

const UTILITY_TERM = {
    UTILITY: '/utility',
    UTILITY_REPORT: '/utility/report',
}
 
const BASIC_TERM = {
    HOME: '/home',
    WELCOME: '/',
}
const AUTH_TERM = {
    LOGIN: '/login',
    SIGNUP: '/signup',
}

const INVENTORY_BASE_PATH = '/inventory';
const WAREHOUSE_BASE_PATH = `${INVENTORY_BASE_PATH}/warehouse`;
const SHELVE_BASE_PATH = `${WAREHOUSE_BASE_PATH}/:warehouseId/shelf`;
const ROW_BASE_PATH = `${SHELVE_BASE_PATH}/:shelfId/row`;
const SEGMENT_BASE_PATH = `${ROW_BASE_PATH}/:rowId/segment`;

const INVENTORY_TERM = {
    CREATE_PRODUCT: `${INVENTORY_BASE_PATH}/create-product`,
    INVENTORY_ITEMS: '/inventory/items',
    CATEGORIES: '/inventory/categories',
    WAREHOUSES: `${INVENTORY_BASE_PATH}/warehouses`, // Listado de almacenes
    WAREHOUSE: `${WAREHOUSE_BASE_PATH}/:warehouseId`, // Detalle de un almacén
    SHELF: `${SHELVE_BASE_PATH}/:shelfId`, // Detalle de un estante
    ROW: `${ROW_BASE_PATH}/:rowId`, // Detalle de una fila
    SEGMENT: `${SEGMENT_BASE_PATH}/:segmentId`, // Detalle de un segmento
    CREATE_WAREHOUSE: `${INVENTORY_BASE_PATH}/warehouses/create`, // Crear un nuevo almacén
    EDIT_WAREHOUSE: `${INVENTORY_BASE_PATH}/warehouses/edit/:id`,
    INVENTORY_SERVICES: '/inventory/services',
    PRODUCT_IMAGES_MANAGER: '/inventory/product-images-manager',
    PRODUCT_OUTFLOW: '/inventory/product_outflow',
    SERVICE_OUTFLOW: '/inventory/service_outflow',
}
const CONTACT_TERM = {
    CLIENTS: '/contact',
    SUPPLIERS: '/suppliers',
}
const SETTING_TERM = {
    SETTINGS: '/settings',
    USERS: '/users',
    USERS_LIST: 'list',
    CREATE_USER: 'create-user/',
    UPDATE_USER: 'update-user/:id',
    APP_INFO: '/app-info',
    BUSINESS_INFO: '/business-info',
    TAX_RECEIPT: '/tax-receipt',
}
const PURCHASE_TERM = {
    PURCHASES: '/purchases-list',
    PURCHASES_CREATE: '/purchases-create',
    ORDERS: '/orders-list',
    ORDERS_CREATE: '/orders-create',
}
const EXPENSES_TERM = {
    EXPENSES: '/expenses',
    EXPENSES_CREATE: '/expenses/new',
    EXPENSES_UPDATE: '/expenses/update/:id',
    EXPENSES_LIST: '/expenses/list',
    EXPENSES_CATEGORY: '/expenses/categories',
}
const ACCOUNT_RECEIVABLE = {
    ACCOUNT_RECEIVABLE_INFO: '/account-receivable/info/:id',
    RECEIVABLE_PAYMENT_RECEIPTS: '/account-receivable/receipts',
}

const ROUTES_PATH = {
    UTILITY_TERM,
    BASIC_TERM,
    AUTH_TERM,
    CASH_RECONCILIATION_TERM,
    EXPENSES_TERM,
    ACCOUNT_RECEIVABLE,
    SALES_TERM,
    INVENTORY_TERM,
    CONTACT_TERM,
    SETTING_TERM,
    PURCHASE_TERM,
    DEV_VIEW_TERM,
    CHANGELOG_TERM
}

export default ROUTES_PATH 