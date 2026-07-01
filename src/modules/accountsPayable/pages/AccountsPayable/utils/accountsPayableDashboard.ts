import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format/formatPrice';
import { isSettledPaymentStateStatus } from '@/utils/payments/paymentState';
import type {
  Purchase,
  PurchasePaymentCondition,
} from '@/utils/purchase/types';
import { resolvePurchaseWorkflowStatus } from '@/utils/purchase/workflow';
import { resolveVendorBillDueAtMillis } from '@/domain/accountsPayable/vendorBills/fromPurchase';
import type {
  VendorBill,
  VendorBillDocumentNature,
  VendorBillPaymentControlStatus,
  VendorBillSettlementTiming,
} from '@/domain/accountsPayable/vendorBills/types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const startOfDay = (millis: number): number => {
  const date = new Date(millis);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const endOfDay = (millis: number): number => {
  const date = new Date(millis);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

const PAYMENT_CONDITION_LABELS: Record<string, string> = {
  cash: 'Contado',
  one_week: '1 semana',
  fifteen_days: '15 días',
  thirty_days: '30 días',
  other: 'Otro',
};

export type AccountsPayableAgingBucket =
  | 'current'
  | 'due_1_30'
  | 'due_31_60'
  | 'due_61_plus'
  | 'no_due_date';

export type AccountsPayableTraceabilityFilter =
  | 'all'
  | 'with_payments'
  | 'with_evidence'
  | 'missing_evidence'
  | 'overdue';

export type AccountsPayableFiscalFilter =
  | 'all'
  | 'with_ncf'
  | 'missing_ncf'
  | 'with_withholdings'
  | 'missing_vendor_reference'
  | 'missing_dgii_classification';

export type AccountsPayableGroupBy = 'provider' | 'aging' | 'none';

export type AccountsPayablePaymentControlStatus =
  VendorBillPaymentControlStatus;

export interface AccountsPayablePaymentControl {
  canRegisterPayment: boolean;
  label: string;
  reason: string | null;
  status: AccountsPayablePaymentControlStatus;
  tone: 'danger' | 'warning' | 'neutral' | 'success';
}

export interface AccountsPayableFiscalSnapshot {
  vendorReference: string | null;
  ncf: string | null;
  documentType: string | null;
  dgii606ExpenseType: string | null;
  issueAt: number | null;
  billDate: number | null;
  subtotalAmount: number | null;
  taxAmount: number | null;
  withholdingITBISAmount: number | null;
  withholdingISRAmount: number | null;
  netPayableAmount: number | null;
  fiscalLabel: string;
  vendorReferenceLabel: string;
}

export interface AccountsPayableCurrencySnapshot {
  currency: string | null;
  currencyLabel: string;
  exchangeRate: number | null;
  exchangeRateLabel: string;
  functionalCurrency: string | null;
}

export interface AccountsPayableAccountingSnapshot {
  accountingDate: number | null;
  accountingEventId: string | null;
  documentNature: VendorBillDocumentNature | null;
  documentNatureLabel: string;
  journalEntryId: string | null;
  posted: boolean;
  postedAt: number | null;
  sourceDocumentId: string | null;
  sourceDocumentType: string | null;
  statusLabel: string;
  statusTone: 'neutral' | 'success' | 'warning';
  settlementTiming: VendorBillSettlementTiming | null;
  settlementTimingLabel: string;
}

export interface AccountsPayableAgingSnapshot {
  bucket: AccountsPayableAgingBucket;
  daysOverdue: number | null;
  daysUntilDue: number | null;
  dueAt: number | null;
  label: string;
  tone: 'danger' | 'warning' | 'neutral' | 'success';
}

export type AccountsPayablePaymentChecklistTone =
  | 'danger'
  | 'neutral'
  | 'success'
  | 'warning';

export type AccountsPayablePaymentChecklistItemKey =
  | 'control'
  | 'due_date'
  | 'fiscal'
  | 'receipt'
  | 'supplier';

export interface AccountsPayablePaymentChecklistItem {
  detail: string;
  key: AccountsPayablePaymentChecklistItemKey;
  label: string;
  statusLabel: string;
  tone: AccountsPayablePaymentChecklistTone;
}

export interface AccountsPayablePaymentChecklist {
  description: string;
  items: AccountsPayablePaymentChecklistItem[];
  label: string;
  tone: AccountsPayablePaymentChecklistTone;
}

export interface AccountsPayableRow {
  id: string;
  vendorBill: VendorBill;
  purchase: Purchase;
  reference: string;
  providerName: string;
  providerId: string | null;
  conditionLabel: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentCount: number;
  evidenceCount: number;
  dueAt: number | null;
  lastPaymentAt: number | null;
  agingBucket: AccountsPayableAgingBucket;
  agingLabel: string;
  agingTone: AccountsPayableAgingSnapshot['tone'];
  agingDays: number | null;
  daysUntilDue: number | null;
  providerGroup: string;
  agingGroup: string;
  currencySnapshot: AccountsPayableCurrencySnapshot;
  fiscalSnapshot: AccountsPayableFiscalSnapshot;
  accountingSnapshot: AccountsPayableAccountingSnapshot;
  paymentControl: AccountsPayablePaymentControl;
  traceabilitySummary: string;
}

export interface AccountsPayableSummaryBucket {
  key: AccountsPayableAgingBucket;
  label: string;
  count: number;
  balanceAmount: number;
}

export type AccountsPayableReviewQueueKey =
  | 'disputed'
  | 'fiscal_review'
  | 'on_hold'
  | 'pending_approval';

export interface AccountsPayableReviewQueueSummary {
  balanceAmount: number;
  count: number;
  key: AccountsPayableReviewQueueKey;
  label: string;
  tone: 'danger' | 'neutral' | 'warning';
}

export interface AccountsPayableSummary {
  totalCount: number;
  totalBalanceAmount: number;
  totalWithPayments: number;
  totalWithEvidence: number;
  buckets: AccountsPayableSummaryBucket[];
  reviewQueues: AccountsPayableReviewQueueSummary[];
}

export const ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS: Record<
  AccountsPayableAgingBucket,
  string
> = {
  current: 'Al día',
  due_1_30: 'Vencido 1-30',
  due_31_60: 'Vencido 31-60',
  due_61_plus: 'Vencido 61+',
  no_due_date: 'Sin fecha',
};

const ACCOUNTS_PAYABLE_REVIEW_QUEUE_DEFINITIONS: Array<
  Pick<AccountsPayableReviewQueueSummary, 'key' | 'label' | 'tone'>
> = [
  {
    key: 'pending_approval',
    label: 'Pendientes aprobación',
    tone: 'neutral',
  },
  {
    key: 'on_hold',
    label: 'Retenidas',
    tone: 'warning',
  },
  {
    key: 'disputed',
    label: 'En disputa',
    tone: 'danger',
  },
  {
    key: 'fiscal_review',
    label: 'Revisión fiscal',
    tone: 'warning',
  },
];

const CONTROL_EVIDENCE_URL_FIELDS = [
  'approvalEvidenceUrls',
  'approvalRequestEvidenceUrls',
  'rejectionEvidenceUrls',
  'voidEvidenceUrls',
] as const;

const CONTROL_EVIDENCE_NOTE_FIELDS = [
  'approvalEvidenceNote',
  'approvalRequestEvidenceNote',
  'rejectionEvidenceNote',
  'voidEvidenceNote',
] as const;

const addEvidenceEntries = (
  signals: Set<string>,
  scope: string,
  entries: unknown,
) => {
  if (!Array.isArray(entries)) return;

  entries.forEach((entry, index) => {
    if (typeof entry === 'string') {
      const url = toCleanString(entry);
      if (url) signals.add(`url:${url}`);
      return;
    }

    const record = asRecord(entry);
    const url = toCleanString(record.url);
    if (url) {
      signals.add(`url:${url}`);
      return;
    }

    const id = toCleanString(record.id);
    if (id) {
      signals.add(`${scope}:file:${id}`);
      return;
    }

    if (Object.keys(record).length > 0) {
      signals.add(`${scope}:file:${index}`);
    }
  });
};

const addEvidenceNote = (
  signals: Set<string>,
  scope: string,
  value: unknown,
) => {
  const note = toCleanString(value);
  if (note) signals.add(`${scope}:note:${note}`);
};

const addControlStateEvidence = (
  signals: Set<string>,
  scope: string,
  value: unknown,
) => {
  const state = asRecord(value);
  addEvidenceEntries(signals, scope, state.evidenceUrls);
  addEvidenceNote(signals, scope, state.evidenceNote);
};

const resolveAccountsPayableEvidenceCount = (
  vendorBill: VendorBill,
): number => {
  const signals = new Set<string>();
  const vendorBillRecord = asRecord(vendorBill);
  const purchaseAccountsPayable = asRecord(
    asRecord(vendorBill.purchase).accountsPayable,
  );

  addEvidenceEntries(signals, 'purchase', vendorBill.attachmentUrls);

  CONTROL_EVIDENCE_URL_FIELDS.forEach((field) => {
    addEvidenceEntries(signals, `vendorBill:${field}`, vendorBillRecord[field]);
    addEvidenceEntries(
      signals,
      `purchaseAccountsPayable:${field}`,
      purchaseAccountsPayable[field],
    );
  });

  CONTROL_EVIDENCE_NOTE_FIELDS.forEach((field) => {
    addEvidenceNote(signals, `vendorBill:${field}`, vendorBillRecord[field]);
    addEvidenceNote(
      signals,
      `purchaseAccountsPayable:${field}`,
      purchaseAccountsPayable[field],
    );
  });

  addControlStateEvidence(
    signals,
    'vendorBill:paymentHold',
    vendorBill.paymentHold,
  );
  addControlStateEvidence(signals, 'vendorBill:dispute', vendorBill.dispute);
  addControlStateEvidence(
    signals,
    'purchaseAccountsPayable:paymentHold',
    purchaseAccountsPayable.paymentHold,
  );
  addControlStateEvidence(
    signals,
    'purchaseAccountsPayable:dispute',
    purchaseAccountsPayable.dispute,
  );

  return signals.size;
};

export const resolveAccountsPayableProviderName = (
  vendorBill: VendorBill,
): string => {
  if (vendorBill.supplierName?.trim()) {
    return vendorBill.supplierName.trim();
  }

  const { purchase } = vendorBill;
  if (purchase.provider && typeof purchase.provider === 'object') {
    const provider = purchase.provider as { name?: string | null };
    return provider.name?.trim() || 'Sin proveedor';
  }

  return 'Sin proveedor';
};

export const resolveAccountsPayableConditionLabel = (
  vendorBill: VendorBill,
): string => {
  const condition =
    toCleanString(vendorBill.paymentTerms?.condition) ??
    toCleanString(vendorBill.purchase.condition);

  return condition
    ? (PAYMENT_CONDITION_LABELS[condition as PurchasePaymentCondition] ??
        condition)
    : 'Sin condición';
};

export const resolveAccountsPayableDueAt = (
  vendorBill: VendorBill,
): number | null => {
  return resolveVendorBillDueAtMillis(vendorBill);
};

const ACTIVE_CONTROL_STATUSES = new Set([
  'active',
  'blocked',
  'disputed',
  'held',
  'in_dispute',
  'on_hold',
  'open',
  'payment_hold',
  'pending',
]);

const RELEASED_CONTROL_STATUSES = new Set([
  'cancelled',
  'canceled',
  'closed',
  'cleared',
  'inactive',
  'released',
  'resolved',
  'void',
  'voided',
]);

const PAYMENT_BLOCKING_APPROVAL_STATUSES = new Set([
  'draft',
  'pending',
  'pending_approval',
  'rejected',
]);

const PAYMENT_CONTROL_STATUSES = new Set<AccountsPayablePaymentControlStatus>([
  'payable',
  'on_hold',
  'disputed',
  'pending_approval',
  'closed',
]);

const PAYMENT_CONTROL_DEFAULTS: Record<
  AccountsPayablePaymentControlStatus,
  Pick<AccountsPayablePaymentControl, 'label' | 'tone'>
> = {
  payable: {
    label: 'Aprobada',
    tone: 'success',
  },
  on_hold: {
    label: 'Retenida',
    tone: 'warning',
  },
  disputed: {
    label: 'En disputa',
    tone: 'danger',
  },
  pending_approval: {
    label: 'No aprobada',
    tone: 'neutral',
  },
  closed: {
    label: 'Cerrada',
    tone: 'neutral',
  },
};

const ACCOUNTING_DOCUMENT_NATURE_LABELS: Record<
  VendorBillDocumentNature,
  string
> = {
  asset: 'Activo',
  expense: 'Gasto',
  inventory: 'Inventario',
  service: 'Servicio',
};

const ACCOUNTING_SETTLEMENT_TIMING_LABELS: Record<
  VendorBillSettlementTiming,
  string
> = {
  deferred: 'Diferida',
  immediate: 'Inmediata',
};

const PURCHASE_WORKFLOW_LABELS: Record<
  ReturnType<typeof resolvePurchaseWorkflowStatus>,
  string
> = {
  canceled: 'Compra anulada',
  completed: 'Recepción completa',
  partial_receipt: 'Recepción parcial',
  pending_receipt: 'Recepción pendiente',
};

const INVENTORY_RECEIPT_STATUS_LABELS: Record<string, string> = {
  applied: 'Inventario aplicado',
  applying: 'Inventario en proceso',
  completed: 'Inventario aplicado',
  pending: 'Inventario pendiente',
  pending_inventory: 'Inventario pendiente',
  skipped: 'Sin impacto de inventario',
};

const toCleanDisplayString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return toCleanString(value);
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

const pickCleanString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const cleaned = toCleanDisplayString(value);
    if (cleaned) return cleaned;
  }

  return null;
};

