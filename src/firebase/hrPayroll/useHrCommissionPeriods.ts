import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useMemo, useState } from 'react';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { db, functions } from '@/firebase/firebaseconfig';
import type {
  HrCommissionPeriodRecord,
  HrCommissionPeriodStatus,
  HrPayrollEmployeeLineRecord,
  HrPayrollRunStatus,
} from '@/types/hrPayroll';

type ManageHrCommissionPeriodAction = 'create' | 'close' | 'approve';

interface UseHrCommissionPeriodsArgs {
  businessId?: string | null;
  pageSize?: number;
}

interface UseHrPayrollEmployeeLinesArgs {
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

interface ManageHrCommissionPeriodArgs {
  action: ManageHrCommissionPeriodAction;
  businessId: string;
  endDate?: Date | string | null;
  periodId?: string | null;
  startDate?: Date | string | null;
}

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

const PERIOD_STATUS_VALUES = new Set<HrCommissionPeriodStatus>([
  'draft',
  'closed',
  'approved',
  'cancelled',
]);

const RUN_STATUS_VALUES = new Set<HrPayrollRunStatus>([
  'draft',
  'closed',
  'approved',
  'paid',
  'cancelled',
]);

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
    ? data.commissionEntryIds.map(toCleanString).filter(Boolean)
    : [],
  entriesCount: Math.max(0, toFiniteNumber(data.entriesCount)),
  accountingEventId: toCleanString(data.accountingEventId),
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
  const callable = httpsCallable<
    {
      action: ManageHrCommissionPeriodAction;
      businessId: string;
      endDate?: string | null;
      periodId?: string | null;
      sessionToken?: string;
      startDate?: string | null;
    },
    ManageHrCommissionPeriodResponse
  >(functions, 'manageHrCommissionPeriod');

  const result = await callable({
    action,
    businessId,
    endDate: toCallableDate(endDate),
    periodId: toCleanString(periodId),
    startDate: toCallableDate(startDate),
    ...(sessionToken ? { sessionToken } : {}),
  });

  return result.data;
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
