import { z } from 'zod';

export const ACCOUNTING_EVENT_TYPE_VALUES = [
  'invoice.committed',
  'accounts_receivable.payment.recorded',
  'accounts_receivable.payment.voided',
  'purchase.committed',
  'accounts_payable.payment.recorded',
  'accounts_payable.payment.voided',
  'expense.recorded',
  'internal_transfer.posted',
  'manual.entry.recorded',
  'fx_settlement.recorded',
];

export const ACCOUNTING_EVENT_STATUS_VALUES = [
  'recorded',
  'projected',
  'voided',
];

export const ACCOUNTING_PROJECTION_STATUS_VALUES = [
  'pending',
  'projected',
  'failed',
  'pending_account_mapping',
];

export const ACCOUNTING_TREASURY_PAYMENT_CHANNEL_VALUES = [
  'cash',
  'bank',
  'mixed',
  'other',
];

const trimString = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const toNullableTrimmedString = (value) => {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const trimmedStringSchema = z.preprocess(
  trimString,
  z.string().min(1, 'Este campo es requerido.'),
);

const nullableTrimmedStringSchema = z.preprocess(
  toNullableTrimmedString,
  z.string().min(1).nullable(),
);

const timestampLikeSchema = z.any().nullable().optional();

const monetaryAmountSchema = z
  .coerce.number({
    invalid_type_error: 'Los montos deben ser numéricos.',
  })
  .finite('Los montos deben ser numéricos.');

const optionalRoundedAmountSchema = z
  .union([monetaryAmountSchema, z.null()])
  .optional();

const callableLedgerLineSchema = z
  .object({
    accountId: trimmedStringSchema,
    credit: monetaryAmountSchema.nonnegative(
      'El crédito debe ser mayor o igual que cero.',
    ),
    debit: monetaryAmountSchema.nonnegative(
      'El débito debe ser mayor o igual que cero.',
    ),
    description: nullableTrimmedStringSchema.optional().default(null),
  })
  .superRefine((line, context) => {
    const hasDebit = line.debit > 0;
    const hasCredit = line.credit > 0;

    if (hasDebit === hasCredit) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Cada línea debe tener débito o crédito, pero no ambos al mismo tiempo.',
        path: ['debit'],
      });
    }
  });

export const AccountingEventErrorSchema = z
  .object({
    code: trimmedStringSchema,
    message: trimmedStringSchema,
    at: timestampLikeSchema,
    details: z.record(z.string(), z.unknown()).optional().default({}),
  })
  .passthrough();

export const AccountingEventProjectionSchema = z
  .object({
    status: z.enum(ACCOUNTING_PROJECTION_STATUS_VALUES),
    projectorVersion: z.coerce.number().int().positive().optional().default(1),
    journalEntryId: nullableTrimmedStringSchema.optional().default(null),
    lastAttemptAt: timestampLikeSchema,
    projectedAt: timestampLikeSchema,
    lastError: AccountingEventErrorSchema.nullable().optional().default(null),
  })
  .passthrough();

export const AccountingEventMonetarySnapshotSchema = z
  .object({
    amount: optionalRoundedAmountSchema,
    taxAmount: optionalRoundedAmountSchema,
    functionalAmount: optionalRoundedAmountSchema,
    functionalTaxAmount: optionalRoundedAmountSchema,
  })
  .passthrough();

export const AccountingEventTreasurySnapshotSchema = z
  .object({
    cashCountId: nullableTrimmedStringSchema.optional().default(null),
    bankAccountId: nullableTrimmedStringSchema.optional().default(null),
    paymentChannel: z
      .union([
        z.enum(ACCOUNTING_TREASURY_PAYMENT_CHANNEL_VALUES),
        z.null(),
      ])
      .optional()
      .default(null),
  })
  .passthrough();

