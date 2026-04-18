/**
 * Traducciones amigables para los issues de cumplimiento fiscal DGII.
 * Convierte códigos técnicos en mensajes entendibles por el usuario.
 */

const SEVERITY_LABELS: Record<string, string> = {
  error: 'Error',
  warning: 'Advertencia',
  info: 'Información',
};

const ISSUE_CODE_LABELS: Record<string, string> = {
  'missing-required-field': 'Campo requerido faltante',
  'invalid-value': 'Valor inválido',
  'invalid-format': 'Formato incorrecto',
  'duplicate-record': 'Registro duplicado',
  'out-of-range': 'Valor fuera de rango',
  'unmatched-reference': 'Referencia no encontrada',
  'missing-ncf': 'NCF faltante',
  'invalid-ncf': 'NCF inválido',
  'missing-rnc': 'RNC faltante',
  'invalid-rnc': 'RNC inválido',
  'missing-counterparty': 'Proveedor/cliente no identificado',
  'missing-expense-type': 'Tipo de gasto no especificado',
  'missing-document-type': 'Tipo de comprobante faltante',
};

const SOURCE_ID_LABELS: Record<string, string> = {
  purchases: 'Compras',
  expenses: 'Gastos',
  sales: 'Ventas',
  invoices: 'Facturas',
  creditNotes: 'Notas de crédito',
  debitNotes: 'Notas de débito',
  thirdPartyWithholdings: 'Retenciones sufridas',
  accountsPayablePayments: 'Pagos de cuentas por pagar',
  accountsReceivablePayments: 'Cobros de cuentas por cobrar',
  voidedDocuments: 'Documentos anulados',
  annulments: 'Anulaciones',
  manualEntries: 'Asientos manuales',
};

const FIELD_PATH_LABELS: Record<string, string> = {
  // Contraparte
  'counterparty.id': 'ID del proveedor/cliente',
  'counterparty.identification.number': 'RNC / Cédula del proveedor/cliente',
  'counterparty.identification.type': 'Tipo de identificación del proveedor/cliente',
  'counterparty.name': 'Nombre del proveedor/cliente',
  // Proveedor
  supplierId: 'ID del proveedor',
  supplierRnc: 'RNC del proveedor',
  supplierName: 'Nombre del proveedor',
  // Documento
  documentType: 'Tipo de comprobante',
  documentNumber: 'Número de comprobante',
  documentDate: 'Fecha del comprobante',
  'data.NCF': 'Número de comprobante fiscal (NCF)',
  ncf: 'Número de comprobante fiscal (NCF)',
  // NCF
  'taxReceipt.ncf': 'Número de comprobante fiscal (NCF)',
  'taxReceipt.type': 'Tipo de comprobante fiscal',
  'taxReceipt.series': 'Serie del NCF',
  // Clasificación
  'classification.dgii606ExpenseType': 'Tipo de gasto para el 606 (DGII)',
  'classification.dgii607IncomeType': 'Tipo de ingreso para el 607 (DGII)',
  'classification.dgii608VoidType': 'Tipo de anulación para el 608 (DGII)',
  // Montos
  amount: 'Monto',
  taxableAmount: 'Monto gravado',
  taxAmount: 'Monto de impuesto (ITBIS)',
  totalAmount: 'Monto total',
  'totals.total': 'Monto total',
  'totals.tax': 'Monto de impuesto (ITBIS)',
  itbisWithheld: 'ITBIS retenido por terceros',
  incomeTaxWithheld: 'ISR retenido por terceros',
  // Fechas
  transactionDate: 'Fecha de la transacción',
  paymentDate: 'Fecha de pago',
  issueDate: 'Fecha de emisión',
  retentionDate: 'Fecha de retención',
  voidedAt: 'Fecha de anulación',
  voidReasonCode: 'Código DGII de anulación',
  'metadata.invoiceNcf': 'NCF de factura afectada',
  // Otros
  currency: 'Moneda',
  exchangeRate: 'Tasa de cambio',
};

/** Traduce el nivel de severidad a español. */
export const translateSeverity = (severity: string): string =>
  SEVERITY_LABELS[severity] ?? severity;

/** Traduce el código de issue a un texto amigable en español. */
export const translateIssueCode = (code: string): string =>
  ISSUE_CODE_LABELS[code] ?? code;

/** Traduce el identificador de fuente a un nombre legible en español. */
export const translateSourceId = (sourceId: string): string =>
  SOURCE_ID_LABELS[sourceId] ?? sourceId;

/** Traduce la ruta de campo técnica a un nombre legible en español. */
export const translateFieldPath = (fieldPath: string): string =>
  FIELD_PATH_LABELS[fieldPath] ?? fieldPath;
