import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { db } from '@/firebase/firebaseconfig';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type {
  HrCommissionCutRuleInput,
  HrCommissionCutRuleFrequency,
  HrCommissionCutRuleRecord,
  HrCommissionEntryRecord,
  HrCommissionNextCutPreview,
  HrCommissionRetroactiveEntriesResponse,
  HrCommissionRetroactiveEntryAction,
  HrCommissionRetroactiveEntryRecord,
  HrRetroactiveResolutionStatus,
  HrEmployeePaymentRecord,
  HrEmployeePaymentStatus,
  HrPaymentMethod,
  HrCommissionPeriodRecord,
  HrCommissionPeriodStatus,
  HrPayrollEmployeeLineRecord,
  HrPayrollRunStatus,
} from '@/types/hrPayroll';
import { normalizeHrDepositAccount } from '@/utils/hrPayroll/depositAccounts';
import { normalizeSalaryDeductionLines } from '@/utils/hrPayroll/salaryDeductions';
import { normalizeHrCommissionEntryRecord } from './useHrCommissionEntries';

type ManageHrCommissionPeriodAction =
  | 'preview_next'
  | 'list_retroactive_entries'
  | 'resolve_retroactive_entries'
  | 'unresolve_retroactive_entries'
  | 'create'
  | 'close'
  | 'approve'
  | 'revert_approval'
  | 'adjust_line';
type ManageHrCommissionCutRuleAction =
  | 'upsert_cut_rule'
  | 'deactivate_cut_rule';
type ManageHrPayrollPaymentAction = 'record';

interface UseHrCommissionCutRulesArgs {
  businessId?: string | null;
  pageSize?: number;
}

interface UseHrCommissionPeriodsArgs {
  businessId?: string | null;
  pageSize?: number;
}

interface UseHrCommissionNextCutPreviewArgs {
  businessId?: string | null;
  refreshKey?: number | string;
  ruleId?: string | null;
}

interface UseHrCommissionRetroactiveEntriesArgs {
  businessId?: string | null;
  refreshKey?: number | string;
  ruleId?: string | null;
}

interface UseHrPayrollEmployeeLinesArgs {
  businessId?: string | null;
  periodId?: string | null;
}

interface UseHrCommissionPeriodEntriesArgs {
  businessId?: string | null;
  periodId?: string | null;
}

interface UseHrEmployeePaymentsArgs {
  businessId?: string | null;
  periodId?: string | null;
}

interface HookState<T> {
  error: Error | null;
  key: string;
  loading: boolean;
  rows: T[];
}

interface PreviewHookState {
  error: Error | null;
  key: string;
  preview: HrCommissionNextCutPreview | null;
}

interface RetroactiveEntriesHookState {
  error: Error | null;
  key: string;
  result: HrCommissionRetroactiveEntriesResponse | null;
}

interface UseHrCommissionCutRulesResult {
  error: Error | null;
  loading: boolean;
  rows: HrCommissionCutRuleRecord[];
}

interface UseHrCommissionPeriodsResult {
  error: Error | null;
  loading: boolean;
  rows: HrCommissionPeriodRecord[];
}

interface UseHrCommissionNextCutPreviewResult {
  error: Error | null;
  loading: boolean;
  preview: HrCommissionNextCutPreview | null;
}

interface UseHrCommissionRetroactiveEntriesResult {
  error: Error | null;
  loading: boolean;
  result: HrCommissionRetroactiveEntriesResponse | null;
}

interface UseHrPayrollEmployeeLinesResult {
  error: Error | null;
  loading: boolean;
  rows: HrPayrollEmployeeLineRecord[];
}

interface UseHrCommissionPeriodEntriesResult {
  error: Error | null;
  loading: boolean;
  rows: HrCommissionEntryRecord[];
}

interface UseHrEmployeePaymentsResult {
  error: Error | null;
  loading: boolean;
  rows: HrEmployeePaymentRecord[];
}

interface ManageHrCommissionPeriodArgs {
  action: ManageHrCommissionPeriodAction;
  businessId: string;
  comment?: string | null;
  cutRuleId?: string | null;
  endDate?: Date | string | null;
  entryIds?: string[];
  periodId?: string | null;
  payrollLineId?: string | null;
  ruleId?: string | null;
  startDate?: Date | string | null;
  totalToPay?: number | string | null;
}

interface AdjustHrPayrollLinePayableArgs {
  businessId: string;
  comment: string;
  payrollLineId: string;
  totalToPay: number | string;
}

interface ManageHrCommissionCutRuleArgs {
  action?: ManageHrCommissionCutRuleAction;
  businessId: string;
  rule: HrCommissionCutRuleInput;
}

interface DeactivateHrCommissionCutRuleArgs {
  businessId: string;
  ruleId: string;
}

interface ManageHrPayrollPaymentArgs {
  action?: ManageHrPayrollPaymentAction;
  amount?: number | string | null;
  bankAccountId?: string | null;
  businessId: string;
  cashAccountId?: string | null;
  cashCountId?: string | null;
  checkNumber?: string | null;
  paymentDate?: Date | string | null;
  paymentMethod?: HrPaymentMethod | null;
  payrollLineId: string;
  reference?: string | null;
  transferReference?: string | null;
}

type ManageHrCommissionPeriodPayload = {
  action: ManageHrCommissionPeriodAction;
  businessId: string;
  comment?: string | null;
  cutRuleId?: string | null;
  endDate?: string | null;
  entryIds?: string[];
  periodId?: string | null;
  payrollLineId?: string | null;
  ruleId?: string | null;
  sessionToken?: string;
  startDate?: string | null;
  totalToPay?: number | string | null;
};

