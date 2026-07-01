import {
  collection,
  count,
  getAggregateFromServer,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  sum,
  Timestamp,
  where,
} from 'firebase/firestore';
import type {
  DocumentData,
  Query,
  QueryConstraint,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { OPEN_VENDOR_BILL_STATUSES } from '@/domain/accountsPayable/vendorBills/fromPurchase';
import type {
  VendorBillPaymentControlStatus,
  VendorBillStatus,
} from '@/domain/accountsPayable/vendorBills/types';

export interface VendorBillFilters {
  condition?: string | null;
  dueAtDirection?: 'asc' | 'desc' | null;
  limit?: number | null;
  paymentControlStatus?: VendorBillPaymentControlStatus | null;
  providerId?: string | null;
  statuses?: readonly VendorBillStatus[] | null;
}

export interface VendorBillSnapshotMetadata {
  hasMore: boolean;
  isClientFiltered: boolean;
  rawDocCount: number;
  visibleDocCount: number;
}

export type VendorBillAgingAggregateBucketKey =
  | 'current'
  | 'due_1_30'
  | 'due_31_60'
  | 'due_61_plus'
  | 'no_due_date';

export interface VendorBillAgingAggregateBucket {
  balanceAmount: number;
  count: number;
  key: VendorBillAgingAggregateBucketKey;
}

export interface VendorBillAgingAggregateSummary {
  buckets: VendorBillAgingAggregateBucket[];
  totalBalanceAmount: number;
  totalCount: number;
}

type VendorBillSnapshotHandler = (
  snapshot: QuerySnapshot<DocumentData>,
  metadata?: VendorBillSnapshotMetadata,
) => void;

export const DEFAULT_VENDOR_BILL_QUERY_STATUSES = OPEN_VENDOR_BILL_STATUSES;
export const DEFAULT_VENDOR_BILL_QUERY_LIMIT = 500;
export const MAX_VENDOR_BILL_QUERY_LIMIT = 2_000;
export const VENDOR_BILL_QUERY_LIMIT_INCREMENT = 500;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const VENDOR_BILL_AGING_AGGREGATE_BUCKETS = [
  'current',
  'due_1_30',
  'due_31_60',
  'due_61_plus',
  'no_due_date',
] as const;

const resolveVendorBillQueryLimit = (value: number | null | undefined) => {
  if (value == null) return DEFAULT_VENDOR_BILL_QUERY_LIMIT;

  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_VENDOR_BILL_QUERY_LIMIT;
  }

  return Math.min(parsed, MAX_VENDOR_BILL_QUERY_LIMIT);
};

const resolveVendorBillFetchLimit = (value: number | null | undefined) =>
  resolveVendorBillQueryLimit(value) + 1;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const isMissingIndexError = (error: unknown): boolean =>
  asRecord(error).code === 'failed-precondition';

const resolveVendorBillQueryStatuses = (
  filters: VendorBillFilters | null,
): readonly VendorBillStatus[] =>
  filters?.statuses ?? DEFAULT_VENDOR_BILL_QUERY_STATUSES;

const resolveVendorBillDueAtDirection = (
  filters: VendorBillFilters | null,
): 'asc' | 'desc' => (filters?.dueAtDirection === 'desc' ? 'desc' : 'asc');

