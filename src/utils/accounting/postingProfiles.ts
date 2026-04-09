import type {
  AccountingEventType,
  AccountingModuleKey,
  AccountingPostingAmountSource,
  AccountingPostingCondition,
  AccountingPostingLineTemplate,
  AccountingPostingPaymentTerm,
  AccountingPostingProfile,
  AccountingPostingProfileStatus,
  AccountingPostingSettlementKind,
  AccountingPostingTaxTreatment,
  ChartOfAccount,
  ChartOfAccountNormalSide,
} from '@/types/accounting';
import {
  getAccountingEventDefinition,
  normalizeAccountingEventType,
  normalizeAccountingModuleKey,
} from '@/utils/accounting/accountingEvents';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

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
  amountSource: AccountingPostingAmountSource;
  description?: string | null;
  omitIfZero?: boolean;
}

export interface AccountingPostingProfileDraft {
  name: string;
  description?: string | null;
  eventType: AccountingEventType;
  moduleKey: AccountingModuleKey;
  priority: number;
  status?: AccountingPostingProfileStatus;
  conditions?: AccountingPostingCondition | null;
  linesTemplate: AccountingPostingLineDraft[];
  metadata?: Record<string, unknown>;
}

interface DefaultPostingProfileSeedLine {
  side: ChartOfAccountNormalSide;
  accountSystemKey: string;
  amountSource: AccountingPostingAmountSource;
  description?: string;
  omitIfZero?: boolean;
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
  purchase_total: 'Total de compra',
  expense_total: 'Total de gasto',
  tax_total: 'Total de impuesto',
  cash_over_short_gain: 'Sobrante de caja',
  cash_over_short_loss: 'Faltante de caja',
  accounts_receivable_payment_amount: 'Monto del cobro',
  accounts_payable_payment_amount: 'Monto del pago',
  transfer_amount: 'Monto transferido',
  fx_gain: 'Ganancia cambiaria',
  fx_loss: 'Pérdida cambiaria',
};

export const normalizeAccountingPostingProfileStatus = (
  value: unknown,
): AccountingPostingProfileStatus => (value === 'inactive' ? 'inactive' : 'active');

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
    case 'purchase_total':
    case 'expense_total':
    case 'tax_total':
    case 'cash_over_short_gain':
    case 'cash_over_short_loss':
    case 'accounts_receivable_payment_amount':
    case 'accounts_payable_payment_amount':
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
  };
};

export const normalizeAccountingPostingLineDraft = (
  value: unknown,
  accountsById: Map<string, ChartOfAccount> = new Map(),
): AccountingPostingLineTemplate => {
  const record = asRecord(value);
  const accountId = toCleanString(record.accountId);
  const account = accountId ? accountsById.get(accountId) ?? null : null;

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
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
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
    name: draft.name || 'Perfil contable',
    description: draft.description ?? null,
    eventType: draft.eventType,
    moduleKey: draft.moduleKey,
    status: normalizeAccountingPostingProfileStatus(record.status),
    priority: draft.priority,
    conditions: draft.conditions,
    linesTemplate: draft.linesTemplate,
    createdAt: (record.createdAt as AccountingPostingProfile['createdAt']) ?? null,
    updatedAt: (record.updatedAt as AccountingPostingProfile['updatedAt']) ?? null,
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
        amountSource: 'accounts_receivable_payment_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'accounts_receivable_payment_amount',
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
        amountSource: 'accounts_receivable_payment_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_receivable',
        amountSource: 'accounts_receivable_payment_amount',
      },
    ],
  },
  {
    seedKey: 'purchase_committed',
    name: 'Compra registrada',
    description: 'Compra confirmada que incrementa inventario o costo.',
    eventType: 'purchase.committed',
    moduleKey: 'purchases',
    priority: 40,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'inventory',
        amountSource: 'purchase_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'accounts_payable',
        amountSource: 'purchase_total',
      },
    ],
  },
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
        amountSource: 'accounts_payable_payment_amount',
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
        amountSource: 'expense_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'expense_total',
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
        amountSource: 'expense_total',
      },
      {
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'expense_total',
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
    seedKey: 'internal_transfer_cash_to_bank',
    name: 'Transferencia caja a banco',
    description: 'Movimiento interno desde caja hacia banco.',
    eventType: 'internal_transfer.posted',
    moduleKey: 'banking',
    priority: 70,
    linesTemplate: [
      {
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'transfer_amount',
      },
      {
        side: 'credit',
        accountSystemKey: 'cash',
        amountSource: 'transfer_amount',
      },
    ],
  },
];

export const buildDefaultAccountingPostingProfileTemplates = (
  accounts: ChartOfAccount[],
): AccountingPostingProfileDraft[] => {
  const accountsBySystemKey = new Map(
    accounts
      .filter((account) => account.systemKey)
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
