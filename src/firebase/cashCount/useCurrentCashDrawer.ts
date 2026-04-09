import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import {
  clearCashReconciliation,
  setCashReconciliation,
} from '@/features/cashCount/cashStateSlice';
import { db } from '@/firebase/firebaseconfig';
import DateUtils from '@/utils/date/dateUtils';
import type { UserIdentity } from '@/types/users';
import type {
  CashCountEmployee,
  CashCountRecord,
  CashCountState,
} from '@/utils/cashCount/types';
import { resolveCashCountEmployeeId } from '@/utils/cashCount/resolveEmployeeId';
import {
  resolveUserIdentityBusinessId,
  resolveUserIdentityUid,
} from '@/utils/users/userIdentityAccess';
import { getEmployeeData } from './fbGetCashCounts/getEmployeeData';

const toMillisSafe = (value?: unknown): number | null => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === 'object' &&
    typeof (value as { seconds?: number }).seconds === 'number' &&
    typeof (value as { nanoseconds?: number }).nanoseconds === 'number'
  ) {
    return DateUtils.convertTimestampToMillis(
      value as { seconds: number; nanoseconds: number },
    );
  }
  if (
    typeof value === 'object' &&
    typeof (value as { _seconds?: number })._seconds === 'number' &&
    typeof (value as { _nanoseconds?: number })._nanoseconds === 'number'
  ) {
    const legacy = value as { _seconds: number; _nanoseconds: number };
    return legacy._seconds * 1000 + legacy._nanoseconds / 1_000_000;
  }
  return Number(value) || null;
};

const sanitizeReceivablePayments = (
  payments: Array<Record<string, unknown>> = [],
) =>
  (Array.isArray(payments) ? payments : []).map((payment) => ({
    ...payment,
    date: toMillisSafe(payment?.date),
  }));

interface SanitizeCashCountParams {
  cashCount?: CashCountRecord | null;
  employeeData: CashCountEmployee | null;
  approvalEmployeeData: CashCountEmployee | null;
  closingEmployeeData: CashCountEmployee | null;
  closingApprovalEmployeeData: CashCountEmployee | null;
  fallbackId?: string;
}

const sanitizeCashCount = ({
  cashCount = {},
  employeeData,
  approvalEmployeeData,
  closingEmployeeData,
  closingApprovalEmployeeData,
  fallbackId,
}: SanitizeCashCountParams): CashCountRecord => {
  const {
    stateHistory: _stateHistory,
    sales: _sales,
    ...restCashCount
  } = (cashCount || {}) as CashCountRecord & { stateHistory?: unknown };

  return {
    ...restCashCount,
    id: restCashCount.id || fallbackId || null,
    createdAt: toMillisSafe(restCashCount.createdAt),
    updatedAt: toMillisSafe(restCashCount.updatedAt),
    opening: {
      ...(restCashCount.opening || {}),
      date: toMillisSafe(restCashCount?.opening?.date),
      employee: employeeData,
      approvalEmployee: approvalEmployeeData,
    },
    closing: {
      ...(restCashCount.closing || {}),
      date: toMillisSafe(restCashCount?.closing?.date),
      employee: closingEmployeeData,
      approvalEmployee: closingApprovalEmployeeData,
    },
    receivablePayments: sanitizeReceivablePayments(
      restCashCount.receivablePayments as Array<Record<string, unknown>>,
    ),
    sales: [],
  };
};

export const useCurrentCashDrawer = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = resolveUserIdentityBusinessId(user);
  const userId = resolveUserIdentityUid(user);

  useEffect(() => {
    try {
      if (!businessId || !userId) {
        dispatch(clearCashReconciliation());
        return;
      }

      const cashDrawerRef = collection(
        db,
        'businesses',
        businessId,
        'cashCounts',
      );

      const q = query(
        cashDrawerRef,
        where('cashCount.state', 'in', ['open', 'closing']),
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const docsPromise = querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as DocumentData;
          const cashCountData = (data.cashCount || {}) as CashCountRecord;
          const openingEmployeeId = resolveCashCountEmployeeId(
            cashCountData?.opening?.employee,
          );
          const closingEmployeeId = resolveCashCountEmployeeId(
            cashCountData?.closing?.employee,
          );
          const employeeData = await getEmployeeData(
            cashCountData?.opening?.employee as DocumentReference | null,
          );
          const approvalEmployeeData = await getEmployeeData(
            cashCountData?.opening
              ?.approvalEmployee as DocumentReference | null,
          );
          const closingEmployeeData = await getEmployeeData(
            cashCountData?.closing?.employee as DocumentReference | null,
          );
          const closingApprovalEmployeeData = await getEmployeeData(
            cashCountData?.closing
              ?.approvalEmployee as DocumentReference | null,
          );

          const sanitizedCashCount = sanitizeCashCount({
            cashCount: cashCountData,
            employeeData:
              employeeData ||
              (openingEmployeeId
                ? ({
                    id: openingEmployeeId,
                  } as CashCountEmployee)
                : null),
            approvalEmployeeData,
            closingEmployeeData:
              closingEmployeeData ||
              (closingEmployeeId
                ? ({
                    id: closingEmployeeId,
                  } as CashCountEmployee)
                : null),
            closingApprovalEmployeeData,
            fallbackId: docSnap.id,
          });

          return {
            ...data,
            cashCount: sanitizedCashCount,
          };
        });
        const cashData = await Promise.all(docsPromise);

        const openDrawerEntry = cashData.find(
          ({ cashCount }) =>
            cashCount.state === 'open' &&
            resolveCashCountEmployeeId(
              (cashCount.opening as CashCountRecord['opening'])?.employee,
            ) === userId,
        );

        if (openDrawerEntry) {
          dispatch(
            setCashReconciliation({
              state: 'open' as CashCountState,
              cashCount: openDrawerEntry.cashCount,
            }),
          );
          return;
        }

        const closingDrawerEntry = cashData.find(
          ({ cashCount }) =>
            cashCount.state === 'closing' &&
            resolveCashCountEmployeeId(
              (cashCount.opening as CashCountRecord['opening'])?.employee,
            ) === userId,
        );

        if (closingDrawerEntry) {
          dispatch(
            setCashReconciliation({
              state: 'closing' as CashCountState,
              cashCount: closingDrawerEntry.cashCount,
            }),
          );
          return;
        }

        dispatch(clearCashReconciliation());
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('useCurrentCashDrawer error:', error);
    }
  }, [businessId, userId, dispatch]);
};
