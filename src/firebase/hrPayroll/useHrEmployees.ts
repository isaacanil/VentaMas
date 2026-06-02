import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { db } from '@/firebase/firebaseconfig';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type {
  HrCommissionType,
  HrEmployeeDocumentType,
  HrEmployeeGender,
  HrEmployeeInput,
  HrEmployeePayType,
  HrEmployeeRecord,
  HrEmployeeStatus,
  HrPaymentMethod,
  HrReadyToPayStatus,
} from '@/types/hrPayroll';

interface HrEmployeesState {
  businessId: string | null;
  error: Error | null;
  loading: boolean;
  rows: HrEmployeeRecord[];
}

interface SaveHrEmployeeArgs {
  businessId: string;
  employee: HrEmployeeInput;
}

interface ManageHrEmployeeResponse {
  ok: boolean;
  businessId: string;
  employeeId: string;
  partyId: string;
  employee?: HrEmployeeRecord | null;
}

type ManageHrEmployeePayload = {
  businessId: string;
  employee: HrEmployeeInput;
  sessionToken?: string;
};

const manageHrEmployeeCallable = createFirebaseCallable<
  ManageHrEmployeePayload,
  ManageHrEmployeeResponse
>('manageHrEmployee');

const EMPTY_STATE: HrEmployeesState = {
  businessId: null,
  rows: [],
  loading: false,
  error: null,
};

const STATUS_VALUES = new Set<HrEmployeeStatus>([
  'active',
  'inactive',
  'suspended',
  'terminated',
]);
const PAY_TYPE_VALUES = new Set<HrEmployeePayType>([
  'salary',
  'hourly',
  'commission_only',
  'mixed',
]);
const DOCUMENT_TYPE_VALUES = new Set<HrEmployeeDocumentType>([
  'cedula',
  'passport',
  'rnc',
  'other',
]);
const GENDER_VALUES = new Set<HrEmployeeGender>(['male', 'female', 'other']);
const PAYMENT_METHOD_VALUES = new Set<HrPaymentMethod>([
  'cash',
  'bank_transfer',
  'check',
  'other',
]);
const COMMISSION_TYPE_VALUES = new Set<HrCommissionType>([
  'percentage',
  'fixed',
]);
const READY_STATUS_VALUES = new Set<HrReadyToPayStatus>([
  'ready',
  'needs_review',
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

const normalizeOptionalEnum = <T extends string>(
  value: unknown,
  allowedValues: Set<T>,
): T | null => {
  const normalized = toCleanString(value)?.toLowerCase() as T | undefined;
  return normalized && allowedValues.has(normalized) ? normalized : null;
};

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => toCleanString(entry))
        .filter((entry): entry is string => Boolean(entry))
    : [];

const normalizeHrEmployeeRecord = (
  id: string,
  data: Record<string, unknown>,
): HrEmployeeRecord => {
  const employeeId = toCleanString(data.employeeId) ?? id;
  const code = toCleanString(data.code) ?? employeeId;
  const fullName =
    toCleanString(data.fullName) ??
    toCleanString(data.displayName) ??
    toCleanString(data.name) ??
    code;

  return {
    ...data,
    id,
    employeeId,
    businessId: toCleanString(data.businessId) ?? '',
    partyId: toCleanString(data.partyId) ?? employeeId,
    code,
    fullName,
    legalName: toCleanString(data.legalName),
    displayName: toCleanString(data.displayName) ?? fullName,
    documentType: normalizeEnum(
      data.documentType,
      DOCUMENT_TYPE_VALUES,
      'cedula',
    ),
    documentId: toCleanString(data.documentId),
    gender: normalizeOptionalEnum(data.gender, GENDER_VALUES),
    email: toCleanString(data.email),
    phone: toCleanString(data.phone),
    address: toCleanString(data.address),
    linkedUserId: toCleanString(data.linkedUserId),
    status: normalizeEnum(data.status, STATUS_VALUES, 'active'),
    payType: normalizeEnum(data.payType, PAY_TYPE_VALUES, 'salary'),
    baseSalaryAmount: Math.max(0, toFiniteNumber(data.baseSalaryAmount)),
    hourlyRateAmount: Math.max(0, toFiniteNumber(data.hourlyRateAmount)),
    currency: toCleanString(data.currency)?.toUpperCase() ?? 'DOP',
    paymentMethod: normalizeEnum(
      data.paymentMethod,
      PAYMENT_METHOD_VALUES,
      'bank_transfer',
    ),
    paymentDestination: toCleanString(data.paymentDestination),
    commissionEnabled: data.commissionEnabled === true,
    defaultCommissionType: normalizeEnum(
      data.defaultCommissionType,
      COMMISSION_TYPE_VALUES,
      'percentage',
    ),
    defaultCommissionRate:
      data.defaultCommissionRate == null
        ? null
        : Math.max(0, toFiniteNumber(data.defaultCommissionRate)),
    readyToPayStatus: normalizeEnum(
      data.readyToPayStatus,
      READY_STATUS_VALUES,
      'needs_review',
    ),
    readyToPayIssues: normalizeStringArray(data.readyToPayIssues),
    notes: toCleanString(data.notes),
  };
};

export const saveHrEmployee = async ({
  businessId,
  employee,
}: SaveHrEmployeeArgs): Promise<ManageHrEmployeeResponse> => {
  if (!businessId) {
    throw new Error('Falta el negocio para guardar el empleado.');
  }

  const { sessionToken } = getStoredSession();
  return manageHrEmployeeCallable({
    businessId,
    employee,
    ...(sessionToken ? { sessionToken } : {}),
  });
};

export const useHrEmployees = (businessId?: string | null) => {
  const [state, setState] = useState<HrEmployeesState>(EMPTY_STATE);

  const employeesQuery = useMemo(() => {
    if (!businessId) return null;
    return query(
      collection(db, 'businesses', businessId, 'hrEmployees'),
      orderBy('code', 'asc'),
    );
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !employeesQuery) return undefined;

    return onSnapshot(
      employeesQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((docSnapshot) =>
          normalizeHrEmployeeRecord(
            docSnapshot.id,
            docSnapshot.data() as Record<string, unknown>,
          ),
        );

        setState({
          businessId,
          rows,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          businessId,
          rows: [],
          loading: false,
          error,
        });
      },
    );
  }, [businessId, employeesQuery]);

  if (!businessId) return EMPTY_STATE;
  if (state.businessId !== businessId) {
    return {
      businessId,
      rows: [],
      loading: true,
      error: null,
    };
  }

  return state;
};

export default useHrEmployees;
