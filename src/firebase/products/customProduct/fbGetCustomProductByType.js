import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbGetProductsQueryByType = async (
  setProducts,
  type,
  size,
  user,
) => {
  if (!user && user.businessID) {
    return;
  }
  const productsRef = collection(db, 'businesses', user.businessID, 'products');
  const q = query(
    productsRef,
    where('type', '==', type),
    where('size', '==', size),
    orderBy('name', 'asc'),
  );
  const { docs } = await getDocs(q);
  const array = docs.map((item) => item.data());
  // Custom products retrieved
  setProducts(array);
};