type ManageHrCommissionCutRulePayload = {
  action: ManageHrCommissionCutRuleAction;
  active?: boolean | null;
  businessId: string;
  cutRuleId?: string | null;
  endDay?: number | string | null;
  frequency?: string | null;
  label?: string | null;
  ruleId?: string | null;
  sessionToken?: string;
  sortOrder?: number | string | null;
  startDay?: number | string | null;
};

type ManageHrPayrollPaymentPayload = {
  action: ManageHrPayrollPaymentAction;
  amount?: number | string | null;
  bankAccountId?: string | null;
  businessId: string;
  cashAccountId?: string | null;
  cashCountId?: string | null;
  checkNumber?: string | null;
  paymentDate?: string | null;
  paymentMethod?: HrPaymentMethod | null;
  payrollLineId: string;
  reference?: string | null;
  sessionToken?: string;
  transferReference?: string | null;
};

export interface ManageHrCommissionPeriodResponse {
  ok: boolean;
  reused?: boolean;
  businessId: string;
  periodId: string;
  payrollRunId?: string | null;
  accountingEventId?: string | null;
  status: HrCommissionPeriodStatus;
  entriesCount: number;
  employeesCount: number;
  totalCommissionAmount: number;
  deductionsAmount?: number;
  grossAmount?: number;
  netAmount?: number;
  payrollLineId?: string | null;
}

export interface ManageHrCommissionRetroactiveResolutionResponse {
  ok: boolean;
  businessId: string;
  targetPeriodId?: string | null;
  resolvedCount?: number;
  unresolvedCount?: number;
  entryIds: string[];
}

type ManageHrCommissionPeriodCallableResponse =
  | ManageHrCommissionPeriodResponse
  | HrCommissionNextCutPreview
  | HrCommissionRetroactiveEntriesResponse
  | ManageHrCommissionRetroactiveResolutionResponse;

export interface ManageHrCommissionCutRuleResponse {
  ok: boolean;
  businessId: string;
  ruleId: string;
  rule: HrCommissionCutRuleRecord;
}

export interface ManageHrPayrollPaymentResponse {
  ok: boolean;
  reused?: boolean;
  businessId: string;
  paymentId: string;
  periodId?: string | null;
  payrollRunId?: string | null;
  payrollLineId?: string | null;
  employeeId?: string | null;
  amount: number;
  currency: string;
  status: HrEmployeePaymentStatus;
  accountingEventId?: string | null;
  cashMovementIds: string[];
}

const manageHrCommissionPeriodCallable = createFirebaseCallable<
  ManageHrCommissionPeriodPayload,
  ManageHrCommissionPeriodCallableResponse
>('manageHrCommissionPeriod');

const manageHrCommissionCutRuleCallable = createFirebaseCallable<
  ManageHrCommissionCutRulePayload,
  ManageHrCommissionCutRuleResponse
>('manageHrCommissionPeriod');

const manageHrPayrollPaymentCallable = createFirebaseCallable<
  ManageHrPayrollPaymentPayload,
  ManageHrPayrollPaymentResponse
>('manageHrPayrollPayment');

const PERIOD_STATUS_VALUES = new Set<HrCommissionPeriodStatus>([
  'draft',
  'closed',
  'approved',
  'partially_paid',
  'paid',
  'cancelled',
]);

const RUN_STATUS_VALUES = new Set<HrPayrollRunStatus>([
  'draft',
  'closed',
  'approved',
  'partially_paid',
  'paid',
  'cancelled',
]);

const PAYMENT_STATUS_VALUES = new Set<HrEmployeePaymentStatus>([
  'confirmed',
  'voided',
]);

const PAYMENT_METHOD_VALUES = new Set<HrPaymentMethod>([
  'cash',
  'bank_transfer',
  'transfer',
  'check',
  'card',
  'other',
]);

const CUT_RULE_FREQUENCY_VALUES = new Set<HrCommissionCutRuleFrequency>([
  'weekly',
  'biweekly',
  'monthly',
]);

const RETROACTIVE_ENTRY_ACTION_VALUES =
  new Set<HrCommissionRetroactiveEntryAction>([
    'adjustment_required',
    'recalculable',
    'selected_for_next_cut',
    'selected_for_other_cut',
    'included_in_cut',
    'paid',
    'review_required',
  ]);

const RETROACTIVE_RESOLUTION_STATUS_VALUES =
  new Set<HrRetroactiveResolutionStatus>([
    'selected_for_next_cut',
    'included_in_cut',
    'paid',
    'cancelled',
  ]);

const isNonNullableString = (value: string | null): value is string =>
  Boolean(value);

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toMoneyNumber = (value: unknown, fallback = 0): number =>
  Math.max(0, toFiniteNumber(value, fallback));

const resolveGrossAmount = (data: Record<string, unknown>): number =>
  toMoneyNumber(
    data.grossAmount ??
      data.commissionAmount ??
      data.totalCommissionAmount ??
      data.netAmount,
  );

const resolveNetAmount = (data: Record<string, unknown>): number =>
  toMoneyNumber(
    data.netAmount ??
      data.totalPayableAmount ??
      data.commissionAmount ??
      data.grossAmount ??
      data.totalCommissionAmount,
  );

const resolveDeductionsAmount = (data: Record<string, unknown>): number => {
  const explicitDeduction = toMoneyNumber(data.deductionsAmount);
  if (explicitDeduction > 0) return explicitDeduction;
  return Math.max(0, resolveGrossAmount(data) - resolveNetAmount(data));
};

const toDayNumber = (value: unknown, fallback: number): number => {
  const parsed = Math.trunc(toFiniteNumber(value, fallback));
  return parsed >= 1 && parsed <= 31 ? parsed : fallback;
};

const isLegacyBiweeklyCutRuleRange = (
  startDay: number,
  endDay: number,
): boolean =>
  (startDay === 1 && endDay === 15) || (startDay === 16 && endDay >= 28);

