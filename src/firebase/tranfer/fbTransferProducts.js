import {
  collection,
  getDocs,
  writeBatch,
  doc,
  Timestamp,
  limit as firebaseLimit,
  query,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '../firebaseconfig';

export const transferProducts = async (businessIdA, businessIdB, limit = 0) => {
  const productsBusinessA = collection(
    db,
    `businesses/${businessIdA}/products`,
  );
  const productsBusinessB = collection(
    db,
    `businesses/${businessIdB}/products`,
  );

  let q = productsBusinessA;

  if (limit) {
    q = query(productsBusinessA, firebaseLimit(limit));
  }

  const querySnapshot = await getDocs(q);

  let totalProducts = querySnapshot.docs.length;

  console.info(`Found ${totalProducts} products to transfer`);

  if (limit > 0 && limit < totalProducts) {
    totalProducts = limit;
  }

  // Processing product transfer

  const batchSize = 500;
  let _batchCount = 0;
  for (let i = 0; i < totalProducts; i += batchSize) {
    const batch = writeBatch(db);
    querySnapshot.docs.slice(i, i + batchSize).forEach((item) => {
      const product = item.data();
      const id = nanoid(12);
      const changeProduct = {
        ...product,
        stock: 0,
        createdAt: Timestamp.now(),
        image: '',
        id: id,
      };
      const newProductRef = doc(productsBusinessB, id);
      batch.set(newProductRef, changeProduct);
    });

    await batch.commit();
    _batchCount++;
    // Batch processed
  }

  console.info('Product transfer completed successfully');
};