const resolveCurrencyCode = (value: unknown): string | null => {
  const directValue = toCleanDisplayString(value);
  if (directValue) return directValue.toUpperCase();

  const record = asRecord(value);
  const code = pickCleanString(
    record.code,
    record.currency,
    record.id,
    record.isoCode,
    record.value,
  );

  return code?.toUpperCase() ?? null;
};

const resolveExchangeRate = (...values: unknown[]): number | null => {
  for (const value of values) {
    const record = asRecord(value);
    const parsed =
      toFiniteNumber(value) ??
      toFiniteNumber(record.effectiveRate) ??
      toFiniteNumber(record.rate) ??
      toFiniteNumber(record.value) ??
      toFiniteNumber(record.exchangeRate);

    if (parsed != null && parsed > 0) return roundCurrency(parsed);
  }

  return null;
};

const normalizeAccountingDocumentNature = (
  value: unknown,
): VendorBillDocumentNature | null => {
  const cleaned = toCleanString(value)?.toLowerCase();
  return cleaned === 'inventory' ||
    cleaned === 'expense' ||
    cleaned === 'asset' ||
    cleaned === 'service'
    ? cleaned
    : null;
};

const normalizeAccountingSettlementTiming = (
  value: unknown,
): VendorBillSettlementTiming | null => {
  const cleaned = toCleanString(value)?.toLowerCase();
  return cleaned === 'immediate' || cleaned === 'deferred' ? cleaned : null;
};

