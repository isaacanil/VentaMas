import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import { resolveMonetarySnapshotForBusiness } from '@/utils/accounting/monetary';
import type { UserIdentity } from '@/types/users';
import type { Purchase } from '@/utils/purchase/types';
import {
  resolvePurchaseMonetaryTotals,
  resolvePurchasePaymentState,
  resolvePurchasePaymentTerms,
} from '@/utils/purchase/financials';
import { syncPurchaseAttachments } from './attachmentService';

interface CompletePurchaseParams {
  user: UserIdentity;
  purchase: Purchase;
  localFiles?: Purchase['attachmentUrls'];
  setLoading?: (value: boolean) => void;
  warehouseId?: string | null;
}

interface CompletePurchaseReceiptPayload {
  businessId: string;
  purchaseId: string;
  purchase: Purchase;
  attachmentUrls?: Purchase['attachmentUrls'];
  paymentTerms?: Purchase['paymentTerms'];
  paymentState?: Purchase['paymentState'];
  monetary?: Purchase['monetary'];
  sessionToken?: string;
  warehouseId?: string | null;
}

interface CompletePurchaseReceiptResult {
  ok: boolean;
  purchase?: Purchase | null;
  receiptInventoryState?: Purchase['receiptInventoryState'];
  destinationWarehouseId?: string | null;
  workflowStatus?: Purchase['workflowStatus'];
  status?: Purchase['status'];
}

const completePurchaseReceiptCallable = createFirebaseCallable<
  CompletePurchaseReceiptPayload,
  CompletePurchaseReceiptResult
>('completePurchaseReceipt');

const resolvePurchaseMonetarySnapshot = async (
  businessId: string,
  purchase: Purchase,
  capturedBy: string | null | undefined,
): Promise<Record<string, unknown> | null> => {
  const totals = resolvePurchaseMonetaryTotals(purchase);
  if (totals.total == null) {
    return null;
  }
  const paymentTerms = resolvePurchasePaymentTerms(purchase);
  const paymentState = resolvePurchasePaymentState({
    purchase: { ...purchase, paymentTerms },
    total: totals.total,
  });

  return resolveMonetarySnapshotForBusiness({
    businessId,
    monetary: purchase.monetary,
    operationType: 'purchase',
    source: purchase,
    totals: {
      subtotal: totals.subtotal || undefined,
      taxes: totals.taxes || undefined,
      total: totals.total,
      paid: paymentState?.paid ?? 0,
      balance: paymentState?.balance ?? totals.total,
    },
    capturedBy: capturedBy ?? null,
  });
};

export const fbCompletePurchase = async ({
  user,
  purchase,
  localFiles = [],
  // eslint_disable-next-line @typescript-eslint/no-empty-function
  setLoading = () => {},
  warehouseId = null,
}: CompletePurchaseParams): Promise<Purchase> => {
  try {
    setLoading(true);

    const businessId = user?.businessID ?? user?.businessId ?? null;
    if (!businessId) {
      throw new Error('No user or businessID provided');
    }
    if (!purchase?.id) {
      throw new Error('No purchase id provided');
    }

    const updatedAttachments = await syncPurchaseAttachments({
      user,
      purchaseId: purchase.id,
      currentAttachments: purchase.attachmentUrls,
      localFiles,
    });
    const paymentTerms = resolvePurchasePaymentTerms(purchase);
    const paymentState = resolvePurchasePaymentState({
      purchase: { ...purchase, paymentTerms },
      total: resolvePurchaseMonetaryTotals(purchase).total,
    });
    const monetary =
      (await resolvePurchaseMonetarySnapshot(
        businessId,
        { ...purchase, paymentTerms, paymentState },
        user.uid,
      )) ??
      purchase.monetary ??
      null;
    const purchasePayload: Purchase = {
      ...purchase,
      attachmentUrls: updatedAttachments,
      paymentTerms,
      paymentState,
      monetary,
    };
    const { sessionToken } = getStoredSession();

    const result = await completePurchaseReceiptCallable({
      businessId,
      purchaseId: purchase.id,
      purchase: purchasePayload,
      attachmentUrls: updatedAttachments,
      paymentTerms,
      paymentState,
      monetary,
      warehouseId,
      ...(sessionToken ? { sessionToken } : {}),
    });

    if (!result?.ok || !result.purchase) {
      throw new Error('No se pudo completar la recepción de la compra.');
    }

    setLoading(false);
    return result.purchase;
  } catch (error) {
    setLoading(false);
    console.error('Error completing purchase:', error);
    throw error;
  }
};
