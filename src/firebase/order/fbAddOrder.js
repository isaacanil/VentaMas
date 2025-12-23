import {
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { fbUploadFiles } from '@/firebase/img/fbUploadFileAndGetURL';
import {
  safeTimestamp,
  updateLocalAttachmentsWithRemoteURLs,
} from '@/firebase/purchase/fbAddPurchase';
import { getNextID } from '@/firebase/Tools/getNextID';

export const fbAddOrder = async (user, value, fileList = []) => {
  try {
    if (!user || !user.businessID) return;
    const nextID = await getNextID(user, 'lastOrdersId');
    let data = {
      ...value,
      id: nanoid(12),
      numberId: nextID,
      dates: {
        ...value.dates,
        deliveryDate: Timestamp.fromMillis(value.dates.deliveryDate),
        createdAt: Timestamp.now(),
      },
      provider: value.providerId,
      state: 'state_2',
    };
    const OrderRef = doc(db, 'businesses', user.businessID, 'orders', data.id);
    if (fileList.length > 0) {
      const files = await fbUploadFiles(user, 'orderReceipts', fileList);
      data.fileList = [...(data?.fileList || []), ...files];
    }
    await setDoc(OrderRef, { data });
  } catch (error) {
    console.error('Error adding document: ', error);
  }
};

export async function addOrder({
  user,
  order,
  localFiles = [],
  setLoading,
}) {
  if (!user || !user.businessID) return;
  try {
    const id = nanoid();
    const numberId = await getNextID(user, 'lastOrdersId');
    const ordersRef = doc(db, 'businesses', user.businessID, 'orders', id);

    let uploadedFiles = [];
    // Solo intentar subir archivos si hay archivos locales
    if (localFiles && localFiles.length > 0) {
      const files = localFiles.map(({ file }) => file);
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

    const existingAttachments = order.attachmentUrls || [];

    const updatedAttachments = updateLocalAttachmentsWithRemoteURLs(
      existingAttachments,
      uploadedFiles,
    );

    const data = {
      ...order,
      id,
      numberId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deliveryAt: safeTimestamp(order.deliveryAt),
      paymentAt: safeTimestamp(order.paymentAt),
      completedAt: order.completedAt ? safeTimestamp(order.completedAt) : null,
      attachmentUrls: updatedAttachments,
    };

    // Manejo de backorders en la orden
    if (order.replenishments) {
      const replenishmentsWithBackOrders = order.replenishments.filter(
        (item) => item.selectedBackOrders && item.selectedBackOrders.length > 0,
      );

      if (replenishmentsWithBackOrders.length > 0) {
        const writeBatchOp = writeBatch(db);

        for (const replenishment of replenishmentsWithBackOrders) {
          for (const backOrder of replenishment.selectedBackOrders) {
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
              orderId: id, // Relacionado con el ID de la orden
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            });
          }
        }
        await writeBatchOp.commit();
      }
    }

    await setDoc(ordersRef, data);
    setLoading?.(false);
    return data;
  } catch (error) {
    setLoading?.(false);
    console.error('Error in addPurchase:', error);
    throw error;
  }
}
