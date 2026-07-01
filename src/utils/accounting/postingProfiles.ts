import type {
  AccountingEventType,
  AccountingModuleKey,
  AccountingPostingAmountSource,
  AccountingPostingCondition,
  AccountingPostingDocumentNature,
  AccountingPostingLineTemplate,
  AccountingPostingPaymentTerm,
  AccountingPostingProfile,
  AccountingPostingProfileStatus,
  AccountingPostingSettlementKind,
  AccountingPostingSettlementTiming,
  AccountingPostingTaxTreatment,
  AccountingPostingTransferDirection,
  ChartOfAccount,
  ChartOfAccountNormalSide,
} from '@/types/accounting';
import {
  getAccountingEventDefinition,
  normalizeAccountingEventType,
  normalizeAccountingModuleKey,
} from '@/utils/accounting/accountingEvents';
import {
  buildChartOfAccountChildrenByParentId,
  isChartOfAccountPostingAllowedForEntries,
} from '@/utils/accounting/chartOfAccounts';
import { toCleanString } from '@/utils/text';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toFinitePriority = (value: unknown, fallback = 100): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createPostingProfileLineId = (): string =>
  `line_${Math.random().toString(36).slice(2, 10)}`;

export interface AccountingPostingLineDraft {
  id?: string;
  side: ChartOfAccountNormalSide;
  accountId?: string | null;
  accountSystemKey?: string | null;
  amountSource: AccountingPostingAmountSource;
  description?: string | null;
  omitIfZero?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AccountingPostingProfileDraft {
  name: string;
  description?: string | null;
  eventType: AccountingEventType;
  moduleKey: AccountingModuleKey;
  priority: number;
  status?: AccountingPostingProfileStatus;
  conditions?: AccountingPostingCondition | null;
  linesTemplate: AccountingPostingLineTemplate[];
  metadata?: Record<string, unknown>;
}

interface DefaultPostingProfileSeedLine {
  side: ChartOfAccountNormalSide;
  accountSystemKey: string;
  amountSource: AccountingPostingAmountSource;
  description?: string;
  omitIfZero?: boolean;
  metadata?: Record<string, unknown>;
}

interface DefaultPostingProfileSeed {
  seedKey: string;
  name: string;
  description: string;
  eventType: AccountingEventType;
  moduleKey: AccountingModuleKey;
  priority: number;
  conditions?: AccountingPostingCondition;
  linesTemplate: DefaultPostingProfileSeedLine[];
}

const buildImmediatePurchaseProfileSeed = ({
  creditAccountSystemKey,
  debitAccountSystemKey,
  description,
  documentNature,
  name,
  priority,
  seedKey,
  settlementKind,
}: {
  creditAccountSystemKey: string;
  debitAccountSystemKey: string;
  description: string;
  documentNature: AccountingPostingDocumentNature;
  name: string;
  priority: number;
  seedKey: string;
  settlementKind: AccountingPostingSettlementKind;
}): DefaultPostingProfileSeed => ({
  seedKey,
  name,
  description,
  eventType: 'purchase.committed',
  moduleKey: 'purchases',
  priority,
  conditions: {
    documentNature,
    settlementKind,
    settlementTiming: 'immediate',
  },
  linesTemplate: [
    {
      side: 'debit',
      accountSystemKey: debitAccountSystemKey,
      amountSource: 'purchase_subtotal',
    },
    {
      side: 'debit',
      accountSystemKey: 'tax_receivable',
      amountSource: 'purchase_tax',
    },
    {
      side: 'credit',
      accountSystemKey: creditAccountSystemKey,
      amountSource: 'purchase_net_payable',
    },
    {
      side: 'credit',
      accountSystemKey: 'withholding_itbis_payable',
      amountSource: 'purchase_withholding_itbis',
    },
    {
      side: 'credit',
      accountSystemKey: 'withholding_isr_payable',
      amountSource: 'purchase_withholding_isr',
    },
  ],
});

const IMMEDIATE_PURCHASE_PROFILE_SEEDS: DefaultPostingProfileSeed[] = [
  buildImmediatePurchaseProfileSeed({
    seedKey: 'purchase_immediate_inventory_cash',
    name: 'Compra inventariable al contado por caja',
    description: 'Compra confirmada de inventario pagada en caja.',
    documentNature: 'inventory',
    settlementKind: 'cash',
    debitAccountSystemKey: 'inventory',
    creditAccountSystemKey: 'cash',
    priority: 41,
  }),
  buildImmediatePurchaseProfileSeed({
    seedKey: 'purchase_immediate_inventory_bank',
    name: 'Compra inventariable al contado por banco',
    description: 'Compra confirmada de inventario pagada por banco.',
    documentNature: 'inventory',
    settlementKind: 'bank',
    debitAccountSystemKey: 'inventory',
    creditAccountSystemKey: 'bank',
    priority: 42,
  }),
  buildImmediatePurchaseProfileSeed({
    seedKey: 'purchase_immediate_expense_cash',
    name: 'Compra de gasto al contado por caja',
    description: 'Compra confirmada como gasto pagada en caja.',
    documentNature: 'expense',
    settlementKind: 'cash',
    debitAccountSystemKey: 'operating_expenses',
    creditAccountSystemKey: 'cash',
    priority: 46,
  }),
  buildImmediatePurchaseProfileSeed({
    seedKey: 'purchase_immediate_expense_bank',
    name: 'Compra de gasto al contado por banco',
    description: 'Compra confirmada como gasto pagada por banco.',
    documentNature: 'expense',
    settlementKind: 'bank',
    debitAccountSystemKey: 'operating_expenses',
    creditAccountSystemKey: 'bank',
    priority: 47,
  }),
  buildImmediatePurchaseProfileSeed({
    seedKey: 'purchase_immediate_asset_cash',
    name: 'Compra de activo al contado por caja',
    description: 'Compra confirmada de activo fijo pagada en caja.',
    documentNature: 'asset',
    settlementKind: 'cash',
    debitAccountSystemKey: 'fixed_assets',
    creditAccountSystemKey: 'cash',
    priority: 51,
  }),
  buildImmediatePurchaseProfileSeed({
    seedKey: 'purchase_immediate_asset_bank',
    name: 'Compra de activo al contado por banco',
    description: 'Compra confirmada de activo fijo pagada por banco.',
    documentNature: 'asset',
    settlementKind: 'bank',
    debitAccountSystemKey: 'fixed_assets',
    creditAccountSystemKey: 'bank',
    priority: 52,
  }),
  buildImmediatePurchaseProfileSeed({
    seedKey: 'purchase_immediate_service_cash',
    name: 'Compra de servicio al contado por caja',
    description: 'Compra confirmada de servicios pagada en caja.',
    documentNature: 'service',
    settlementKind: 'cash',
    debitAccountSystemKey: 'operating_expenses',
    creditAccountSystemKey: 'cash',
    priority: 56,
  }),
  buildImmediatePurchaseProfileSeed({
    seedKey: 'purchase_immediate_service_bank',
    name: 'Compra de servicio al contado por banco',
    description: 'Compra confirmada de servicios pagada por banco.',
    documentNature: 'service',
    settlementKind: 'bank',
    debitAccountSystemKey: 'operating_expenses',
    creditAccountSystemKey: 'bank',
    priority: 57,
  }),
];

export const ACCOUNTING_POSTING_PROFILE_STATUS_LABELS: Record<
  AccountingPostingProfileStatus,
  string
> = {
  active: 'Activo',
  inactive: 'Inactivo',
};

export const ACCOUNTING_POSTING_PAYMENT_TERM_LABELS: Record<
  AccountingPostingPaymentTerm,
  string
> = {
  any: 'Cualquiera',
  cash: 'Contado',
  credit: 'Crédito',
};

export const ACCOUNTING_POSTING_SETTLEMENT_KIND_LABELS: Record<
  AccountingPostingSettlementKind,
  string
> = {
  any: 'Cualquiera',
  cash: 'Caja',
  bank: 'Banco',
  mixed: 'Mixto',
  other: 'Otro medio',
};

export const ACCOUNTING_POSTING_TAX_TREATMENT_LABELS: Record<
  AccountingPostingTaxTreatment,
  string
> = {
  any: 'Cualquiera',
  taxed: 'Con impuesto',
  untaxed: 'Sin impuesto',
};

export const ACCOUNTING_POSTING_DOCUMENT_NATURE_LABELS: Record<
  AccountingPostingDocumentNature,
  string
> = {
  any: 'Cualquiera',
  inventory: 'Inventario',
  expense: 'Gasto',
  asset: 'Activo fijo',
  service: 'Servicio',
};

export const ACCOUNTING_POSTING_SETTLEMENT_TIMING_LABELS: Record<
  AccountingPostingSettlementTiming,
  string
> = {
  any: 'Cualquiera',
  immediate: 'Pago inmediato',
  deferred: 'Pago diferido',
};

export const ACCOUNTING_POSTING_TRANSFER_DIRECTION_LABELS: Record<
  AccountingPostingTransferDirection,
  string
> = {
  any: 'Cualquiera',
  cash_to_bank: 'Caja a banco',
  bank_to_cash: 'Banco a caja',
  bank_to_bank: 'Banco a banco',
  cash_to_cash: 'Caja a caja',
};

export const ACCOUNTING_POSTING_AMOUNT_SOURCE_LABELS: Record<
  AccountingPostingAmountSource,
  string
> = {
  document_total: 'Total del documento',
  net_sales: 'Ventas netas',
  sale_settled_amount: 'Monto cobrado en la venta',
  sale_receivable_balance: 'Saldo a cuentas por cobrar',
  sale_cash_received: 'Monto cobrado en caja',
  sale_bank_received: 'Monto cobrado por banco',
  sale_other_received: 'Monto cobrado por otro medio',
  credit_note_net_total: 'Nota de crédito sin impuesto',
  purchase_subtotal: 'Subtotal de compra',
  purchase_tax: 'ITBIS de compra',
  purchase_total: 'Total de compra',
  purchase_net_payable: 'Neto a pagar de compra',
  purchase_withholding_itbis: 'Retención ITBIS de compra',
  purchase_withholding_isr: 'Retención ISR de compra',
  expense_subtotal: 'Subtotal de gasto',
  expense_tax: 'ITBIS de gasto',
  expense_total: 'Total de gasto',
  expense_net_payable: 'Neto a pagar de gasto',
  expense_withholding_itbis: 'Retención ITBIS de gasto',
  expense_withholding_isr: 'Retención ISR de gasto',
  tax_total: 'Total de impuesto',
  cash_over_short_gain: 'Sobrante de caja',
  cash_over_short_loss: 'Faltante de caja',
  bank_statement_adjustment_gain: 'Ajuste bancario a favor',
  bank_statement_adjustment_loss: 'Ajuste bancario en contra',
  accounts_receivable_payment_amount: 'Monto del cobro',
  accounts_receivable_applied_amount: 'Monto saldado en CxC',
  accounts_receivable_collected_amount: 'Monto cobrado en caja/banco',
  accounts_receivable_withholding_amount: 'Retencion sufrida por tercero',
  accounts_payable_payment_amount: 'Monto del pago',
  accounts_payable_cash_paid: 'Monto pagado por caja',
  accounts_payable_bank_paid: 'Monto pagado por banco',
  accounts_payable_credit_note_applied: 'Saldo a favor de suplidor aplicado',
  accounts_payable_withholding_itbis: 'Retención ITBIS aplicada en CxP',
  accounts_payable_withholding_isr: 'Retención ISR aplicada en CxP',
  payroll_accrual_amount: 'Nomina devengada',
  payroll_net_payable_amount: 'Neto de nomina por pagar',
  payroll_tax_deductions_amount: 'Retenciones fiscales de nomina',
  payroll_other_deductions_amount: 'Retenciones laborales por pagar',
  transfer_amount: 'Monto transferido',
  fx_gain: 'Ganancia cambiaria',
  fx_loss: 'Pérdida cambiaria',
};

export const normalizeAccountingPostingProfileStatus = (
  value: unknown,
): AccountingPostingProfileStatus =>
  value === 'inactive' ? 'inactive' : 'active';

export const normalizeAccountingPostingPaymentTerm = (
  value: unknown,
): AccountingPostingPaymentTerm => {
  switch (value) {
    case 'cash':
    case 'credit':
      return value;
    default:
      return 'any';
  }
};

export const normalizeAccountingPostingSettlementKind = (
  value: unknown,
): AccountingPostingSettlementKind => {
  switch (value) {
    case 'cash':
    case 'bank':
    case 'mixed':
    case 'other':
      return value;
    default:
      return 'any';
  }
};

export const normalizeAccountingPostingTaxTreatment = (
  value: unknown,
): AccountingPostingTaxTreatment => {
  switch (value) {
    case 'taxed':
    case 'untaxed':
      return value;
    default:
      return 'any';
  }
};

export const normalizeAccountingPostingDocumentNature = (
  value: unknown,
): AccountingPostingDocumentNature => {
  switch (value) {
    case 'inventory':
    case 'expense':
    case 'asset':
    case 'service':
      return value;
    default:
      return 'any';
  }
};

export const normalizeAccountingPostingSettlementTiming = (
  value: unknown,
): AccountingPostingSettlementTiming => {
  switch (value) {
    case 'immediate':
    case 'deferred':
      return value;
    default:
      return 'any';
  }
};

export const normalizeAccountingPostingTransferDirection = (
  value: unknown,
): AccountingPostingTransferDirection => {
  switch (value) {
    case 'cash_to_bank':
    case 'bank_to_cash':
    case 'bank_to_bank':
    case 'cash_to_cash':
      return value;
    default:
      return 'any';
  }
};

export const normalizeAccountingPostingAmountSource = (
  value: unknown,
  fallback: AccountingPostingAmountSource = 'document_total',
): AccountingPostingAmountSource => {
  switch (value) {
    case 'net_sales':
    case 'sale_settled_amount':
    case 'sale_receivable_balance':
    case 'sale_cash_received':
    case 'sale_bank_received':
    case 'sale_other_received':
    case 'credit_note_net_total':
    case 'purchase_subtotal':
    case 'purchase_tax':
    case 'purchase_total':
    case 'purchase_net_payable':
    case 'purchase_withholding_itbis':
    case 'purchase_withholding_isr':
    case 'expense_subtotal':
    case 'expense_tax':
    case 'expense_total':
    case 'expense_net_payable':
    case 'expense_withholding_itbis':
    case 'expense_withholding_isr':
    case 'tax_total':
    case 'cash_over_short_gain':
    case 'cash_over_short_loss':
    case 'bank_statement_adjustment_gain':
    case 'bank_statement_adjustment_loss':
    case 'accounts_receivable_payment_amount':
    case 'accounts_receivable_applied_amount':
    case 'accounts_receivable_collected_amount':
    case 'accounts_receivable_withholding_amount':
    case 'accounts_payable_payment_amount':
    case 'accounts_payable_cash_paid':
    case 'accounts_payable_bank_paid':
    case 'accounts_payable_credit_note_applied':
    case 'accounts_payable_withholding_itbis':
    case 'accounts_payable_withholding_isr':
    case 'payroll_accrual_amount':
    case 'payroll_net_payable_amount':
    case 'payroll_tax_deductions_amount':
    case 'payroll_other_deductions_amount':
    case 'transfer_amount':
    case 'fx_gain':
    case 'fx_loss':
    case 'document_total':
      return value;
    default:
      return fallback;
  }
};

export const normalizeAccountingPostingCondition = (
  value: unknown,
): AccountingPostingCondition => {
  const record = asRecord(value);
  return {
    paymentTerm: normalizeAccountingPostingPaymentTerm(record.paymentTerm),
    settlementKind: normalizeAccountingPostingSettlementKind(
      record.settlementKind,
    ),
    taxTreatment: normalizeAccountingPostingTaxTreatment(record.taxTreatment),
    documentNature: normalizeAccountingPostingDocumentNature(
      record.documentNature,
    ),
    settlementTiming: normalizeAccountingPostingSettlementTiming(
      record.settlementTiming,
    ),
    transferDirection: normalizeAccountingPostingTransferDirection(
      record.transferDirection,
    ),
  };
};

export const normalizeAccountingPostingLineDraft = (
  value: unknown,
  accountsById: Map<string, ChartOfAccount> = new Map(),
): AccountingPostingLineTemplate => {
  const record = asRecord(value);
  const accountId = toCleanString(record.accountId);
  const account = accountId ? (accountsById.get(accountId) ?? null) : null;

  return {
    id: toCleanString(record.id) ?? createPostingProfileLineId(),
    side: record.side === 'credit' ? 'credit' : 'debit',
    accountId,
    accountCode: account?.code ?? toCleanString(record.accountCode),
    accountName: account?.name ?? toCleanString(record.accountName),
    accountSystemKey:
      account?.systemKey ?? toCleanString(record.accountSystemKey),
    amountSource: normalizeAccountingPostingAmountSource(record.amountSource),
    description: toCleanString(record.description),
    omitIfZero: record.omitIfZero !== false,
    metadata: asRecord(record.metadata),
  };
};

export const normalizeAccountingPostingProfileDraft = (
  value: Partial<AccountingPostingProfileDraft> | null | undefined,
  accounts: ChartOfAccount[] = [],
): AccountingPostingProfileDraft => {
  const record = asRecord(value);
  const accountsById = new Map(
    accounts.map((account) => [account.id, account]),
  );
  const eventType = normalizeAccountingEventType(record.eventType);
  const eventDefinition = getAccountingEventDefinition(eventType);
  const lines = Array.isArray(record.linesTemplate)
    ? record.linesTemplate.map((line) =>
        normalizeAccountingPostingLineDraft(line, accountsById),
      )
    : [];

  return {
    name: toCleanString(record.name) ?? '',
    description: toCleanString(record.description),
    eventType,
    moduleKey: normalizeAccountingModuleKey(
      eventDefinition.moduleKey,
      eventDefinition.moduleKey,
    ),
    priority: toFinitePriority(record.priority, 100),
    status: normalizeAccountingPostingProfileStatus(record.status),
    conditions: normalizeAccountingPostingCondition(record.conditions),
    linesTemplate: lines.length
      ? lines
      : [
          {
            id: createPostingProfileLineId(),
            side: 'debit',
            amountSource: 'document_total',
            omitIfZero: true,
          },
          {
            id: createPostingProfileLineId(),
            side: 'credit',
            amountSource: 'document_total',
            omitIfZero: true,
          },
        ],
    metadata: asRecord(record.metadata),
  };
};

export const normalizeAccountingPostingProfileRecord = (
  id: string,
  businessId: string,
  value: unknown,
  accounts: ChartOfAccount[] = [],
): AccountingPostingProfile => {
  const record = asRecord(value);
  const draft = normalizeAccountingPostingProfileDraft(record, accounts);

  return {
    id,
    businessId,
    name: draft.name || 'Regla de contabilización',
    description: draft.description ?? null,
    eventType: draft.eventType,
    moduleKey: draft.moduleKey,
    status: normalizeAccountingPostingProfileStatus(record.status),
    priority: draft.priority,
    conditions: draft.conditions,
    linesTemplate: draft.linesTemplate as AccountingPostingLineTemplate[],
    createdAt:
      (record.createdAt as AccountingPostingProfile['createdAt']) ?? null,
    updatedAt:
      (record.updatedAt as AccountingPostingProfile['updatedAt']) ?? null,
    createdBy: toCleanString(record.createdBy),
    updatedBy: toCleanString(record.updatedBy),
    lastChangeId: toCleanString(record.lastChangeId),
    lastChangedAt:
      (record.lastChangedAt as AccountingPostingProfile['lastChangedAt']) ??
      null,
    metadata: asRecord(record.metadata),
  };
};

export const buildPostingProfileLabel = (
  profile: Pick<AccountingPostingProfile, 'name' | 'priority'>,
): string => `${profile.priority} · ${profile.name}`;

const DEFAULT_ACCOUNTING_POSTING_PROFILE_SEEDS: DefaultPostingProfileSeed[] = [
  {
    seedKey: 'invoice_cash_sale',
    name: 'Venta al contado',
    description: 'Factura confirmada y cobrada en caja.',
    eventType: 'invoice.committed',
    moduleKey: 'sales',
    priority: 10,
    conditions: {
      paymentTerm: 'cash',
      settlementKind: 'cash',
      taxTreatment: 'any',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cash',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'sales',
        amountSource: 'net_sales',
      },
      {
        side: 'credit',
        accountSystemKey: 'tax_payable',
        amountSource: 'tax_total',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'invoice_cash_sale_bank',
    name: 'Venta al contado por banco',
    description: 'Factura confirmada y cobrada directamente por banco.',
    eventType: 'invoice.committed',
    moduleKey: 'sales',
    priority: 15,
    conditions: {
      paymentTerm: 'cash',
      settlementKind: 'bank',
      taxTreatment: 'any',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'sales',
        amountSource: 'net_sales',
      },
      {
        side: 'credit',
        accountSystemKey: 'tax_payable',
        amountSource: 'tax_total',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'invoice_credit_sale',
    name: 'Venta a credito',
    description: 'Factura confirmada con saldo en cuentas por cobrar.',
    eventType: 'invoice.committed',
    moduleKey: 'sales',
    priority: 20,
    conditions: {
      paymentTerm: 'credit',
      settlementKind: 'any',
      taxTreatment: 'any',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'sales',
        amountSource: 'net_sales',
      },
      {
        side: 'credit',
        accountSystemKey: 'tax_payable',
        amountSource: 'tax_total',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'invoice_credit_sale_with_down_payment',
    name: 'Venta a credito con abono inicial',
    description:
      'Factura confirmada con cobro parcial y saldo pendiente en cuentas por cobrar.',
    eventType: 'invoice.committed',
    moduleKey: 'sales',
    priority: 15,
    conditions: {
      paymentTerm: 'credit',
      taxTreatment: 'any',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cash',
        amountSource: 'sale_cash_received',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'sale_bank_received',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'sale_receivable_balance',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'sales',
        amountSource: 'net_sales',
      },
      {
        side: 'credit',
        accountSystemKey: 'tax_payable',
        amountSource: 'tax_total',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'inventory_cogs_recorded',
    name: 'Costo de venta por salida de inventario',
    description:
      'Salida de inventario valorizada contra costo de venta al confirmar una factura.',
    eventType: 'inventory.cogs.recorded',
    moduleKey: 'sales',
    priority: 10,
    conditions: {
      documentNature: 'inventory',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cost_of_sales',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'inventory',
        amountSource: 'document_total',
      },
    ],
  },
  {
    seedKey: 'inventory_cogs_voided',
    name: 'Reversa de costo de venta por anulación',
    description:
      'Restituye inventario y revierte costo de venta al anular una factura.',
    eventType: 'inventory.cogs.voided',
    moduleKey: 'sales',
    priority: 51,
    conditions: {
      documentNature: 'inventory',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'inventory',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'cost_of_sales',
        amountSource: 'document_total',
      },
    ],
  },
  {
    seedKey: 'ar_payment_cash',
    name: 'Cobro en caja',
    description: 'Cobro aplicado a cuentas por cobrar usando caja.',
    eventType: 'accounts_receivable.payment.recorded',
    moduleKey: 'accounts_receivable',
    priority: 30,
    conditions: {
      settlementKind: 'cash',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cash',
        amountSource: 'accounts_receivable_collected_amount',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'accounts_receivable_withholding_amount',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'accounts_receivable_applied_amount',
      },
    ],
  },
  {
    seedKey: 'ar_payment_bank',
    name: 'Cobro por banco',
    description: 'Cobro aplicado a cuentas por cobrar usando banco.',
    eventType: 'accounts_receivable.payment.recorded',
    moduleKey: 'accounts_receivable',
    priority: 35,
    conditions: {
      settlementKind: 'bank',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'accounts_receivable_collected_amount',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'accounts_receivable_withholding_amount',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'accounts_receivable_applied_amount',
      },
    ],
  },
  {
    seedKey: 'ar_payment_void_cash',
    name: 'Anulación de cobro en caja',
    description: 'Reversa un cobro aplicado a cuentas por cobrar usando caja.',
    eventType: 'accounts_receivable.payment.voided',
    moduleKey: 'accounts_receivable',
    priority: 32,
    conditions: {
      settlementKind: 'cash',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'accounts_receivable_applied_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'accounts_receivable_collected_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'accounts_receivable_withholding_amount',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'ar_payment_void_bank',
    name: 'Anulación de cobro por banco',
    description: 'Reversa un cobro aplicado a cuentas por cobrar usando banco.',
    eventType: 'accounts_receivable.payment.voided',
    moduleKey: 'accounts_receivable',
    priority: 37,
    conditions: {
      settlementKind: 'bank',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'accounts_receivable_applied_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'accounts_receivable_collected_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'accounts_receivable_withholding_amount',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'customer_credit_note_issued',
    name: 'Nota de crédito emitida a cliente',
    description:
      'Reconoce una nota de crédito emitida contra ventas, impuestos y crédito a favor del cliente.',
    eventType: 'customer_credit_note.issued',
    moduleKey: 'accounts_receivable',
    priority: 38,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'sales',
        amountSource: 'credit_note_net_total',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_payable',
        amountSource: 'tax_total',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'customer_credits',
        amountSource: 'document_total',
      },
    ],
  },
  {
    seedKey: 'customer_credit_note_applied',
    name: 'Nota de crédito aplicada a CxC',
    description:
      'Aplica saldo a favor del cliente contra una cuenta por cobrar.',
    eventType: 'customer_credit_note.applied',
    moduleKey: 'accounts_receivable',
    priority: 39,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'customer_credits',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'document_total',
      },
    ],
  },
  {
    seedKey: 'supplier_credit_note_issued',
    name: 'Saldo a favor de suplidor emitido',
    description:
      'Reconoce un saldo a favor del suplidor originado por sobrepago.',
    eventType: 'supplier_credit_note.issued',
    moduleKey: 'accounts_payable',
    priority: 39,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'supplier_credits',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'document_total',
      },
    ],
  },
  {
    seedKey: 'purchase_committed_inventory',
    name: 'Compra inventariable a crédito',
    description: 'Compra confirmada de inventario con obligación al suplidor.',
    eventType: 'purchase.committed',
    moduleKey: 'purchases',
    priority: 40,
    conditions: {
      documentNature: 'inventory',
      settlementTiming: 'deferred',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'inventory',
        amountSource: 'purchase_subtotal',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'purchase_tax',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'purchase_net_payable',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'purchase_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'purchase_withholding_isr',
      },
    ],
  },
  {
    seedKey: 'purchase_committed_expense',
    name: 'Compra de gasto a crédito',
    description:
      'Compra confirmada que se reconoce como gasto contra cuentas por pagar.',
    eventType: 'purchase.committed',
    moduleKey: 'purchases',
    priority: 45,
    conditions: {
      documentNature: 'expense',
      settlementTiming: 'deferred',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'operating_expenses',
        amountSource: 'purchase_subtotal',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'purchase_tax',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'purchase_net_payable',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'purchase_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'purchase_withholding_isr',
      },
    ],
  },
  {
    seedKey: 'purchase_committed_asset',
    name: 'Compra de activo a crédito',
    description: 'Compra confirmada de activo fijo contra cuentas por pagar.',
    eventType: 'purchase.committed',
    moduleKey: 'purchases',
    priority: 50,
    conditions: {
      documentNature: 'asset',
      settlementTiming: 'deferred',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'fixed_assets',
        amountSource: 'purchase_subtotal',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'purchase_tax',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'purchase_net_payable',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'purchase_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'purchase_withholding_isr',
      },
    ],
  },
  {
    seedKey: 'purchase_committed_service',
    name: 'Compra de servicio a crédito',
    description: 'Compra confirmada de servicios contra cuentas por pagar.',
    eventType: 'purchase.committed',
    moduleKey: 'purchases',
    priority: 55,
    conditions: {
      documentNature: 'service',
      settlementTiming: 'deferred',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'operating_expenses',
        amountSource: 'purchase_subtotal',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'purchase_tax',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'purchase_net_payable',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'purchase_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'purchase_withholding_isr',
      },
    ],
  },
  ...IMMEDIATE_PURCHASE_PROFILE_SEEDS,
  {
    seedKey: 'ap_payment_bank',
    name: 'Pago a suplidor por banco',
    description: 'Pago de cuentas por pagar usando banco.',
    eventType: 'accounts_payable.payment.recorded',
    moduleKey: 'accounts_payable',
    priority: 50,
    conditions: {
      settlementKind: 'bank',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'accounts_payable_payment_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'accounts_payable_bank_paid',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'accounts_payable_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'accounts_payable_withholding_isr',
      },
    ],
  },
  {
    seedKey: 'ap_payment_mixed',
    name: 'Pago mixto a suplidor',
    description:
      'Pago de cuentas por pagar con combinacion de caja, banco y saldo a favor.',
    eventType: 'accounts_payable.payment.recorded',
    moduleKey: 'accounts_payable',
    priority: 48,
    conditions: {
      settlementKind: 'mixed',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'accounts_payable_payment_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'accounts_payable_cash_paid',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'accounts_payable_bank_paid',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'supplier_credits',
        amountSource: 'accounts_payable_credit_note_applied',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'accounts_payable_withholding_itbis',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'accounts_payable_withholding_isr',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'ap_payment_supplier_credit_note',
    name: 'Pago a suplidor con saldo a favor',
    description: 'Aplicacion de saldo a favor de suplidor contra CxP.',
    eventType: 'accounts_payable.payment.recorded',
    moduleKey: 'accounts_payable',
    priority: 49,
    conditions: {
      settlementKind: 'other',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'accounts_payable_payment_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'supplier_credits',
        amountSource: 'accounts_payable_credit_note_applied',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'accounts_payable_withholding_itbis',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'accounts_payable_withholding_isr',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'ap_payment_cash',
    name: 'Pago a suplidor por caja',
    description: 'Pago de cuentas por pagar usando caja.',
    eventType: 'accounts_payable.payment.recorded',
    moduleKey: 'accounts_payable',
    priority: 45,
    conditions: {
      settlementKind: 'cash',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'accounts_payable_payment_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'accounts_payable_cash_paid',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'accounts_payable_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'accounts_payable_withholding_isr',
      },
    ],
  },
  {
    seedKey: 'ap_payment_void_bank',
    name: 'Anulación de pago a suplidor por banco',
    description: 'Reversa un pago de cuentas por pagar usando banco.',
    eventType: 'accounts_payable.payment.voided',
    moduleKey: 'accounts_payable',
    priority: 52,
    conditions: {
      settlementKind: 'bank',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'accounts_payable_bank_paid',
      },
      {
        side: 'debit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'accounts_payable_withholding_itbis',
      },
      {
        side: 'debit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'accounts_payable_withholding_isr',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'accounts_payable_payment_amount',
      },
    ],
  },
  {
    seedKey: 'ap_payment_void_mixed',
    name: 'Anulacion de pago mixto a suplidor',
    description:
      'Reversa un pago de cuentas por pagar con caja, banco y saldo a favor.',
    eventType: 'accounts_payable.payment.voided',
    moduleKey: 'accounts_payable',
    priority: 53,
    conditions: {
      settlementKind: 'mixed',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cash',
        amountSource: 'accounts_payable_cash_paid',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'accounts_payable_bank_paid',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'supplier_credits',
        amountSource: 'accounts_payable_credit_note_applied',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'accounts_payable_withholding_itbis',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'accounts_payable_withholding_isr',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'accounts_payable_payment_amount',
      },
    ],
  },
  {
    seedKey: 'ap_payment_void_supplier_credit_note',
    name: 'Anulacion de pago con saldo a favor',
    description:
      'Restaura saldo a favor de suplidor y la cuenta por pagar al anular el pago.',
    eventType: 'accounts_payable.payment.voided',
    moduleKey: 'accounts_payable',
    priority: 54,
    conditions: {
      settlementKind: 'other',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'supplier_credits',
        amountSource: 'accounts_payable_credit_note_applied',
      },
      {
        side: 'debit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'accounts_payable_withholding_itbis',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'accounts_payable_withholding_isr',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'accounts_payable_payment_amount',
      },
    ],
  },
  {
    seedKey: 'ap_payment_void_cash',
    name: 'Anulación de pago a suplidor por caja',
    description: 'Reversa un pago de cuentas por pagar usando caja.',
    eventType: 'accounts_payable.payment.voided',
    moduleKey: 'accounts_payable',
    priority: 47,
    conditions: {
      settlementKind: 'cash',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cash',
        amountSource: 'accounts_payable_cash_paid',
      },
      {
        side: 'debit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'accounts_payable_withholding_itbis',
      },
      {
        side: 'debit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'accounts_payable_withholding_isr',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'accounts_payable_payment_amount',
      },
    ],
  },
  {
    seedKey: 'expense_cash',
    name: 'Gasto por caja',
    description: 'Gasto operativo pagado desde caja.',
    eventType: 'expense.recorded',
    moduleKey: 'expenses',
    priority: 60,
    conditions: {
      settlementKind: 'cash',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'operating_expenses',
        amountSource: 'expense_subtotal',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'expense_tax',
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'expense_net_payable',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'expense_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'expense_withholding_isr',
      },
    ],
  },
  {
    seedKey: 'expense_bank',
    name: 'Gasto por banco',
    description: 'Gasto operativo pagado desde banco.',
    eventType: 'expense.recorded',
    moduleKey: 'expenses',
    priority: 65,
    conditions: {
      settlementKind: 'bank',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'operating_expenses',
        amountSource: 'expense_subtotal',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'expense_tax',
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'expense_net_payable',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'expense_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'expense_withholding_isr',
      },
    ],
  },
  {
    seedKey: 'expense_payable',
    name: 'Gasto a pagar',
    description: 'Gasto reconocido sin salida inmediata de tesorería.',
    eventType: 'expense.recorded',
    moduleKey: 'expenses',
    priority: 70,
    conditions: {
      settlementTiming: 'deferred',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'operating_expenses',
        amountSource: 'expense_subtotal',
      },
      {
        side: 'debit',
        accountSystemKey: 'tax_receivable',
        amountSource: 'expense_tax',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'expense_net_payable',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_itbis_payable',
        amountSource: 'expense_withholding_itbis',
      },
      {
        side: 'credit',
        accountSystemKey: 'withholding_isr_payable',
        amountSource: 'expense_withholding_isr',
      },
    ],
  },
  {
    seedKey: 'hr_commission_accrued',
    name: 'Nomina RRHH devengada',
    description:
      'Reconoce salario y comisiones aprobadas separando neto y retenciones.',
    eventType: 'hr_commission.accrued',
    moduleKey: 'payroll',
    priority: 70,
    conditions: {
      documentNature: 'expense',
      settlementTiming: 'deferred',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'operating_expenses',
        amountSource: 'payroll_accrual_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'payroll_payable',
        amountSource: 'payroll_net_payable_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'tax_payable',
        amountSource: 'payroll_tax_deductions_amount',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'payroll_withholdings_payable',
        amountSource: 'payroll_other_deductions_amount',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'hr_payroll_payment_cash',
    name: 'Pago de nomina por caja',
    description: 'Cancela la obligacion de nomina o comisiones usando caja.',
    eventType: 'hr_payroll.payment.recorded',
    moduleKey: 'payroll',
    priority: 72,
    conditions: {
      settlementKind: 'cash',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'payroll_payable',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'document_total',
      },
    ],
  },
  {
    seedKey: 'hr_payroll_payment_bank',
    name: 'Pago de nomina por banco',
    description:
      'Cancela la obligacion de nomina o comisiones usando banco o transferencia.',
    eventType: 'hr_payroll.payment.recorded',
    moduleKey: 'payroll',
    priority: 74,
    conditions: {
      settlementKind: 'bank',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'payroll_payable',
        amountSource: 'document_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'document_total',
      },
    ],
  },
  {
    seedKey: 'cash_over_short',
    name: 'Diferencia de cuadre de caja',
    description:
      'Registra el sobrante o faltante detectado al cerrar el cuadre de caja.',
    eventType: 'cash_over_short.recorded',
    moduleKey: 'cash',
    priority: 70,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cash',
        amountSource: 'cash_over_short_gain',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'cash_over_short_expense',
        amountSource: 'cash_over_short_loss',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'cash_over_short_loss',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'cash_over_short_income',
        amountSource: 'cash_over_short_gain',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'bank_statement_adjustment',
    name: 'Ajuste por diferencia bancaria',
    description:
      'Registra diferencias aceptadas al conciliar líneas de extracto bancario.',
    eventType: 'bank_statement_adjustment.recorded',
    moduleKey: 'banking',
    priority: 72,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'bank_statement_adjustment_gain',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'bank_reconciliation_expense',
        amountSource: 'bank_statement_adjustment_loss',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'bank_statement_adjustment_loss',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'bank_reconciliation_income',
        amountSource: 'bank_statement_adjustment_gain',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'fx_settlement_recorded',
    name: 'Diferencia cambiaria liquidada',
    description:
      'Reconoce ganancia o perdida cambiaria al liquidar una cuenta por cobrar en moneda extranjera.',
    eventType: 'fx_settlement.recorded',
    moduleKey: 'fx',
    priority: 72,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'fx_gain',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'fx_loss',
        amountSource: 'fx_loss',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'fx_loss',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'fx_gain',
        amountSource: 'fx_gain',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'fx_settlement_voided',
    name: 'Anulacion de diferencia cambiaria',
    description:
      'Revierte la ganancia o perdida cambiaria asociada a un cobro anulado.',
    eventType: 'fx_settlement.voided',
    moduleKey: 'fx',
    priority: 72,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'fx_gain',
        amountSource: 'fx_gain',
        omitIfZero: true,
      },
      {
        side: 'debit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'fx_loss',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'fx_gain',
        omitIfZero: true,
      },
      {
        side: 'credit',
        accountSystemKey: 'fx_loss',
        amountSource: 'fx_loss',
        omitIfZero: true,
      },
    ],
  },
  {
    seedKey: 'internal_transfer_direction_cash_to_bank',
    name: 'Transferencia caja a banco',
    description: 'Movimiento interno desde una caja hacia una cuenta bancaria.',
    eventType: 'internal_transfer.posted',
    moduleKey: 'banking',
    priority: 60,
    conditions: {
      settlementKind: 'mixed',
      transferDirection: 'cash_to_bank',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'transfer_amount',
        metadata: { treasuryRole: 'destination' },
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'transfer_amount',
        metadata: { treasuryRole: 'source' },
      },
    ],
  },
  {
    seedKey: 'internal_transfer_direction_bank_to_cash',
    name: 'Transferencia banco a caja',
    description: 'Movimiento interno desde una cuenta bancaria hacia una caja.',
    eventType: 'internal_transfer.posted',
    moduleKey: 'banking',
    priority: 61,
    conditions: {
      settlementKind: 'mixed',
      transferDirection: 'bank_to_cash',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cash',
        amountSource: 'transfer_amount',
        metadata: { treasuryRole: 'destination' },
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'transfer_amount',
        metadata: { treasuryRole: 'source' },
      },
    ],
  },
  {
    seedKey: 'internal_transfer_direction_bank_to_bank',
    name: 'Transferencia banco a banco',
    description: 'Movimiento interno entre dos cuentas bancarias.',
    eventType: 'internal_transfer.posted',
    moduleKey: 'banking',
    priority: 62,
    conditions: {
      settlementKind: 'bank',
      transferDirection: 'bank_to_bank',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'transfer_amount',
        metadata: { treasuryRole: 'destination' },
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'transfer_amount',
        metadata: { treasuryRole: 'source' },
      },
    ],
  },
  {
    seedKey: 'internal_transfer_direction_cash_to_cash',
    name: 'Transferencia caja a caja',
    description: 'Movimiento interno entre dos cajas.',
    eventType: 'internal_transfer.posted',
    moduleKey: 'cash',
    priority: 63,
    conditions: {
      settlementKind: 'cash',
      transferDirection: 'cash_to_cash',
    },
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'cash',
        amountSource: 'transfer_amount',
        metadata: { treasuryRole: 'destination' },
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'transfer_amount',
        metadata: { treasuryRole: 'source' },
      },
    ],
  },
];

