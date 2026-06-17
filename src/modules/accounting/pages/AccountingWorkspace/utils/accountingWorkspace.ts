import type {
  AccountingEvent,
  AccountingEventType,
  AccountingPostingAmountSource,
  AccountingPostingCondition,
  AccountingPostingProfile,
  BankAccount,
  CashAccount,
  ChartOfAccount,
  ChartOfAccountNormalSide,
  ChartOfAccountType,
  JournalEntry,
  JournalEntryLine,
} from '@/types/accounting';
import type { AccountingLedgerRecord } from '@/modules/accounting/utils/accountingLedgerRecord';
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
import { normalizePaymentMethodCode } from '@/utils/payments/contracts';

export type { AccountingLedgerRecord } from '@/modules/accounting/utils/accountingLedgerRecord';

export type AccountingWorkspacePanelKey =
  | 'journal-book'
  | 'general-ledger'
  | 'manual-entries'
  | 'financial-reports'
  | 'fiscal-compliance'
  | 'accounting-monitor'
  | 'period-close';

export interface AccountingPeriodClosure {
  id: string;
  periodKey: string;
  closedAt: unknown;
  closedBy: string | null;
  note: string | null;
}

export interface AccountingProjectionDeadLetter {
  id: string;
  businessId: string | null;
  eventId: string;
  eventType: AccountingEventType | null;
  sourceType: string | null;
  sourceId: string | null;
  sourceDocumentType: string | null;
  sourceDocumentId: string | null;
  projectionStatus: 'failed' | 'pending_account_mapping' | 'pending' | string;
  journalEntryId: string | null;
  attemptCount: number;
  replayCount: number;
  retryable: boolean;
  lastAttemptAt: unknown;
  lastReplayRequestedAt: unknown;
  lastReplayRequestedBy: string | null;
  lastError: {
    code?: string | null;
    message?: string | null;
    details?: Record<string, unknown>;
  } | null;
  updatedAt: unknown;
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
    case 'invoice.voided':
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
    case 'hr_payroll.payment.recorded':
      return (
        toCleanString(snapshot.reference) ??
        toCleanString(snapshot.employeeCode) ??
        toCleanString(snapshot.employeeNameSnapshot) ??
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

const roundAccountingAmount = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const CASH_PAYMENT_METHODS = new Set(['cash']);
const BANK_PAYMENT_METHODS = new Set(['card', 'transfer']);
const OTHER_PAYMENT_METHODS = new Set(['creditNote', 'supplierCreditNote']);

const normalizeTreasuryLedgerType = (value: unknown): 'cash' | 'bank' | null =>
  value === 'cash' || value === 'bank' ? value : null;

const resolveTreasuryLedgerRecord = (
  event: AccountingEvent,
  role: 'source' | 'destination',
) => {
  const payload = asRecord(event.payload);
  const ledgerRecord = asRecord(role === 'source' ? payload.from : payload.to);
  const type = normalizeTreasuryLedgerType(ledgerRecord.type);

  if (!type) {
    return null;
  }

  return {
    type,
    bankAccountId: toCleanString(ledgerRecord.bankAccountId),
    cashAccountId:
      toCleanString(ledgerRecord.cashAccountId) ??
      toCleanString(ledgerRecord.cashCountId),
  };
};

const resolveTransferDirectionFromLedgers = (
  fromLedger: Record<string, unknown>,
  toLedger: Record<string, unknown>,
) => {
  const fromType = normalizeTreasuryLedgerType(fromLedger.type);
  const toType = normalizeTreasuryLedgerType(toLedger.type);
  if (fromType === 'cash' && toType === 'bank') return 'cash_to_bank';
  if (fromType === 'bank' && toType === 'cash') return 'bank_to_cash';
  if (fromType === 'bank' && toType === 'bank') return 'bank_to_bank';
  if (fromType === 'cash' && toType === 'cash') return 'cash_to_cash';
  return 'any';
};

const resolveEventTransferDirection = (event: AccountingEvent) => {
  const payload = asRecord(event.payload);
  const explicitDirection = toCleanString(payload.transferDirection);
  if (
    explicitDirection === 'cash_to_bank' ||
    explicitDirection === 'bank_to_cash' ||
    explicitDirection === 'bank_to_bank' ||
    explicitDirection === 'cash_to_cash'
  ) {
    return explicitDirection;
  }

  return resolveTransferDirectionFromLedgers(
    asRecord(payload.from),
    asRecord(payload.to),
  );
};

const resolveSaleSettlementContext = (event: AccountingEvent) => {
  const payload = asRecord(event.payload);
  const monetary = asRecord(event.monetary);
  const documentTotal = toFiniteAmount(monetary.amount);
  const total =
    toFiniteAmount(monetary.functionalAmount) ||
    toFiniteAmount(monetary.amount);
  const functionalRate =
    documentTotal > 0 && total > 0 ? total / documentTotal : 1;
  const paymentMethods = Array.isArray(payload.paymentMethods)
    ? payload.paymentMethods
    : [];

  return {
    functionalRate,
    paymentMethods,
    payload,
    total,
  };
};

const resolvePaymentMethodFunctionalAmount = (
  method: unknown,
  functionalRate: number,
): number => {
  const methodRecord = asRecord(method);
  const explicitFunctionalAmount = toFiniteAmount(
    methodRecord.functionalValue ??
      methodRecord.functionalAmount ??
      methodRecord.functionalTotal,
  );
  const documentAmount = toFiniteAmount(
    methodRecord.value ?? methodRecord.amount,
  );
  const amount =
    explicitFunctionalAmount > 0
      ? explicitFunctionalAmount
      : documentAmount * functionalRate;

  return amount > 0 ? amount : 0;
};

const resolveSaleSettlementBreakdown = (event: AccountingEvent) => {
  const { functionalRate, paymentMethods, payload, total } =
    resolveSaleSettlementContext(event);
  const breakdown = paymentMethods.reduce(
    (accumulator, method) => {
      const methodRecord = asRecord(method);
      const amount = resolvePaymentMethodFunctionalAmount(
        method,
        functionalRate,
      );
      if (amount <= 0) {
        return accumulator;
      }

      const methodCode = normalizePaymentMethodCode(
        methodRecord.method ?? methodRecord.code ?? method,
      );

      if (CASH_PAYMENT_METHODS.has(methodCode ?? '')) {
        accumulator.cash += amount;
        return accumulator;
      }

      if (BANK_PAYMENT_METHODS.has(methodCode ?? '')) {
        accumulator.bank += amount;
        return accumulator;
      }

      if (OTHER_PAYMENT_METHODS.has(methodCode ?? '')) {
        accumulator.other += amount;
        return accumulator;
      }

      accumulator.other += amount;
      return accumulator;
    },
    { cash: 0, bank: 0, other: 0 },
  );

  const explicitSettled =
    toFiniteAmount(payload.functionalSettledAmount) ||
    toFiniteAmount(payload.functionalPaidAmount) ||
    (toFiniteAmount(payload.settledAmount) ||
      toFiniteAmount(payload.paidAmount)) * functionalRate;
  const settledAmount = Math.max(
    explicitSettled || breakdown.cash + breakdown.bank + breakdown.other,
    0,
  );
  const explicitReceivableBalance =
    toFiniteAmount(payload.functionalReceivableBalance) ||
    toFiniteAmount(payload.receivableFunctionalBalance) ||
    toFiniteAmount(payload.receivableBalance) * functionalRate;
  const receivableBalance = Math.max(
    explicitReceivableBalance || total - settledAmount,
    0,
  );

  return {
    cash: roundAccountingAmount(breakdown.cash),
    bank: roundAccountingAmount(breakdown.bank),
    other: roundAccountingAmount(breakdown.other),
    settledAmount: roundAccountingAmount(settledAmount),
    receivableBalance: roundAccountingAmount(receivableBalance),
  };
};

const resolveReceivablePaymentAmounts = (event: AccountingEvent) => {
  const payload = asRecord(event.payload);
  const monetary = asRecord(event.monetary);
  const total =
    toFiniteAmount(monetary.functionalAmount) ||
    toFiniteAmount(monetary.amount);
  const withholding = asRecord(payload.thirdPartyWithholding);
  const applied =
    toFiniteAmount(payload.functionalAppliedAmount) ||
    toFiniteAmount(payload.appliedFunctionalAmount) ||
    toFiniteAmount(payload.appliedAmount) ||
    toFiniteAmount(monetary.amount) ||
    total;
  const collected =
    toFiniteAmount(payload.functionalCollectedAmount) ||
    toFiniteAmount(payload.collectedFunctionalAmount) ||
    toFiniteAmount(payload.collectedAmount) ||
    total;
  const withheld =
    toFiniteAmount(payload.functionalWithholdingAmount) ||
    toFiniteAmount(payload.withholdingFunctionalAmount) ||
    toFiniteAmount(withholding.functionalTotalWithheld) ||
    toFiniteAmount(withholding.functionalAmount) ||
    toFiniteAmount(withholding.totalWithheld) ||
    Math.max(applied - collected, 0);

  return {
    applied: roundAccountingAmount(Math.max(applied, 0)),
    collected: roundAccountingAmount(Math.max(collected, 0)),
    withheld: roundAccountingAmount(Math.max(withheld, 0)),
  };
};

const resolvePayablePaymentBreakdown = (event: AccountingEvent) => {
  const payload = asRecord(event.payload);
  const monetary = asRecord(event.monetary);
  const documentTotal = toFiniteAmount(monetary.amount);
  const total =
    toFiniteAmount(monetary.functionalAmount) ||
    toFiniteAmount(monetary.amount);
  const functionalRate =
    documentTotal > 0 && total > 0 ? total / documentTotal : 1;
  const paymentMethods = Array.isArray(payload.paymentMethods)
    ? payload.paymentMethods
    : [];

  const breakdown = paymentMethods.reduce(
    (accumulator, method) => {
      const methodRecord = asRecord(method);
      const amount = resolvePaymentMethodFunctionalAmount(
        method,
        functionalRate,
      );
      if (amount <= 0) {
        return accumulator;
      }

      const methodCode = normalizePaymentMethodCode(
        methodRecord.method ?? methodRecord.code ?? method,
      );

      if (CASH_PAYMENT_METHODS.has(methodCode ?? '')) {
        accumulator.cash += amount;
        return accumulator;
      }

      if (BANK_PAYMENT_METHODS.has(methodCode ?? '')) {
        accumulator.bank += amount;
        return accumulator;
      }

      if (OTHER_PAYMENT_METHODS.has(methodCode ?? '')) {
        accumulator.creditNote += amount;
        return accumulator;
      }

      accumulator.other += amount;
      return accumulator;
    },
    { cash: 0, bank: 0, creditNote: 0, other: 0 },
  );

  return {
    cash: roundAccountingAmount(breakdown.cash),
    bank: roundAccountingAmount(breakdown.bank),
    creditNote: roundAccountingAmount(breakdown.creditNote),
    other: roundAccountingAmount(breakdown.other),
    settledAmount: roundAccountingAmount(total),
  };
};

const resolvePayrollDeductionAmounts = (event: AccountingEvent) => {
  const payload = asRecord(event.payload);
  const summary = asRecord(payload.payrollDeductionSummary);
  const summaryTax = toFiniteAmount(summary.taxAmount);
  const summaryOther = toFiniteAmount(summary.otherPayableAmount);
  if (summaryTax > 0 || summaryOther > 0) {
    return {
      tax: roundAccountingAmount(summaryTax),
      other: roundAccountingAmount(summaryOther),
    };
  }

  const employeeLines = Array.isArray(payload.employeeLines)
    ? payload.employeeLines
    : [];
  const totals = employeeLines.reduce(
    (accumulator, line) => {
      const lineRecord = asRecord(line);
      const deductionLines = Array.isArray(lineRecord.deductionLines)
        ? lineRecord.deductionLines
        : [];

      deductionLines.forEach((deductionLine) => {
        const deduction = asRecord(deductionLine);
        if (deduction.payableObligation === false) {
          return;
        }

        const amount = toFiniteAmount(
          deduction.functionalAmount ??
            deduction.calculatedAmount ??
            deduction.amount,
        );
        if (amount <= 0) {
          return;
        }

        const accountSystemKey = toCleanString(deduction.accountSystemKey);
        const kind = toCleanString(deduction.kind);
        if (accountSystemKey === 'tax_payable' || kind === 'salary_itbis') {
          accumulator.tax += amount;
          return;
        }

        accumulator.other += amount;
      });

      return accumulator;
    },
    { tax: 0, other: 0 },
  );

  return {
    tax: roundAccountingAmount(totals.tax),
    other: roundAccountingAmount(totals.other),
  };
};

const resolvePayrollAccrualAmounts = (event: AccountingEvent) => {
  const monetary = asRecord(event.monetary);
  const payload = asRecord(event.payload);
  const total =
    toFiniteAmount(monetary.functionalAmount) ||
    toFiniteAmount(monetary.amount);
  const deductions = resolvePayrollDeductionAmounts(event);
  const net =
    toFiniteAmount(payload.functionalNetAmount) ||
    toFiniteAmount(payload.netAmount) ||
    Math.max(total - deductions.tax - deductions.other, 0);

  return {
    accrual: roundAccountingAmount(total),
    net: roundAccountingAmount(Math.max(net, 0)),
    taxDeductions: deductions.tax,
    otherDeductions: deductions.other,
  };
};

const resolveSaleBankSettlementAllocations = (event: AccountingEvent) => {
  const { functionalRate, paymentMethods } =
    resolveSaleSettlementContext(event);
  const allocationsByBankAccountId = new Map<string, number>();
  let unassignedAmount = 0;

  paymentMethods.forEach((method) => {
    const methodRecord = asRecord(method);
    const methodCode = normalizePaymentMethodCode(
      methodRecord.method ?? methodRecord.code ?? method,
    );
    if (!BANK_PAYMENT_METHODS.has(methodCode ?? '')) {
      return;
    }

    const amount = resolvePaymentMethodFunctionalAmount(method, functionalRate);
    if (amount <= 0) {
      return;
    }

    const bankAccountId = toCleanString(methodRecord.bankAccountId);
    if (!bankAccountId) {
      unassignedAmount += amount;
      return;
    }

    allocationsByBankAccountId.set(
      bankAccountId,
      roundAccountingAmount(
        (allocationsByBankAccountId.get(bankAccountId) ?? 0) + amount,
      ),
    );
  });

  return {
    allocations: Array.from(allocationsByBankAccountId.entries())
      .map(([bankAccountId, amount]) => ({
        bankAccountId,
        amount: roundAccountingAmount(amount),
      }))
      .filter((allocation) => allocation.amount > 0),
    unassignedAmount: roundAccountingAmount(unassignedAmount),
  };
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
      record.journalEntry?.id ??
        record.entryReference ??
        record.internalReference,
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
    toCleanString(payload.paymentCondition) ??
    toCleanString(payload.saleCondition) ??
    toCleanString(payload.terms);
  const settlementKindCandidate =
    toCleanString(treasury.paymentChannel) ??
    toCleanString(payload.settlementKind) ??
    toCleanString(payload.paymentChannel);
  const documentNatureCandidate =
    toCleanString(payload.documentNature) ??
    toCleanString(payload.financialType) ??
    toCleanString(payload.purchaseNature);
  const settlementTimingCandidate =
    toCleanString(payload.settlementTiming) ??
    toCleanString(payload.settlementMode);

  return {
    paymentTerm:
      paymentTermCandidate === 'cash' || paymentTermCandidate === 'credit'
        ? paymentTermCandidate
        : 'any',
    settlementKind:
      settlementKindCandidate === 'cash' ||
      settlementKindCandidate === 'bank' ||
      settlementKindCandidate === 'mixed' ||
      settlementKindCandidate === 'other'
        ? settlementKindCandidate
        : 'any',
    taxTreatment: taxAmount > 0 ? 'taxed' : 'untaxed',
    documentNature:
      documentNatureCandidate === 'inventory' ||
      documentNatureCandidate === 'expense' ||
      documentNatureCandidate === 'asset' ||
      documentNatureCandidate === 'service'
        ? documentNatureCandidate
        : 'any',
    settlementTiming:
      settlementTimingCandidate === 'immediate' ||
      settlementTimingCandidate === 'deferred'
        ? settlementTimingCandidate
        : 'any',
    transferDirection: resolveEventTransferDirection(event),
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

  if (
    conditions.documentNature &&
    conditions.documentNature !== 'any' &&
    conditions.documentNature !== eventContext.documentNature
  ) {
    return false;
  }

  if (
    conditions.settlementTiming &&
    conditions.settlementTiming !== 'any' &&
    conditions.settlementTiming !== eventContext.settlementTiming
  ) {
    return false;
  }

  if (
    conditions.transferDirection &&
    conditions.transferDirection !== 'any' &&
    conditions.transferDirection !== eventContext.transferDirection
  ) {
    return false;
  }

  return true;
};

const resolveEventBankAccountId = (event: AccountingEvent): string | null => {
  const payload = asRecord(event.payload);
  const treasury = asRecord(event.treasury);
  const treasuryBankAccountId = toCleanString(treasury.bankAccountId);
  if (treasuryBankAccountId) {
    return treasuryBankAccountId;
  }

  const paymentMethods = Array.isArray(payload.paymentMethods)
    ? payload.paymentMethods
    : [];
  const bankAccountIds = new Set(
    paymentMethods
      .filter((method) => {
        const methodCode = normalizePaymentMethodCode(
          method?.method ?? method?.code ?? method,
        );
        return BANK_PAYMENT_METHODS.has(methodCode);
      })
      .map((method) => toCleanString(method?.bankAccountId))
      .filter((bankAccountId): bankAccountId is string =>
        Boolean(bankAccountId),
      ),
  );

  return bankAccountIds.size === 1 ? Array.from(bankAccountIds)[0] : null;
};

const resolveAccountForProjectedLine = ({
  accountId,
  accountSystemKey,
  accountsById,
  accountsBySystemKey,
  bankAccountsById,
  cashAccountsById,
  event,
  line,
}: {
  accountId?: string | null;
  accountSystemKey?: string | null;
  accountsById: Map<string, ChartOfAccount>;
  accountsBySystemKey: Map<string, ChartOfAccount>;
  bankAccountsById: Map<string, BankAccount>;
  cashAccountsById: Map<string, CashAccount>;
  event: AccountingEvent;
  line: AccountingPostingProfile['linesTemplate'][number];
}): ChartOfAccount | null => {
  const account = accountId ? (accountsById.get(accountId) ?? null) : null;
  const effectiveSystemKey = accountSystemKey ?? account?.systemKey ?? null;
  const treasuryRole = toCleanString(asRecord(line.metadata).treasuryRole);
  if (treasuryRole === 'source' || treasuryRole === 'destination') {
    const ledger = resolveTreasuryLedgerRecord(event, treasuryRole);
    if (!ledger) {
      return null;
    }

    if (ledger.type === 'bank') {
      return effectiveSystemKey === 'bank'
        ? resolveBankChartAccount({
            accountsById,
            bankAccountId: ledger.bankAccountId,
            bankAccountsById,
          })
        : null;
    }

    if (ledger.type === 'cash') {
      if (effectiveSystemKey !== 'cash') {
        return null;
      }

      const cashChartAccount = resolveCashChartAccount({
        accountsById,
        cashAccountId: ledger.cashAccountId,
        cashAccountsById,
      });
      if (cashChartAccount) {
        return cashChartAccount;
      }

      return null;
    }
  }

  if (effectiveSystemKey === 'bank') {
    const bankAccountId = resolveEventBankAccountId(event);
    const bankAccount = bankAccountId
      ? (bankAccountsById.get(bankAccountId) ?? null)
      : null;
    const bankChartAccountId = toCleanString(bankAccount?.chartOfAccountId);
    const bankChartAccount = bankChartAccountId
      ? (accountsById.get(bankChartAccountId) ?? null)
      : null;
    if (bankChartAccount && bankAccount?.status === 'active') {
      return bankChartAccount;
    }
  }

  return (
    account ??
    (accountSystemKey
      ? (accountsBySystemKey.get(accountSystemKey) ?? null)
      : null)
  );
};

const resolveBankChartAccount = ({
  accountsById,
  bankAccountId,
  bankAccountsById,
}: {
  accountsById: Map<string, ChartOfAccount>;
  bankAccountId: string | null;
  bankAccountsById: Map<string, BankAccount>;
}): ChartOfAccount | null => {
  const bankAccount = bankAccountId
    ? (bankAccountsById.get(bankAccountId) ?? null)
    : null;
  const bankChartAccountId = toCleanString(bankAccount?.chartOfAccountId);
  const bankChartAccount = bankChartAccountId
    ? (accountsById.get(bankChartAccountId) ?? null)
    : null;

  return bankChartAccount && bankAccount?.status === 'active'
    ? bankChartAccount
    : null;
};

const resolveCashChartAccount = ({
  accountsById,
  cashAccountId,
  cashAccountsById,
}: {
  accountsById: Map<string, ChartOfAccount>;
  cashAccountId: string | null;
  cashAccountsById: Map<string, CashAccount>;
}): ChartOfAccount | null => {
  const cashAccount = cashAccountId
    ? (cashAccountsById.get(cashAccountId) ?? null)
    : null;
  const cashChartAccountId = toCleanString(cashAccount?.chartOfAccountId);
  const cashChartAccount = cashChartAccountId
    ? (accountsById.get(cashChartAccountId) ?? null)
    : null;

  return cashChartAccount && cashAccount?.status === 'active'
    ? cashChartAccount
    : null;
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
    case 'invoice.voided':
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
    case 'hr_commission.accrued':
    case 'hr_payroll.payment.recorded':
      return 'payroll';
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
  const subtotal =
    toFiniteAmount(monetary.functionalSubtotalAmount) ||
    toFiniteAmount(monetary.subtotalAmount) ||
    Math.max(total - tax, 0);
  const withholdingITBIS =
    toFiniteAmount(monetary.functionalWithholdingITBISAmount) ||
    toFiniteAmount(monetary.withholdingITBISAmount);
  const withholdingISR =
    toFiniteAmount(monetary.functionalWithholdingISRAmount) ||
    toFiniteAmount(monetary.withholdingISRAmount);
  const netPayable =
    toFiniteAmount(monetary.functionalNetPayableAmount) ||
    toFiniteAmount(monetary.netPayableAmount) ||
    Math.max(total - withholdingITBIS - withholdingISR, 0);
  const netSales = Math.max(total - tax, 0);
  const saleSettlement = resolveSaleSettlementBreakdown(event);
  const receivablePayment = resolveReceivablePaymentAmounts(event);
  const payablePayment = resolvePayablePaymentBreakdown(event);
  const payrollAccrual = resolvePayrollAccrualAmounts(event);
  const gain = Math.max(total, 0);
  const loss = Math.abs(Math.min(total, 0));

  switch (source) {
    case 'tax_total':
      return tax;
    case 'net_sales':
      return netSales;
    case 'sale_settled_amount':
      return saleSettlement.settledAmount;
    case 'sale_receivable_balance':
      return saleSettlement.receivableBalance;
    case 'sale_cash_received':
      return saleSettlement.cash;
    case 'sale_bank_received':
      return saleSettlement.bank;
    case 'sale_other_received':
      return saleSettlement.other;
    case 'credit_note_net_total':
      return netSales;
    case 'purchase_subtotal':
    case 'expense_subtotal':
      return subtotal;
    case 'purchase_tax':
    case 'expense_tax':
      return tax;
    case 'purchase_net_payable':
    case 'expense_net_payable':
      return netPayable;
    case 'purchase_withholding_itbis':
    case 'expense_withholding_itbis':
      return withholdingITBIS;
    case 'purchase_withholding_isr':
    case 'expense_withholding_isr':
      return withholdingISR;
    case 'accounts_receivable_applied_amount':
      return receivablePayment.applied;
    case 'accounts_receivable_collected_amount':
    case 'accounts_receivable_payment_amount':
      return receivablePayment.collected;
    case 'accounts_receivable_withholding_amount':
      return receivablePayment.withheld;
    case 'accounts_payable_cash_paid':
      return payablePayment.cash;
    case 'accounts_payable_bank_paid':
      return payablePayment.bank;
    case 'accounts_payable_credit_note_applied':
      return payablePayment.creditNote;
    case 'payroll_accrual_amount':
      return payrollAccrual.accrual;
    case 'payroll_net_payable_amount':
      return payrollAccrual.net;
    case 'payroll_tax_deductions_amount':
      return payrollAccrual.taxDeductions;
    case 'payroll_other_deductions_amount':
      return payrollAccrual.otherDeductions;
    case 'purchase_total':
    case 'expense_total':
    case 'document_total':
    case 'accounts_payable_payment_amount':
    case 'transfer_amount':
      return total;
    case 'cash_over_short_gain':
    case 'bank_statement_adjustment_gain':
      return gain;
    case 'cash_over_short_loss':
    case 'bank_statement_adjustment_loss':
      return loss;
    case 'fx_gain':
      return gain;
    case 'fx_loss':
      return loss;
    default:
      return total;
  }
};

const buildProjectedLine = ({
  account,
  amount,
  event,
  line,
  lineNumber,
  metadata = {},
  profile,
}: {
  account: ChartOfAccount;
  amount: number;
  event: AccountingEvent;
  line: AccountingPostingProfile['linesTemplate'][number];
  lineNumber: number;
  metadata?: Record<string, unknown>;
  profile: AccountingPostingProfile;
}): JournalEntryLine => ({
  lineNumber,
  accountId: account.id,
  accountCode: account.code ?? line.accountCode ?? null,
  accountName: account.name ?? line.accountName ?? null,
  accountSystemKey: line.accountSystemKey ?? account.systemKey ?? null,
  description: line.description ?? profile.name,
  debit: line.side === 'debit' ? amount : 0,
  credit: line.side === 'credit' ? amount : 0,
  amountSource: line.amountSource,
  reference: event.sourceDocumentId ?? event.sourceId ?? event.id,
  metadata: {
    ...asRecord(line.metadata),
    projectedFromProfileId: profile.id,
    ...metadata,
  },
});

const buildProjectedLines = ({
  accountsById,
  accountsBySystemKey,
  bankAccountsById,
  cashAccountsById,
  event,
  profile,
}: {
  accountsById: Map<string, ChartOfAccount>;
  accountsBySystemKey: Map<string, ChartOfAccount>;
  bankAccountsById: Map<string, BankAccount>;
  cashAccountsById: Map<string, CashAccount>;
  event: AccountingEvent;
  profile: AccountingPostingProfile;
}): JournalEntryLine[] =>
  profile.linesTemplate
    .flatMap((line, index) => {
      const amount = resolveEventAmountSource(event, line.amountSource);
      if (line.omitIfZero && amount === 0) {
        return [];
      }

      const templateAccount = line.accountId
        ? (accountsById.get(line.accountId) ?? null)
        : null;
      const effectiveSystemKey =
        line.accountSystemKey ?? templateAccount?.systemKey ?? null;
      if (
        effectiveSystemKey === 'bank' &&
        line.amountSource === 'sale_bank_received'
      ) {
        const bankSettlement = resolveSaleBankSettlementAllocations(event);
        if (bankSettlement.allocations.length) {
          const allocationLines = bankSettlement.allocations.flatMap(
            (allocation) => {
              const account = resolveBankChartAccount({
                accountsById,
                bankAccountId: allocation.bankAccountId,
                bankAccountsById,
              });
              if (!account) {
                return [];
              }

              return [
                buildProjectedLine({
                  account,
                  amount: allocation.amount,
                  event,
                  line,
                  lineNumber: index + 1,
                  metadata: {
                    bankAccountId: allocation.bankAccountId,
                    splitFromAmountSource: line.amountSource,
                  },
                  profile,
                }),
              ];
            },
          );

          if (bankSettlement.unassignedAmount <= 0) {
            return allocationLines;
          }

          const fallbackAccount = resolveAccountForProjectedLine({
            accountId: line.accountId,
            accountSystemKey: line.accountSystemKey,
            accountsById,
            accountsBySystemKey,
            bankAccountsById,
            cashAccountsById,
            event,
            line,
          });
          if (!fallbackAccount) {
            return allocationLines;
          }

          return [
            ...allocationLines,
            buildProjectedLine({
              account: fallbackAccount,
              amount: bankSettlement.unassignedAmount,
              event,
              line,
              lineNumber: index + 1,
              metadata: {
                splitFromAmountSource: line.amountSource,
                splitUnassignedBankAmount: true,
              },
              profile,
            }),
          ];
        }
      }

      const account = resolveAccountForProjectedLine({
        accountId: line.accountId,
        accountSystemKey: line.accountSystemKey,
        accountsById,
        accountsBySystemKey,
        bankAccountsById,
        cashAccountsById,
        event,
        line,
      });

      return [
        account
          ? buildProjectedLine({
              account,
              amount,
              event,
              line,
              lineNumber: index + 1,
              profile,
            })
          : {
              lineNumber: index + 1,
              accountId: line.accountId ?? `preview-${index + 1}`,
              accountCode: line.accountCode ?? null,
              accountName: line.accountName ?? null,
              accountSystemKey: line.accountSystemKey ?? null,
              description: line.description ?? profile.name,
              debit: line.side === 'debit' ? amount : 0,
              credit: line.side === 'credit' ? amount : 0,
              amountSource: line.amountSource,
              reference: event.sourceDocumentId ?? event.sourceId ?? event.id,
              metadata: {
                ...asRecord(line.metadata),
                projectedFromProfileId: profile.id,
              },
            },
      ];
    })
    .map((line, index) => ({
      ...line,
      lineNumber: index + 1,
    }));

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

export const normalizeAccountingProjectionDeadLetterRecord = (
  id: string,
  businessId: string,
  value: unknown,
): AccountingProjectionDeadLetter => {
  const record = asRecord(value);
  const lastError = asRecord(record.lastError);

  return {
    id,
    businessId: toCleanString(record.businessId) ?? businessId,
    eventId: toCleanString(record.eventId) ?? id,
    eventType: toCleanString(record.eventType) as AccountingEventType | null,
    sourceType: toCleanString(record.sourceType),
    sourceId: toCleanString(record.sourceId),
    sourceDocumentType: toCleanString(record.sourceDocumentType),
    sourceDocumentId: toCleanString(record.sourceDocumentId),
    projectionStatus:
      toCleanString(record.projectionStatus) ??
      toCleanString(asRecord(record.projection).status) ??
      'pending',
    journalEntryId: toCleanString(record.journalEntryId),
    attemptCount: Math.max(0, Math.trunc(toFiniteAmount(record.attemptCount))),
    replayCount: Math.max(0, Math.trunc(toFiniteAmount(record.replayCount))),
    retryable: record.retryable !== false,
    lastAttemptAt: record.lastAttemptAt ?? null,
    lastReplayRequestedAt: record.lastReplayRequestedAt ?? null,
    lastReplayRequestedBy: toCleanString(record.lastReplayRequestedBy),
    lastError: Object.keys(lastError).length
      ? {
          code: toCleanString(lastError.code),
          message: toCleanString(lastError.message),
          details: asRecord(lastError.details),
        }
      : null,
    updatedAt: record.updatedAt ?? null,
  };
};

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
  bankAccounts = [],
  cashAccounts = [],
  events,
  journalEntries,
  postingProfiles,
  userNamesById = {},
}: {
  accounts: ChartOfAccount[];
  bankAccounts?: BankAccount[];
  cashAccounts?: CashAccount[];
  events: AccountingEvent[];
  journalEntries: JournalEntry[];
  postingProfiles: AccountingPostingProfile[];
  userNamesById?: Record<string, string>;
}): AccountingLedgerRecord[] => {
  const accountsById = new Map(
    accounts.map((account) => [account.id, account]),
  );
  const accountsBySystemKey = new Map(
    accounts
      .filter((account) => toCleanString(account.systemKey))
      .map((account) => [account.systemKey as string, account]),
  );
  const bankAccountsById = new Map(
    bankAccounts.map((account) => [account.id, account]),
  );
  const cashAccountsById = new Map(
    cashAccounts.map((account) => [account.id, account]),
  );
  const entriesById = new Map(
    journalEntries.map((entry) => [entry.id, entry] as const),
  );
  const usedEntryIds = new Set<string>();

  const automaticRecords: AccountingLedgerRecord[] = events.map((event) => {
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
            accountsBySystemKey,
            bankAccountsById,
            cashAccountsById,
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
      sourceLabel: journalEntry ? 'Automatizado' : 'Regla de contabilización',
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
        resolvedDocumentReference ??
        event.sourceDocumentId ??
        event.sourceId ??
        event.id,
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

  const standaloneEntries: AccountingLedgerRecord[] = journalEntries
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
      ? (record.documentReference ?? record.entryReference)
      : (record.documentReference ?? record.reference);
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
    pagination: {
      page: 1,
      pageSize: entries.length || 1,
      totalEntries: entries.length,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      searchQuery: null,
    },
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
      kind: account.type as 'expense' | 'income',
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
): Array<{
  amount: number;
  entries: number;
  label: string;
  periodKey: string;
  status: 'closed' | 'open';
}> =>
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
