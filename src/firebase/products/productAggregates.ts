import {
  collection,
  count,
  getAggregateFromServer,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export async function getInventoriableProductsCount(
  businessID: string,
): Promise<number> {
  const productsRef = collection(db, 'businesses', businessID, 'products');
  const inventoryProductsQuery = query(
    productsRef,
    where('isDeleted', '==', false),
    where('trackInventory', '==', true),
  );

  const inventorySnapshot = await getAggregateFromServer(inventoryProductsQuery, {
    total: count(),
  });

  return inventorySnapshot?.data()?.total ?? 0;
}

