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
const DEV_VIEW_TERM = {
    CREATE_BUSINESS: '/create-business',
    MANAGE_BUSINESS: '/manage-business',

}
const BASIC_TERM = {
    HOME: '/home',
    WELCOME: '/',
}
const AUTH_TERM = {
    LOGIN: '/login',
    SIGNUP: '/signup',
}
const INVENTORY_TERM = {
    INVENTORY_ITEMS: '/inventory-items',
    CATEGORIES: '/categories',
    INVENTORY_SERVICES: '/inventory-services',
    PRODUCT_IMAGES_MANAGER: '/product-images-manager',
    PRODUCT_OUTFLOW: '/product_outflow',
    SERVICE_OUTFLOW: '/service_outflow',
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
    PURCHASES: '/purchases',
    ORDERS: '/orders',
}



const ROUTES_PATH = {
    BASIC_TERM,
    AUTH_TERM,
    CASH_RECONCILIATION_TERM,
    SALES_TERM,
    INVENTORY_TERM,
    CONTACT_TERM,
    SETTING_TERM,
    PURCHASE_TERM,
    DEV_VIEW_TERM

}

export default ROUTES_PATH 