const normalizeCutRuleFrequency = (
  data: Record<string, unknown>,
): HrCommissionCutRuleFrequency => {
  const startDay = toDayNumber(data.startDay, 1);
  const endDay = toDayNumber(data.endDay, 31);
  const normalized = toCleanString(data.frequency)?.toLowerCase() as
    | HrCommissionCutRuleFrequency
    | undefined;

  if (
    normalized === 'monthly' &&
    isLegacyBiweeklyCutRuleRange(startDay, endDay)
  ) {
    return 'biweekly';
  }

  return normalized && CUT_RULE_FREQUENCY_VALUES.has(normalized)
    ? normalized
    : 'monthly';
};

const normalizeEnum = <T extends string>(
  value: unknown,
  allowedValues: Set<T>,
  fallback: T,
): T => {
  const normalized = toCleanString(value)?.toLowerCase() as T | undefined;
  return normalized && allowedValues.has(normalized) ? normalized : fallback;
};

const toCallableDate = (
  value: Date | string | null | undefined,
): string | null => {
  if (value instanceof Date) return value.toISOString();
  return toCleanString(value);
};

const normalizePaymentMethod = (value: unknown): HrPaymentMethod => {
  const normalized = toCleanString(value)?.toLowerCase() as
    | HrPaymentMethod
    | undefined;
  return normalized && PAYMENT_METHOD_VALUES.has(normalized)
    ? normalized
    : 'bank_transfer';
};

const normalizeCashMovementIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(toCleanString).filter(isNonNullableString)
    : [];

const normalizeCutRuleRecord = (
  id: string,
  data: Record<string, unknown>,
): HrCommissionCutRuleRecord => ({
  ...data,
  id,
  businessId: toCleanString(data.businessId) ?? '',
  label: toCleanString(data.label) ?? 'Corte',
  frequency: normalizeCutRuleFrequency(data),
  startDay: toDayNumber(data.startDay, 1),
  endDay: toDayNumber(data.endDay, 31),
  businessTimeZone:
    toCleanString(data.businessTimeZone) ?? 'America/Santo_Domingo',
  active: data.active !== false,
  sortOrder: toFiniteNumber(data.sortOrder, toDayNumber(data.startDay, 1)),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const toMillis = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && 'toMillis' in value) {
    const millis = (value as { toMillis: () => unknown }).toMillis();
    return Number(millis) || 0;
  }
  if (typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => unknown }).toDate();
    return date instanceof Date ? date.getTime() : 0;
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePeriodRecord = (
  id: string,
  data: Record<string, unknown>,
): HrCommissionPeriodRecord => ({
  ...data,
  id,
  businessId: toCleanString(data.businessId) ?? '',
  type: 'commission',
  periodKey: toCleanString(data.periodKey),
  label: toCleanString(data.label),
  status: normalizeEnum(data.status, PERIOD_STATUS_VALUES, 'draft'),
  startDateKey: toCleanString(data.startDateKey),
  endDateKey: toCleanString(data.endDateKey),
  businessTimeZone:
    toCleanString(data.businessTimeZone) ?? 'America/Santo_Domingo',
  startDate: data.startDate,
  endDate: data.endDate,
  cutRuleId: toCleanString(data.cutRuleId),
  cutRuleLabel: toCleanString(data.cutRuleLabel),
  cutRuleSnapshot:
    data.cutRuleSnapshot && typeof data.cutRuleSnapshot === 'object'
      ? (data.cutRuleSnapshot as Record<string, unknown>)
      : null,
  currency: toCleanString(data.currency)?.toUpperCase() ?? 'DOP',
  entriesCount: Math.max(0, toFiniteNumber(data.entriesCount)),
  employeesCount: Math.max(0, toFiniteNumber(data.employeesCount)),
  totalCommissionAmount: Math.max(
    0,
    toFiniteNumber(data.totalCommissionAmount),
  ),
  normalEntriesCount: Math.max(0, toFiniteNumber(data.normalEntriesCount)),
  retroactiveAdjustmentAmount: toMoneyNumber(data.retroactiveAdjustmentAmount),
  retroactiveAdjustmentsCount: Math.max(
    0,
    toFiniteNumber(data.retroactiveAdjustmentsCount),
  ),
  retroactiveSourcePeriods: Array.isArray(data.retroactiveSourcePeriods)
    ? data.retroactiveSourcePeriods.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === 'object',
      )
    : [],
  hasRetroactiveAdjustments: Boolean(data.hasRetroactiveAdjustments),
  grossAmount: resolveGrossAmount(data),
  deductionsAmount: resolveDeductionsAmount(data),
  netAmount: resolveNetAmount(data),
  totalPayableAmount: resolveNetAmount(data),
  manualAdjustmentAmount: toMoneyNumber(data.manualAdjustmentAmount),
  adjustmentsCount: Math.max(0, toFiniteNumber(data.adjustmentsCount)),
  lastAdjustmentComment: toCleanString(data.lastAdjustmentComment),
  paidAmount: Math.max(0, toFiniteNumber(data.paidAmount)),
  paidLinesCount: Math.max(0, toFiniteNumber(data.paidLinesCount)),
  lastPaymentId: toCleanString(data.lastPaymentId),
  payrollRunId: toCleanString(data.payrollRunId),
  accountingEventId: toCleanString(data.accountingEventId),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const normalizePayrollEmployeeLineRecord = (
  id: string,
  data: Record<string, unknown>,
): HrPayrollEmployeeLineRecord => ({
  ...data,
  id,
  businessId: toCleanString(data.businessId) ?? '',
  periodId: toCleanString(data.periodId) ?? '',
  payrollRunId: toCleanString(data.payrollRunId) ?? '',
  employeeId: toCleanString(data.employeeId) ?? '',
  employeeCode: toCleanString(data.employeeCode),
  employeeNameSnapshot: toCleanString(data.employeeNameSnapshot),
  partyId: toCleanString(data.partyId),
  type:
    data.type === 'salary' || data.type === 'mixed' ? data.type : 'commission',
  status: normalizeEnum(data.status, RUN_STATUS_VALUES, 'draft'),
  currency: toCleanString(data.currency)?.toUpperCase() ?? 'DOP',
  baseSalaryAmount: Math.max(0, toFiniteNumber(data.baseSalaryAmount)),
  grossAmount: resolveGrossAmount(data),
  deductionsAmount: resolveDeductionsAmount(data),
  netAmount: resolveNetAmount(data),
  totalPayableAmount: resolveNetAmount(data),
  commissionAmount: Math.max(0, toFiniteNumber(data.commissionAmount)),
  retroactiveAdjustmentAmount: toMoneyNumber(data.retroactiveAdjustmentAmount),
  retroactiveAdjustmentsCount: Math.max(
    0,
    toFiniteNumber(data.retroactiveAdjustmentsCount),
  ),
  retroactiveEntryIds: Array.isArray(data.retroactiveEntryIds)
    ? data.retroactiveEntryIds.map(toCleanString).filter(isNonNullableString)
    : [],
  retroactiveSourcePeriods: Array.isArray(data.retroactiveSourcePeriods)
    ? data.retroactiveSourcePeriods.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === 'object',
      )
    : [],
  hasRetroactiveAdjustments: Boolean(data.hasRetroactiveAdjustments),
  deductionLines: normalizeSalaryDeductionLines(
    data.deductionLines ?? data.salaryDeductions,
  ),
  commissionEntryIds: Array.isArray(data.commissionEntryIds)
    ? data.commissionEntryIds.map(toCleanString).filter(isNonNullableString)
    : [],
  entriesCount: Math.max(0, toFiniteNumber(data.entriesCount)),
  manualAdjustmentAmount: toMoneyNumber(data.manualAdjustmentAmount),
  manualAdjustmentComment: toCleanString(data.manualAdjustmentComment),
  manualAdjustmentHistory: Array.isArray(data.manualAdjustmentHistory)
    ? data.manualAdjustmentHistory.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === 'object',
      )
    : [],
  accountingEventId: toCleanString(data.accountingEventId),
  employeePaymentId: toCleanString(data.employeePaymentId),
  paymentDestination: toCleanString(data.paymentDestination),
  depositAccount: normalizeHrDepositAccount(data.depositAccount),
  paymentMethod: data.paymentMethod
    ? normalizePaymentMethod(data.paymentMethod)
    : null,
  paymentAccountingEventId: toCleanString(data.paymentAccountingEventId),
  cashMovementIds: normalizeCashMovementIds(data.cashMovementIds),
  paidAt: data.paidAt,
});

