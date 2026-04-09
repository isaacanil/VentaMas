import { doc, setDoc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

type CreditLimitPayload = CreditLimitConfig & {
  id?: string;
  clientId?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export async function fbUpsertCreditLimit({
  user,
  client,
  creditLimitData,
}: {
  user: UserIdentity | null | undefined;
  client: { id?: string | null } | null | undefined;
  creditLimitData: CreditLimitPayload | null | undefined;
}): Promise<CreditLimitPayload | undefined> {
  if (!user?.businessID) return;
  if (!creditLimitData) return;
  if (!client?.id) return;

  let creditLimit: CreditLimitPayload = {
    ...creditLimitData,
    updatedBy: user?.uid,
    updatedAt: Timestamp.now(),
  };

  const creditLimitRef = doc(
    db,
    'businesses',
    user.businessID,
    'creditLimit',
    client?.id,
  );

  const docSnapshot = await getDoc(creditLimitRef);

  if (docSnapshot.exists()) {
    const existing = docSnapshot.data() as CreditLimitPayload;
    await updateDoc(creditLimitRef, {
      ...creditLimit,
      id: existing.id,
      clientId: existing.clientId,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
    });
  } else {
    creditLimit = {
      ...creditLimit,
      id: client?.id, // Usamos el id del cliente como id del documento
      clientId: client?.id,
      createdAt: Timestamp.now(),
      createdBy: user?.uid,
    };
    await setDoc(creditLimitRef, creditLimit);
  }

  return creditLimit;
}
