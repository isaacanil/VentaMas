// @ts-nocheck
import { deleteDoc, doc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbDeleteProduct = async (user, id) => {
  // Deleting product
  if (!user?.businessID) {
    return;
  }
  try {
    const docRef = doc(db, 'businesses', user.businessID, `products`, id);
    await deleteDoc(docRef);
    // Product deleted
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};
