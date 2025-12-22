import ROUTES_NAME from '@/router/routes/routesName';
import { registerToolbar } from '../core/registerToolbar';

import type { ToolbarRegistryEntry } from '../types/types';

const {
  SALES_TERM,
  INVENTORY_TERM,
  PURCHASE_TERM,
  ORDER_TERM,
  EXPENSES_TERM,
  CONTACT_TERM,
  DEV_VIEW_TERM,
  SETTING_TERM,
  CREDIT_NOTE_TERM,
  AUTHORIZATIONS_TERM,
  INSURANCE_TERM,
  CASH_RECONCILIATION_TERM,
  ACCOUNT_RECEIVABLE,
  UTILITY_TERM,
} = ROUTES_NAME;

/**
 * Registry of all toolbar configurations
 * Each entry maps a route pattern to its corresponding toolbar component
 */
export const toolbarConfigs: ToolbarRegistryEntry[] = [
  registerToolbar({
    id: 'sales-toolbar',
    routes: SALES_TERM.SALES,
    importFn: () => import('../Page/VentaMenuToolbar'),
    exportName: 'VentaMenuToolbar',
  }),
  registerToolbar({
    id: 'inventory-items-toolbar',
    routes: INVENTORY_TERM.INVENTORY_ITEMS,
    importFn: () => import('../Page/InventoryMenuToolbar/InventoryMenuToolbar'),
    exportName: 'InventoryMenuToolbar',
  }),
  registerToolbar({
    id: 'inventory-categories-toolbar',
    routes: INVENTORY_TERM.CATEGORIES,
    importFn: () => import('../Page/ProductCategoriesToolbar'),
    exportName: 'ProductCategoriesToolbar',
  }),
  registerToolbar({
    id: 'inventory-warehouses-toolbar',
    routes: { path: INVENTORY_TERM.WAREHOUSES, end: false },
    importFn: () => import('../Page/WarehouseToolbar'),
    exportName: 'WarehouseToolbar',
  }),
  registerToolbar({
    id: 'product-studio-toolbar',
    routes: INVENTORY_TERM.PRODUCT_STUDIO,
    importFn: () => import('../Page/ProductStudioToolbar'),
    exportName: 'ProductStudioToolbar',
  }),
  registerToolbar({
    id: 'users-admin-toolbar',
    routes: '/users/list',
    importFn: () => import('../Page/UsersAdminToolbar'),
  }),
  registerToolbar({
    id: 'cash-reconciliation-toolbar',
    routes: CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST,
    importFn: () => import('../Page/CashReconciliationToolbar'),
    exportName: 'CashReconciliationToolbar',
  }),
  registerToolbar({
    id: 'account-receivable-toolbar',
    routes: [
      ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST,
      ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_AUDIT,
    ].filter(Boolean),
    importFn: () =>
      import('../Page/AccountReceivableToolbar/AccountReceivableToolbar'),
    exportName: 'AccountReceivableToolbar',
  }),
  registerToolbar({
    id: 'purchases-toolbar',
    routes: PURCHASE_TERM.PURCHASES,
    importFn: () => import('../Page/PurchaseToolbar'),
    exportName: 'PurchaseToolbar',
  }),
  registerToolbar({
    id: 'purchases-create-toolbar',
    routes: PURCHASE_TERM.PURCHASES_CREATE,
    importFn: () => import('../Page/CreatePurchaseToolbar'),
    exportName: 'CreatePurchaseToolbar',
  }),
  registerToolbar({
    id: 'orders-toolbar',
    routes: ORDER_TERM.ORDERS,
    importFn: () => import('../Page/OrderToolbar'),
    exportName: 'OrderToolbar',
  }),
  registerToolbar({
    id: 'orders-create-toolbar',
    routes: ORDER_TERM.ORDERS_CREATE,
    importFn: () => import('../Page/CreateOrderToolbar'),
    exportName: 'CreateOrderToolbar',
  }),
  registerToolbar({
    id: 'bills-toolbar',
    routes: SALES_TERM.BILLS,
    importFn: () => import('../Page/RegistroToolbar'),
    exportName: 'RegistroToolbar',
  }),
  registerToolbar({
    id: 'expenses-list-toolbar',
    routes: EXPENSES_TERM.EXPENSES_LIST,
    importFn: () => import('../Page/ExpensesListToolbar'),
    exportName: 'ExpensesListToolbar',
  }),
  registerToolbar({
    id: 'clients-toolbar',
    routes: CONTACT_TERM.CLIENTS,
    importFn: () => import('../Page/ClientControlToolbar'),
    exportName: 'ClientControlToolbar',
  }),
  registerToolbar({
    id: 'preorders-toolbar',
    routes: SALES_TERM.PREORDERS,
    importFn: () => import('../Page/PreorderMenuToolbar'),
    exportName: 'PreorderMenuToolbar',
  }),
  registerToolbar({
    id: 'businesses-toolbar',
    routes: DEV_VIEW_TERM.BUSINESSES,
    importFn: () => import('../Page/BusinessManageToolbar'),
  }),
  registerToolbar({
    id: 'insurance-config-toolbar',
    routes: INSURANCE_TERM.INSURANCE_CONFIG,
    importFn: () => import('../Page/InsuranceConfigToolbar'),
    exportName: 'InsuranceConfigToolbar',
  }),
  registerToolbar({
    id: 'general-config-toolbar',
    routes: { path: SETTING_TERM.SETTING, end: false },
    importFn: () => import('../Page/GeneralConfigToolbar'),
  }),
  registerToolbar({
    id: 'credit-note-toolbar',
    routes: CREDIT_NOTE_TERM.CREDIT_NOTE_LIST,
    importFn: () => import('../Page/CreditNoteToolbar'),
    exportName: 'CreditNoteToolbar',
  }),
  registerToolbar({
    id: 'authorizations-toolbar',
    routes: { path: AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST, end: false },
    importFn: () => import('../Page/AuthorizationsToolbar'),
    exportName: 'AuthorizationsToolbar',
  }),
  registerToolbar({
    id: 'utility-toolbar',
    routes: [UTILITY_TERM.UTILITY, UTILITY_TERM.UTILITY_REPORT],
    importFn: () => import('../Page/UtilityToolbar'),
    exportName: 'UtilityToolbar',
  }),
];
