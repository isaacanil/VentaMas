import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  clearCashReconciliation,
  setCashReconciliation,
} from '@/features/cashCount/cashStateSlice';
import { db } from '@/firebase/firebaseconfig';
import DateUtils from '@/utils/date/dateUtils';

import { getEmployeeData } from './fbGetCashCounts/getEmployeeData';

const toMillisSafe = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === 'object' &&
    typeof value.seconds === 'number' &&
    typeof value.nanoseconds === 'number'
  ) {
    return DateUtils.convertTimestampToMillis(value);
  }
  if (
    typeof value === 'object' &&
    typeof value._seconds === 'number' &&
    typeof value._nanoseconds === 'number'
  ) {
    return value._seconds * 1000 + value._nanoseconds / 1_000_000;
  }
  return value;
};

const sanitizeReceivablePayments = (payments = []) =>
  (Array.isArray(payments) ? payments : []).map((payment) => ({
    ...payment,
    date: toMillisSafe(payment?.date),
  }));

const sanitizeCashCount = ({
  cashCount = {},
  employeeData,
  approvalEmployeeData,
  closingEmployeeData,
  closingApprovalEmployeeData,
  fallbackId,
}) => {
  const { stateHistory: _stateHistory, sales: _sales, ...restCashCount } = cashCount || {};

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
      restCashCount.receivablePayments,
    ),
    sales: [], // avoid large arrays in Redux state
  };
};

export const useCurrentCashDrawer = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  useEffect(() => {
    try {
      if (!user || !user?.businessID) {
        return;
      }

      const cashDrawerRef = collection(
        db,
        'businesses',
        user?.businessID,
        'cashCounts',
      );

      const q = query(
        cashDrawerRef,
        where('cashCount.state', 'in', ['open', 'closing']),
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const docsPromise = querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const cashCountData = data.cashCount || {};
          const employeeData = await getEmployeeData(
            cashCountData?.opening?.employee,
          );
          const approvalEmployeeData = await getEmployeeData(
            cashCountData?.opening?.approvalEmployee,
          );
          const closingEmployeeData = await getEmployeeData(
            cashCountData?.closing?.employee,
          );
          const closingApprovalEmployeeData = await getEmployeeData(
            cashCountData?.closing?.approvalEmployee,
          );

          const sanitizedCashCount = sanitizeCashCount({
            cashCount: cashCountData,
            employeeData,
            approvalEmployeeData,
            closingEmployeeData,
            closingApprovalEmployeeData,
            fallbackId: doc.id,
          });

          return {
            ...data,
            cashCount: sanitizedCashCount,
          };
        });
        const cashData = await Promise.all(docsPromise);
        // Busca un registro con estado 'open'
        const openDrawerEntry = cashData.find(
          ({ cashCount }) =>
            cashCount.state === 'open' &&
            cashCount.opening.employee.id === user.uid,
        );

        if (openDrawerEntry) {
          dispatch(
            setCashReconciliation({
              state: 'open',
              cashCount: openDrawerEntry.cashCount,
            }),
          );
          return; // Sal del callback porque ya encontraste lo que buscabas
        }

        // Si no hay 'open', busca 'closing'
        const closingDrawerEntry = cashData.find(
          ({ cashCount }) =>
            cashCount.state === 'closing' &&
            cashCount.opening.employee.id === user.uid,
        );

        if (closingDrawerEntry) {
          dispatch(
            setCashReconciliation({
              state: 'closing',
              cashCount: closingDrawerEntry.cashCount,
            }),
          );
          return; // Sal del callback porque ya encontraste lo que buscabas
        }

        // Si no hay ni 'open' ni 'closing', limpia
        dispatch(clearCashReconciliation());
      });

      return () => unsubscribe();
    } catch (error) {
      // Log unexpected errors from snapshot subscription setup
      // Don't re-throw to avoid breaking React render lifecycle

      console.error('useCurrentCashDrawer error:', error);
    }
  }, [user, dispatch]);
};
