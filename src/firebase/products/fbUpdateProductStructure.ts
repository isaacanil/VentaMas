import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

export const fbUpdateProductStructure = async (
  user: UserWithBusiness | null | undefined,
  id: string,
): Promise<void> => {
  const docRef = doc(db, 'businesses', user?.businessID, `products`, id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = (docSnap.data() as { product?: ProductRecord }).product;
      if (data) {
        const newProduct = {
          ...data,
        };

        await setDoc(docRef, newProduct);
      } else {
        console.warn('No product data found');
      }
    } else {
      console.warn('Product document not found');
    }
  } catch (e) {
    console.error('Error updating document: ', e);
  }
};
