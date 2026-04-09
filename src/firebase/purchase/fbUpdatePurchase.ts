import { Timestamp, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { safeTimestamp } from '@/firebase/utils/firestoreDates';
import { toMillis } from '@/utils/date/toMillis';
import {
  resolveMonetarySnapshotForBusiness,
} from '@/utils/accounting/monetary';
import type { UserIdentity } from '@/types/users';
import type { Purchase, PurchaseAttachment } from '@/utils/purchase/types';
import {
  resolvePurchaseMonetaryTotals,
  resolvePurchasePaymentState,
  resolvePurchasePaymentTerms,
} from '@/utils/purchase/financials';
import {
  canEditPurchase,
  normalizePurchaseReplenishments,
  resolveLegacyPurchaseStatus,
  resolvePurchaseWorkflowStatus,
} from '@/utils/purchase/workflow';
import { syncVendorBillFromPurchase } from '@/firebase/vendorBills/fbUpsertVendorBill';
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
  // eslint_disable-next-line @typescript-eslint/no-empty-function
  setLoading = () => {},
}: UpdatePurchaseParams) => {
  try {
    setLoading(true);

    if (!user?.businessID) {
      throw new Error('No user or businessID provided');
    }
    if (!purchase?.id) {
      throw new Error('No purchase id provided');
    }
    if (!canEditPurchase(purchase)) {
      throw new Error(
        'Solo se pueden editar compras pendientes de recepcion.',
      );
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
    const updatedReplenishments = normalizePurchaseReplenishments(
      purchase.replenishments,
    ).map((item) => {
      const expirationMillis = toMillis(item.expirationDate);
      return {
        ...item,
        expirationDate:
          typeof expirationMillis === 'number' &&
          Number.isFinite(expirationMillis)
            ? Timestamp.fromMillis(expirationMillis)
            : null,
      };
    });
    const workflowStatus = resolvePurchaseWorkflowStatus({
      ...purchase,
      replenishments: updatedReplenishments,
    });
    const status = resolveLegacyPurchaseStatus(workflowStatus);
    const totals = resolvePurchaseMonetaryTotals(purchase);
    const paymentTerms = resolvePurchasePaymentTerms(purchase);
    const paymentState = resolvePurchasePaymentState({
      purchase: { ...purchase, paymentTerms },
      total: totals.total,
    });
    const resolvedMonetary =
      totals.total != null
        ? await resolveMonetarySnapshotForBusiness({
            businessId: user.businessID,
            monetary: purchase.monetary,
            operationType: 'purchase',
            source: purchase,
            totals: {
              subtotal: totals.subtotal || undefined,
              taxes: totals.taxes || undefined,
              total: totals.total ?? 0,
              paid: paymentState?.paid ?? 0,
              balance: paymentState?.balance ?? totals.total ?? 0,
            },
            capturedBy: user.uid ?? null,
          })
        : null;
    const monetary = resolvedMonetary ?? purchase.monetary ?? null;

    const updatedData = {
      ...purchase,
      createdAt: purchase.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      status,
      workflowStatus,
      deliveryAt: safeTimestamp(purchase.deliveryAt, 'server'),
      paymentAt: safeTimestamp(purchase.paymentAt, 'server'),
      completedAt: purchase.completedAt
        ? safeTimestamp(purchase.completedAt, 'server')
        : null,
      attachmentUrls: updatedAttachments,
      replenishments: updatedReplenishments,
      paymentTerms,
      paymentState,
      monetary,
    };

    await updateDoc(purchaseRef, updatedData);
    await syncVendorBillFromPurchase({
      user,
      purchase: updatedData,
    });
    setLoading(false);
    return updatedData;
  } catch (error) {
    setLoading(false);
    console.error('Error updating purchase:', error);
    throw error;
  }
};
