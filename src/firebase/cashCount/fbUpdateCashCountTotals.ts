import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord } from '@/utils/cashCount/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

export async function fbUpdateCashCountTotals(
  user: UserIdentity | null | undefined,
  cashCountId?: string | null,
  cashCount?: CashCountRecord | null,
): Promise<void> {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId || !cashCountId) {
    return;
  }
  try {
    const cashCountRef = doc(
      db,
      'businesses',
      businessId,
      'cashCounts',
      cashCountId,
    );
    await updateDoc(cashCountRef, {
      'cashCount.totalCard': cashCount?.totalCard ?? 0,
      'cashCount.totalTransfer': cashCount?.totalTransfer ?? 0,
      'cashCount.totalCharged': cashCount?.totalCharged ?? 0,
      'cashCount.totalReceivables': cashCount?.totalReceivables ?? 0,
      'cashCount.totalDiscrepancy': cashCount?.totalDiscrepancy ?? 0,
      'cashCount.totalRegister': cashCount?.totalRegister ?? 0,
      'cashCount.totalSystem': cashCount?.totalSystem ?? 0,
    });
  } catch (error) {
    console.error('Error al actualizar el documento:', error);
  }
}
