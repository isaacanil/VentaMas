import { query, getDocs, where, collection } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/date/toMillis';
import type { UserIdentity } from '@/types/users';
import type { CashCountInvoice } from '@/utils/cashCount/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

export const fbLoadInvoicesForCashCount = async (
  user: UserIdentity | null | undefined,
  cashCountID?: string | null,
): Promise<CashCountInvoice[]> => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId || !cashCountID) return [];

  const invoicesRef = collection(db, 'businesses', businessId, 'invoices');
  const q = query(invoicesRef, where('data.cashCountId', '==', cashCountID));

  try {
    const invoiceSnap = await getDocs(q);
    return invoiceSnap.docs
      .map((doc) => doc.data() as CashCountInvoice)
      .filter((doc) => doc.data?.status !== 'cancelled')
      .sort((a, b) => {
        const timeA = toMillis(a.data?.date ?? null) ?? 0;
        const timeB = toMillis(b.data?.date ?? null) ?? 0;
        return timeB - timeA;
      });
  } catch (err) {
    console.error('Error al cargar facturas:', err);
    return [];
  }
};
