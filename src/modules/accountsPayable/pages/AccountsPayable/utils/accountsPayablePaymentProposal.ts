import type { AccountsPayableRow } from './accountsPayableDashboard';
import { isAccountsPayablePaymentEligible } from './accountsPayablePaymentEligibility';

export interface AccountsPayablePaymentProposalSupplier {
  balanceAmount: number;
  cashRequirementAmount: number;
  count: number;
  overdueAmount: number;
  providerId: string | null;
  providerName: string;
  withholdingAmount: number;
}

export interface AccountsPayablePaymentProposalExclusion {
  amount: number;
  count: number;
  label: string;
  reasons: string[];
  status: AccountsPayableRow['paymentControl']['status'];
}

export interface AccountsPayablePaymentProposal {
  blockedAmount: number;
  blockedCashRequirementAmount: number;
  blockedCount: number;
  blockedWithholdingAmount: number;
  eligibleAmount: number;
  eligibleCashRequirementAmount: number;
  eligibleCount: number;
  eligibleWithholdingAmount: number;
  exclusionSummaries: AccountsPayablePaymentProposalExclusion[];
  dueSoonAmount: number;
  dueSoonCount: number;
  dueSoonRows: AccountsPayableRow[];
  noDueDateAmount: number;
  noDueDateCount: number;
  overdueAmount: number;
  recommendedRows: AccountsPayableRow[];
  reviewRows: AccountsPayableRow[];
  supplierSummaries: AccountsPayablePaymentProposalSupplier[];
  visibleAmount: number;
  visibleCashRequirementAmount: number;
  visibleCount: number;
  visibleWithholdingAmount: number;
}

const OVERDUE_BUCKETS = new Set(['due_1_30', 'due_31_60', 'due_61_plus']);
const DUE_SOON_DAYS = 7;

const BUCKET_PRIORITY: Record<AccountsPayableRow['agingBucket'], number> = {
  due_61_plus: 0,
  due_31_60: 1,
  due_1_30: 2,
  current: 3,
  no_due_date: 4,
};

const EXCLUSION_STATUS_PRIORITY: Record<
  AccountsPayableRow['paymentControl']['status'],
  number
> = {
  pending_approval: 0,
  on_hold: 1,
  disputed: 2,
  closed: 3,
  payable: 4,
};

const toMoney = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

const toOptionalMoney = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
};

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const sumBalance = (rows: AccountsPayableRow[]): number =>
  roundMoney(rows.reduce((sum, row) => sum + toMoney(row.balanceAmount), 0));

export interface AccountsPayableProposalCashSnapshot {
  cashRequirementAmount: number;
  grossBalanceAmount: number;
  withholdingAmount: number;
}

export const resolveAccountsPayableProposalCashSnapshot = (
  row: AccountsPayableRow,
): AccountsPayableProposalCashSnapshot => {
  const grossBalanceAmount = toMoney(row.balanceAmount);
  const withholdingAmount = roundMoney(
    toMoney(row.fiscalSnapshot.withholdingITBISAmount ?? 0) +
      toMoney(row.fiscalSnapshot.withholdingISRAmount ?? 0),
  );
  const netPayableAmount = toOptionalMoney(
    row.fiscalSnapshot.netPayableAmount,
  );
  const estimatedNetPayableAmount =
    netPayableAmount ??
    (withholdingAmount > 0 && toMoney(row.totalAmount) > 0
      ? Math.max(toMoney(row.totalAmount) - withholdingAmount, 0)
      : null);

  if (estimatedNetPayableAmount == null || withholdingAmount <= 0) {
    return {
      cashRequirementAmount: grossBalanceAmount,
      grossBalanceAmount,
      withholdingAmount: 0,
    };
  }

  const openNetPayableAmount = Math.max(
    estimatedNetPayableAmount - toMoney(row.paidAmount),
    0,
  );
  const cashRequirementAmount = roundMoney(
    Math.min(grossBalanceAmount, openNetPayableAmount),
  );

  return {
    cashRequirementAmount,
    grossBalanceAmount,
    withholdingAmount: roundMoney(
      Math.min(
        withholdingAmount,
        Math.max(grossBalanceAmount - cashRequirementAmount, 0),
      ),
    ),
  };
};

const sumCashRequirement = (rows: AccountsPayableRow[]): number =>
  roundMoney(
    rows.reduce(
      (sum, row) =>
        sum + resolveAccountsPayableProposalCashSnapshot(row).cashRequirementAmount,
      0,
    ),
  );

const sumWithholding = (rows: AccountsPayableRow[]): number =>
  roundMoney(
    rows.reduce(
      (sum, row) =>
        sum + resolveAccountsPayableProposalCashSnapshot(row).withholdingAmount,
      0,
    ),
  );

export const isAccountsPayableRowPaymentEligible = (
  row: AccountsPayableRow,
): boolean => isAccountsPayablePaymentEligible(row);

export const sortAccountsPayableProposalRows = (
  rows: AccountsPayableRow[],
): AccountsPayableRow[] =>
  [...rows].sort((left, right) => {
    const priorityDelta =
      BUCKET_PRIORITY[left.agingBucket] - BUCKET_PRIORITY[right.agingBucket];
    if (priorityDelta !== 0) return priorityDelta;

    if (
      left.dueAt != null &&
      right.dueAt != null &&
      left.dueAt !== right.dueAt
    ) {
      return left.dueAt - right.dueAt;
    }

    if (left.dueAt == null && right.dueAt != null) return 1;
    if (left.dueAt != null && right.dueAt == null) return -1;

    const balanceDelta = right.balanceAmount - left.balanceAmount;
    if (balanceDelta !== 0) return balanceDelta;

    return left.reference.localeCompare(right.reference);
  });

