import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import type { Dispatch, SetStateAction } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

export const fbGetProductsQueryByType = async <
  TProduct extends Record<string, unknown>,
>(
  setProducts: Dispatch<SetStateAction<TProduct[]>>,
  type: string,
  size: string,
  user: UserWithBusiness | null | undefined,
) => {
  if (!user?.businessID) {
    return;
  }
  const productsRef = collection(
    db,
    'businesses',
    user.businessID,
    'products',
  );
  const q = query(
    productsRef,
    where('type', '==', type),
    where('size', '==', size),
    orderBy('name', 'asc'),
  );
  const { docs } = await getDocs(q);
  const array = docs.map((item) => item.data() as TProduct);
  // Custom products retrieved
  setProducts(array);
};
