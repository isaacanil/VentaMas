import type {
  AccountingEvent,
  AccountingEventType,
  AccountingModuleKey,
  AccountingPostingAmountSource,
  AccountingPostingCondition,
  AccountingPostingProfile,
  ChartOfAccount,
  ChartOfAccountNormalSide,
  ChartOfAccountType,
  JournalEntry,
  JournalEntryLine,
} from '@/types/accounting';
import {
  ACCOUNTING_EVENT_TYPE_LABELS,
  ACCOUNTING_MODULE_LABELS,
  getAccountingEventDefinition,
} from '@/utils/accounting/accountingEvents';
import {
  buildAccountingPeriodKey,
  buildJournalEntryTotals,
  toDateOrNull,
} from '@/utils/accounting/journalEntries';
import { isAccountingPeriodClosed } from '@/utils/accounting/periodClosures';

export type AccountingWorkspacePanelKey =
  | 'journal-book'
  | 'general-ledger'
  | 'manual-entries'
  | 'financial-reports'
  | 'fiscal-compliance'
  | 'period-close';

export interface AccountingPeriodClosure {
  id: string;
  periodKey: string;
  closedAt: unknown;
  closedBy: string | null;
  note: string | null;
}

export interface AccountingLedgerRecord {
  id: string;
  entryDate: Date | null;
  periodKey: string | null;
  sourceKind: 'automatic' | 'manual';
  sourceLabel: string;
  detailMode: 'posted' | 'projected';
  eventType: AccountingEventType;
  moduleKey: AccountingModuleKey;
  moduleLabel: string;
  title: string;
  description: string;
  reference: string;
  internalReference: string | null;
  entryReference: string;
  documentReference: string | null;
  journalTypeKey:
    | 'sale'
    | 'purchase'
    | 'payment'
    | 'collection'
    | 'expense'
    | 'payroll'
    | 'adjustment';
  journalTypeLabel: string;
  userLabel: string | null;
  amount: number;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'neutral';
  lines: JournalEntryLine[];
  journalEntry: JournalEntry | null;
  event: AccountingEvent | null;
  profile: AccountingPostingProfile | null;
  searchIndex: string;
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: ChartOfAccountType;
  debit: number;
  credit: number;
  balance: number;
}

export interface FinancialReportsSnapshot {
  trialBalance: TrialBalanceRow[];
  trialBalanceTotals: {
    debit: number;
    credit: number;
  };
  incomeRows: Array<{
    accountId: string;
    code: string;
    name: string;
    kind: 'income' | 'expense';
    amount: number;
  }>;
  incomeTotals: {
    income: number;
    expense: number;
    netIncome: number;
  };
  balanceSheet: {
    assets: TrialBalanceRow[];
    liabilities: TrialBalanceRow[];
    equity: TrialBalanceRow[];
    currentEarnings: number;
  };
}

export interface AccountingWorkspaceSummary {
  automaticRecords: number;
  manualRecords: number;
  projectedRecords: number;
  closedPeriods: number;
}

export interface GeneralLedgerAccountOption {
  id: string;
  code: string;
  name: string;
  normalSide: ChartOfAccountNormalSide;
  type: ChartOfAccountType;
  movementCount: number;
}

export interface GeneralLedgerMovement {
  id: string;
  entryDate: Date | null;
  periodKey: string | null;
  moduleLabel: string;
  sourceLabel: string;
  reference: string;
  internalReference: string | null;
  title: string;
  description: string;
  lineDescription: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
  sourceRecord: AccountingLedgerRecord;
}

export interface GeneralLedgerSnapshot {
  account: ChartOfAccount;
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
  entries: GeneralLedgerMovement[];
  pagination: {
    page: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    searchQuery: string | null;
  };
}

const amountFormatter = new Intl.NumberFormat('es-DO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium',
});

const pad2 = (value: number) => value.toString().padStart(2, '0');

const monthFormatter = new Intl.DateTimeFormat('es-DO', {
  month: 'long',
  year: 'numeric',
});

