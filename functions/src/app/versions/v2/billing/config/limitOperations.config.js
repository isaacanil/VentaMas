import { toCleanString } from '../utils/billingCommon.util.js';

export const LIMIT_OPERATION_KEYS = Object.freeze({
  INVOICE_CREATE: 'invoice.create',
  USER_CREATE: 'user.create',
  PRODUCT_CREATE: 'product.create',
  CLIENT_CREATE: 'client.create',
  SUPPLIER_CREATE: 'supplier.create',
  WAREHOUSE_CREATE: 'warehouse.create',
  CASH_REGISTER_OPEN: 'cashRegister.open',
  BUSINESS_CREATE: 'business.create',
  ACCOUNTS_RECEIVABLE_PAYMENT: 'accountsReceivable.payment',
  ACCOUNTS_PAYABLE_PAYMENT: 'accountsPayable.payment',
});

const OPERATION_ENFORCEMENT_MAP = Object.freeze({
  [LIMIT_OPERATION_KEYS.INVOICE_CREATE]: {
    metricKey: 'monthlyInvoices',
    incrementBy: 1,
    requiredModule: 'sales',
    requiredAddon: null,
    writePath: 'businesses/{businessId}/invoicesV2/{invoiceId}',
    notes: 'Facturacion V2 protegida por backend.',
  },
  [LIMIT_OPERATION_KEYS.USER_CREATE]: {
    metricKey: 'usersTotal',
    incrementBy: 1,
    requiredModule: null,
    requiredAddon: null,
    writePath: 'businesses/{businessId}/members/{userId}',
    notes: 'Pendiente migracion centralizada de altas/invitaciones.',
  },
  [LIMIT_OPERATION_KEYS.PRODUCT_CREATE]: {
    metricKey: 'productsTotal',
    incrementBy: 1,
    requiredModule: 'inventory',
    requiredAddon: null,
    writePath: 'businesses/{businessId}/products/{productId}',
    notes: 'Migrado a callable createProduct.',
  },
  [LIMIT_OPERATION_KEYS.CLIENT_CREATE]: {
    metricKey: 'clientsTotal',
    incrementBy: 1,
    requiredModule: null,
    requiredAddon: null,
    writePath: 'businesses/{businessId}/clients/{clientId}',
    notes: 'Migrado a callable createClient.',
  },
  [LIMIT_OPERATION_KEYS.SUPPLIER_CREATE]: {
    metricKey: 'suppliersTotal',
    incrementBy: 1,
    requiredModule: null,
    requiredAddon: null,
    writePath: 'businesses/{businessId}/providers/{providerId}',
    notes: 'Migrado a callable createProvider.',
  },
  [LIMIT_OPERATION_KEYS.WAREHOUSE_CREATE]: {
    metricKey: 'warehousesTotal',
    incrementBy: 1,
    requiredModule: 'inventory',
    requiredAddon: null,
    writePath: 'businesses/{businessId}/warehouses/{warehouseId}',
    notes: 'Migrado a callable createWarehouse.',
  },
  [LIMIT_OPERATION_KEYS.CASH_REGISTER_OPEN]: {
    metricKey: 'openCashRegisters',
    incrementBy: 1,
    requiredModule: 'cashReconciliation',
    requiredAddon: null,
    writePath: 'businesses/{businessId}/cashCounts/{cashCountId}',
    notes: 'Pendiente porque requiere decremento sincronizado en cierre.',
  },
  [LIMIT_OPERATION_KEYS.BUSINESS_CREATE]: {
    metricKey: 'businessesTotal',
    incrementBy: 1,
    requiredModule: null,
    requiredAddon: null,
    writePath: 'businesses/{businessId}',
    notes:
      'Usa contrato central para resolver maxBusinesses por billingAccount.',
  },
  [LIMIT_OPERATION_KEYS.ACCOUNTS_RECEIVABLE_PAYMENT]: {
    metricKey: null,
    incrementBy: 0,
    requiredModule: 'accountsReceivable',
    requiredAddon: null,
    writePath: 'businesses/{businessId}/accountsReceivablePayments/{paymentId}',
    notes: 'Pago AR protegido por backend callable.',
  },
  [LIMIT_OPERATION_KEYS.ACCOUNTS_PAYABLE_PAYMENT]: {
    metricKey: null,
    incrementBy: 0,
    requiredModule: 'purchases',
    requiredAddon: null,
    writePath: 'businesses/{businessId}/accountsPayablePayments/{paymentId}',
    notes: 'Pago AP protegido por backend callable.',
  },
});

export const resolveSubscriptionOperationAccess = (operation) => {
  const normalizedOperation = toCleanString(operation);
  if (!normalizedOperation) return null;
  const resolved = OPERATION_ENFORCEMENT_MAP[normalizedOperation];
  if (!resolved) return null;
  return {
    metricKey: resolved.metricKey,
    incrementBy: resolved.incrementBy,
    requiredModule: resolved.requiredModule || null,
    requiredAddon: resolved.requiredAddon || null,
    writePath: resolved.writePath || null,
    notes: resolved.notes || null,
  };
};

export const resolveUsageDeltaByOperation = (operation) => {
  const resolved = resolveSubscriptionOperationAccess(operation);
  if (!resolved) return null;
  return {
    metricKey: resolved.metricKey,
    incrementBy: resolved.incrementBy,
  };
};