const normalizeHrEmployeePaymentRecord = (
  id: string,
  data: Record<string, unknown>,
): HrEmployeePaymentRecord => ({
  ...data,
  id,
  businessId: toCleanString(data.businessId) ?? '',
  periodId: toCleanString(data.periodId),
  payrollRunId: toCleanString(data.payrollRunId),
  payrollLineId: toCleanString(data.payrollLineId),
  employeeId: toCleanString(data.employeeId),
  employeeCode: toCleanString(data.employeeCode),
  employeeNameSnapshot: toCleanString(data.employeeNameSnapshot),
  partyId: toCleanString(data.partyId),
  amount: Math.max(0, toFiniteNumber(data.amount)),
  currency: toCleanString(data.currency)?.toUpperCase() ?? 'DOP',
  status: normalizeEnum(data.status, PAYMENT_STATUS_VALUES, 'confirmed'),
  paymentMethod: normalizePaymentMethod(data.paymentMethod),
  paymentChannel:
    data.paymentChannel === 'cash' ||
    data.paymentChannel === 'bank' ||
    data.paymentChannel === 'other'
      ? data.paymentChannel
      : null,
  reference: toCleanString(data.reference),
  transferReference: toCleanString(data.transferReference),
  checkNumber: toCleanString(data.checkNumber),
  cashAccountId: toCleanString(data.cashAccountId),
  cashCountId: toCleanString(data.cashCountId),
  bankAccountId: toCleanString(data.bankAccountId),
  paymentDestination: toCleanString(data.paymentDestination),
  depositAccount: normalizeHrDepositAccount(data.depositAccount),
  accountingEventId: toCleanString(data.accountingEventId),
  cashMovementIds: normalizeCashMovementIds(data.cashMovementIds),
  paymentDate: data.paymentDate,
  createdAt: data.createdAt,
  createdBy: toCleanString(data.createdBy),
});

