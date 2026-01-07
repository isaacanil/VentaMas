import {
  Timestamp,
  doc,
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
import { updateLocalAttachmentsWithRemoteURLs } from '@/utils/purchase/attachments';
import type { UserIdentity } from '@/types/users';
import type {
  Purchase,
  PurchaseAttachment,
  PurchaseReplenishment,
} from '@/utils/purchase/types';
import { fbUpdateProdStockForReplenish } from './fbUpdateProdStockForReplenish';

interface AddPurchaseParams {
  user: UserIdentity;
  purchase: Purchase;
  localFiles?: PurchaseAttachment[];
  setLoading?: (value: boolean) => void;
}

export async function addPurchase({
  user,
  purchase,
  localFiles = [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLoading = () => { },
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
      await updateDoc(ordersRef, { status: 'completed' });
    }

    let uploadedFiles: PurchaseAttachment[] = [];
    if (localFiles.length > 0) {
      const files = localFiles.map(({ file }) => file).filter(Boolean) as File[];
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

    const updatedReplenishments = (purchase.replenishments || []).map(
      (item: PurchaseReplenishment) => {
        const expirationMillis = toMillis(item.expirationDate);
        return {
          ...item,
          expirationDate:
            typeof expirationMillis === 'number' && Number.isFinite(expirationMillis)
              ? Timestamp.fromMillis(expirationMillis)
              : null,
        };
      },
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deliveryAt: safeTimestamp(purchase.deliveryAt, 'now'),
      paymentAt: safeTimestamp(purchase.paymentAt, 'now'),
      completedAt: purchase.completedAt
        ? safeTimestamp(purchase.completedAt, 'now')
        : null,
      attachmentUrls: updatedAttachments,
      replenishments: updatedReplenishments,
    };

    await setDoc(purchasesRef, data);
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

    const updatedReplenishments = (purchase.replenishments || []).map((item) => {
      const expirationMillis = toMillis(item.expirationDate);
      return {
        ...item,
        expirationDate:
          typeof expirationMillis === 'number' && Number.isFinite(expirationMillis)
            ? Timestamp.fromMillis(expirationMillis)
            : null,
      };
    });

    const deliveryDateMillis = toMillis(purchase.dates?.deliveryDate) ?? Date.now();
    const paymentDateMillis = toMillis(purchase.dates?.paymentDate) ?? Date.now();

    const data: Purchase = {
      ...purchase,
      id,
      numberId: nextID,
      deliveryDate: Timestamp.fromMillis(deliveryDateMillis),
      paymentDate: Timestamp.fromMillis(paymentDateMillis),
      replenishments: updatedReplenishments,
    };

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
    setLoading({ isOpen: false, message: '' });
    return data;
  } catch (error) {
    setLoading({ isOpen: false, message: '' });
    console.error('Error adding purchase: ', error);
    throw error;
  }
};

