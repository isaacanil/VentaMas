import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { hasManageAllAccess } from '@/utils/access/manageAllAccess';
import { validateUser } from '@/utils/userValidation';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivablePaymentReceipt } from '@/utils/accountsReceivable/types';

type TimeRange = {
  startDate?: string | number | Date;
  endDate?: string | number | Date;
};

const toTimeKey = (value?: string | number | Date): number | string | null => {
  if (value == null) return null;
  const dateValue = value instanceof Date ? value : new Date(value);
  const timestamp = dateValue.getTime();
  return Number.isNaN(timestamp) ? String(value) : timestamp;
};

const fetchPaymentReceipts = async (
  time: TimeRange,
  user: UserIdentity,
): Promise<AccountsReceivablePaymentReceipt[]> => {
  validateUser(user);
  const { businessID, uid, role } = user;

  const start = new Date(time.startDate);
  const end = new Date(time.endDate);
  const restrictionStartDate = new Date('2024-01-21T14:41:00');

  const receiptsRef = collection(
    db,
    'businesses',
    businessID,
    'accountsReceivablePaymentReceipt',
  );

  let q;
  if (new Date() >= restrictionStartDate) {
    if (hasManageAllAccess({ role })) {
      q = query(
        receiptsRef,
        where('createdAt', '>=', start),
        where('createdAt', '<=', end),
        orderBy('createdAt', 'desc'),
      );
    } else {
      q = query(
        receiptsRef,
        where('createdAt', '>=', start),
        where('createdAt', '<=', end),
        where('createdBy', '==', uid),
        orderBy('createdAt', 'desc'),
      );
    }
  } else {
    q = query(
      receiptsRef,
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc'),
    );
  }

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as AccountsReceivablePaymentReceipt),
    }))
    .filter(
      (item) =>
        Array.isArray(item.paymentMethod) &&
        item.paymentMethod.some((method) => method.status === true),
    );
};

export const useAccountsReceivablePaymentReceipts = (
  time: TimeRange | null | undefined,
) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = user?.businessID ?? null;
  const userId = user?.uid ?? null;
  const startDateKey = toTimeKey(time?.startDate);
  const endDateKey = toTimeKey(time?.endDate);
  const hasValidTimeRange =
    time?.startDate !== undefined && time?.endDate !== undefined;

  const { data: paymentReceipts, isLoading: loading } = useQuery({
    queryKey: ['paymentReceipts', businessId, userId, startDateKey, endDateKey],
    queryFn: () => fetchPaymentReceipts(time as TimeRange, user as UserIdentity),
    enabled: Boolean(hasValidTimeRange && businessId && userId),
    staleTime: 15000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return { paymentReceipts, loading };
};
