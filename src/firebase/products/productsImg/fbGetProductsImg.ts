import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { ProductImageRecord } from '@/types/products';

export const fbGetProductsImg = (
  user: UserIdentity | null,
  SetAllImg: (images: ProductImageRecord[]) => void,
): Unsubscribe | undefined => {
  if (!user || !user?.businessID) {
    return;
  }
  const imageRef = collection(
    db,
    'businesses',
    user.businessID,
    'productsImages',
  );

  return onSnapshot(imageRef, (querySnapshot) => {
    const img: ProductImageRecord[] = [];
    querySnapshot.forEach((doc) => {
      img.push(doc.data() as ProductImageRecord);
    });

    SetAllImg(img);
  });
};
