import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { safeTimestamp } from '@/firebase/utils/firestoreDates';
import type { UserIdentity } from '@/types/users';
import type { Purchase, PurchaseAttachment } from '@/utils/purchase/types';
import { syncPurchaseAttachments } from './attachmentService';

interface UpdatePurchaseParams {
  user: UserIdentity;
  purchase: Purchase;
  localFiles?: PurchaseAttachment[];
  setLoading?: (value: boolean) => void;
}

export const fbUpdatePurchase = async ({
  user,
  purchase,
  localFiles = [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLoading = () => { },
}: UpdatePurchaseParams) => {
  try {
    setLoading(true);

    if (!user?.businessID) {
      throw new Error('No user or businessID provided');
    }
    if (!purchase?.id) {
      throw new Error('No purchase id provided');
    }

    const purchaseRef = doc(
      db,
      'businesses',
      user.businessID,
      'purchases',
      purchase.id,
    );

    const updatedAttachments = await syncPurchaseAttachments({
      user,
      purchaseId: purchase.id,
      currentAttachments: purchase.attachmentUrls,
      localFiles,
    });

    const updatedData = {
      ...purchase,
      createdAt: purchase.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      deliveryAt: safeTimestamp(purchase.deliveryAt, 'server'),
      paymentAt: safeTimestamp(purchase.paymentAt, 'server'),
      completedAt: purchase.completedAt
        ? safeTimestamp(purchase.completedAt, 'server')
        : null,
      attachmentUrls: updatedAttachments,
    };

    await updateDoc(purchaseRef, updatedData);
    setLoading(false);
    return updatedData;
  } catch (error) {
    setLoading(false);
    console.error('Error updating purchase:', error);
    throw error;
  }
};

