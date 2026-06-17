import { buildVendorBillFromPurchase } from '@/domain/accountsPayable/vendorBills/fromPurchase';
import type { UserIdentity } from '@/types/users';
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

  const vendorBill = buildVendorBillFromPurchase(purchase);
  // La materializacion canonica de CxP vive en el trigger backend
  // syncVendorBillFromPurchase; el cliente no debe escribir vendorBills.
  return vendorBill;
};