const SYSTEM_GENERATED_REFERENCE_PATTERN =
  /^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+__[\w-]+$/i;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolvePreferredAccountingDocumentReference = ({
  eventType,
  payload,
}: {
  eventType: AccountingEventType;
  payload: unknown;
}): string | null => {
  const snapshot = asRecord(payload);

  switch (eventType) {
    case 'invoice.committed':
      return (
        toCleanString(snapshot.ncfCode) ??
        toCleanString(snapshot.invoiceNumber) ??
        null
      );
    case 'accounts_receivable.payment.recorded':
    case 'accounts_receivable.payment.voided':
      return (
        toCleanString(snapshot.receiptNumber) ??
        toCleanString(snapshot.reference) ??
        null
      );
    case 'purchase.committed':
      return (
        toCleanString(snapshot.vendorReference) ??
        toCleanString(snapshot.invoiceNumber) ??
        toCleanString(snapshot.purchaseNumber) ??
        null
      );
    case 'accounts_payable.payment.recorded':
    case 'accounts_payable.payment.voided':
      return (
        toCleanString(snapshot.receiptNumber) ??
        toCleanString(snapshot.reference) ??
        toCleanString(snapshot.purchaseNumber) ??
        null
      );
    case 'expense.recorded':
      return (
        toCleanString(snapshot.invoiceNcf) ??
        toCleanString(snapshot.reference) ??
        toCleanString(snapshot.numberId) ??
        null
      );
    case 'internal_transfer.posted':
      return (
        toCleanString(snapshot.reference) ??
        toCleanString(snapshot.note) ??
        null
      );
    default:
      return null;
  }
};

const toFiniteAmount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildEntryAlias = (
  entryDate: Date | null,
  entryId: string | null,
): string => {
  const cleanedEntryId = toCleanString(entryId);
  const normalizedEntryId =
    cleanedEntryId
      ?.replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toUpperCase() || 'ENTRY';
  const year = entryDate?.getFullYear() ?? 0;
  const month = pad2((entryDate?.getMonth() ?? 0) + 1);
  return `AST-${year.toString().padStart(4, '0')}-${month}-${normalizedEntryId}`;
};

const assignStableEntryReferences = (
  records: AccountingLedgerRecord[],
): AccountingLedgerRecord[] => {
  return records.map((record) => {
    const entryReference = buildEntryAlias(
      record.entryDate,
      record.journalEntry?.id ?? record.entryReference ?? record.internalReference,
    );
    return {
      ...record,
      entryReference,
      searchIndex: `${record.searchIndex} ${entryReference}`.toLowerCase(),
    };
  });
};

const shouldCompactVisibleReference = (value: string | null): boolean =>
  Boolean(value && SYSTEM_GENERATED_REFERENCE_PATTERN.test(value));

const findFirstLineReference = (lines: JournalEntryLine[]): string | null =>
  lines.reduce<string | null>(
    (currentValue, line) => currentValue ?? toCleanString(line.reference),
    null,
  );

const resolveManualEntryReference = (
  entry: JournalEntry,
): Pick<AccountingLedgerRecord, 'reference' | 'internalReference'> => {
  const userReference =
    toCleanString(asRecord(entry.metadata).note) ??
    findFirstLineReference(entry.lines);
  const internalReference = toCleanString(entry.sourceId) ?? entry.id;

  return {
    reference: userReference ?? 'Sin referencia',
    internalReference:
      internalReference && internalReference !== userReference
        ? internalReference
        : null,
  };
};

const normalizePeriodLabel = (periodKey: string): string => {
  const [year, month] = periodKey.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return monthFormatter.format(date);
};

