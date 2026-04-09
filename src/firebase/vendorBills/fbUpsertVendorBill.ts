import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import { buildVendorBillFromPurchase } from '@/utils/vendorBills/fromPurchase';
import type { Purchase } from '@/utils/purchase/types';

interface SyncVendorBillFromPurchaseParams {
  user: UserIdentity;
  purchase: Purchase;
}

export const syncVendorBillFromPurchase = async ({
  user,
  purchase,
}: SyncVendorBillFromPurchaseParams) => {
  if (!user?.businessID) {
    throw new Error('No user or businessID provided');
  }
  if (!purchase?.id) {
    throw new Error('No purchase id provided');
  }

  const canonicalVendorBillId = `purchase:${purchase.id}`;
  const vendorBillRef = doc(
    db,
    'businesses',
    user.businessID,
    'vendorBills',
    canonicalVendorBillId,
  );
  const legacyVendorBillRef =
    canonicalVendorBillId !== purchase.id
      ? doc(db, 'businesses', user.businessID, 'vendorBills', purchase.id)
      : null;
  const vendorBill = buildVendorBillFromPurchase(purchase);

  if (!vendorBill) {
    if (legacyVendorBillRef) {
      await deleteDoc(legacyVendorBillRef).catch(() => null);
    }
    await deleteDoc(vendorBillRef);
    return null;
  }

  if (!vendorBill.supplierName && vendorBill.supplierId) {
    const providerRef = doc(
      db,
      'businesses',
      user.businessID,
      'providers',
      vendorBill.supplierId,
    );
    const providerSnap = await getDoc(providerRef);
    if (providerSnap.exists()) {
      const providerData = providerSnap.data() as {
        provider?: { name?: string | null };
        name?: string | null;
      };
      vendorBill.supplierName =
        providerData.provider?.name?.trim() ||
        providerData.name?.trim() ||
        null;
    }
  }

  await setDoc(vendorBillRef, vendorBill);
  if (legacyVendorBillRef) {
    await deleteDoc(legacyVendorBillRef).catch(() => null);
  }
  return vendorBill;
};
