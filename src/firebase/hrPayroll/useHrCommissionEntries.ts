import {
  Timestamp,
  collection,
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
  HrCommissionEntryRecord,
  HrCommissionEntryStatus,
  HrCommissionType,
} from '@/types/hrPayroll';

interface UseHrCommissionEntriesArgs {
  businessId?: string | null;
  endDate: Date;
  startDate: Date;
  status?: HrCommissionEntryStatus | 'all';
}

interface HrCommissionEntriesState {
  error: Error | null;
  key: string;
  loading: boolean;
  rows: HrCommissionEntryRecord[];
}

interface UseHrCommissionEntriesResult {
  error: Error | null;
  loading: boolean;
  rows: HrCommissionEntryRecord[];
}

interface RecalculateHrCommissionEntriesArgs {
  businessId: string;
  endDate?: Date | string | null;
  startDate?: Date | string | null;
}

interface RecalculateHrCommissionEntriesResponse {
  ok: boolean;
  businessId: string;
  scannedServiceCommissions: number;
  writtenEntries: number;
  unresolvedCount: number;
}

type RecalculateHrCommissionEntriesPayload = {
  businessId: string;
  endDate?: string | null;
  sessionToken?: string;
  startDate?: string | null;
};

const recalculateHrCommissionEntriesCallable = createFirebaseCallable<
  RecalculateHrCommissionEntriesPayload,
  RecalculateHrCommissionEntriesResponse
>('recalculateHrCommissionEntries');

const STATUS_VALUES = new Set<HrCommissionEntryStatus>([
  'calculated',
  'eligible',
  'included_in_cut',
  'approved',
  'paid',
  'reversed',
  'cancelled',
  'requires_adjustment',
]);

const COMMISSION_TYPE_VALUES = new Set<HrCommissionType>([
  'percentage',
  'fixed',
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

const toStartOfDay = (date: Date): Date => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const toEndOfDay = (date: Date): Date => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const normalizeHrCommissionEntryRecord = (
  id: string,
  data: Record<string, unknown>,
): HrCommissionEntryRecord => ({
  ...data,
  id,
  businessId: toCleanString(data.businessId) ?? '',
  employeeId: toCleanString(data.employeeId),
  employeeCode: toCleanString(data.employeeCode),
  employeeNameSnapshot: toCleanString(data.employeeNameSnapshot),
  partyId: toCleanString(data.partyId),
  linkedUserId: toCleanString(data.linkedUserId),
  invoiceId: toCleanString(data.invoiceId),
  invoiceNumber: toCleanString(data.invoiceNumber),
  invoiceItemId: toCleanString(data.invoiceItemId),
  sourceType:
    data.sourceType === 'invoice_payment' ||
    data.sourceType === 'manual_adjustment'
      ? data.sourceType
      : 'invoice_line',
  sourceCommissionId: toCleanString(data.sourceCommissionId),
  customerId: toCleanString(data.customerId),
  customerNameSnapshot: toCleanString(data.customerNameSnapshot),
  serviceId: toCleanString(data.serviceId),
  serviceName: toCleanString(data.serviceName),
  commissionRuleId: toCleanString(data.commissionRuleId),
  commissionRuleNameSnapshot: toCleanString(data.commissionRuleNameSnapshot),
  calculationBase: toCleanString(data.calculationBase),
  baseAmount: Math.max(0, toFiniteNumber(data.baseAmount)),
  rateType: normalizeEnum(data.rateType, COMMISSION_TYPE_VALUES, 'percentage'),
  rateValue: Math.max(0, toFiniteNumber(data.rateValue)),
  commissionAmount: Math.max(0, toFiniteNumber(data.commissionAmount)),
  currency: toCleanString(data.currency)?.toUpperCase() ?? 'DOP',
  status: normalizeEnum(data.status, STATUS_VALUES, 'requires_adjustment'),
  sourceStatus: toCleanString(data.sourceStatus),
  periodId: toCleanString(data.periodId),
  payrollRunId: toCleanString(data.payrollRunId),
  payrollEmployeeLineId: toCleanString(data.payrollEmployeeLineId),
  employeePaymentId: toCleanString(data.employeePaymentId),
  accountingEventId: toCleanString(data.accountingEventId),
  paymentAccountingEventId: toCleanString(data.paymentAccountingEventId),
  journalEntryId: toCleanString(data.journalEntryId),
  dedupeKey: toCleanString(data.dedupeKey),
  date: data.date,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const recalculateHrCommissionEntries = async ({
  businessId,
  endDate,
  startDate,
}: RecalculateHrCommissionEntriesArgs): Promise<RecalculateHrCommissionEntriesResponse> => {
  if (!businessId) {
    throw new Error('Falta el negocio para recalcular comisiones.');
  }

  const { sessionToken } = getStoredSession();
  return recalculateHrCommissionEntriesCallable({
    businessId,
    endDate:
      endDate instanceof Date ? endDate.toISOString() : toCleanString(endDate),
    startDate:
      startDate instanceof Date
        ? startDate.toISOString()
        : toCleanString(startDate),
    ...(sessionToken ? { sessionToken } : {}),
  });
};

export const useHrCommissionEntries = ({
  businessId,
  endDate,
  startDate,
  status = 'all',
}: UseHrCommissionEntriesArgs): UseHrCommissionEntriesResult => {
  const [state, setState] = useState<HrCommissionEntriesState>({
    key: '',
    rows: [],
    loading: false,
    error: null,
  });

  const queryBounds = useMemo(
    () => ({
      start: Timestamp.fromDate(toStartOfDay(startDate)),
      end: Timestamp.fromDate(toEndOfDay(endDate)),
    }),
    [endDate, startDate],
  );
  const reportKey = useMemo(
    () =>
      [
        businessId ?? 'no-business',
        status,
        queryBounds.start.toMillis(),
        queryBounds.end.toMillis(),
      ].join('|'),
    [businessId, queryBounds.end, queryBounds.start, status],
  );

  useEffect(() => {
    if (!businessId) return undefined;

    const entriesRef = collection(
      db,
      'businesses',
      businessId,
      'hrCommissionEntries',
    );
    const entriesQuery = query(
      entriesRef,
      where('date', '>=', queryBounds.start),
      where('date', '<=', queryBounds.end),
      orderBy('date', 'desc'),
    );

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
          .filter((entry) => status === 'all' || entry.status === status);

        setState({ key: reportKey, rows, loading: false, error: null });
      },
      (error) => {
        setState({ key: reportKey, rows: [], loading: false, error });
      },
    );
  }, [businessId, queryBounds.end, queryBounds.start, reportKey, status]);

  if (!businessId) {
    return { rows: [], loading: false, error: null };
  }
  if (state.key !== reportKey) {
    return { rows: [], loading: true, error: null };
  }

  return state;
};

export default useHrCommissionEntries;