const resolveEventContext = (event: AccountingEvent) => {
  const payload = asRecord(event.payload);
  const treasury = asRecord(event.treasury);
  const taxAmount =
    toFiniteAmount(asRecord(event.monetary).functionalTaxAmount) ||
    toFiniteAmount(asRecord(event.monetary).taxAmount);
  const paymentTermCandidate =
    toCleanString(payload.paymentTerm) ??
    toCleanString(payload.saleCondition) ??
    toCleanString(payload.terms);
  const settlementKindCandidate =
    toCleanString(treasury.paymentChannel) ??
    toCleanString(payload.settlementKind) ??
    toCleanString(payload.paymentChannel);

  return {
    paymentTerm:
      paymentTermCandidate === 'cash' || paymentTermCandidate === 'credit'
        ? paymentTermCandidate
        : 'any',
    settlementKind:
      settlementKindCandidate === 'cash' || settlementKindCandidate === 'bank'
        ? settlementKindCandidate
        : 'any',
    taxTreatment: taxAmount > 0 ? 'taxed' : 'untaxed',
  } satisfies Required<AccountingPostingCondition>;
};

const matchesProfileConditions = (
  profile: AccountingPostingProfile,
  event: AccountingEvent,
): boolean => {
  const conditions = profile.conditions ?? {};
  const eventContext = resolveEventContext(event);

  if (
    conditions.paymentTerm &&
    conditions.paymentTerm !== 'any' &&
    conditions.paymentTerm !== eventContext.paymentTerm
  ) {
    return false;
  }

  if (
    conditions.settlementKind &&
    conditions.settlementKind !== 'any' &&
    conditions.settlementKind !== eventContext.settlementKind
  ) {
    return false;
  }

  if (
    conditions.taxTreatment &&
    conditions.taxTreatment !== 'any' &&
    conditions.taxTreatment !== eventContext.taxTreatment
  ) {
    return false;
  }

  return true;
};

const ACCOUNTING_JOURNAL_TYPE_LABELS = {
  adjustment: 'Ajuste',
  collection: 'Cobro',
  expense: 'Gasto',
  payment: 'Pago',
  payroll: 'Nomina',
  purchase: 'Compra',
  sale: 'Venta',
} as const;

const resolveJournalTypeKey = (
  eventType: AccountingEventType,
): keyof typeof ACCOUNTING_JOURNAL_TYPE_LABELS => {
  switch (eventType) {
    case 'invoice.committed':
      return 'sale';
    case 'purchase.committed':
      return 'purchase';
    case 'accounts_payable.payment.recorded':
    case 'accounts_payable.payment.voided':
      return 'payment';
    case 'accounts_receivable.payment.recorded':
    case 'accounts_receivable.payment.voided':
      return 'collection';
    case 'expense.recorded':
      return 'expense';
    default:
      return 'adjustment';
  }
};

const resolveRecordUserLabel = (...values: Array<unknown>): string | null => {
  for (const value of values) {
    const cleaned = toCleanString(value);
    if (cleaned) {
      return cleaned;
    }
  }

  return null;
};

const resolveEventAmountSource = (
  event: AccountingEvent,
  source: AccountingPostingAmountSource,
): number => {
  const monetary = asRecord(event.monetary);
  const total =
    toFiniteAmount(monetary.functionalAmount) ||
    toFiniteAmount(monetary.amount);
  const tax =
    toFiniteAmount(monetary.functionalTaxAmount) ||
    toFiniteAmount(monetary.taxAmount);
  const netSales = Math.max(total - tax, 0);

  switch (source) {
    case 'tax_total':
      return tax;
    case 'net_sales':
      return netSales;
    case 'purchase_total':
    case 'expense_total':
    case 'document_total':
    case 'accounts_receivable_payment_amount':
    case 'accounts_payable_payment_amount':
    case 'transfer_amount':
      return total;
    case 'fx_gain':
      return Math.max(total, 0);
    case 'fx_loss':
      return Math.abs(Math.min(total, 0));
    default:
      return total;
  }
};