const normalizeNextCutPreview = (
  data: ManageHrCommissionPeriodCallableResponse,
): HrCommissionNextCutPreview => {
  const record = data as Record<string, unknown>;
  const blockedReason = toCleanString(record.blockedReason);
  const exceedsMaxCutEntries = Boolean(record.exceedsMaxCutEntries);
  const retroactiveEntriesCount = Math.max(
    0,
    toFiniteNumber(record.retroactiveEntriesCount),
  );
  const pendingRetroactiveEntriesCount = Math.max(
    0,
    toFiniteNumber(record.pendingRetroactiveEntriesCount),
  );
  const incompatibleRetroactiveEntriesCount = Math.max(
    0,
    toFiniteNumber(record.incompatibleRetroactiveEntriesCount),
  );
  const reviewRequiredRetroactiveEntriesCount = Math.max(
    0,
    toFiniteNumber(record.reviewRequiredRetroactiveEntriesCount),
  );
  const hasBlockingRetroactiveEntries =
    Boolean(record.hasRetroactiveEntries) ||
    pendingRetroactiveEntriesCount > 0 ||
    incompatibleRetroactiveEntriesCount > 0 ||
    reviewRequiredRetroactiveEntriesCount > 0;
  const blocked =
    Boolean(record.blocked) ||
    Boolean(blockedReason) ||
    exceedsMaxCutEntries ||
    hasBlockingRetroactiveEntries;

  return {
    ...record,
    ok: record.ok !== false,
    preview: true,
    blocked,
    blockedReason,
    businessId: toCleanString(record.businessId),
    ruleId: toCleanString(record.ruleId),
    ruleLabel: toCleanString(record.ruleLabel),
    frequency: normalizeCutRuleFrequency(record),
    startDateKey: toCleanString(record.startDateKey),
    endDateKey: toCleanString(record.endDateKey),
    businessTimeZone:
      toCleanString(record.businessTimeZone) ?? 'America/Santo_Domingo',
    employeesCount: Math.max(0, toFiniteNumber(record.employeesCount)),
    entriesCount: Math.max(0, toFiniteNumber(record.entriesCount)),
    normalEntriesCount: Math.max(0, toFiniteNumber(record.normalEntriesCount)),
    totalEstimatedAmount: Math.max(
      0,
      toFiniteNumber(record.totalEstimatedAmount),
    ),
    currency: toCleanString(record.currency)?.toUpperCase() ?? 'DOP',
    exceedsMaxCutEntries,
    maxCutEntries: Math.max(0, toFiniteNumber(record.maxCutEntries, 450)),
    retroactiveEntriesCount,
    selectedRetroactiveEntriesCount: Math.max(
      0,
      toFiniteNumber(record.selectedRetroactiveEntriesCount),
    ),
    pendingRetroactiveEntriesCount,
    recalculableRetroactiveEntriesCount: Math.max(
      0,
      toFiniteNumber(record.recalculableRetroactiveEntriesCount),
    ),
    incompatibleRetroactiveEntriesCount,
    reviewRequiredRetroactiveEntriesCount,
    retroactiveAdjustmentAmount: toMoneyNumber(
      record.retroactiveAdjustmentAmount,
    ),
    hasRetroactiveEntries: hasBlockingRetroactiveEntries,
    hasRetroactiveAdjustments: Boolean(record.hasRetroactiveAdjustments),
    canCreate: Boolean(record.canCreate) && !blocked,
  };
};

const normalizeRetroactiveEntryRecord = (
  data: Record<string, unknown>,
): HrCommissionRetroactiveEntryRecord => ({
  ...data,
  id: toCleanString(data.id) ?? toCleanString(data.entryId) ?? '',
  entryId: toCleanString(data.entryId) ?? toCleanString(data.id) ?? '',
  dateKey: toCleanString(data.dateKey),
  employeeId: toCleanString(data.employeeId),
  employeeCode: toCleanString(data.employeeCode),
  employeeNameSnapshot: toCleanString(data.employeeNameSnapshot),
  invoiceId: toCleanString(data.invoiceId),
  invoiceNumber: toCleanString(data.invoiceNumber),
  serviceId: toCleanString(data.serviceId),
  serviceName: toCleanString(data.serviceName),
  commissionAmount: toMoneyNumber(data.commissionAmount),
  currency: toCleanString(data.currency)?.toUpperCase() ?? 'DOP',
  originalPeriodId: toCleanString(data.originalPeriodId),
  originalPeriodLabel: toCleanString(data.originalPeriodLabel),
  originalStartDateKey: toCleanString(data.originalStartDateKey),
  originalEndDateKey: toCleanString(data.originalEndDateKey),
  originalPeriodStatus: normalizeEnum(
    data.originalPeriodStatus,
    PERIOD_STATUS_VALUES,
    'draft',
  ),
  retroactiveResolutionStatus: data.retroactiveResolutionStatus
    ? normalizeEnum(
        data.retroactiveResolutionStatus,
        RETROACTIVE_RESOLUTION_STATUS_VALUES,
        'selected_for_next_cut',
      )
    : null,
  retroactiveTargetPeriodId: toCleanString(data.retroactiveTargetPeriodId),
  selectedForCurrentCut: Boolean(data.selectedForCurrentCut),
  action: normalizeEnum(
    data.action,
    RETROACTIVE_ENTRY_ACTION_VALUES,
    'review_required',
  ),
});

const normalizeRetroactiveEntriesResponse = (
  data: ManageHrCommissionPeriodCallableResponse,
): HrCommissionRetroactiveEntriesResponse => {
  const record = data as Record<string, unknown>;
  const entries = Array.isArray(record.entries)
    ? record.entries
        .filter(
          (entry): entry is Record<string, unknown> =>
            Boolean(entry) && typeof entry === 'object',
        )
        .map(normalizeRetroactiveEntryRecord)
    : [];

  return {
    ...record,
    ok: record.ok !== false,
    businessId: toCleanString(record.businessId),
    ruleId: toCleanString(record.ruleId),
    ruleLabel: toCleanString(record.ruleLabel),
    targetPeriodId: toCleanString(record.targetPeriodId),
    startDateKey: toCleanString(record.startDateKey),
    endDateKey: toCleanString(record.endDateKey),
    businessTimeZone:
      toCleanString(record.businessTimeZone) ?? 'America/Santo_Domingo',
    totalCount: Math.max(0, toFiniteNumber(record.totalCount)),
    selectedForTargetCount: Math.max(
      0,
      toFiniteNumber(record.selectedForTargetCount),
    ),
    adjustmentRequiredCount: Math.max(
      0,
      toFiniteNumber(record.adjustmentRequiredCount),
    ),
    recalculableCount: Math.max(0, toFiniteNumber(record.recalculableCount)),
    selectedForOtherTargetCount: Math.max(
      0,
      toFiniteNumber(record.selectedForOtherTargetCount),
    ),
    reviewRequiredCount: Math.max(
      0,
      toFiniteNumber(record.reviewRequiredCount),
    ),
    retroactiveAdjustmentAmount: toMoneyNumber(
      record.retroactiveAdjustmentAmount,
    ),
    entries,
  };
};