export const AccountingEventSchema = z
  .object({
    id: trimmedStringSchema,
    businessId: trimmedStringSchema,
    eventType: z.enum(ACCOUNTING_EVENT_TYPE_VALUES),
    eventVersion: z.coerce.number().int().positive(),
    status: z.enum(ACCOUNTING_EVENT_STATUS_VALUES),
    occurredAt: timestampLikeSchema,
    recordedAt: timestampLikeSchema,
    sourceType: nullableTrimmedStringSchema.optional().default(null),
    sourceId: nullableTrimmedStringSchema.optional().default(null),
    sourceDocumentType: nullableTrimmedStringSchema.optional().default(null),
    sourceDocumentId: nullableTrimmedStringSchema.optional().default(null),
    counterpartyType: nullableTrimmedStringSchema.optional().default(null),
    counterpartyId: nullableTrimmedStringSchema.optional().default(null),
    currency: nullableTrimmedStringSchema.optional().default(null),
    functionalCurrency: nullableTrimmedStringSchema.optional().default(null),
    monetary: AccountingEventMonetarySnapshotSchema.optional().default({}),
    treasury: AccountingEventTreasurySnapshotSchema.optional().default({}),
    payload: z.record(z.string(), z.unknown()).optional().default({}),
    dedupeKey: nullableTrimmedStringSchema.optional().default(null),
    idempotencyKey: nullableTrimmedStringSchema.optional().default(null),
    projection: AccountingEventProjectionSchema.optional().default({
      status: 'pending',
      projectorVersion: 1,
      journalEntryId: null,
      lastAttemptAt: null,
      projectedAt: null,
      lastError: null,
    }),
    reversalOfEventId: nullableTrimmedStringSchema.optional().default(null),
    createdAt: timestampLikeSchema,
    createdBy: nullableTrimmedStringSchema.optional().default(null),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
  })
  .passthrough();

export const CreateManualJournalEntryInputSchema = z.object({
  businessId: trimmedStringSchema,
  description: trimmedStringSchema,
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha del asiento debe tener formato YYYY-MM-DD.'),
  lines: z
    .array(callableLedgerLineSchema)
    .min(2, 'El asiento manual requiere al menos dos líneas válidas.'),
  note: nullableTrimmedStringSchema.optional().default(null),
});

export const CreateManualJournalEntryResultSchema = z.object({
  ok: z.literal(true),
  entryId: trimmedStringSchema,
  eventId: trimmedStringSchema,
  status: z.enum(['posted', 'reversed']),
});

export const ReverseJournalEntryInputSchema = z.object({
  businessId: trimmedStringSchema,
  entryId: trimmedStringSchema,
  reason: nullableTrimmedStringSchema.optional().default(null),
  reversalDate: z
    .union([
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha del reverso debe tener formato YYYY-MM-DD.'),
      z.null(),
    ])
    .optional()
    .default(null),
});

export const ReverseJournalEntryResultSchema = z.object({
  ok: z.literal(true),
  entryId: trimmedStringSchema,
  reversalEntryId: z.union([trimmedStringSchema, z.null()]),
  reused: z.boolean(),
});

export const CloseAccountingPeriodInputSchema = z.object({
  businessId: trimmedStringSchema,
  note: nullableTrimmedStringSchema.optional().default(null),
  periodKey: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'periodKey debe tener formato YYYY-MM.'),
});

export const CloseAccountingPeriodResultSchema = z.object({
  ok: z.literal(true),
  periodKey: trimmedStringSchema,
  reused: z.boolean(),
});

export const GetAccountingReportsInputSchema = z.object({
  businessId: trimmedStringSchema,
  includeFinancialReports: z.boolean().optional().default(true),
  includeGeneralLedger: z.boolean().optional().default(true),
  ledgerAccountId: nullableTrimmedStringSchema.optional().default(null),
  ledgerPage: z.coerce.number().int().positive().optional().default(1),
  ledgerPageSize: z
    .coerce.number()
    .int()
    .positive()
    .optional()
    .default(50)
    .transform((value) => Math.min(value, 100)),
  ledgerPeriodKey: z
    .union([
      z
        .string()
        .regex(/^\d{4}-\d{2}$/, 'Los periodos deben tener formato YYYY-MM.'),
      z.null(),
    ])
    .optional()
    .default(null),
  ledgerQuery: nullableTrimmedStringSchema.optional().default(null),
  reportPeriodKey: z
    .union([
      z
        .string()
        .regex(/^\d{4}-\d{2}$/, 'Los periodos deben tener formato YYYY-MM.'),
      z.null(),
    ])
    .optional()
    .default(null),
});

export const GetAccountingReportsResultSchema = z.object({
  ok: z.literal(true),
  generatedAt: trimmedStringSchema,
  periods: z.array(trimmedStringSchema),
  generalLedger: z.object({
    selectedAccountId: z.union([trimmedStringSchema, z.null()]),
    selectedPeriodKey: z.union([trimmedStringSchema, z.null()]),
    accountOptions: z.array(
      z.object({
        id: trimmedStringSchema,
        code: trimmedStringSchema,
        name: trimmedStringSchema,
        normalSide: trimmedStringSchema,
        type: trimmedStringSchema,
        movementCount: z.coerce.number().int().nonnegative(),
      }),
    ),
    snapshot: z.unknown().nullable(),
  }),
  financialReports: z.object({
    selectedPeriodKey: z.union([trimmedStringSchema, z.null()]),
    snapshot: z.unknown().nullable(),
  }),
});

export const safeAccountingMetadata = (value) => toPlainObject(value);