const buildProjectedLines = ({
  accountsById,
  event,
  profile,
}: {
  accountsById: Map<string, ChartOfAccount>;
  event: AccountingEvent;
  profile: AccountingPostingProfile;
}): JournalEntryLine[] =>
  profile.linesTemplate.flatMap((line, index) => {
    const amount = resolveEventAmountSource(event, line.amountSource);
    if (line.omitIfZero && amount === 0) {
      return [];
    }

    const account = line.accountId
      ? (accountsById.get(line.accountId) ?? null)
      : null;

    return [
      {
        lineNumber: index + 1,
        accountId: line.accountId ?? account?.id ?? `preview-${index + 1}`,
        accountCode: line.accountCode ?? account?.code ?? null,
        accountName: line.accountName ?? account?.name ?? null,
        accountSystemKey: line.accountSystemKey ?? account?.systemKey ?? null,
        description: line.description ?? profile.name,
        debit: line.side === 'debit' ? amount : 0,
        credit: line.side === 'credit' ? amount : 0,
        amountSource: line.amountSource,
        reference: event.sourceDocumentId ?? event.sourceId ?? event.id,
        metadata: {
          projectedFromProfileId: profile.id,
        },
      },
    ];
  });

const resolvePostingProfile = (
  event: AccountingEvent,
  postingProfiles: AccountingPostingProfile[],
): AccountingPostingProfile | null =>
  postingProfiles
    .filter(
      (profile) =>
        profile.status === 'active' &&
        profile.eventType === event.eventType &&
        matchesProfileConditions(profile, event),
    )
    .sort((left, right) => left.priority - right.priority)[0] ?? null;

const getRecordStatus = ({
  event,
  hasLines,
  hasJournalEntry,
}: {
  event: AccountingEvent;
  hasLines: boolean;
  hasJournalEntry: boolean;
}): Pick<AccountingLedgerRecord, 'statusLabel' | 'statusTone'> => {
  if (hasJournalEntry) {
    return {
      statusLabel: 'Posteado',
      statusTone: 'success',
    };
  }

  if (hasLines) {
    return {
      statusLabel: 'Previo',
      statusTone: 'warning',
    };
  }

  if (event.projection?.status === 'pending_account_mapping') {
    return {
      statusLabel: 'Sin mapeo',
      statusTone: 'warning',
    };
  }

  return {
    statusLabel: 'Pendiente',
    statusTone: 'neutral',
  };
};

export const formatAccountingDate = (value: Date | null): string =>
  value ? dateFormatter.format(value) : 'Sin fecha';

export const formatAccountingDateTime = (value: Date | null): string =>
  value
    ? `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}\n${pad2(value.getHours())}:${pad2(value.getMinutes())}`
    : 'Sin fecha';

export const formatAccountingMoney = (value: number): string =>
  amountFormatter.format(value);

export const formatAccountingPeriod = (periodKey: string): string =>
  normalizePeriodLabel(periodKey);

export const createManualLineId = (): string =>
  `manual-line-${Math.random().toString(36).slice(2, 10)}`;

export const buildWorkspaceSummary = (
  records: AccountingLedgerRecord[],
  closedPeriods: AccountingPeriodClosure[],
): AccountingWorkspaceSummary => ({
  automaticRecords: records.filter(
    (record) => record.sourceKind === 'automatic',
  ).length,
  manualRecords: records.filter((record) => record.sourceKind === 'manual')
    .length,
  projectedRecords: records.filter(
    (record) => record.detailMode === 'projected',
  ).length,
  closedPeriods: closedPeriods.length,
});

