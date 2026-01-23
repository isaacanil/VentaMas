import { doc, increment, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type OutputRestoreItem = {
  product: ProductRecord;
  totalRemovedQuantity: number;
};

export const fbRemoveOutputRestoreQuantity = (
  user: UserWithBusiness | null | undefined,
  item: OutputRestoreItem,
): void => {
  if (!user?.businessID) return;
  const { product, totalRemovedQuantity } = item;
  const restoredQuantity =
    Number(product.stock ?? 0) + Number(totalRemovedQuantity ?? 0);
  const productRef = doc(
    db,
    'businesses',
    user.businessID,
    'products',
    product.id,
  );
  console.log(
    product.stock,
    '========',
    totalRemovedQuantity,
    '========',
    restoredQuantity,
  );
  try {
    updateDoc(productRef, {
      'product.stock': increment(Number(totalRemovedQuantity)),
    });
  } catch (error) {
    console.log('Lo sentimos Ocurrió un error: ', error);
  }
};
