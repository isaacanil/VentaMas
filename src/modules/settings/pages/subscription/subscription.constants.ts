export const STATUS_LABELS: Record<string, string> = {
    none: 'Sin suscripción',
    active: 'Activa',
    trialing: 'En prueba',
    past_due: 'Pago pendiente',
    canceled: 'Cancelada',
    paused: 'Pausada',
    unpaid: 'Sin pago',
    deprecated: 'Deprecada',
    scheduled: 'Programada',
};

export const LIMIT_LABELS: Record<string, string> = {
    maxBusinesses: 'Negocios máximos',
    maxUsers: 'Usuarios máximos por negocio',
    maxProducts: 'Productos máximos',
    maxMonthlyInvoices: 'Facturas mensuales máximas',
    maxClients: 'Clientes máximos',
    maxSuppliers: 'Suplidores máximos',
    maxWarehouses: 'Almacenes máximos',
    maxOpenCashRegisters: 'Cajas abiertas máximas',
};

export const LIMIT_USAGE_KEY_MAP: Record<string, string> = {
    maxBusinesses: 'businessesTotal',
    maxUsers: 'usersTotal',
    maxProducts: 'productsTotal',
    maxMonthlyInvoices: 'monthlyInvoices',
    maxClients: 'clientsTotal',
    maxSuppliers: 'suppliersTotal',
    maxWarehouses: 'warehousesTotal',
    maxOpenCashRegisters: 'openCashRegisters',
};
