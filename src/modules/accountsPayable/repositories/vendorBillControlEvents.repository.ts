import {
  collection,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import type {
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const DEFAULT_VENDOR_BILL_CONTROL_EVENTS_LIMIT = 25;
export const MAX_VENDOR_BILL_CONTROL_EVENTS_LIMIT = 100;

export interface VendorBillControlEventsQueryOptions {
  limit?: number | null;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const isMissingIndexError = (error: unknown): boolean =>
  asRecord(error).code === 'failed-precondition';

const resolveVendorBillControlEventsLimit = (
  value: number | null | undefined,
): number => {
  if (value == null) return DEFAULT_VENDOR_BILL_CONTROL_EVENTS_LIMIT;

  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_VENDOR_BILL_CONTROL_EVENTS_LIMIT;
  }

  return Math.min(parsed, MAX_VENDOR_BILL_CONTROL_EVENTS_LIMIT);
};

const buildVendorBillControlEventsPrimaryQuery = (
  collectionRef: ReturnType<typeof collection>,
  vendorBillId: string,
  options: VendorBillControlEventsQueryOptions,
) =>
  query(
    collectionRef,
    where('vendorBillId', '==', vendorBillId),
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc'),
    limitQuery(resolveVendorBillControlEventsLimit(options.limit)),
  );

const buildVendorBillControlEventsFallbackQuery = (
  collectionRef: ReturnType<typeof collection>,
  vendorBillId: string,
  options: VendorBillControlEventsQueryOptions,
) =>
  query(
    collectionRef,
    where('vendorBillId', '==', vendorBillId),
    limitQuery(resolveVendorBillControlEventsLimit(options.limit)),
  );

export const subscribeToVendorBillControlEvents = (
  businessId: string,
  vendorBillId: string,
  callback: (snapshot: QuerySnapshot<DocumentData>) => void,
  onError?: (error: unknown) => void,
  options: VendorBillControlEventsQueryOptions = {},
): Unsubscribe => {
  const collectionRef = collection(
    db,
    'businesses',
    businessId,
    'vendorBillControlEvents',
  );
  const primaryQuery = buildVendorBillControlEventsPrimaryQuery(
    collectionRef,
    vendorBillId,
    options,
  );
  let primaryUnsubscribe: Unsubscribe = () => undefined;
  let fallbackUnsubscribe: Unsubscribe | null = null;

  primaryUnsubscribe = onSnapshot(primaryQuery, callback, (error: unknown) => {
    if (!isMissingIndexError(error) || fallbackUnsubscribe) {
      onError?.(error);
      return;
    }

    primaryUnsubscribe();
    const fallbackQuery = buildVendorBillControlEventsFallbackQuery(
      collectionRef,
      vendorBillId,
      options,
    );
    fallbackUnsubscribe = onSnapshot(fallbackQuery, callback, onError);
  });

  return () => {
    primaryUnsubscribe();
    fallbackUnsubscribe?.();
  };
};