const resolveProviderChecklistDetail = (
  row: AccountsPayableRow,
): { detail: string; statusLabel: string; tone: AccountsPayablePaymentChecklistTone } => {
  const provider = asRecord(row.purchase.provider);
  const rnc = pickCleanString(
    provider.rnc,
    provider.taxId,
    provider.documentNumber,
    provider.identification,
  );
  const voucherType = pickCleanString(
    provider.voucherType,
    provider.documentType,
    provider.receiptType,
  );
  const hasProviderName = row.providerName !== 'Sin proveedor';
  const details = [
    hasProviderName ? row.providerName : 'Proveedor no identificado',
    rnc ? `RNC ${rnc}` : 'RNC no disponible',
    voucherType ? `Comprobante ${voucherType}` : null,
  ].filter(Boolean);

  if (!hasProviderName) {
    return {
      detail: details.join(' · '),
      statusLabel: 'Sin proveedor',
      tone: 'danger',
    };
  }

  if (!row.providerId) {
    return {
      detail: details.join(' · '),
      statusLabel: 'Ficha por confirmar',
      tone: 'warning',
    };
  }

  return {
    detail: details.join(' · '),
    statusLabel: 'Ficha vinculada',
    tone: 'success',
  };
};

const resolveFiscalChecklistDetail = (
  row: AccountsPayableRow,
): { detail: string; statusLabel: string; tone: AccountsPayablePaymentChecklistTone } => {
  const { fiscalSnapshot } = row;
  const missingItems = [
    fiscalSnapshot.vendorReference ? null : 'factura proveedor',
    fiscalSnapshot.ncf ? null : 'NCF',
    fiscalSnapshot.dgii606ExpenseType ? null : 'clasificación DGII',
  ].filter(Boolean);
  const detail = [
    fiscalSnapshot.vendorReference
      ? `Factura ${fiscalSnapshot.vendorReference}`
      : 'Sin factura proveedor',
    fiscalSnapshot.ncf ? `NCF ${fiscalSnapshot.ncf}` : 'Sin NCF',
    fiscalSnapshot.documentType ?? 'Sin tipo documento',
    fiscalSnapshot.dgii606ExpenseType
      ? `DGII ${fiscalSnapshot.dgii606ExpenseType}`
      : 'Sin clasificación DGII',
  ].join(' · ');

  if (missingItems.length === 0) {
    return {
      detail,
      statusLabel: 'Fiscal validado',
      tone: 'success',
    };
  }

  return {
    detail,
    statusLabel: `Falta ${missingItems.join(', ')}`,
    tone:
      !fiscalSnapshot.vendorReference && !fiscalSnapshot.ncf
        ? 'danger'
        : 'warning',
  };
};

