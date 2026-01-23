import { doc, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import type { Dispatch, SetStateAction } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

export const fbGetCustomProduct = async <
  TProduct extends Record<string, unknown>,
>(
  user: UserWithBusiness | null | undefined,
  setProduct: Dispatch<SetStateAction<TProduct | null>>,
): Promise<Unsubscribe | undefined> => {
  if (!user?.businessID) {
    return;
  }
  const customProductRef = doc(
    db,
    'businesses',
    user.businessID,
    'products',
    '6dssod',
  );
  return onSnapshot(customProductRef, (snapshot) => {
    const data = snapshot.data() as TProduct | undefined;
    setProduct(data ?? null);
  });
};