export const buildLedgerRecords = ({
  accounts,
  events,
  journalEntries,
  postingProfiles,
  userNamesById = {},
}: {
  accounts: ChartOfAccount[];
  events: AccountingEvent[];
  journalEntries: JournalEntry[];
  postingProfiles: AccountingPostingProfile[];
  userNamesById?: Record<string, string>;
}): AccountingLedgerRecord[] => {
  const accountsById = new Map(
    accounts.map((account) => [account.id, account]),
  );
  const entriesById = new Map(
    journalEntries.map((entry) => [entry.id, entry] as const),
  );
  const usedEntryIds = new Set<string>();

  const automaticRecords = events.map((event) => {
    const journalEntryId =
      toCleanString(event.projection?.journalEntryId) ??
      toCleanString(event.metadata?.journalEntryId);
    const journalEntry = journalEntryId
      ? (entriesById.get(journalEntryId) ?? null)
      : null;
    if (journalEntry) {
      usedEntryIds.add(journalEntry.id);
    }

    const profile = resolvePostingProfile(event, postingProfiles);
    const lines =
      journalEntry?.lines ??
      (profile
        ? buildProjectedLines({
            accountsById,
            event,
            profile,
          })
        : []);
    const effectiveDate =
      toDateOrNull(journalEntry?.entryDate) ??
      toDateOrNull(event.occurredAt) ??
      toDateOrNull(event.recordedAt);
    const periodKey =
      journalEntry?.periodKey ??
      (effectiveDate ? buildAccountingPeriodKey(effectiveDate) : null);
    const eventDefinition = getAccountingEventDefinition(event.eventType);
    const moduleKey = profile?.moduleKey ?? eventDefinition.moduleKey;
    const journalTypeKey = resolveJournalTypeKey(event.eventType);
    const rawEntryReference = journalEntry?.id ?? journalEntryId ?? event.id;
    const resolvedDocumentReference =
      resolvePreferredAccountingDocumentReference({
        eventType: event.eventType,
        payload: event.payload,
      }) ??
      event.sourceDocumentId ??
      event.sourceId ??
      null;
    const userLabel = resolveRecordUserLabel(
      userNamesById[journalEntry?.createdBy ?? ''],
      userNamesById[event.createdBy ?? ''],
      journalEntry?.createdBy,
      event.createdBy,
    );
    const status = getRecordStatus({
      event,
      hasLines: lines.length > 0,
      hasJournalEntry: Boolean(journalEntry),
    });

    return {
      id: `event:${event.id}`,
      entryDate: effectiveDate,
      periodKey,
      sourceKind: 'automatic',
      sourceLabel: journalEntry ? 'Automatizado' : 'Perfil contable',
      detailMode: journalEntry ? 'posted' : 'projected',
      eventType: event.eventType,
      moduleKey,
      moduleLabel: ACCOUNTING_MODULE_LABELS[moduleKey],
      title: ACCOUNTING_EVENT_TYPE_LABELS[event.eventType],
      description:
        journalEntry?.description ??
        profile?.description ??
        event.sourceDocumentType ??
        'Movimiento contable generado por la operacion.',
      reference:
        resolvedDocumentReference ?? event.sourceDocumentId ?? event.sourceId ?? event.id,
      internalReference: rawEntryReference,
      entryReference: rawEntryReference,
      documentReference: resolvedDocumentReference,
      journalTypeKey,
      journalTypeLabel: ACCOUNTING_JOURNAL_TYPE_LABELS[journalTypeKey],
      userLabel,
      amount:
        journalEntry?.totals.debit ??
        resolveEventAmountSource(event, 'document_total'),
      statusLabel: status.statusLabel,
      statusTone: status.statusTone,
      lines,
      journalEntry,
      event,
      profile,
      searchIndex: [
        ACCOUNTING_EVENT_TYPE_LABELS[event.eventType],
        resolvedDocumentReference,
        event.sourceId,
        event.sourceDocumentType,
        rawEntryReference,
        rawEntryReference,
        resolvedDocumentReference,
        ACCOUNTING_JOURNAL_TYPE_LABELS[journalTypeKey],
        userLabel,
        profile?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    };
  });

  const standaloneEntries = journalEntries
    .filter((entry) => !usedEntryIds.has(entry.id))
    .map((entry) => {
      const effectiveDate =
        toDateOrNull(entry.entryDate) ?? toDateOrNull(entry.createdAt);
      const periodKey =
        entry.periodKey ??
        (effectiveDate ? buildAccountingPeriodKey(effectiveDate) : null);
      const title =
        entry.eventType === 'manual.entry.recorded'
          ? 'Asiento manual'
          : ACCOUNTING_EVENT_TYPE_LABELS[entry.eventType];
      const moduleKey =
        entry.eventType === 'manual.entry.recorded'
          ? 'general_ledger'
          : getAccountingEventDefinition(entry.eventType).moduleKey;
      const manualReference =
        entry.eventType === 'manual.entry.recorded'
          ? resolveManualEntryReference(entry)
          : null;
      const rawEntryReference = entry.id;
      const journalTypeKey = resolveJournalTypeKey(entry.eventType);
      const documentReference =
        manualReference?.reference ?? toCleanString(entry.sourceId);
      const userLabel = resolveRecordUserLabel(
        userNamesById[entry.createdBy ?? ''],
        entry.createdBy,
      );

      return {
        id: `entry:${entry.id}`,
        entryDate: effectiveDate,
        periodKey,
        sourceKind:
          entry.eventType === 'manual.entry.recorded' ? 'manual' : 'automatic',
        sourceLabel:
          entry.eventType === 'manual.entry.recorded'
            ? 'Manual'
            : 'Automatizado',
        detailMode: 'posted' as const,
        eventType: entry.eventType,
        moduleKey,
        moduleLabel: ACCOUNTING_MODULE_LABELS[moduleKey],
        title,
        description:
          entry.description ??
          'Asiento posteado directamente en el libro diario.',
        reference: manualReference?.reference ?? entry.sourceId ?? entry.id,
        internalReference:
          manualReference?.internalReference ?? rawEntryReference,
        entryReference: rawEntryReference,
        documentReference,
        journalTypeKey,
        journalTypeLabel: ACCOUNTING_JOURNAL_TYPE_LABELS[journalTypeKey],
        userLabel,
        amount: entry.totals.debit,
        statusLabel: entry.status === 'reversed' ? 'Revertido' : 'Posteado',
        statusTone: entry.status === 'reversed' ? 'neutral' : 'success',
        lines: entry.lines,
        journalEntry: entry,
        event: null,
        profile: null,
        searchIndex: [
          title,
          rawEntryReference,
          rawEntryReference,
          entry.id,
          documentReference,
          ACCOUNTING_JOURNAL_TYPE_LABELS[journalTypeKey],
          userLabel,
          manualReference?.reference,
          manualReference?.internalReference,
          entry.sourceId,
          entry.description,
          entry.lines.map((line) => line.accountName).join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    });

  return assignStableEntryReferences([
    ...automaticRecords,
    ...standaloneEntries,
  ]);
};

const recordAffectsPeriod = (
  record: AccountingLedgerRecord,
  periodKey: string,
  mode: 'cumulative' | 'period',
): boolean => {
  if (!record.periodKey) return false;

  return mode === 'period'
    ? record.periodKey === periodKey
    : record.periodKey <= periodKey;
};

const buildAccountBalances = ({
  accounts,
  periodKey,
  records,
  mode,
}: {
  accounts: ChartOfAccount[];
  periodKey: string;
  records: AccountingLedgerRecord[];
  mode: 'cumulative' | 'period';
}) => {
  const balances = new Map<
    string,
    {
      account: ChartOfAccount;
      debit: number;
      credit: number;
    }
  >();

  accounts.forEach((account) => {
    balances.set(account.id, {
      account,
      debit: 0,
      credit: 0,
    });
  });

  records.forEach((record) => {
    if (!recordAffectsPeriod(record, periodKey, mode)) {
      return;
    }

    record.lines.forEach((line) => {
      const balance = balances.get(line.accountId);
      if (!balance) {
        return;
      }

      balance.debit += line.debit;
      balance.credit += line.credit;
    });
  });

  return Array.from(balances.values());
};

const resolveLineBalanceDelta = (
  account: Pick<ChartOfAccount, 'normalSide'>,
  line: Pick<JournalEntryLine, 'credit' | 'debit'>,
): number =>
  account.normalSide === 'debit'
    ? line.debit - line.credit
    : line.credit - line.debit;

export const buildGeneralLedgerAccountOptions = ({
  accounts,
  records,
}: {
  accounts: ChartOfAccount[];
  records: AccountingLedgerRecord[];
}): GeneralLedgerAccountOption[] => {
  const movementCounts = new Map<string, number>();

  records.forEach((record) => {
    record.lines.forEach((line) => {
      movementCounts.set(
        line.accountId,
        (movementCounts.get(line.accountId) ?? 0) + 1,
      );
    });
  });

  return accounts
    .filter((account) => account.status === 'active' && account.postingAllowed)
    .map((account) => ({
      id: account.id,
      code: account.code,
      name: account.name,
      normalSide: account.normalSide,
      type: account.type,
      movementCount: movementCounts.get(account.id) ?? 0,
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
};

export const buildGeneralLedgerSnapshot = ({
  account,
  periodKey,
  records,
}: {
  account: ChartOfAccount;
  periodKey?: string | null;
  records: AccountingLedgerRecord[];
}): GeneralLedgerSnapshot => {
  const accountLines = records.flatMap((record) =>
    record.lines
      .filter((line) => line.accountId === account.id)
      .map((line) => ({
        line,
        record,
      })),
  );

  const openingBalance = periodKey
    ? accountLines
        .filter(
          ({ record }) =>
            record.periodKey !== null && record.periodKey < periodKey,
        )
        .reduce(
          (total, { line }) => total + resolveLineBalanceDelta(account, line),
          0,
        )
    : 0;

  const scopedLines = accountLines
    .filter(({ record }) => (periodKey ? record.periodKey === periodKey : true))
    .sort((left, right) => {
      const leftTime = left.record.entryDate?.getTime() ?? 0;
      const rightTime = right.record.entryDate?.getTime() ?? 0;
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      const periodCompare = (left.record.periodKey ?? '').localeCompare(
        right.record.periodKey ?? '',
      );
      if (periodCompare !== 0) {
        return periodCompare;
      }

      const recordCompare = left.record.id.localeCompare(right.record.id);
      if (recordCompare !== 0) {
        return recordCompare;
      }

      return left.line.lineNumber - right.line.lineNumber;
    });

  let runningBalance = openingBalance;
  const entries = scopedLines.map(({ line, record }) => {
    runningBalance += resolveLineBalanceDelta(account, line);
    const visibleReference = shouldCompactVisibleReference(record.reference)
      ? record.documentReference ?? record.entryReference
      : record.documentReference ?? record.reference;
    const internalReference =
      visibleReference !== record.reference
        ? record.reference
        : record.internalReference;

    return {
      id: `${record.id}:${line.lineNumber}`,
      entryDate: record.entryDate,
      periodKey: record.periodKey,
      moduleLabel: record.moduleLabel,
      sourceLabel: record.sourceLabel,
      reference: visibleReference,
      internalReference,
      title: record.title,
      description: record.description,
      lineDescription: line.description ?? null,
      debit: line.debit,
      credit: line.credit,
      runningBalance,
      sourceRecord: record,
    } satisfies GeneralLedgerMovement;
  });

  const periodDebit = entries.reduce((total, entry) => total + entry.debit, 0);
  const periodCredit = entries.reduce(
    (total, entry) => total + entry.credit,
    0,
  );

  return {
    account,
    openingBalance,
    periodDebit,
    periodCredit,
    closingBalance: runningBalance,
    entries,
  };
};

export const buildFinancialReports = ({
  accounts,
  periodKey,
  records,
}: {
  accounts: ChartOfAccount[];
  periodKey: string;
  records: AccountingLedgerRecord[];
}): FinancialReportsSnapshot => {
  const cumulativeBalances = buildAccountBalances({
    accounts,
    periodKey,
    records,
    mode: 'cumulative',
  });
  const periodBalances = buildAccountBalances({
    accounts,
    periodKey,
    records,
    mode: 'period',
  });

  const toTrialBalanceRow = ({
    account,
    credit,
    debit,
  }: {
    account: ChartOfAccount;
    credit: number;
    debit: number;
  }): TrialBalanceRow => ({
    accountId: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    debit,
    credit,
    balance: account.normalSide === 'debit' ? debit - credit : credit - debit,
  });

  const trialBalance = cumulativeBalances
    .filter(({ debit, credit }) => debit !== 0 || credit !== 0)
    .map(toTrialBalanceRow)
    .sort((left, right) => left.code.localeCompare(right.code));

  const trialBalanceTotals = trialBalance.reduce(
    (totals, row) => ({
      debit: totals.debit + row.debit,
      credit: totals.credit + row.credit,
    }),
    { debit: 0, credit: 0 },
  );

  const incomeRows = periodBalances
    .filter(
      ({ account, credit, debit }) =>
        (account.type === 'income' || account.type === 'expense') &&
        (debit !== 0 || credit !== 0),
    )
    .map(({ account, credit, debit }) => ({
      accountId: account.id,
      code: account.code,
      name: account.name,
      kind: account.type,
      amount: account.type === 'income' ? credit - debit : debit - credit,
    }))
    .sort((left, right) => left.code.localeCompare(right.code));

  const incomeTotals = incomeRows.reduce(
    (totals, row) => ({
      income:
        totals.income + (row.kind === 'income' ? Math.max(row.amount, 0) : 0),
      expense:
        totals.expense + (row.kind === 'expense' ? Math.max(row.amount, 0) : 0),
      netIncome: 0,
    }),
    { income: 0, expense: 0, netIncome: 0 },
  );
  incomeTotals.netIncome = incomeTotals.income - incomeTotals.expense;

  const assets = cumulativeBalances
    .filter(
      ({ account, credit, debit }) =>
        account.type === 'asset' && (debit !== 0 || credit !== 0),
    )
    .map(toTrialBalanceRow)
    .sort((left, right) => left.code.localeCompare(right.code));
  const liabilities = cumulativeBalances
    .filter(
      ({ account, credit, debit }) =>
        account.type === 'liability' && (debit !== 0 || credit !== 0),
    )
    .map(toTrialBalanceRow)
    .sort((left, right) => left.code.localeCompare(right.code));
  const equity = cumulativeBalances
    .filter(
      ({ account, credit, debit }) =>
        account.type === 'equity' && (debit !== 0 || credit !== 0),
    )
    .map(toTrialBalanceRow)
    .sort((left, right) => left.code.localeCompare(right.code));

  return {
    trialBalance,
    trialBalanceTotals,
    incomeRows,
    incomeTotals,
    balanceSheet: {
      assets,
      liabilities,
      equity,
      currentEarnings: incomeTotals.netIncome,
    },
  };
};

export const buildAvailablePeriods = (
  records: AccountingLedgerRecord[],
): string[] => {
  const periodKeys = new Set<string>();

  records.forEach((record) => {
    if (record.periodKey) {
      periodKeys.add(record.periodKey);
    }
  });

  periodKeys.add(buildAccountingPeriodKey(new Date()));

  return Array.from(periodKeys).sort((left, right) =>
    right.localeCompare(left),
  );
};

export const buildPeriodOptions = (
  periods: string[],
  records: AccountingLedgerRecord[],
  closures: AccountingPeriodClosure[],
) =>
  periods.map((periodKey) => ({
    periodKey,
    label: normalizePeriodLabel(periodKey),
    status: isAccountingPeriodClosed(periodKey, closures) ? 'closed' : 'open',
    entries: records.filter((record) => record.periodKey === periodKey).length,
    amount: records
      .filter((record) => record.periodKey === periodKey)
      .reduce((total, record) => total + record.amount, 0),
  }));

export const summarizeManualEntryLines = (
  lines: Array<{ debit: number; credit: number }>,
) =>
  buildJournalEntryTotals(
    lines.map((line, index) => ({
      lineNumber: index + 1,
      accountId: `line-${index + 1}`,
      debit: line.debit,
      credit: line.credit,
    })),
  );