export const buildDefaultAccountingPostingProfileTemplates = (
  accounts: ChartOfAccount[],
): AccountingPostingProfileDraft[] => {
  const childCountByParentId = buildChartOfAccountChildrenByParentId(accounts);
  const accountsBySystemKey = new Map(
    accounts
      .filter(
        (account) =>
          account.systemKey &&
          isChartOfAccountPostingAllowedForEntries(
            account,
            childCountByParentId.get(account.id)?.length ?? 0,
          ),
      )
      .map((account) => [account.systemKey as string, account]),
  );

  return DEFAULT_ACCOUNTING_POSTING_PROFILE_SEEDS.flatMap((seed) => {
    const linesTemplate = seed.linesTemplate.map((line) => {
      const account = accountsBySystemKey.get(line.accountSystemKey) ?? null;
      if (!account) {
        return null;
      }

      return {
        id: createPostingProfileLineId(),
        side: line.side,
        accountId: account.id,
        amountSource: line.amountSource,
        description: line.description ?? null,
        omitIfZero: line.omitIfZero !== false,
        accountCode: account.code,
        accountName: account.name,
        accountSystemKey: account.systemKey ?? null,
        metadata: line.metadata ?? {},
      };
    });

    if (linesTemplate.some((line) => line === null)) {
      return [];
    }

    return [
      {
        name: seed.name,
        description: seed.description,
        eventType: seed.eventType,
        moduleKey: seed.moduleKey,
        priority: seed.priority,
        status: 'active',
        conditions: seed.conditions ?? null,
        linesTemplate: linesTemplate as AccountingPostingLineTemplate[],
        metadata: {
          seedKey: seed.seedKey,
        },
      },
    ];
  });
};
