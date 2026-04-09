import type {
  AccountingEvent,
  AccountingEventError,
  AccountingEventProjection,
  AccountingEventStatus,
  AccountingProjectionStatus,
  AccountingEventType,
  AccountingModuleKey,
} from '@/types/accounting';
import {
  ACCOUNTING_EVENT_STATUS_VALUES,
  ACCOUNTING_EVENT_TYPE_VALUES,
  ACCOUNTING_PROJECTION_STATUS_VALUES,
  AccountingEventProjectionSchema,
  AccountingEventSchema,
} from '@/shared/accountingSchemas.js';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export interface AccountingEventDefinition {
  eventType: AccountingEventType;
  moduleKey: AccountingModuleKey;
  label: string;
  description: string;
}

export const ACCOUNTING_EVENT_DEFINITIONS: AccountingEventDefinition[] = [
  {
    eventType: 'invoice.committed',
    moduleKey: 'sales',
    label: 'Factura confirmada',
    description:
      'Venta confirmada que ya debe quedar disponible para proyeccion contable.',
  },
  {
    eventType: 'accounts_receivable.payment.recorded',
    moduleKey: 'accounts_receivable',
    label: 'Cobro registrado',
    description: 'Pago aplicado a cuentas por cobrar.',
  },
  {
    eventType: 'accounts_receivable.payment.voided',
    moduleKey: 'accounts_receivable',
    label: 'Cobro anulado',
    description: 'Reversa operativa de un cobro registrado.',
  },
  {
    eventType: 'customer_credit_note.issued',
    moduleKey: 'accounts_receivable',
    label: 'Nota de crédito de cliente emitida',
    description: 'Documento de crédito emitido a favor de un cliente.',
  },
  {
    eventType: 'customer_credit_note.applied',
    moduleKey: 'accounts_receivable',
    label: 'Nota de crédito de cliente aplicada',
    description: 'Aplicación de saldo a favor de cliente contra una factura.',
  },
  {
    eventType: 'purchase.committed',
    moduleKey: 'purchases',
    label: 'Compra confirmada',
    description: 'Compra validada y lista para reflejar inventario o pasivos.',
  },
  {
    eventType: 'accounts_payable.payment.recorded',
    moduleKey: 'accounts_payable',
    label: 'Pago a suplidor registrado',
    description: 'Pago aplicado a cuentas por pagar.',
  },
  {
    eventType: 'accounts_payable.payment.voided',
    moduleKey: 'accounts_payable',
    label: 'Pago a suplidor anulado',
    description: 'Reversa operativa de un pago a suplidor.',
  },
  {
    eventType: 'supplier_credit_note.issued',
    moduleKey: 'accounts_payable',
    label: 'Saldo a favor de suplidor emitido',
    description: 'Documento o saldo a favor disponible para aplicar a compras futuras.',
  },
  {
    eventType: 'supplier_credit_note.applied',
    moduleKey: 'accounts_payable',
    label: 'Saldo a favor de suplidor aplicado',
    description: 'Aplicación de saldo a favor de suplidor contra una compra.',
  },
  {
    eventType: 'expense.recorded',
    moduleKey: 'expenses',
    label: 'Gasto registrado',
    description: 'Registro de gasto confirmado para libro mayor.',
  },
  {
    eventType: 'cash_over_short.recorded',
    moduleKey: 'cash',
    label: 'Diferencia de cuadre registrada',
    description: 'Sobrante o faltante detectado al cerrar un cuadre de caja.',
  },
  {
    eventType: 'internal_transfer.posted',
    moduleKey: 'banking',
    label: 'Transferencia interna posteada',
    description: 'Movimiento entre caja y banco o entre cuentas internas.',
  },
  {
    eventType: 'manual.entry.recorded',
    moduleKey: 'general_ledger',
    label: 'Asiento manual registrado',
    description: 'Asiento ingresado manualmente desde libro diario.',
  },
  {
    eventType: 'fx_settlement.recorded',
    moduleKey: 'fx',
    label: 'Settlement FX registrado',
    description: 'Cierre de diferencia cambiaria o liquidacion monetaria.',
  },
];

