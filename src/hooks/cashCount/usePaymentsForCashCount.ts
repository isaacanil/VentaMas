import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/firebaseconfig';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import type { CashMovement, PaymentMethodCode } from '@/types/payments';
import { toValidDate } from '@/utils/date/toValidDate';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivablePayment } from '@/utils/accountsReceivable/types';
import type { TimestampLike } from '@/utils/date/types';

const EMPTY_PAYMENTS: AccountsReceivablePayment[] = [];
const RECEIVABLE_MOVEMENT_SOURCE_TYPE = 'receivable_payment';

const normalizeMethodCode = (
  method: PaymentMethodCode | string | undefined,
): PaymentMethodCode | undefined => {
  if (typeof method !== 'string') return undefined;
  const normalized = method.trim().toLowerCase();
  return normalized.length ? (normalized as PaymentMethodCode) : undefined;
};

export const isReceivableCashMovement = (
  movement: CashMovement | null | undefined,
): movement is CashMovement =>
  Boolean(
    movement &&
      movement.sourceType === RECEIVABLE_MOVEMENT_SOURCE_TYPE &&
      movement.direction === 'in' &&
      movement.status !== 'void' &&
      Number(movement.amount) > 0,
  );

export const mapCashMovementToReceivablePayment = (
  movement: CashMovement,
): AccountsReceivablePayment => {
  const normalizedMethod = normalizeMethodCode(movement.method);
  const paymentMethod = normalizedMethod
    ? [
        {
          method: normalizedMethod,
          status: true,
          value: Number(movement.amount) || 0,
          amount: Number(movement.amount) || 0,
          reference: movement.reference ?? null,
        },
      ]
    : [];

  return {
    id: movement.id,
    amount: Number(movement.amount) || 0,
    totalPaid: Number(movement.amount) || 0,
    totalAmount: Number(movement.amount) || 0,
    createdAt: movement.createdAt,
    date: movement.occurredAt ?? movement.createdAt,
    createdUserId: movement.createdBy ?? undefined,
    paymentMethod,
    paymentMethods: paymentMethod,
    originType: movement.sourceType,
    originId: movement.sourceId,
  };
};

interface SnapshotState {
  key: string | null;
  payments: AccountsReceivablePayment[];
  cashMovements: CashMovement[];
  error: string | null;
}

/**
 * Hook to listen for AR payments made by a specific user within a date range.
 * Used for Cash Reconciliation to find "surplus" money coming from debt collections.
 *
 * @param {Object} user - The current user (must have businessID).
 * @param {string|null} targetUserId - The UID of the cashier to filter by.
 * @param {number|string|Date|Object|null} startDate - Start date (ms, ISO string, Date, Firestore Timestamp, Luxon DateTime).
 * @param {number|string|Date|Object|null} endDate - End date (ms, ISO string, Date, Firestore Timestamp, Luxon DateTime).
 * @returns {Object} { data: Array, payments: Array, loading: boolean, error: string|null }
 */
export const usePaymentsForCashCount = (
  user: UserIdentity | null | undefined,
  targetUserId?: string | null,
  startDate?: TimestampLike,
  endDate?: TimestampLike,
  cashCountId?: string | null,
) => {
  const businessId = user?.businessID ?? null;
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(
    businessId,
    Boolean(businessId),
  );
  const shouldUseCashMovements = Boolean(
    isAccountingRolloutEnabled && cashCountId,
  );

  const startAsDate = useMemo(() => toValidDate(startDate), [startDate]);
  const endAsDate = useMemo(() => toValidDate(endDate), [endDate]);

  const startMs = startAsDate?.getTime?.() ?? null;
  const endMs = endAsDate?.getTime?.() ?? null;

  const queryKey = useMemo(() => {
    if (!businessId) return null;
    if (shouldUseCashMovements) {
      return `cashMovements:${businessId}:${cashCountId}`;
    }
    if (!targetUserId || startMs === null) return null;
    return `legacy:${businessId}:${targetUserId}:${startMs}:${endMs ?? 'open'}`;
  }, [
    businessId,
    cashCountId,
    endMs,
    shouldUseCashMovements,
    startMs,
    targetUserId,
  ]);

  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    key: null,
    payments: [],
    cashMovements: [],
    error: null,
  });

  useEffect(() => {
    if (!queryKey) return;

    let active = true;

    const unsubscribe = shouldUseCashMovements
      ? onSnapshot(
          query(
            collection(db, 'businesses', businessId, 'cashMovements'),
            where('cashCountId', '==', cashCountId),
          ),
          (snapshot) => {
            if (!active) return;

            const loadedMovements = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as CashMovement),
            }));
            const loadedPayments = loadedMovements
              .filter(isReceivableCashMovement)
              .map(mapCashMovementToReceivablePayment);

            setSnapshotState({
              key: queryKey,
              payments: loadedPayments,
              cashMovements: loadedMovements,
              error: null,
            });
          },
          (err) => {
            if (!active) return;
            console.error('Error fetching cash movements for cash count:', err);
            setSnapshotState({
              key: queryKey,
              payments: [],
              cashMovements: [],
              error: err?.message || String(err),
            });
          },
        )
      : onSnapshot(
          query(
            collection(
              db,
              'businesses',
              businessId,
              'accountsReceivablePayments',
            ),
            where('createdUserId', '==', targetUserId),
            where('createdAt', '>=', new Date(startMs as number)),
            where(
              'createdAt',
              '<=',
              endMs === null || new Date(endMs) < new Date(startMs as number)
                ? new Date()
                : new Date(endMs),
            ),
          ),
          (snapshot) => {
            if (!active) return;
            const loadedPayments = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as AccountsReceivablePayment),
            }));
            setSnapshotState({
              key: queryKey,
              payments: loadedPayments,
              cashMovements: [],
              error: null,
            });
          },
          (err) => {
            if (!active) return;
            console.error('Error fetching AR payments for cash count:', err);
            setSnapshotState({
              key: queryKey,
              payments: [],
              cashMovements: [],
              error: err?.message || String(err),
            });
          },
        );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [
    businessId,
    cashCountId,
    endMs,
    queryKey,
    shouldUseCashMovements,
    startMs,
    targetUserId,
  ]);

  const invalidStartDate =
    !shouldUseCashMovements &&
    startDate !== null &&
    startDate !== undefined &&
    startAsDate === null;

  const isReady = shouldUseCashMovements
    ? Boolean(businessId && cashCountId)
    : Boolean(businessId && targetUserId && startMs !== null);
  const hasCurrentSnapshot =
    queryKey !== null && snapshotState.key === queryKey;

  const payments =
    isReady && hasCurrentSnapshot ? snapshotState.payments : EMPTY_PAYMENTS;
  const cashMovements =
    isReady && hasCurrentSnapshot ? snapshotState.cashMovements : [];
  const loading = isReady && !hasCurrentSnapshot;
  const error = invalidStartDate
    ? 'Invalid start date'
    : isReady && hasCurrentSnapshot
      ? snapshotState.error
      : null;

  return { data: payments, payments, cashMovements, loading, error };
};
