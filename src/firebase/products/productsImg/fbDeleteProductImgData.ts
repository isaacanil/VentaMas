import { deleteDoc, doc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

export const fbDeleteProductImgData = async (
  user: UserWithBusiness | null | undefined,
  id: string,
) => {
  if (!user?.businessID) {
    return;
  }
  const imgRef = doc(db, 'businesses', user?.businessID, 'productsImages', id);
  try {
    await deleteDoc(imgRef);
    console.log(id);
  } catch (error: unknown) {
    console.log(error);
  }
};