export const manageHrCommissionPeriod = async ({
  action,
  businessId,
  comment,
  cutRuleId,
  endDate,
  entryIds,
  periodId,
  payrollLineId,
  ruleId,
  startDate,
  totalToPay,
}: ManageHrCommissionPeriodArgs): Promise<ManageHrCommissionPeriodResponse> => {
  if (!businessId) {
    throw new Error('Falta el negocio para gestionar el corte.');
  }

  const { sessionToken } = getStoredSession();
  const result = await manageHrCommissionPeriodCallable({
    action,
    businessId,
    comment: toCleanString(comment),
    cutRuleId: toCleanString(cutRuleId),
    endDate: toCallableDate(endDate),
    entryIds,
    periodId: toCleanString(periodId),
    payrollLineId: toCleanString(payrollLineId),
    ruleId: toCleanString(ruleId),
    startDate: toCallableDate(startDate),
    totalToPay,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return result as ManageHrCommissionPeriodResponse;
};

export const previewHrCommissionPeriod = async ({
  businessId,
  ruleId,
}: {
  businessId: string;
  ruleId: string;
}): Promise<HrCommissionNextCutPreview> => {
  if (!businessId || !ruleId) {
    throw new Error('Falta la regla activa para previsualizar el corte.');
  }

  const { sessionToken } = getStoredSession();
  const result = await manageHrCommissionPeriodCallable({
    action: 'preview_next',
    businessId,
    ruleId: toCleanString(ruleId),
    ...(sessionToken ? { sessionToken } : {}),
  });

  return normalizeNextCutPreview(result);
};

export const listHrCommissionRetroactiveEntries = async ({
  businessId,
  ruleId,
}: {
  businessId: string;
  ruleId: string;
}): Promise<HrCommissionRetroactiveEntriesResponse> => {
  if (!businessId || !ruleId) {
    throw new Error('Falta la regla activa para revisar retroactivas.');
  }

  const { sessionToken } = getStoredSession();
  const result = await manageHrCommissionPeriodCallable({
    action: 'list_retroactive_entries',
    businessId,
    ruleId: toCleanString(ruleId),
    ...(sessionToken ? { sessionToken } : {}),
  });

  return normalizeRetroactiveEntriesResponse(result);
};

export const resolveHrCommissionRetroactiveEntries = async ({
  businessId,
  entryIds,
  ruleId,
}: {
  businessId: string;
  entryIds: string[];
  ruleId: string;
}): Promise<ManageHrCommissionRetroactiveResolutionResponse> => {
  if (!businessId || !ruleId || !entryIds.length) {
    throw new Error('Faltan datos para incluir retroactivas.');
  }

  const { sessionToken } = getStoredSession();
  const result = await manageHrCommissionPeriodCallable({
    action: 'resolve_retroactive_entries',
    businessId,
    entryIds,
    ruleId,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return result as ManageHrCommissionRetroactiveResolutionResponse;
};

export const unresolveHrCommissionRetroactiveEntries = async ({
  businessId,
  entryIds,
  ruleId,
}: {
  businessId: string;
  entryIds: string[];
  ruleId: string;
}): Promise<ManageHrCommissionRetroactiveResolutionResponse> => {
  if (!businessId || !ruleId || !entryIds.length) {
    throw new Error('Faltan datos para quitar retroactivas.');
  }

  const { sessionToken } = getStoredSession();
  const result = await manageHrCommissionPeriodCallable({
    action: 'unresolve_retroactive_entries',
    businessId,
    entryIds,
    ruleId,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return result as ManageHrCommissionRetroactiveResolutionResponse;
};

export const adjustHrPayrollLinePayable = async ({
  businessId,
  comment,
  payrollLineId,
  totalToPay,
}: AdjustHrPayrollLinePayableArgs): Promise<ManageHrCommissionPeriodResponse> =>
  manageHrCommissionPeriod({
    action: 'adjust_line',
    businessId,
    comment,
    payrollLineId,
    totalToPay,
  });

export const saveHrCommissionCutRule = async ({
  action = 'upsert_cut_rule',
  businessId,
  rule,
}: ManageHrCommissionCutRuleArgs): Promise<ManageHrCommissionCutRuleResponse> => {
  if (!businessId) {
    throw new Error('Falta el negocio para guardar la regla.');
  }

  const { sessionToken } = getStoredSession();
  const normalizedRuleId = toCleanString(rule.ruleId ?? rule.id);
  return manageHrCommissionCutRuleCallable({
    action,
    active: rule.active,
    businessId,
    cutRuleId: normalizedRuleId,
    endDay: rule.endDay,
    frequency: rule.frequency ?? 'monthly',
    label: toCleanString(rule.label),
    ruleId: normalizedRuleId,
    sortOrder: rule.sortOrder,
    startDay: rule.startDay,
    ...(sessionToken ? { sessionToken } : {}),
  });
};

export const deactivateHrCommissionCutRule = async ({
  businessId,
  ruleId,
}: DeactivateHrCommissionCutRuleArgs): Promise<ManageHrCommissionCutRuleResponse> => {
  if (!businessId || !ruleId) {
    throw new Error('Faltan datos para desactivar la regla.');
  }

  const { sessionToken } = getStoredSession();
  return manageHrCommissionCutRuleCallable({
    action: 'deactivate_cut_rule',
    businessId,
    ruleId: toCleanString(ruleId),
    ...(sessionToken ? { sessionToken } : {}),
  });
};

export const recordHrPayrollPayment = async ({
  action = 'record',
  amount,
  bankAccountId,
  businessId,
  cashAccountId,
  cashCountId,
  checkNumber,
  paymentDate,
  paymentMethod,
  payrollLineId,
  reference,
  transferReference,
}: ManageHrPayrollPaymentArgs): Promise<ManageHrPayrollPaymentResponse> => {
  if (!businessId || !payrollLineId) {
    throw new Error('Faltan datos para registrar el pago.');
  }

  const { sessionToken } = getStoredSession();
  return manageHrPayrollPaymentCallable({
    action,
    amount,
    bankAccountId: toCleanString(bankAccountId),
    businessId,
    cashAccountId: toCleanString(cashAccountId),
    cashCountId: toCleanString(cashCountId),
    checkNumber: toCleanString(checkNumber),
    paymentDate: toCallableDate(paymentDate),
    paymentMethod: paymentMethod ? normalizePaymentMethod(paymentMethod) : null,
    payrollLineId,
    reference: toCleanString(reference),
    transferReference: toCleanString(transferReference),
    ...(sessionToken ? { sessionToken } : {}),
  });
};

export const useHrCommissionCutRules = ({
  businessId,
  pageSize = 80,
}: UseHrCommissionCutRulesArgs): UseHrCommissionCutRulesResult => {
  const [state, setState] = useState<HookState<HrCommissionCutRuleRecord>>({
    key: '',
    rows: [],
    loading: false,
    error: null,
  });
  const reportKey = useMemo(
    () => [businessId ?? 'no-business', pageSize].join('|'),
    [businessId, pageSize],
  );

  useEffect(() => {
    if (!businessId) return undefined;

    const rulesRef = collection(
      db,
      'businesses',
      businessId,
      'hrCommissionCutRules',
    );
    const rulesQuery = query(rulesRef, limit(pageSize));

    return onSnapshot(
      rulesQuery,
      (snapshot) => {
        const rows = snapshot.docs
          .map((docSnapshot) =>
            normalizeCutRuleRecord(
              docSnapshot.id,
              docSnapshot.data() as Record<string, unknown>,
            ),
          )
          .sort((left, right) => {
            const byActive = Number(right.active) - Number(left.active);
            if (byActive !== 0) return byActive;
            const byOrder = left.sortOrder - right.sortOrder;
            if (byOrder !== 0) return byOrder;
            return left.label.localeCompare(right.label);
          });

        setState({ key: reportKey, rows, loading: false, error: null });
      },
      (error) => {
        setState({ key: reportKey, rows: [], loading: false, error });
      },
    );
  }, [businessId, pageSize, reportKey]);

  if (!businessId) {
    return { rows: [], loading: false, error: null };
  }
  if (state.key !== reportKey) {
    return { rows: [], loading: true, error: null };
  }

  return state;
};

export const useHrCommissionPeriods = ({
  businessId,
  pageSize = 40,
}: UseHrCommissionPeriodsArgs): UseHrCommissionPeriodsResult => {
  const [state, setState] = useState<HookState<HrCommissionPeriodRecord>>({
    key: '',
    rows: [],
    loading: false,
    error: null,
  });
  const reportKey = useMemo(
    () => [businessId ?? 'no-business', pageSize].join('|'),
    [businessId, pageSize],
  );

  useEffect(() => {
    if (!businessId) return undefined;

    const periodsRef = collection(
      db,
      'businesses',
      businessId,
      'hrCommissionPeriods',
    );
    const periodsQuery = query(
      periodsRef,
      orderBy('endDate', 'desc'),
      limit(pageSize),
    );

    return onSnapshot(
      periodsQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((docSnapshot) =>
          normalizePeriodRecord(
            docSnapshot.id,
            docSnapshot.data() as Record<string, unknown>,
          ),
        );

        setState({ key: reportKey, rows, loading: false, error: null });
      },
      (error) => {
        setState({ key: reportKey, rows: [], loading: false, error });
      },
    );
  }, [businessId, pageSize, reportKey]);

  if (!businessId) {
    return { rows: [], loading: false, error: null };
  }
  if (state.key !== reportKey) {
    return { rows: [], loading: true, error: null };
  }

  return state;
};

export const useHrCommissionNextCutPreview = ({
  businessId,
  refreshKey = 0,
  ruleId,
}: UseHrCommissionNextCutPreviewArgs): UseHrCommissionNextCutPreviewResult => {
  const [state, setState] = useState<PreviewHookState>({
    key: '',
    preview: null,
    error: null,
  });
  const previewKey = useMemo(
    () =>
      [businessId ?? 'no-business', ruleId ?? 'no-rule', refreshKey].join('|'),
    [businessId, refreshKey, ruleId],
  );

  useEffect(() => {
    if (!businessId || !ruleId) return undefined;

    let active = true;
    void previewHrCommissionPeriod({ businessId, ruleId })
      .then((preview) => {
        if (!active) return;
        setState({ key: previewKey, preview, error: null });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          key: previewKey,
          preview: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => {
      active = false;
    };
  }, [businessId, previewKey, ruleId]);

  if (!businessId || !ruleId) {
    return { preview: null, loading: false, error: null };
  }
  if (state.key !== previewKey) {
    return { preview: null, loading: true, error: null };
  }

  return { preview: state.preview, loading: false, error: state.error };
};

export const useHrCommissionRetroactiveEntries = ({
  businessId,
  refreshKey = 0,
  ruleId,
}: UseHrCommissionRetroactiveEntriesArgs): UseHrCommissionRetroactiveEntriesResult => {
  const [state, setState] = useState<RetroactiveEntriesHookState>({
    key: '',
    result: null,
    error: null,
  });
  const reportKey = useMemo(
    () =>
      [businessId ?? 'no-business', ruleId ?? 'no-rule', refreshKey].join('|'),
    [businessId, refreshKey, ruleId],
  );

  useEffect(() => {
    if (!businessId || !ruleId) return undefined;

    let active = true;
    void listHrCommissionRetroactiveEntries({ businessId, ruleId })
      .then((result) => {
        if (!active) return;
        setState({ key: reportKey, result, error: null });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          key: reportKey,
          result: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => {
      active = false;
    };
  }, [businessId, reportKey, ruleId]);

  if (!businessId || !ruleId) {
    return { result: null, loading: false, error: null };
  }
  if (state.key !== reportKey) {
    return { result: null, loading: true, error: null };
  }

  return { result: state.result, loading: false, error: state.error };
};

export const useHrPayrollEmployeeLines = ({
  businessId,
  periodId,
}: UseHrPayrollEmployeeLinesArgs): UseHrPayrollEmployeeLinesResult => {
  const [state, setState] = useState<HookState<HrPayrollEmployeeLineRecord>>({
    key: '',
    rows: [],
    loading: false,
    error: null,
  });
  const reportKey = useMemo(
    () => [businessId ?? 'no-business', periodId ?? 'no-period'].join('|'),
    [businessId, periodId],
  );

  useEffect(() => {
    if (!businessId || !periodId) return undefined;

    const linesRef = collection(
      db,
      'businesses',
      businessId,
      'hrPayrollEmployeeLines',
    );
    const linesQuery = query(linesRef, where('periodId', '==', periodId));

    return onSnapshot(
      linesQuery,
      (snapshot) => {
        const rows = snapshot.docs
          .map((docSnapshot) =>
            normalizePayrollEmployeeLineRecord(
              docSnapshot.id,
              docSnapshot.data() as Record<string, unknown>,
            ),
          )
          .sort((left, right) =>
            (
              left.employeeNameSnapshot ||
              left.employeeCode ||
              left.employeeId
            ).localeCompare(
              right.employeeNameSnapshot ||
                right.employeeCode ||
                right.employeeId,
            ),
          );

        setState({ key: reportKey, rows, loading: false, error: null });
      },
      (error) => {
        setState({ key: reportKey, rows: [], loading: false, error });
      },
    );
  }, [businessId, periodId, reportKey]);

  if (!businessId || !periodId) {
    return { rows: [], loading: false, error: null };
  }
  if (state.key !== reportKey) {
    return { rows: [], loading: true, error: null };
  }

  return state;
};

export const useHrCommissionPeriodEntries = ({
  businessId,
  periodId,
}: UseHrCommissionPeriodEntriesArgs): UseHrCommissionPeriodEntriesResult => {
  const [state, setState] = useState<HookState<HrCommissionEntryRecord>>({
    key: '',
    rows: [],
    loading: false,
    error: null,
  });
  const reportKey = useMemo(
    () => [businessId ?? 'no-business', periodId ?? 'no-period'].join('|'),
    [businessId, periodId],
  );

  useEffect(() => {
    if (!businessId || !periodId) return undefined;

    const entriesRef = collection(
      db,
      'businesses',
      businessId,
      'hrCommissionEntries',
    );
    const entriesQuery = query(entriesRef, where('periodId', '==', periodId));

    return onSnapshot(
      entriesQuery,
      (snapshot) => {
        const rows = snapshot.docs
          .map((docSnapshot) =>
            normalizeHrCommissionEntryRecord(
              docSnapshot.id,
              docSnapshot.data() as Record<string, unknown>,
            ),
          )
          .sort((left, right) => toMillis(right.date) - toMillis(left.date));

        setState({ key: reportKey, rows, loading: false, error: null });
      },
      (error) => {
        setState({ key: reportKey, rows: [], loading: false, error });
      },
    );
  }, [businessId, periodId, reportKey]);

  if (!businessId || !periodId) {
    return { rows: [], loading: false, error: null };
  }
  if (state.key !== reportKey) {
    return { rows: [], loading: true, error: null };
  }

  return state;
};

export const useHrEmployeePayments = ({
  businessId,
  periodId,
}: UseHrEmployeePaymentsArgs): UseHrEmployeePaymentsResult => {
  const [state, setState] = useState<HookState<HrEmployeePaymentRecord>>({
    key: '',
    rows: [],
    loading: false,
    error: null,
  });
  const reportKey = useMemo(
    () => [businessId ?? 'no-business', periodId ?? 'no-period'].join('|'),
    [businessId, periodId],
  );

  useEffect(() => {
    if (!businessId || !periodId) return undefined;

    const paymentsRef = collection(
      db,
      'businesses',
      businessId,
      'hrEmployeePayments',
    );
    const paymentsQuery = query(
      paymentsRef,
      where('periodId', '==', periodId),
      limit(80),
    );

    return onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const rows = snapshot.docs
          .map((docSnapshot) =>
            normalizeHrEmployeePaymentRecord(
              docSnapshot.id,
              docSnapshot.data() as Record<string, unknown>,
            ),
          )
          .sort((left, right) => {
            const byDate =
              toMillis(right.paymentDate) - toMillis(left.paymentDate);
            if (byDate !== 0) return byDate;
            return (
              left.employeeNameSnapshot ||
              left.employeeCode ||
              left.employeeId ||
              left.id
            ).localeCompare(
              right.employeeNameSnapshot ||
                right.employeeCode ||
                right.employeeId ||
                right.id,
            );
          });

        setState({ key: reportKey, rows, loading: false, error: null });
      },
      (error) => {
        setState({ key: reportKey, rows: [], loading: false, error });
      },
    );
  }, [businessId, periodId, reportKey]);

  if (!businessId || !periodId) {
    return { rows: [], loading: false, error: null };
  }
  if (state.key !== reportKey) {
    return { rows: [], loading: true, error: null };
  }

  return state;
};
