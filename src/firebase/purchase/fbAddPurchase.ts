import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from '@/firebase/firebaseconfig';
import { fbUploadFiles } from '@/firebase/img/fbUploadFileAndGetURL';
import { getNextID } from '@/firebase/Tools/getNextID';
import { safeTimestamp } from '@/firebase/utils/firestoreDates';
import { toMillis } from '@/utils/date/toMillis';
import {
  resolveMonetarySnapshotForBusiness,
} from '@/utils/accounting/monetary';
import {
  resolvePurchaseMonetaryTotals,
  resolvePurchasePaymentState,
  resolvePurchasePaymentTerms,
} from '@/utils/purchase/financials';
import { updateLocalAttachmentsWithRemoteURLs } from '@/utils/purchase/attachments';
import { buildOrderStatusPatch } from '@/utils/order/status';
import {
  normalizePurchaseReplenishments,
  resolveLegacyPurchaseStatus,
  resolvePurchaseWorkflowStatus,
} from '@/utils/purchase/workflow';
import type { UserIdentity } from '@/types/users';
import type {
  Purchase,
  PurchaseAttachment,
  PurchaseReplenishment,
} from '@/utils/purchase/types';
import { syncVendorBillFromPurchase } from '@/firebase/vendorBills/fbUpsertVendorBill';
import { fbUpdateProdStockForReplenish } from './fbUpdateProdStockForReplenish';

interface AddPurchaseParams {
  user: UserIdentity;
  purchase: Purchase;
  localFiles?: PurchaseAttachment[];
  setLoading?: (value: boolean) => void;
}

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

