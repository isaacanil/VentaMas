import { doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

export const fbAddProductImgData = async (user: UserIdentity | null, url: string): Promise<void> => {
  if (!user || !user?.businessID) {
    return;
  }
  let id = nanoid(10);
  const imgRef = doc(db, 'businesses', user.businessID, 'productsImages', id);
  try {
    await setDoc(imgRef, {
      id: id,
      url: url,
    });
  } catch (error) {
    console.log(error);
  }
};
