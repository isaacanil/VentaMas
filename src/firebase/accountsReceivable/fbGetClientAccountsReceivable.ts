import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

export const fbGetClientAccountsReceivable = ({
  user,
  clientId,
  onUpdate,
}: {
  user: UserIdentity | null | undefined;
  clientId: string | null | undefined;
  onUpdate?: (accounts: AccountsReceivableDoc[]) => void;
}) => {
  if (!user?.businessID || !clientId) {
    return undefined;
  }
  const accountsReceivableRef = collection(
    db,
    'businesses',
    user?.businessID,
    'accountsReceivable',
  );
  const q = query(accountsReceivableRef, where('clientId', '==', clientId));
  const unSnapshot = onSnapshot(
    q,
    (snapshot) => {
      const accountsReceivable = snapshot.docs.map(
        (doc) => doc.data() as AccountsReceivableDoc,
      );
      if (onUpdate) {
        onUpdate(accountsReceivable);
      }
    },
    (error) => {
      console.error('Error al obtener las cuentas por cobrar: ', error);
    },
  );
  return unSnapshot;
};