export const ACCOUNTING_EVENT_TYPE_LABELS: Record<AccountingEventType, string> =
  Object.fromEntries(
    ACCOUNTING_EVENT_DEFINITIONS.map((definition) => [
      definition.eventType,
      definition.label,
    ]),
  ) as Record<AccountingEventType, string>;

export const ACCOUNTING_MODULE_LABELS: Record<AccountingModuleKey, string> = {
  sales: 'Ventas',
  accounts_receivable: 'Cuentas por cobrar',
  purchases: 'Compras',
  accounts_payable: 'Cuentas por pagar',
  expenses: 'Gastos',
  cash: 'Caja',
  banking: 'Bancos y transferencias',
  fx: 'Tasa de cambio',
  general_ledger: 'Libro diario',
  tax: 'Impuestos',
};

export const ACCOUNTING_EVENT_STATUS_LABELS: Record<
  AccountingEventStatus,
  string
> = {
  recorded: 'Registrado',
  projected: 'Proyectado',
  voided: 'Anulado',
};

export const ACCOUNTING_PROJECTION_STATUS_LABELS: Record<
  AccountingProjectionStatus,
  string
> = {
  pending: 'Pendiente',
  projected: 'Proyectado',
  failed: 'Fallido',
  pending_account_mapping: 'Pendiente de mapeo contable',
};

export const normalizeAccountingEventType = (
  value: unknown,
  fallback: AccountingEventType = 'invoice.committed',
): AccountingEventType =>
  (ACCOUNTING_EVENT_TYPE_VALUES.find((eventType) => eventType === value) as
    | AccountingEventType
    | undefined) ?? fallback;