const resolveReceiptChecklistDetail = (
  row: AccountsPayableRow,
): { detail: string; statusLabel: string; tone: AccountsPayablePaymentChecklistTone } => {
  const workflowStatus = resolvePurchaseWorkflowStatus(row.purchase);
  const inventoryState = asRecord(row.purchase.receiptInventoryState);
  const inventoryStatus = toCleanString(inventoryState.status)?.toLowerCase();
  const inventoryLabel = inventoryStatus
    ? (INVENTORY_RECEIPT_STATUS_LABELS[inventoryStatus] ?? inventoryStatus)
    : 'Sin estado de inventario';
  const warehouseId = pickCleanString(
    inventoryState.warehouseId,
    row.purchase.destinationWarehouseId,
  );
  const detail = [
    PURCHASE_WORKFLOW_LABELS[workflowStatus],
    inventoryLabel,
    warehouseId ? `Almacén ${warehouseId}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  if (workflowStatus === 'canceled') {
    return {
      detail,
      statusLabel: 'Compra anulada',
      tone: 'danger',
    };
  }

  if (inventoryStatus === 'pending' || inventoryStatus === 'pending_inventory') {
    return {
      detail,
      statusLabel: 'Inventario pendiente',
      tone: 'danger',
    };
  }

  if (inventoryStatus === 'applying') {
    return {
      detail,
      statusLabel: 'Inventario en proceso',
      tone: 'warning',
    };
  }

  if (workflowStatus === 'completed') {
    return {
      detail,
      statusLabel: 'Recepción completa',
      tone: 'success',
    };
  }

  return {
    detail,
    statusLabel: PURCHASE_WORKFLOW_LABELS[workflowStatus],
    tone: 'warning',
  };
};

const resolveDueDateChecklistItem = (
  row: AccountsPayableRow,
): AccountsPayablePaymentChecklistItem => {
  if (!row.dueAt) {
    return {
      detail: 'Define fecha pactada antes de priorizar o correr pagos.',
      key: 'due_date',
      label: 'Vencimiento',
      statusLabel: 'Sin fecha pactada',
      tone: 'warning',
    };
  }

  return {
    detail: row.agingLabel,
    key: 'due_date',
    label: 'Vencimiento',
    statusLabel: row.agingBucket === 'current' ? 'Programado' : 'Vencido',
    tone: row.agingTone,
  };
};

const pickFiscalNumber = (
  vendorBill: VendorBill,
  keys: string[],
): number | null => {
  const purchaseRecord = asRecord(vendorBill.purchase);
  const monetary = asRecord(
    vendorBill.monetary ?? vendorBill.purchase.monetary,
  );
  const records = [
    asRecord(monetary.fiscalTotals),
    asRecord(monetary.documentTotals),
    monetary,
    asRecord(monetary.functionalTotals),
    asRecord(monetary.legacyTotals),
    asRecord(purchaseRecord.fiscalTotals),
    purchaseRecord,
  ];

  for (const record of records) {
    for (const key of keys) {
      const amount = toFiniteNumber(record[key]);
      if (amount != null) return roundCurrency(amount);
    }
  }

  return null;
};

export const resolveAccountsPayableFiscalSnapshot = (
  vendorBill: VendorBill,
): AccountsPayableFiscalSnapshot => {
  const purchase = vendorBill.purchase;
  const purchaseRecord = asRecord(purchase);
  const taxReceipt = asRecord(purchase.taxReceipt);
  const classification = asRecord(purchase.classification);
  const totalAmount =
    pickFiscalNumber(vendorBill, [
      'total',
      'amount',
      'totalPurchase',
      'gross',
    ]) ?? toFiniteNumber(vendorBill.paymentState?.total);
  const withholdingITBISAmount =
    pickFiscalNumber(vendorBill, ['withholdingITBISAmount', 'itbisWithheld']) ??
    0;
  const withholdingISRAmount =
    pickFiscalNumber(vendorBill, ['withholdingISRAmount', 'isrWithheld']) ?? 0;
  const netPayableAmount =
    pickFiscalNumber(vendorBill, ['netPayableAmount', 'net']) ??
    (totalAmount != null
      ? roundCurrency(
          Math.max(
            totalAmount - withholdingITBISAmount - withholdingISRAmount,
            0,
          ),
        )
      : null);
  const vendorReference = pickCleanString(
    vendorBill.vendorReference,
    purchaseRecord.vendorReference,
    purchase.invoiceNumber,
    purchaseRecord.reference,
  );
  const ncf = pickCleanString(
    taxReceipt.ncf,
    purchaseRecord.ncf,
    purchaseRecord.NCF,
    purchase.proofOfPurchase,
  );

  return {
    vendorReference,
    ncf,
    documentType: pickCleanString(
      purchase.documentType,
      taxReceipt.documentType,
      taxReceipt.type,
    ),
    dgii606ExpenseType: pickCleanString(
      classification.dgii606ExpenseType,
      purchaseRecord.dgii606ExpenseType,
    ),
    issueAt:
      toMillis(
        vendorBill.issueAt ?? purchase.completedAt ?? purchaseRecord.createdAt,
      ) ?? null,
    billDate:
      toMillis(
        vendorBill.billDate ?? purchase.completedAt ?? purchaseRecord.createdAt,
      ) ?? null,
    subtotalAmount: pickFiscalNumber(vendorBill, [
      'subtotalAmount',
      'subtotal',
      'subTotal',
      'totalBaseCost',
      'totalProducts',
    ]),
    taxAmount: pickFiscalNumber(vendorBill, [
      'taxAmount',
      'taxes',
      'tax',
      'totalItbis',
      'itbisAmount',
    ]),
    withholdingITBISAmount,
    withholdingISRAmount,
    netPayableAmount,
    fiscalLabel: ncf ?? 'Sin NCF',
    vendorReferenceLabel: vendorReference ?? 'Sin factura proveedor',
  };
};

export const resolveAccountsPayableCurrencySnapshot = (
  vendorBill: VendorBill,
): AccountsPayableCurrencySnapshot => {
  const vendorBillRecord = asRecord(vendorBill);
  const purchaseRecord = asRecord(vendorBill.purchase);
  const monetary = asRecord(vendorBill.monetary ?? purchaseRecord.monetary);
  const exchangeRateSnapshot = asRecord(monetary.exchangeRateSnapshot);
  const currency = resolveCurrencyCode(
    monetary.documentCurrency ??
      vendorBillRecord.documentCurrency ??
      vendorBillRecord.currency ??
      purchaseRecord.documentCurrency ??
      purchaseRecord.currency,
  );
  const functionalCurrency = resolveCurrencyCode(
    monetary.functionalCurrency ??
      vendorBillRecord.functionalCurrency ??
      purchaseRecord.functionalCurrency,
  );
  const exchangeRate = resolveExchangeRate(
    exchangeRateSnapshot,
    monetary.exchangeRate,
    monetary.rate,
    vendorBillRecord.exchangeRate,
    purchaseRecord.exchangeRate,
  );
  const currencyLabel =
    currency && functionalCurrency && currency !== functionalCurrency
      ? `${currency} -> ${functionalCurrency}`
      : (currency ?? functionalCurrency ?? 'Sin moneda');
  const exchangeRateLabel =
    exchangeRate != null && currency && functionalCurrency
      ? `1 ${currency} = ${exchangeRate} ${functionalCurrency}`
      : exchangeRate != null
        ? `Tasa ${exchangeRate}`
        : currency && functionalCurrency && currency !== functionalCurrency
          ? 'Sin tasa'
          : '';

  return {
    currency,
    currencyLabel,
    exchangeRate,
    exchangeRateLabel,
    functionalCurrency,
  };
};

export const resolveAccountsPayableAccountingSnapshot = (
  vendorBill: VendorBill,
): AccountsPayableAccountingSnapshot => {
  const vendorBillRecord = asRecord(vendorBill);
  const purchaseRecord = asRecord(vendorBill.purchase);
  const purchaseAccounting = asRecord(purchaseRecord.accounting);
  const accountingEventId = pickCleanString(
    vendorBillRecord.accountingEventId,
    purchaseRecord.accountingEventId,
    purchaseAccounting.accountingEventId,
  );
  const journalEntryId = pickCleanString(
    vendorBillRecord.journalEntryId,
    purchaseRecord.journalEntryId,
    purchaseAccounting.journalEntryId,
  );
  const accountingDate =
    toMillis(
      vendorBill.accountingDate ??
        purchaseRecord.accountingDate ??
        purchaseRecord.completedAt ??
        purchaseRecord.createdAt,
    ) ?? null;
  const postedAt =
    toMillis(vendorBill.postedAt ?? purchaseRecord.postedAt) ?? null;
  const documentNature = normalizeAccountingDocumentNature(
    vendorBill.documentNature ?? purchaseRecord.documentNature,
  );
  const settlementTiming = normalizeAccountingSettlementTiming(
    vendorBill.settlementTiming ?? purchaseRecord.settlementTiming,
  );
  const posted = Boolean(postedAt || journalEntryId || accountingEventId);

  return {
    accountingDate,
    accountingEventId,
    documentNature,
    documentNatureLabel: documentNature
      ? ACCOUNTING_DOCUMENT_NATURE_LABELS[documentNature]
      : 'Sin naturaleza',
    journalEntryId,
    posted,
    postedAt,
    settlementTiming,
    settlementTimingLabel: settlementTiming
      ? ACCOUNTING_SETTLEMENT_TIMING_LABELS[settlementTiming]
      : 'Sin liquidación',
    sourceDocumentId: toCleanString(vendorBill.sourceDocumentId),
    sourceDocumentType: toCleanString(vendorBill.sourceDocumentType),
    statusLabel: posted ? 'Contabilizada' : 'Pendiente contable',
    statusTone: posted ? 'success' : 'warning',
  };
};

const isActiveControlState = (value: unknown): boolean => {
  if (value === true) return true;

  const record = asRecord(value);
  if (record.active === true || record.isActive === true) return true;
  if (record.active === false || record.isActive === false) return false;

  const status = toCleanString(
    record.status ?? record.state ?? record.approvalStatus,
  )?.toLowerCase();
  if (!status || RELEASED_CONTROL_STATUSES.has(status)) return false;

  return ACTIVE_CONTROL_STATUSES.has(status);
};

const resolveControlReason = (...values: unknown[]): string | null => {
  for (const value of values) {
    const record = asRecord(value);
    const reason = toCleanString(
      record.reason ?? record.note ?? record.comment ?? record.description,
    );
    if (reason) return reason;
  }

  return null;
};

const resolvePersistedPaymentControl = (
  vendorBill: VendorBill,
): AccountsPayablePaymentControl | null => {
  const snapshot = vendorBill.paymentControl;
  const status = toCleanString(
    snapshot?.status,
  ) as AccountsPayablePaymentControlStatus | null;

  if (!status || !PAYMENT_CONTROL_STATUSES.has(status)) {
    return null;
  }

  const defaults = PAYMENT_CONTROL_DEFAULTS[status];
  const snapshotTone = toCleanString(snapshot?.tone);
  const tone =
    snapshotTone === 'danger' ||
    snapshotTone === 'warning' ||
    snapshotTone === 'neutral' ||
    snapshotTone === 'success'
      ? snapshotTone
      : defaults.tone;

  return {
    canRegisterPayment:
      status === 'payable' && snapshot?.canRegisterPayment !== false,
    label: toCleanString(snapshot?.label) ?? defaults.label,
    reason: toCleanString(snapshot?.reason),
    status,
    tone,
  };
};

export const resolveAccountsPayablePaymentControl = (
  vendorBill: VendorBill,
): AccountsPayablePaymentControl => {
  const persistedControl = resolvePersistedPaymentControl(vendorBill);
  if (persistedControl) return persistedControl;

  const status = toCleanString(vendorBill.status)?.toLowerCase();
  if (status === 'paid' || status === 'voided') {
    return {
      canRegisterPayment: false,
      label: 'Cerrada',
      reason: null,
      status: 'closed',
      tone: 'neutral',
    };
  }

  const purchaseAccountsPayable = asRecord(
    vendorBill.purchase.accountsPayable ??
      vendorBill.purchase.payables ??
      vendorBill.purchase.vendorBill,
  );
  const paymentHold =
    vendorBill.paymentHold ??
    purchaseAccountsPayable.paymentHold ??
    purchaseAccountsPayable.hold ??
    null;
  const dispute = vendorBill.dispute ?? purchaseAccountsPayable.dispute ?? null;

  if (status === 'disputed' || isActiveControlState(dispute)) {
    return {
      canRegisterPayment: false,
      label: 'En disputa',
      reason: resolveControlReason(dispute),
      status: 'disputed',
      tone: 'danger',
    };
  }

  if (status === 'on_hold' || isActiveControlState(paymentHold)) {
    return {
      canRegisterPayment: false,
      label: 'Retenida',
      reason: resolveControlReason(paymentHold),
      status: 'on_hold',
      tone: 'warning',
    };
  }

  const approvalStatus = toCleanString(
    vendorBill.approvalStatus ?? purchaseAccountsPayable.approvalStatus,
  )?.toLowerCase();
  if (
    approvalStatus &&
    PAYMENT_BLOCKING_APPROVAL_STATUSES.has(approvalStatus)
  ) {
    return {
      canRegisterPayment: false,
      label: 'No aprobada',
      reason: null,
      status: 'pending_approval',
      tone: 'neutral',
    };
  }

  return {
    canRegisterPayment: true,
    label: 'Aprobada',
    reason: null,
    status: 'payable',
    tone: 'success',
  };
};

export const resolveAccountsPayableAgingSnapshot = (
  vendorBill: VendorBill,
  now = Date.now(),
): AccountsPayableAgingSnapshot => {
  const dueAt = resolveAccountsPayableDueAt(vendorBill);
  const settledAt = toMillis(vendorBill.paymentState?.lastPaymentAt);

  if (isSettledPaymentStateStatus(vendorBill.paymentState?.status)) {
    if (!dueAt) {
      return {
        bucket: 'current',
        daysOverdue: null,
        daysUntilDue: null,
        dueAt: null,
        label: 'Pagada',
        tone: 'success',
      };
    }

    if (settledAt == null || endOfDay(settledAt) <= endOfDay(dueAt)) {
      return {
        bucket: 'current',
        daysOverdue: 0,
        daysUntilDue: null,
        dueAt,
        label: 'Pagada a tiempo',
        tone: 'success',
      };
    }

    const daysLate = Math.max(
      1,
      Math.ceil((startOfDay(settledAt) - endOfDay(dueAt)) / DAY_IN_MS),
    );

    return {
      bucket: 'current',
      daysOverdue: daysLate,
      daysUntilDue: null,
      dueAt,
      label: `Pagada con ${daysLate} día${daysLate === 1 ? '' : 's'} de atraso`,
      tone: 'warning',
    };
  }

  if (!dueAt) {
    return {
      bucket: 'no_due_date',
      daysOverdue: null,
      daysUntilDue: null,
      dueAt: null,
      label: 'Sin fecha pactada',
      tone: 'neutral',
    };
  }

  const todayStart = startOfDay(now);
  const dueDayStart = startOfDay(dueAt);
  const dueDayEnd = endOfDay(dueAt);
  const daysUntilDue = Math.ceil((dueDayStart - todayStart) / DAY_IN_MS);

  if (now <= dueDayEnd) {
    if (daysUntilDue <= 0) {
      return {
        bucket: 'current',
        daysOverdue: 0,
        daysUntilDue: 0,
        dueAt,
        label: 'Vence hoy',
        tone: 'warning',
      };
    }

    return {
      bucket: 'current',
      daysOverdue: 0,
      daysUntilDue,
      dueAt,
      label:
        daysUntilDue <= 7
          ? `Vence en ${daysUntilDue} día${daysUntilDue === 1 ? '' : 's'}`
          : 'Al día',
      tone: daysUntilDue <= 7 ? 'warning' : 'success',
    };
  }

  const daysOverdue = Math.max(
    1,
    Math.ceil((todayStart - dueDayEnd) / DAY_IN_MS),
  );

  if (daysOverdue <= 30) {
    return {
      bucket: 'due_1_30',
      daysOverdue,
      daysUntilDue: -daysOverdue,
      dueAt,
      label: `Vencido hace ${daysOverdue} día${daysOverdue === 1 ? '' : 's'}`,
      tone: 'danger',
    };
  }

  if (daysOverdue <= 60) {
    return {
      bucket: 'due_31_60',
      daysOverdue,
      daysUntilDue: -daysOverdue,
      dueAt,
      label: `Vencido hace ${daysOverdue} días`,
      tone: 'danger',
    };
  }

  return {
    bucket: 'due_61_plus',
    daysOverdue,
    daysUntilDue: -daysOverdue,
    dueAt,
    label: `Vencido hace ${daysOverdue} días`,
    tone: 'danger',
  };
};

export const buildAccountsPayableRow = (
  vendorBill: VendorBill,
  fallbackProviderName?: string | null,
  now = Date.now(),
): AccountsPayableRow => {
  const paymentState = vendorBill.paymentState ?? null;
  const providerName =
    toCleanString(fallbackProviderName) ??
    resolveAccountsPayableProviderName(vendorBill);
  const aging = resolveAccountsPayableAgingSnapshot(vendorBill, now);
  const totalAmount = Number(paymentState?.total ?? 0);
  const paidAmount = Number(paymentState?.paid ?? 0);
  const balanceAmount = Number(paymentState?.balance ?? totalAmount);
  const paymentCount = Number(paymentState?.paymentCount ?? 0);
  const evidenceCount = resolveAccountsPayableEvidenceCount(vendorBill);
  const reference = String(
    vendorBill.reference ?? vendorBill.id ?? 'Sin número',
  );
  const paymentControl = resolveAccountsPayablePaymentControl(vendorBill);
  const fiscalSnapshot = resolveAccountsPayableFiscalSnapshot(vendorBill);
  const currencySnapshot = resolveAccountsPayableCurrencySnapshot(vendorBill);
  const accountingSnapshot =
    resolveAccountsPayableAccountingSnapshot(vendorBill);

  return {
    id: String(vendorBill.id ?? reference),
    vendorBill,
    purchase: vendorBill.purchase,
    reference,
    providerName,
    providerId: toCleanString(vendorBill.supplierId),
    conditionLabel: resolveAccountsPayableConditionLabel(vendorBill),
    totalAmount,
    paidAmount,
    balanceAmount,
    paymentCount,
    evidenceCount,
    dueAt: aging.dueAt,
    lastPaymentAt: toMillis(paymentState?.lastPaymentAt) ?? null,
    agingBucket: aging.bucket,
    agingLabel: aging.label,
    agingTone: aging.tone,
    agingDays: aging.daysOverdue,
    daysUntilDue: aging.daysUntilDue,
    providerGroup: providerName,
    agingGroup: ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS[aging.bucket],
    currencySnapshot,
    fiscalSnapshot,
    accountingSnapshot,
    paymentControl,
    traceabilitySummary: `${paymentCount} pago${paymentCount === 1 ? '' : 's'} · ${evidenceCount} evidencia${evidenceCount === 1 ? '' : 's'}`,
  };
};

export const buildAccountsPayablePaymentChecklist = (
  row: AccountsPayableRow,
): AccountsPayablePaymentChecklist => {
  const supplier = resolveProviderChecklistDetail(row);
  const fiscal = resolveFiscalChecklistDetail(row);
  const receipt = resolveReceiptChecklistDetail(row);
  const items: AccountsPayablePaymentChecklistItem[] = [
    {
      detail: supplier.detail,
      key: 'supplier',
      label: 'Proveedor',
      statusLabel: supplier.statusLabel,
      tone: supplier.tone,
    },
    {
      detail: fiscal.detail,
      key: 'fiscal',
      label: 'Documento fiscal',
      statusLabel: fiscal.statusLabel,
      tone: fiscal.tone,
    },
    {
      detail: receipt.detail,
      key: 'receipt',
      label: 'Recepción',
      statusLabel: receipt.statusLabel,
      tone: receipt.tone,
    },
    resolveDueDateChecklistItem(row),
    {
      detail:
        row.paymentControl.reason ??
        (row.paymentControl.canRegisterPayment
          ? `Balance abierto ${formatPrice(row.balanceAmount)}`
          : 'Requiere acción de control antes de pagar.'),
      key: 'control',
      label: 'Control de pago',
      statusLabel: row.paymentControl.label,
      tone: row.paymentControl.canRegisterPayment
        ? 'success'
        : row.paymentControl.tone,
    },
  ];
  const hasBlockingItem =
    !row.paymentControl.canRegisterPayment ||
    items.some((item) => item.key !== 'due_date' && item.tone === 'danger');
  const hasReviewItem = items.some(
    (item) =>
      item.tone === 'warning' ||
      (item.key === 'due_date' && item.tone === 'danger'),
  );

  if (hasBlockingItem) {
    return {
      description:
        'Corrige los bloqueos o completa la aprobación antes de registrar pagos.',
      items,
      label: 'Bloqueado para pago',
      tone: 'danger',
    };
  }

  if (hasReviewItem) {
    return {
      description:
        'Hay datos incompletos que conviene revisar antes de incluir en una corrida.',
      items,
      label: 'Requiere revisión',
      tone: 'warning',
    };
  }

  return {
    description:
      'Proveedor, documento, recepción, vencimiento y control están listos.',
    items,
    label: 'Listo para pagar',
    tone: 'success',
  };
};

export const buildAccountsPayableSummary = (
  rows: AccountsPayableRow[],
): AccountsPayableSummary => {
  const buckets = (
    Object.keys(
      ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS,
    ) as AccountsPayableAgingBucket[]
  ).map((key) => ({
    key,
    label: ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS[key],
    count: 0,
    balanceAmount: 0,
  }));
  const reviewQueues = ACCOUNTS_PAYABLE_REVIEW_QUEUE_DEFINITIONS.map(
    (definition) => ({
      ...definition,
      balanceAmount: 0,
      count: 0,
    }),
  );
  const reviewQueueByKey = new Map(
    reviewQueues.map((queue) => [queue.key, queue]),
  );
  const addReviewQueueRow = (
    key: AccountsPayableReviewQueueKey,
    row: AccountsPayableRow,
  ) => {
    const queue = reviewQueueByKey.get(key);
    if (!queue) return;
    queue.count += 1;
    queue.balanceAmount += row.balanceAmount;
  };

  rows.forEach((row) => {
    const bucket = buckets.find((entry) => entry.key === row.agingBucket);
    if (bucket) {
      bucket.count += 1;
      bucket.balanceAmount += row.balanceAmount;
    }

    if (row.paymentControl.status === 'pending_approval') {
      addReviewQueueRow('pending_approval', row);
    }
    if (row.paymentControl.status === 'on_hold') {
      addReviewQueueRow('on_hold', row);
    }
    if (row.paymentControl.status === 'disputed') {
      addReviewQueueRow('disputed', row);
    }
    if (hasAccountsPayableFiscalReviewGap(row)) {
      addReviewQueueRow('fiscal_review', row);
    }
  });

  return {
    totalCount: rows.length,
    totalBalanceAmount: rows.reduce((sum, row) => sum + row.balanceAmount, 0),
    totalWithPayments: rows.filter((row) => row.paymentCount > 0).length,
    totalWithEvidence: rows.filter((row) => row.evidenceCount > 0).length,
    buckets,
    reviewQueues,
  };
};

const hasAccountsPayableFiscalReviewGap = (row: AccountsPayableRow): boolean =>
  !row.fiscalSnapshot.ncf ||
  !row.fiscalSnapshot.vendorReference ||
  !row.fiscalSnapshot.dgii606ExpenseType;

export const matchesAccountsPayableReviewQueue = (
  row: AccountsPayableRow,
  queue: AccountsPayableReviewQueueKey | 'all',
): boolean => {
  switch (queue) {
    case 'pending_approval':
      return row.paymentControl.status === 'pending_approval';
    case 'on_hold':
      return row.paymentControl.status === 'on_hold';
    case 'disputed':
      return row.paymentControl.status === 'disputed';
    case 'fiscal_review':
      return hasAccountsPayableFiscalReviewGap(row);
    default:
      return true;
  }
};

export const filterAccountsPayableRowsByReviewQueue = (
  rows: AccountsPayableRow[],
  queue: AccountsPayableReviewQueueKey | 'all',
): AccountsPayableRow[] =>
  queue === 'all'
    ? rows
    : rows.filter((row) => matchesAccountsPayableReviewQueue(row, queue));

export const matchesAccountsPayableTraceabilityFilter = (
  row: AccountsPayableRow,
  filter: AccountsPayableTraceabilityFilter,
): boolean => {
  switch (filter) {
    case 'with_payments':
      return row.paymentCount > 0;
    case 'with_evidence':
      return row.evidenceCount > 0;
    case 'missing_evidence':
      return row.evidenceCount === 0;
    case 'overdue':
      return row.agingBucket !== 'current' && row.agingBucket !== 'no_due_date';
    default:
      return true;
  }
};

export const matchesAccountsPayableFiscalFilter = (
  row: AccountsPayableRow,
  filter: AccountsPayableFiscalFilter,
): boolean => {
  const { fiscalSnapshot } = row;
  const withholdingTotal =
    Number(fiscalSnapshot.withholdingITBISAmount ?? 0) +
    Number(fiscalSnapshot.withholdingISRAmount ?? 0);

  switch (filter) {
    case 'with_ncf':
      return Boolean(fiscalSnapshot.ncf);
    case 'missing_ncf':
      return !fiscalSnapshot.ncf;
    case 'with_withholdings':
      return withholdingTotal > 0;
    case 'missing_vendor_reference':
      return !fiscalSnapshot.vendorReference;
    case 'missing_dgii_classification':
      return !fiscalSnapshot.dgii606ExpenseType;
    default:
      return true;
  }
};

export const matchesAccountsPayableReviewScope = (
  row: AccountsPayableRow,
  {
    fiscalFilter,
    traceabilityFilter,
  }: {
    fiscalFilter: AccountsPayableFiscalFilter;
    traceabilityFilter: AccountsPayableTraceabilityFilter;
  },
): boolean =>
  matchesAccountsPayableTraceabilityFilter(row, traceabilityFilter) &&
  matchesAccountsPayableFiscalFilter(row, fiscalFilter);

export const filterAccountsPayableRowsByReviewScope = (
  rows: AccountsPayableRow[],
  filters: {
    fiscalFilter: AccountsPayableFiscalFilter;
    traceabilityFilter: AccountsPayableTraceabilityFilter;
  },
): AccountsPayableRow[] =>
  rows.filter((row) => matchesAccountsPayableReviewScope(row, filters));

export const filterAccountsPayableRowsByAgingBucket = (
  rows: AccountsPayableRow[],
  agingBucketFilter: AccountsPayableAgingBucket | 'all',
): AccountsPayableRow[] =>
  agingBucketFilter === 'all'
    ? rows
    : rows.filter((row) => row.agingBucket === agingBucketFilter);

export const formatAccountsPayableCompactMoney = (value: number): string =>
  formatPrice(value);
