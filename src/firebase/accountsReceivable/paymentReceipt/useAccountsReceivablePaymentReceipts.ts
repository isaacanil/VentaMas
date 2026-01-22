import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { validateUser } from '@/utils/userValidation';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivablePaymentReceipt } from '@/utils/accountsReceivable/types';

type TimeRange = { startDate?: string | number | Date; endDate?: string | number | Date };

const fetchPaymentReceipts = async ({
  queryKey,
}: {
  queryKey: [string, TimeRange | null | undefined, UserIdentity | null | undefined];
}): Promise<AccountsReceivablePaymentReceipt[]> => {
  const [, time, user] = queryKey;

  validateUser(user);
  const { businessID, uid, role } = user as UserIdentity;

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
    if (['admin', 'owner', 'dev'].includes(role)) {
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
    .filter((item) =>
      Array.isArray(item.paymentMethod) &&
      item.paymentMethod.some((method) => method.status === true),
    );
};

export const useAccountsReceivablePaymentReceipts = (time: TimeRange | null | undefined) => {
  const user = useSelector(selectUser) as UserIdentity | null;

  const { data: paymentReceipts, isLoading: loading } = useQuery({
    queryKey: ['paymentReceipts', time, user],
    queryFn: fetchPaymentReceipts,
    enabled: !!time && !!user, // solo ejecutar cuando time y user existen
  });

  return { paymentReceipts, loading };
};