export const normalizeAccountingEventVersion = (
  value: unknown,
  fallback = 1,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizeAccountingModuleKey = (
  value: unknown,
  fallback: AccountingModuleKey = 'sales',
): AccountingModuleKey =>
  ACCOUNTING_EVENT_DEFINITIONS.find(
    (definition) => definition.moduleKey === value,
  )?.moduleKey ?? fallback;

export const normalizeAccountingEventStatus = (
  value: unknown,
): AccountingEventStatus => {
  return (ACCOUNTING_EVENT_STATUS_VALUES.find((status) => status === value) as
    | AccountingEventStatus
    | undefined) ?? 'recorded';
};

export const normalizeAccountingProjectionStatus = (
  value: unknown,
): AccountingProjectionStatus => {
  return (ACCOUNTING_PROJECTION_STATUS_VALUES.find(
    (status) => status === value,
  ) as AccountingProjectionStatus | undefined) ?? 'pending';
};

export const resolveAccountingSourceDocumentType = ({
  sourceDocumentType,
  sourceType,
}: {
  sourceDocumentType?: unknown;
  sourceType?: unknown;
}): string | null =>
  toCleanString(sourceDocumentType) || toCleanString(sourceType);

export const resolveAccountingSourceDocumentId = ({
  sourceDocumentId,
  sourceId,
}: {
  sourceDocumentId?: unknown;
  sourceId?: unknown;
}): string | null =>
  toCleanString(sourceDocumentId) || toCleanString(sourceId);

export const resolveAccountingEventDedupeKey = ({
  businessId,
  eventType,
  sourceId,
  eventVersion,
  dedupeKey,
}: {
  businessId?: unknown;
  eventType?: unknown;
  sourceId?: unknown;
  eventVersion?: unknown;
  dedupeKey?: unknown;
}): string | null =>
  toCleanString(dedupeKey) ||
  [
    toCleanString(businessId),
    normalizeAccountingEventType(eventType),
    toCleanString(sourceId),
    normalizeAccountingEventVersion(eventVersion),
  ]
    .filter(Boolean)
    .join(':');

export const resolveAccountingEventIdempotencyKey = ({
  idempotencyKey,
  dedupeKey,
}: {
  idempotencyKey?: unknown;
  dedupeKey?: unknown;
}): string | null => toCleanString(idempotencyKey) || toCleanString(dedupeKey);

export const normalizeAccountingEventProjection = (
  value: unknown,
): AccountingEventProjection => {
  const record = asRecord(value);
  const lastError = asRecord(record.lastError);
  const errorCode = toCleanString(lastError.code);
  const errorMessage = toCleanString(lastError.message);

  return AccountingEventProjectionSchema.parse({
    status: normalizeAccountingProjectionStatus(
      record.status ?? record.projectionStatus,
    ),
    projectorVersion: normalizeAccountingEventVersion(record.projectorVersion),
    journalEntryId: toCleanString(record.journalEntryId),
    lastAttemptAt:
      (record.lastAttemptAt as AccountingEventProjection['lastAttemptAt']) ??
      null,
    projectedAt:
      (record.projectedAt as AccountingEventProjection['projectedAt']) ?? null,
    lastError:
      errorCode || errorMessage
        ? {
            code: errorCode ?? 'projection-error',
            message: errorMessage ?? 'Error proyectando evento contable.',
            at: (lastError.at as AccountingEventError['at']) ?? null,
            details: asRecord(lastError.details),
          }
        : null,
  });
};

export const getAccountingEventDefinition = (
  eventType: AccountingEventType,
): AccountingEventDefinition =>
  ACCOUNTING_EVENT_DEFINITIONS.find(
    (definition) => definition.eventType === eventType,
  ) ?? ACCOUNTING_EVENT_DEFINITIONS[0];

export const normalizeAccountingEventRecord = (
  id: string,
  businessId: string,
  value: unknown,
): AccountingEvent => {
  const record = asRecord(value);
  const eventType = normalizeAccountingEventType(record.eventType);
  const eventVersion = normalizeAccountingEventVersion(record.eventVersion);
  const sourceType = toCleanString(record.sourceType);
  const sourceId = toCleanString(record.sourceId);
  const dedupeKey = resolveAccountingEventDedupeKey({
    businessId,
    eventType,
    sourceId,
    eventVersion,
    dedupeKey: record.dedupeKey,
  });

  return AccountingEventSchema.parse({
    id,
    businessId,
    eventType,
    eventVersion,
    status: normalizeAccountingEventStatus(record.status),
    occurredAt: (record.occurredAt as AccountingEvent['occurredAt']) ?? null,
    recordedAt: (record.recordedAt as AccountingEvent['recordedAt']) ?? null,
    sourceType,
    sourceId,
    sourceDocumentType: resolveAccountingSourceDocumentType({
      sourceDocumentType: record.sourceDocumentType,
      sourceType,
    }),
    sourceDocumentId: resolveAccountingSourceDocumentId({
      sourceDocumentId: record.sourceDocumentId,
      sourceId,
    }),
    counterpartyType: toCleanString(record.counterpartyType),
    counterpartyId: toCleanString(record.counterpartyId),
    currency: toCleanString(record.currency) as AccountingEvent['currency'],
    functionalCurrency: toCleanString(
      record.functionalCurrency,
    ) as AccountingEvent['functionalCurrency'],
    monetary: asRecord(record.monetary),
    treasury: asRecord(record.treasury),
    payload: asRecord(record.payload),
    dedupeKey,
    idempotencyKey: resolveAccountingEventIdempotencyKey({
      idempotencyKey: record.idempotencyKey,
      dedupeKey,
    }),
    projection: normalizeAccountingEventProjection(record.projection),
    reversalOfEventId: toCleanString(record.reversalOfEventId),
    createdAt: (record.createdAt as AccountingEvent['createdAt']) ?? null,
    createdBy: toCleanString(record.createdBy),
    metadata: asRecord(record.metadata),
  });
};
