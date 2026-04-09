import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

export async function fbUpdateCreditLimit({
  user,
  client,
  creditLimitData,
}: {
  user: UserIdentity | null | undefined;
  client?: { id?: string | null } | null;
  creditLimitData:
    | (CreditLimitConfig & { clientId?: string | null })
    | null
    | undefined;
}) {
  if (!user?.businessID) return;
  if (!creditLimitData) return;
  const creditLimitRef = doc(db, 'creditLimit', creditLimitData?.clientId);
  const creditLimit = {
    ...creditLimitData,
    clientId: client?.id,
    updatedBy: user?.uid,
  };
  await updateDoc(creditLimitRef, creditLimit);
  return creditLimit;
}
