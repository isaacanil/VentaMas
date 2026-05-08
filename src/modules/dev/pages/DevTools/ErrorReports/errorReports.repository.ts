import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import type { ErrorReportRow, ErrorReportStatus } from './types';

interface RawErrorReport {
  user?: unknown;
  business?: unknown;
  id?: unknown;
  createdAt?: unknown;
  status?: unknown;
  errorStackTrace?: unknown;
  errorInfo?: unknown;
}

const REPORT_LIMIT = 100;

const dateFormatter = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value == null) return '';

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    typeof (value as { seconds?: unknown }).seconds === 'number'
  ) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }

  return null;
};

const formatDate = (value: Date | null): string =>
  value ? dateFormatter.format(value) : 'Sin fecha';

const readCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const getUserLabel = (data: Record<string, unknown> | null, userId: string) => {
  if (!data) return userId;
  return (
    readCleanString(data.realName) ??
    readCleanString(data.displayName) ??
    readCleanString(data.name) ??
    readCleanString(data.username) ??
    readCleanString(data.email) ??
    userId
  );
};

const getBusinessLabel = (
  data: Record<string, unknown> | null,
  businessId: string,
) => {
  if (!data) return businessId;
  const nestedBusiness =
    data.business && typeof data.business === 'object'
      ? (data.business as Record<string, unknown>)
      : null;

  return (
    readCleanString(data.name) ??
    readCleanString(data.businessName) ??
    readCleanString(nestedBusiness?.name) ??
    readCleanString(nestedBusiness?.businessName) ??
    businessId
  );
};

const fetchDocsById = async (
  collectionName: 'businesses' | 'users',
  ids: string[],
) => {
  const entries = await Promise.all(
    ids.map(async (id) => {
      const snapshot = await getDoc(doc(db, collectionName, id));
      return [
        id,
        snapshot.exists()
          ? ({ id: snapshot.id, ...snapshot.data() } as Record<string, unknown>)
          : null,
      ] as const;
    }),
  );

  return new Map(entries);
};

export const fetchErrorReports = async (): Promise<ErrorReportRow[]> => {
  const snapshot = await getDocs(
    query(
      collection(db, 'errors'),
      orderBy('createdAt', 'desc'),
      limit(REPORT_LIMIT),
    ),
  );

  const rawRows = snapshot.docs.map((reportDoc) => {
    const data = reportDoc.data() as RawErrorReport;
    const userId = readCleanString(data.user);
    const businessId = readCleanString(data.business);
    const createdAt = toDate(data.createdAt);

    return {
      id: readCleanString(data.id) ?? reportDoc.id,
      userId,
      userLabel: userId ?? 'Sin usuario',
      businessId,
      businessLabel: businessId ?? 'Sin negocio',
      createdAt,
      createdAtLabel: formatDate(createdAt),
      status: (readCleanString(data.status) ?? 'pending') as ErrorReportStatus,
      errorStackTrace: toText(data.errorStackTrace),
      errorInfo: toText(data.errorInfo),
    };
  });

  const userIds = Array.from(
    new Set(rawRows.map((row) => row.userId).filter(Boolean)),
  ) as string[];
  const businessIds = Array.from(
    new Set(rawRows.map((row) => row.businessId).filter(Boolean)),
  ) as string[];

  const [usersById, businessesById] = await Promise.all([
    fetchDocsById('users', userIds),
    fetchDocsById('businesses', businessIds),
  ]);

  return rawRows.map((row) => ({
    ...row,
    userLabel: row.userId
      ? getUserLabel(usersById.get(row.userId) ?? null, row.userId)
      : row.userLabel,
    businessLabel: row.businessId
      ? getBusinessLabel(
          businessesById.get(row.businessId) ?? null,
          row.businessId,
        )
      : row.businessLabel,
  }));
};
