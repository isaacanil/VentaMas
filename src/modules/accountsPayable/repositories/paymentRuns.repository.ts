import {
  collection,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import type {
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const DEFAULT_PAYMENT_RUNS_LIMIT = 25;
export const MAX_PAYMENT_RUNS_LIMIT = 100;

export interface AccountsPayablePaymentRunLine {
  balanceAmount?: number | null;
  cashRequirementAmount?: number | null;
  exclusionCode?: string | null;
  exclusionReason?: string | null;
  executionStatus?: string | null;
  lastPaymentAt?: unknown;
  lastPaymentId?: string | null;
  paidAmount?: number | null;
  paidCashAmount?: number | null;
  paidSettlementAmount?: number | null;
  paidWithholdingAmount?: number | null;
  paymentIds?: string[];
  purchaseId?: string | null;
  reference?: string | null;
  supplierName?: string | null;
  vendorBillId?: string | null;
  withholdingAmount?: number | null;
}

export interface AccountsPayablePaymentRunExecutionSummary {
  executedLineCount?: number | null;
  lastPaymentAt?: unknown;
  lastPaymentId?: string | null;
  paidCashAmount?: number | null;
  paidSettlementAmount?: number | null;
  paidWithholdingAmount?: number | null;
  partialLineCount?: number | null;
  pendingLineCount?: number | null;
  totalLineCount?: number | null;
}

export interface AccountsPayablePaymentRun {
  approvalStatus?: string | null;
  createdAt?: unknown;
  createdBy?: string | null;
  executionStatus?: string | null;
  executionSummary?: AccountsPayablePaymentRunExecutionSummary | null;
  excludedLines?: AccountsPayablePaymentRunLine[];
  id: string;
  lines?: AccountsPayablePaymentRunLine[];
  source?: {
    description?: string | null;
    isClientFilteredQuery?: boolean;
    isQueryLimitReached?: boolean;
    label?: string | null;
    queryLimit?: number | null;
    rawDocCount?: number | null;
  } | null;
  status?: string | null;
  totals?: {
    eligibleAmount?: number | null;
    eligibleCashRequirementAmount?: number | null;
    eligibleCount?: number | null;
    eligibleWithholdingAmount?: number | null;
    excludedAmount?: number | null;
    excludedCount?: number | null;
    requestedCount?: number | null;
  } | null;
}

export interface AccountsPayablePaymentRunStatusSnapshot {
  approvalStatus?: string | null;
  executionStatus?: string | null;
  status?: string | null;
}

export interface AccountsPayablePaymentRunEvent {
  action?: string | null;
  createdAt?: unknown;
  createdBy?: string | null;
  evidenceNote?: string | null;
  evidenceUrls?: string[];
  id: string;
  nextStatus?: AccountsPayablePaymentRunStatusSnapshot | null;
  paymentRunId?: string | null;
  previousStatus?: AccountsPayablePaymentRunStatusSnapshot | null;
  reason?: string | null;
  sourceId?: string | null;
  sourceType?: string | null;
}

export interface PaymentRunsSnapshotMetadata {
  hasMore: boolean;
  rawDocCount: number;
  visibleDocCount: number;
}

export interface PaymentRunsQueryOptions {
  limit?: number | null;
}

type PaymentRunsSnapshotHandler = (
  snapshot: QuerySnapshot<DocumentData>,
  metadata?: PaymentRunsSnapshotMetadata,
) => void;

export const resolvePaymentRunsLimit = (
  value: number | null | undefined,
): number => {
  if (value == null) return DEFAULT_PAYMENT_RUNS_LIMIT;

  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PAYMENT_RUNS_LIMIT;
  }

  return Math.min(parsed, MAX_PAYMENT_RUNS_LIMIT);
};

const resolvePaymentRunsFetchLimit = (value: number | null | undefined) =>
  resolvePaymentRunsLimit(value) + 1;

const withVisiblePaymentRunDocs = (
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

const buildPaymentRunsSnapshotMetadata = ({
  rawDocCount,
  visibleDocCount,
  visibleLimit,
}: {
  rawDocCount: number;
  visibleDocCount: number;
  visibleLimit: number;
}): PaymentRunsSnapshotMetadata => ({
  hasMore: rawDocCount > visibleLimit,
  rawDocCount,
  visibleDocCount,
});

const buildPaymentRunsPrimaryQuery = (
  collectionRef: ReturnType<typeof collection>,
  options: PaymentRunsQueryOptions,
) =>
  query(
    collectionRef,
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc'),
    limitQuery(resolvePaymentRunsFetchLimit(options.limit)),
  );

export const subscribeToAccountsPayablePaymentRuns = (
  businessId: string,
  callback: PaymentRunsSnapshotHandler,
  onError?: (error: unknown) => void,
  options: PaymentRunsQueryOptions = {},
): Unsubscribe => {
  const collectionRef = collection(
    db,
    'businesses',
    businessId,
    'accountsPayablePaymentRuns',
  );
  const visibleLimit = resolvePaymentRunsLimit(options.limit);
  const primaryQuery = buildPaymentRunsPrimaryQuery(collectionRef, options);

  const handleSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
    const visibleSnapshot = withVisiblePaymentRunDocs(snapshot, visibleLimit);
    callback(
      visibleSnapshot,
      buildPaymentRunsSnapshotMetadata({
        rawDocCount: snapshot.docs.length,
        visibleDocCount: visibleSnapshot.docs.length,
        visibleLimit,
      }),
    );
  };

  return onSnapshot(primaryQuery, handleSnapshot, onError);
};

const buildPaymentRunEventsPrimaryQuery = (
  collectionRef: ReturnType<typeof collection>,
  options: PaymentRunsQueryOptions,
) =>
  query(
    collectionRef,
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc'),
    limitQuery(resolvePaymentRunsFetchLimit(options.limit)),
  );

export const subscribeToAccountsPayablePaymentRunEvents = (
  businessId: string,
  callback: PaymentRunsSnapshotHandler,
  onError?: (error: unknown) => void,
  options: PaymentRunsQueryOptions = {},
): Unsubscribe => {
  const collectionRef = collection(
    db,
    'businesses',
    businessId,
    'accountsPayablePaymentRunEvents',
  );
  const visibleLimit = resolvePaymentRunsLimit(options.limit);
  const primaryQuery = buildPaymentRunEventsPrimaryQuery(
    collectionRef,
    options,
  );

  const handleSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
    const visibleSnapshot = withVisiblePaymentRunDocs(snapshot, visibleLimit);
    callback(
      visibleSnapshot,
      buildPaymentRunsSnapshotMetadata({
        rawDocCount: snapshot.docs.length,
        visibleDocCount: visibleSnapshot.docs.length,
        visibleLimit,
      }),
    );
  };

  return onSnapshot(primaryQuery, handleSnapshot, onError);
};
