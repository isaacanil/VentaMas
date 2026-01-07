// @ts-nocheck
import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbUpdateProduct = async (data, user) => {
  const product = {
    ...data,
  };
  const { businessID } = user;
  const productRef = doc(db, 'businesses', businessID, 'products', product.id);
  await updateDoc(productRef, product);
};
