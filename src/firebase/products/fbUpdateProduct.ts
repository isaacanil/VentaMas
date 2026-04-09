import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

export const fbUpdateProduct = async (
  data: ProductRecord & { id: string },
  user: UserWithBusiness,
): Promise<void> => {
  const product = {
    ...data,
  };
  const { businessID } = user;
  const productRef = doc(db, 'businesses', businessID, 'products', product.id);
  await updateDoc(productRef, product);
};