export async function addPurchase({
  user,
  purchase,
  localFiles = [],
  // eslint_disable-next-line @typescript-eslint/no-empty-function
  setLoading = () => {},
}: AddPurchaseParams) {
  try {
    if (!user?.businessID) {
      throw new Error('No user or businessID provided');
    }

    const id = nanoid();
    const numberId = await getNextID(user, 'lastPurchaseNumberId');
    const purchasesRef = doc(
      db,
      'businesses',
      user.businessID,
      'purchases',
      id,
    );

    if (purchase.orderId) {
      const ordersRef = doc(
        db,
        'businesses',
        user.businessID,
        'orders',
        purchase.orderId,
      );
      const orderSnap = await getDoc(ordersRef);
      await updateDoc(ordersRef, buildOrderStatusPatch(orderSnap.data(), 'completed'));
    }

    let uploadedFiles: PurchaseAttachment[] = [];
    if (localFiles.length > 0) {
      const files = localFiles
        .map(({ file }) => file)
        .filter(Boolean) as File[];
      uploadedFiles = await fbUploadFiles(
        user,
        'purchaseAndOrderFiles',
        files,
        {
          customMetadata: {
            type: 'purchase_attachment',
          },
        },
      );
    }

    const existingAttachments = purchase.attachmentUrls || [];
    const updatedAttachments = updateLocalAttachmentsWithRemoteURLs(
      existingAttachments,
      uploadedFiles,
    );

    const updatedReplenishments = normalizePurchaseReplenishments(
      purchase.replenishments,
    ).map((item: PurchaseReplenishment) => {
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
    const legacyStatus = resolveLegacyPurchaseStatus(workflowStatus);
    const paymentTerms = resolvePurchasePaymentTerms(purchase);
    const paymentState = resolvePurchasePaymentState({
      purchase: { ...purchase, paymentTerms },
      total: resolvePurchaseMonetaryTotals(purchase).total,
    });
    const pilotMonetarySnapshot = await resolvePurchaseMonetarySnapshot(
      user.businessID,
      { ...purchase, paymentTerms, paymentState },
      user.uid,
    );

    const replenishmentsWithBackOrders = updatedReplenishments.filter(
      (item) => item.selectedBackOrders && item.selectedBackOrders.length > 0,
    );

    if (replenishmentsWithBackOrders.length > 0) {
      const writeBatchOp = writeBatch(db);

      for (const replenishment of replenishmentsWithBackOrders) {
        for (const backOrder of replenishment.selectedBackOrders || []) {
          const backOrderRef = doc(
            db,
            'businesses',
            user.businessID,
            'backOrders',
            backOrder.id,
          );
          writeBatchOp.update(backOrderRef, {
            status: 'reserved',
            reservedBy: user.uid,
            reservedAt: serverTimestamp(),
            purchaseId: id,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          });
        }
      }

      await writeBatchOp.commit();
    }

    const data = {
      ...purchase,
      id,
      numberId,
      status: legacyStatus,
      workflowStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deliveryAt: safeTimestamp(purchase.deliveryAt, 'now'),
      paymentAt: safeTimestamp(purchase.paymentAt, 'now'),
      completedAt: purchase.completedAt
        ? safeTimestamp(purchase.completedAt, 'now')
        : null,
      attachmentUrls: updatedAttachments,
      replenishments: updatedReplenishments,
      paymentTerms,
      paymentState,
    };
    if (pilotMonetarySnapshot) {
      data.monetary = pilotMonetarySnapshot;
    }

    await setDoc(purchasesRef, data);
    await syncVendorBillFromPurchase({
      user,
      purchase: data,
    });
    setLoading(false);
    return data;
  } catch (error) {
    setLoading(false);
    console.error('Error in addPurchase:', error);
    throw error;
  }
}

interface LegacyLoadingState {
  isOpen: boolean;
  message: string;
}

export const fbAddPurchase = async (
  user: UserIdentity,
  purchase: Purchase,
  fileList: File[] = [],
  setLoading: (state: LegacyLoadingState) => void,
): Promise<Purchase> => {
  try {
    if (!user?.businessID) {
      throw new Error('No user or businessID provided');
    }

    const id = nanoid(10);
    const purchasesRef = doc(
      db,
      'businesses',
      user.businessID,
      'purchases',
      id,
    );
    setLoading({
      isOpen: true,
      message: 'Iniciando proceso de registro de Compra',
    });

    const nextID = await getNextID(user, 'lastPurchaseNumberId');

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
    const legacyStatus = resolveLegacyPurchaseStatus(workflowStatus);

    const deliveryDateMillis =
      toMillis(purchase.dates?.deliveryDate) ?? Date.now();
    const paymentDateMillis =
      toMillis(purchase.dates?.paymentDate) ?? Date.now();

    const data: Purchase = {
      ...purchase,
      id,
      numberId: nextID,
      status: legacyStatus,
      workflowStatus,
      deliveryDate: Timestamp.fromMillis(deliveryDateMillis),
      paymentDate: Timestamp.fromMillis(paymentDateMillis),
      replenishments: updatedReplenishments,
    };
    const paymentTerms = resolvePurchasePaymentTerms({
      ...purchase,
      paymentAt: paymentDateMillis,
    });
    const paymentState = resolvePurchasePaymentState({
      purchase: {
        ...purchase,
        paymentAt: paymentDateMillis,
        paymentTerms,
      },
      total: resolvePurchaseMonetaryTotals(purchase).total,
    });
    data.paymentTerms = paymentTerms;
    data.paymentState = paymentState;
    const pilotMonetarySnapshot = await resolvePurchaseMonetarySnapshot(
      user.businessID,
      { ...purchase, paymentAt: paymentDateMillis, paymentTerms, paymentState },
      user.uid,
    );
    if (pilotMonetarySnapshot) {
      data.monetary = pilotMonetarySnapshot;
    }

    if (fileList.length > 0) {
      setLoading({
        isOpen: true,
        message: 'Subiendo imagen del recibo al servidor...',
      });
      const files = (await fbUploadFiles(
        user,
        'purchaseReceipts',
        fileList,
      )) as PurchaseAttachment[];
      const existingFileList =
        (data as { fileList?: PurchaseAttachment[] }).fileList ?? [];
      data.fileList = [...existingFileList, ...files];
    }

    setLoading({ isOpen: true, message: 'Actualizando stock de productos...' });
    await fbUpdateProdStockForReplenish(user, data.replenishments);

    await setDoc(purchasesRef, { data });
    await syncVendorBillFromPurchase({
      user,
      purchase: data,
    });
    setLoading({ isOpen: false, message: '' });
    return data;
  } catch (error) {
    setLoading({ isOpen: false, message: '' });
    console.error('Error adding purchase: ', error);
    throw error;
  }
};
