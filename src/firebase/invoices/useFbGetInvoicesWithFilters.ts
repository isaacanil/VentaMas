import type { DocumentData, QueryConstraint } from 'firebase/firestore';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { InvoiceFilters } from '@/types/invoiceFilters';
import type { UserIdentity } from '@/types/users';
import { hasManageAllAccess } from '@/utils/access/manageAllAccess';
import { getInvoicePaymentInfo } from '@/utils/invoice';
import { validateUser } from '@/utils/userValidation';

type PaymentMethod = {
  method?: string;
  status?: boolean;
  value?: number;
};

type InvoiceSnapshot = {
  cart?: {
    isAddedToReceivables?: boolean;
  } | null;
};

type InvoiceData = {
  isAddedToReceivables?: boolean;
  accountsReceivable?: unknown;
  snapshot?: InvoiceSnapshot | null;
  paymentMethod?: PaymentMethod[] | null;
  totalPurchase?: { value?: number | null } | null;
  status?: string | null;
  date?: Date | null;
  client?: { id?: string | null } | null;
  userID?: string | null;
};

type InvoiceDoc = {
  data: InvoiceData;
};

type FilteredInvoicesSnapshotState = {
  queryKey: string | null;
  invoices: InvoiceDoc[];
};

const applyClientSideFilters = (
  invoices: InvoiceDoc[],
  filters: InvoiceFilters,
) => {
  return invoices.filter((invoice) => {
    const invoiceData = invoice.data || {};

    if (filters.receivablesOnly) {
      const isReceivableInvoice =
        invoiceData?.isAddedToReceivables === true ||
        Boolean(invoiceData?.accountsReceivable) ||
        invoiceData?.snapshot?.cart?.isAddedToReceivables === true;
      if (!isReceivableInvoice) return false;
    }

    if (filters.paymentMethod) {
      const hasPaymentMethod = invoiceData.paymentMethod?.some(
        (method) =>
          method.method === filters.paymentMethod && method.status === true,
      );
      if (!hasPaymentMethod) return false;
    }

    if (filters.minAmount !== null && filters.minAmount !== undefined) {
      const totalAmount = invoiceData.totalPurchase?.value || 0;
      if (totalAmount < filters.minAmount) return false;
    }

    if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
      const totalAmount = invoiceData.totalPurchase?.value || 0;
      if (totalAmount > filters.maxAmount) return false;
    }

    if (filters.paymentStatus) {
      const { paid, total, isPaidInFull } = getInvoicePaymentInfo(invoiceData);
      const hasPayment = paid > 0;
      const hasPending = total > paid;

      if (filters.paymentStatus === 'paid' && !isPaidInFull) return false;
      if (filters.paymentStatus === 'partial' && !(hasPayment && hasPending))
        return false;
      if (filters.paymentStatus === 'unpaid' && hasPayment) return false;
    }

    return true;
  });
};

export const useFbGetInvoicesWithFilters = (filters: InvoiceFilters = {}) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [snapshotState, setSnapshotState] =
    useState<FilteredInvoicesSnapshotState>({
      queryKey: null,
      invoices: [],
    });

  const businessID = user?.businessID ?? null;
  const uid = user?.uid ?? null;
  const role = user?.role ?? null;
  const activeFilters = useMemo<InvoiceFilters>(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      clientId: filters.clientId,
      paymentMethod: filters.paymentMethod,
      paymentStatus: filters.paymentStatus,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      receivablesOnly: filters.receivablesOnly,
    }),
    [
      filters.startDate,
      filters.endDate,
      filters.clientId,
      filters.paymentMethod,
      filters.paymentStatus,
      filters.minAmount,
      filters.maxAmount,
      filters.receivablesOnly,
    ],
  );
  const queryKey = useMemo(
    () => (businessID ? `${businessID}-${JSON.stringify(activeFilters)}` : null),
    [activeFilters, businessID],
  );

  useEffect(() => {
    if (!user || !businessID || !queryKey) {
      return undefined;
    }

    const fetchInvoices = () => {
      try {
        validateUser(user);
        const { businessID, uid, role } = user;

        const start = activeFilters.startDate
          ? new Date(activeFilters.startDate)
          : null;
        const end = activeFilters.endDate
          ? new Date(activeFilters.endDate)
          : null;
        const restrictionStartDate = new Date('2024-01-21T14:41:00');

        const invoicesRef = collection(
          db,
          'businesses',
          businessID,
          'invoices',
        );

        const queryConstraints: QueryConstraint[] = [];

        if (start && end) {
          queryConstraints.push(
            where('data.date', '>=', start),
            where('data.date', '<=', end),
          );
        } else {
          const today = new Date();
          const startOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          const endOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            23,
            59,
            59,
          );

          queryConstraints.push(
            where('data.date', '>=', startOfDay),
            where('data.date', '<=', endOfDay),
          );
        }

        if (activeFilters.clientId) {
          queryConstraints.push(
            where('data.client.id', '==', activeFilters.clientId),
          );
        }

        if (new Date() >= restrictionStartDate) {
          if (!hasManageAllAccess({ role })) {
            queryConstraints.push(where('data.userID', '==', uid));
          }
        }

        queryConstraints.push(orderBy('data.date', 'desc'));

        const q = query(invoicesRef, ...queryConstraints);

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              setSnapshotState({ queryKey, invoices: [] });
              return;
            }

            let data = snapshot.docs
              .map((item) => item.data() as DocumentData)
              .filter(
                (item) => (item as InvoiceDoc).data?.status !== 'cancelled',
              )
              .map((item) => item as InvoiceDoc);

            data = applyClientSideFilters(data, activeFilters);

            setSnapshotState({ queryKey, invoices: data });
          },
          (error) => {
            console.error('Error fetching invoices with filters:', error);
            setSnapshotState({ queryKey, invoices: [] });
          },
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up invoices listener:', error);
        setSnapshotState({ queryKey, invoices: [] });
        return undefined;
      }
    };

    const unsubscribe = fetchInvoices();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [
    businessID,
    activeFilters,
    queryKey,
    uid,
    role,
    user,
  ]);

  const isCurrentSnapshot = snapshotState.queryKey === queryKey;
  const invoices = queryKey && isCurrentSnapshot ? snapshotState.invoices : [];
  const loading = Boolean(queryKey) && !isCurrentSnapshot;

  return { invoices, loading };
};