const buildExclusionSummaries = (
  rows: AccountsPayableRow[],
): AccountsPayablePaymentProposalExclusion[] => {
  const summaryMap = new Map<
    AccountsPayableRow['paymentControl']['status'],
    AccountsPayablePaymentProposalExclusion
  >();

  rows.forEach((row) => {
    const { paymentControl } = row;
    const current = summaryMap.get(paymentControl.status) ?? {
      amount: 0,
      count: 0,
      label: paymentControl.label,
      reasons: [],
      status: paymentControl.status,
    };
    const reason = paymentControl.reason?.trim();

    current.amount += toMoney(row.balanceAmount);
    current.count += 1;
    if (reason && !current.reasons.includes(reason)) {
      current.reasons.push(reason);
    }
    summaryMap.set(paymentControl.status, current);
  });

  return [...summaryMap.values()].sort((left, right) => {
    const priorityDelta =
      EXCLUSION_STATUS_PRIORITY[left.status] -
      EXCLUSION_STATUS_PRIORITY[right.status];
    if (priorityDelta !== 0) return priorityDelta;

    const amountDelta = right.amount - left.amount;
    if (amountDelta !== 0) return amountDelta;

    return left.label.localeCompare(right.label);
  });
};

export const buildAccountsPayablePaymentProposal = (
  rows: AccountsPayableRow[],
): AccountsPayablePaymentProposal => {
  const visibleRows = rows.filter((row) => row.balanceAmount > 0);
  const eligibleRows = visibleRows.filter(isAccountsPayableRowPaymentEligible);
  const blockedRows = visibleRows.filter(
    (row) => !isAccountsPayableRowPaymentEligible(row),
  );
  const noDueDateRows = eligibleRows.filter(
    (row) => row.agingBucket === 'no_due_date',
  );
  const recommendedRows = eligibleRows.filter(
    (row) => row.agingBucket !== 'no_due_date',
  );
  const overdueRows = eligibleRows.filter((row) =>
    OVERDUE_BUCKETS.has(row.agingBucket),
  );
  const dueSoonRows = eligibleRows.filter(
    (row) =>
      row.agingBucket === 'current' &&
      typeof row.daysUntilDue === 'number' &&
      row.daysUntilDue >= 0 &&
      row.daysUntilDue <= DUE_SOON_DAYS,
  );
  const supplierMap = new Map<string, AccountsPayablePaymentProposalSupplier>();

  eligibleRows.forEach((row) => {
    const providerKey = row.providerId ?? `name:${row.providerName}`;
    const current = supplierMap.get(providerKey) ?? {
      balanceAmount: 0,
      cashRequirementAmount: 0,
      count: 0,
      overdueAmount: 0,
      providerId: row.providerId,
      providerName: row.providerName,
      withholdingAmount: 0,
    };
    const cashSnapshot = resolveAccountsPayableProposalCashSnapshot(row);

    current.balanceAmount += toMoney(row.balanceAmount);
    current.cashRequirementAmount += cashSnapshot.cashRequirementAmount;
    current.count += 1;
    current.withholdingAmount += cashSnapshot.withholdingAmount;
    if (OVERDUE_BUCKETS.has(row.agingBucket)) {
      current.overdueAmount += toMoney(row.balanceAmount);
    }
    supplierMap.set(providerKey, current);
  });

  const supplierSummaries = [...supplierMap.values()]
    .map((supplier) => ({
      ...supplier,
      balanceAmount: roundMoney(supplier.balanceAmount),
      cashRequirementAmount: roundMoney(supplier.cashRequirementAmount),
      overdueAmount: roundMoney(supplier.overdueAmount),
      withholdingAmount: roundMoney(supplier.withholdingAmount),
    }))
    .sort((left, right) => {
      const overdueDelta = right.overdueAmount - left.overdueAmount;
      if (overdueDelta !== 0) return overdueDelta;

      const balanceDelta = right.balanceAmount - left.balanceAmount;
      if (balanceDelta !== 0) return balanceDelta;

      return left.providerName.localeCompare(right.providerName);
    });

  return {
    blockedAmount: sumBalance(blockedRows),
    blockedCashRequirementAmount: sumCashRequirement(blockedRows),
    blockedCount: blockedRows.length,
    blockedWithholdingAmount: sumWithholding(blockedRows),
    dueSoonAmount: sumBalance(dueSoonRows),
    dueSoonCount: dueSoonRows.length,
    dueSoonRows: sortAccountsPayableProposalRows(dueSoonRows),
    eligibleAmount: sumBalance(eligibleRows),
    eligibleCashRequirementAmount: sumCashRequirement(eligibleRows),
    eligibleCount: eligibleRows.length,
    eligibleWithholdingAmount: sumWithholding(eligibleRows),
    exclusionSummaries: buildExclusionSummaries(blockedRows),
    noDueDateAmount: sumBalance(noDueDateRows),
    noDueDateCount: noDueDateRows.length,
    overdueAmount: sumBalance(overdueRows),
    recommendedRows: sortAccountsPayableProposalRows(recommendedRows),
    reviewRows: sortAccountsPayableProposalRows(noDueDateRows),
    supplierSummaries,
    visibleAmount: sumBalance(visibleRows),
    visibleCashRequirementAmount: sumCashRequirement(visibleRows),
    visibleCount: visibleRows.length,
    visibleWithholdingAmount: sumWithholding(visibleRows),
  };
};
