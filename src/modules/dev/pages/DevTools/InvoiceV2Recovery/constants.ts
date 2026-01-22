export const STATUS_COLORS = {
  pending: 'orange',
  committing: 'purple',
  frontend_ready: 'geekblue',
  committed: 'green',
  failed: 'red',
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;

export const TASK_ORDER = [
  'createCanonicalInvoice',
  'attachToCashCount',
  'setupAR',
  'consumeCreditNotes',
  'setupInsuranceAR',
  'closePreorder',
  'updateInventory',
] as const;

export type TaskKey = (typeof TASK_ORDER)[number];

export const DEFAULT_TASKS: TaskKey[] = ['createCanonicalInvoice', 'attachToCashCount'];
export const ATTACH_TO_CASH_COUNT_TASK: TaskKey = 'attachToCashCount';
export const AUTO_RECOVERY_TASKS: TaskKey[] = ['createCanonicalInvoice', 'setupAR'];
export const AUTO_RECOVERY_REASON =
  'Recuperación automática: factura y cuenta por cobrar';
export const MAX_INVOICE_SUGGESTIONS = 200;

export const TASK_DESCRIPTIONS: Record<TaskKey, string> = {
  createCanonicalInvoice:
    'Replica el documento en businesses/{businessId}/invoices/{invoiceId}.',
  attachToCashCount:
    'Vincula la factura nuevamente al cuadre de caja abierto.',
  setupAR:
    'Regenera la cuenta por cobrar principal en accountsReceivable utilizando el payload original.',
  consumeCreditNotes:
    'Vuelve a aplicar las notas de crédito almacenadas en el snapshot.',
  setupInsuranceAR:
    'Recrea la cuenta por cobrar de seguro y la autorización asociada.',
  closePreorder:
    'Cierra la preorden vinculada si la venta inició como apartado.',
  updateInventory:
    'Reaplica los ajustes de inventario para los productos del carrito.',
};