const startOfDay = (millis: number): number => {
  const date = new Date(millis);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const toFiniteAmount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildVendorBillServerFilterConstraints = (
  filters: VendorBillFilters | null,
): QueryConstraint[] => {
  const constraints = [] as QueryConstraint[];
  const statuses = resolveVendorBillQueryStatuses(filters);

  if (statuses.length > 0) {
    constraints.push(where('status', 'in', [...statuses]));
  }

  if (filters?.condition) {
    constraints.push(where('paymentTerms.condition', '==', filters.condition));
  }
  if (filters?.paymentControlStatus) {
    constraints.push(
      where('paymentControl.status', '==', filters.paymentControlStatus),
    );
  }
  if (filters?.providerId) {
    constraints.push(where('supplierId', '==', filters.providerId));
  }

  return constraints;
};

const matchesVendorBillFilters = (
  data: DocumentData,
  filters: VendorBillFilters | null,
): boolean => {
  const record = asRecord(data);
  const statuses = resolveVendorBillQueryStatuses(filters);
  const status = toCleanString(record.status);

  if (statuses.length > 0 && !statuses.includes(status as VendorBillStatus)) {
    return false;
  }

  const paymentTerms = asRecord(record.paymentTerms);
  if (
    filters?.condition &&
    toCleanString(paymentTerms.condition) !== filters.condition
  ) {
    return false;
  }

  const paymentControl = asRecord(record.paymentControl);
  if (
    filters?.paymentControlStatus &&
    toCleanString(paymentControl.status) !== filters.paymentControlStatus
  ) {
    return false;
  }

  if (
    filters?.providerId &&
    toCleanString(record.supplierId) !== filters.providerId
  ) {
    return false;
  }

  return true;
};

const withClientFilteredDocs = (
  snapshot: QuerySnapshot<DocumentData>,
  filters: VendorBillFilters | null,
): QuerySnapshot<DocumentData> => {
  const filteredDocs = snapshot.docs.filter((snapshotDoc) =>
    matchesVendorBillFilters(snapshotDoc.data(), filters),
  );

  if (filteredDocs.length === snapshot.docs.length) {
    return snapshot;
  }

  return {
    ...snapshot,
    docs: filteredDocs,
  } as QuerySnapshot<DocumentData>;
};

const withVisibleVendorBillDocs = (
  snapshot: QuerySnapshot<DocumentData>,
  visibleLimit: number,
): QuerySnapshot<DocumentData> => {
  if (snapshot.docs.length <= visibleLimit) {
    return snapshot;
  }

  return {
    ...snapshot,
    docs: snapshot.docs.slice(0, visibleLimit),
  } as QuerySnapshot<DocumentData>;
};

const buildVendorBillSnapshotMetadata = ({
  filteredDocCount,
  rawDocCount,
  visibleDocCount,
  visibleLimit,
}: {
  filteredDocCount: number;
  rawDocCount: number;
  visibleDocCount: number;
  visibleLimit: number;
}): VendorBillSnapshotMetadata => ({
  hasMore: rawDocCount > visibleLimit || filteredDocCount > visibleLimit,
  isClientFiltered: filteredDocCount !== rawDocCount,
  rawDocCount,
  visibleDocCount,
});

const buildVendorBillsPrimaryQuery = (
  collectionRef: Query<DocumentData>,
  filters: VendorBillFilters | null,
): Query<DocumentData> => {
  const constraints = buildVendorBillServerFilterConstraints(filters);
  const dueAtDirection = resolveVendorBillDueAtDirection(filters);

  constraints.push(orderBy('dueAt', dueAtDirection));
  constraints.push(orderBy('__name__', dueAtDirection));
  constraints.push(limitQuery(resolveVendorBillFetchLimit(filters?.limit)));

  return query(collectionRef, ...constraints);
};

const buildVendorBillsIndexFallbackQuery = (
  collectionRef: Query<DocumentData>,
  filters: VendorBillFilters | null,
): Query<DocumentData> => {
  const constraints = [] as QueryConstraint[];
  const statuses = resolveVendorBillQueryStatuses(filters);

  if (filters?.providerId) {
    constraints.push(where('supplierId', '==', filters.providerId));
  } else if (filters?.paymentControlStatus) {
    constraints.push(
      where('paymentControl.status', '==', filters.paymentControlStatus),
    );
  } else if (filters?.condition) {
    constraints.push(where('paymentTerms.condition', '==', filters.condition));
  } else if (statuses.length > 0) {
    constraints.push(where('status', 'in', [...statuses]));
  }

  constraints.push(limitQuery(resolveVendorBillFetchLimit(filters?.limit)));

  return query(collectionRef, ...constraints);
};

const buildVendorBillAgingAggregateConstraints = (
  bucket: VendorBillAgingAggregateBucketKey,
  now: number,
): QueryConstraint[] => {
  const todayStart = startOfDay(now);
  const thirtyDaysAgoStart = todayStart - 30 * DAY_IN_MS;
  const sixtyDaysAgoStart = todayStart - 60 * DAY_IN_MS;

  switch (bucket) {
    case 'current':
      return [where('dueAt', '>=', Timestamp.fromMillis(todayStart))];
    case 'due_1_30':
      return [
        where('dueAt', '>=', Timestamp.fromMillis(thirtyDaysAgoStart)),
        where('dueAt', '<', Timestamp.fromMillis(todayStart)),
      ];
    case 'due_31_60':
      return [
        where('dueAt', '>=', Timestamp.fromMillis(sixtyDaysAgoStart)),
        where('dueAt', '<', Timestamp.fromMillis(thirtyDaysAgoStart)),
      ];
    case 'due_61_plus':
      return [where('dueAt', '<', Timestamp.fromMillis(sixtyDaysAgoStart))];
    case 'no_due_date':
      return [where('dueAt', '==', null)];
    default:
      return [];
  }
};

const fetchVendorBillAggregateTotals = async (
  collectionRef: Query<DocumentData>,
  filters: VendorBillFilters | null,
  constraints: QueryConstraint[] = [],
): Promise<{ balanceAmount: number; count: number }> => {
  const aggregateSnapshot = await getAggregateFromServer(
    query(
      collectionRef,
      ...buildVendorBillServerFilterConstraints(filters),
      ...constraints,
    ),
    {
      totalBalanceAmount: sum('paymentState.balance'),
      totalCount: count(),
    },
  );
  const aggregateData = aggregateSnapshot.data() as {
    totalBalanceAmount?: unknown;
    totalCount?: unknown;
  };

  return {
    balanceAmount: toFiniteAmount(aggregateData.totalBalanceAmount),
    count: toFiniteAmount(aggregateData.totalCount),
  };
};

export const fetchVendorBillAgingAggregateSummary = async (
  businessID: string,
  filters: VendorBillFilters | null,
  now = Date.now(),
): Promise<VendorBillAgingAggregateSummary> => {
  const collectionRef = collection(db, 'businesses', businessID, 'vendorBills');
  const buckets = await Promise.all(
    VENDOR_BILL_AGING_AGGREGATE_BUCKETS.map(async (bucket) => {
      const bucketTotal = await fetchVendorBillAggregateTotals(
        collectionRef,
        filters,
        buildVendorBillAgingAggregateConstraints(bucket, now),
      );

      return {
        balanceAmount: bucketTotal.balanceAmount,
        count: bucketTotal.count,
        key: bucket,
      };
    }),
  );
  const total = buckets.reduce(
    (summary, bucket) => ({
      balanceAmount: summary.balanceAmount + bucket.balanceAmount,
      count: summary.count + bucket.count,
    }),
    { balanceAmount: 0, count: 0 },
  );

  return {
    buckets,
    totalBalanceAmount: total.balanceAmount,
    totalCount: total.count,
  };
};

export const subscribeToVendorBills = (
  businessID: string,
  filters: VendorBillFilters | null,
  callback: VendorBillSnapshotHandler,
  onError?: (error: unknown) => void,
): Unsubscribe => {
  const collectionRef = collection(db, 'businesses', businessID, 'vendorBills');
  const visibleLimit = resolveVendorBillQueryLimit(filters?.limit);
  const primaryQuery = buildVendorBillsPrimaryQuery(collectionRef, filters);
  let primaryUnsubscribe: Unsubscribe = () => undefined;
  let fallbackUnsubscribe: Unsubscribe | null = null;

  primaryUnsubscribe = onSnapshot(
    primaryQuery,
    (snapshot) => {
      const visibleSnapshot = withVisibleVendorBillDocs(snapshot, visibleLimit);
      callback(
        visibleSnapshot,
        buildVendorBillSnapshotMetadata({
          filteredDocCount: snapshot.docs.length,
          rawDocCount: snapshot.docs.length,
          visibleDocCount: visibleSnapshot.docs.length,
          visibleLimit,
        }),
      );
    },
    (error: unknown) => {
      if (!isMissingIndexError(error) || fallbackUnsubscribe) {
        onError?.(error);
        return;
      }

      primaryUnsubscribe();
      const fallbackQuery = buildVendorBillsIndexFallbackQuery(
        collectionRef,
        filters,
      );
      fallbackUnsubscribe = onSnapshot(
        fallbackQuery,
        (snapshot) => {
          const filteredSnapshot = withClientFilteredDocs(snapshot, filters);
          const visibleSnapshot = withVisibleVendorBillDocs(
            filteredSnapshot,
            visibleLimit,
          );
          callback(
            visibleSnapshot,
            buildVendorBillSnapshotMetadata({
              filteredDocCount: filteredSnapshot.docs.length,
              rawDocCount: snapshot.docs.length,
              visibleDocCount: visibleSnapshot.docs.length,
              visibleLimit,
            }),
          );
        },
        onError,
      );
    },
  );

  return () => {
    primaryUnsubscribe();
    fallbackUnsubscribe?.();
  };
};
