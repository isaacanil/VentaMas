import { doc, increment, updateDoc } from 'firebase/firestore';

import { db } from '../firebaseconfig';

export const fbRemoveOutputRestoreQuantity = (user, item) => {
  if (!user?.businessID) return;
  const { product, totalRemovedQuantity } = item;
  const restoredQuantity = product.stock + totalRemovedQuantity;
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
      'product.stock': increment(totalRemovedQuantity),
    });
  } catch (error) {
    console.log('Lo sentimos Ocurrió un error: ', error);
  }
};
