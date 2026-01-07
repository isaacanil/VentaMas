import { doc, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { PurchaseReplenishment } from '@/utils/purchase/types';

export const fbUpdateProdStockForReplenish = async (
  user: UserIdentity,
  replenishments: PurchaseReplenishment[] = [],
): Promise<void> => {
  if (!user?.businessID) {
    throw new Error('No user or businessID provided');
  }

  const updates = replenishments.map((item) => {
    const productId = item.id || item.productId;
    if (!productId) return null;

    const stockIncrement = Number(item.newStock ?? item.quantity ?? item.purchaseQuantity ?? 0);
    const productRef = doc(
      db,
      'businesses',
      user.businessID,
      'products',
      productId,
    );
    return updateDoc(productRef, {
      'product.stock': increment(Number.isFinite(stockIncrement) ? stockIncrement : 0),
    });
  });

  await Promise.all(updates.filter(Boolean) as Promise<unknown>[]);
};

