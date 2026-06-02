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
  HrEmployeePaymentRecord,
  HrEmployeePaymentStatus,
  HrPaymentMethod,
  HrCommissionPeriodRecord,
  HrCommissionPeriodStatus,
  HrPayrollEmployeeLineRecord,
  HrPayrollRunStatus,
} from '@/types/hrPayroll';

type ManageHrCommissionPeriodAction = 'create' | 'close' | 'approve';
type ManageHrPayrollPaymentAction = 'record';

interface UseHrCommissionPeriodsArgs {
  businessId?: string | null;
  pageSize?: number;
}

interface UseHrPayrollEmployeeLinesArgs {
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

interface UseHrCommissionPeriodsResult {
  error: Error | null;
  loading: boolean;
  rows: HrCommissionPeriodRecord[];
}

interface UseHrPayrollEmployeeLinesResult {
  error: Error | null;
  loading: boolean;
  rows: HrPayrollEmployeeLineRecord[];
}

interface UseHrEmployeePaymentsResult {
  error: Error | null;
  loading: boolean;
  rows: HrEmployeePaymentRecord[];
}

interface ManageHrCommissionPeriodArgs {
  action: ManageHrCommissionPeriodAction;
  businessId: string;
  endDate?: Date | string | null;
  periodId?: string | null;
  startDate?: Date | string | null;
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
  endDate?: string | null;
  periodId?: string | null;
  sessionToken?: string;
  startDate?: string | null;
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
  ManageHrCommissionPeriodResponse
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
  startDate: data.startDate,
  endDate: data.endDate,
  currency: toCleanString(data.currency)?.toUpperCase() ?? 'DOP',
  entriesCount: Math.max(0, toFiniteNumber(data.entriesCount)),
  employeesCount: Math.max(0, toFiniteNumber(data.employeesCount)),
  totalCommissionAmount: Math.max(
    0,
    toFiniteNumber(data.totalCommissionAmount),
  ),
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
  type: 'commission',
  status: normalizeEnum(data.status, RUN_STATUS_VALUES, 'draft'),
  currency: toCleanString(data.currency)?.toUpperCase() ?? 'DOP',
  grossAmount: Math.max(0, toFiniteNumber(data.grossAmount)),
  deductionsAmount: Math.max(0, toFiniteNumber(data.deductionsAmount)),
  netAmount: Math.max(0, toFiniteNumber(data.netAmount)),
  commissionAmount: Math.max(0, toFiniteNumber(data.commissionAmount)),
  commissionEntryIds: Array.isArray(data.commissionEntryIds)
    ? data.commissionEntryIds.map(toCleanString).filter(isNonNullableString)
    : [],
  entriesCount: Math.max(0, toFiniteNumber(data.entriesCount)),
  accountingEventId: toCleanString(data.accountingEventId),
  employeePaymentId: toCleanString(data.employeePaymentId),
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
  accountingEventId: toCleanString(data.accountingEventId),
  cashMovementIds: normalizeCashMovementIds(data.cashMovementIds),
  paymentDate: data.paymentDate,
  createdAt: data.createdAt,
  createdBy: toCleanString(data.createdBy),
});

export const manageHrCommissionPeriod = async ({
  action,
  businessId,
  endDate,
  periodId,
  startDate,
}: ManageHrCommissionPeriodArgs): Promise<ManageHrCommissionPeriodResponse> => {
  if (!businessId) {
    throw new Error('Falta el negocio para gestionar el corte.');
  }

  const { sessionToken } = getStoredSession();
  return manageHrCommissionPeriodCallable({
    action,
    businessId,
    endDate: toCallableDate(endDate),
    periodId: toCleanString(periodId),
    startDate: toCallableDate(startDate),
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
