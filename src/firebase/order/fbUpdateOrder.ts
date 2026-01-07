// @ts-nocheck
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { fbUploadFiles } from '@/firebase/img/fbUploadFileAndGetURL';
import { safeTimestamp } from '@/firebase/utils/firestoreDates';
import { updateLocalAttachmentsWithRemoteURLs } from '@/utils/purchase/attachments';

export const fbUpdateOrder = async ({ user, order, localFiles = [] }) => {
  if (!user || !user?.businessID) return;

  const { id: orderId, createdAt, deliveryAt, paymentAt, completedAt } = order;

  try {
    let uploadedFiles = [];
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

    const attachmentUrls = updateLocalAttachmentsWithRemoteURLs(
      existingAttachments,
      uploadedFiles,
    );

    let data = {
      ...order,
      attachmentUrls,
      createdAt: safeTimestamp(createdAt, 'now'),
      deliveryAt: safeTimestamp(deliveryAt, 'now'),
      paymentAt: safeTimestamp(paymentAt, 'now'),
      completedAt: safeTimestamp(completedAt, 'now'),
    };
    const orderRef = doc(db, 'businesses', user.businessID, 'orders', orderId);

    const orderSnap = await getDoc(orderRef);
    const previousData = orderSnap.exists() ? orderSnap.data() : null;

    const previousBackOrders = [];
    if (previousData && previousData.replenishments) {
      previousData.replenishments.forEach((item) => {
        if (item.selectedBackOrders && item.selectedBackOrders.length > 0) {
          item.selectedBackOrders.forEach((bo) =>
            previousBackOrders.push(bo.id),
          );
        }
      });
    }

    // Extraer ID de backorders en la nueva versión de la orden
    const newBackOrders = [];
    if (order.replenishments) {
      order.replenishments.forEach((item) => {
        if (item.selectedBackOrders && item.selectedBackOrders.length > 0) {
          item.selectedBackOrders.forEach((bo) => newBackOrders.push(bo.id));
        }
      });
    }

    // Determinar cuáles backorders se han removido y cuáles se han agregado
    const removedBackOrders = previousBackOrders.filter(
      (id) => !newBackOrders.includes(id),
    );
    const addedBackOrders = newBackOrders.filter(
      (id) => !previousBackOrders.includes(id),
    );

    // Ejecutar los cambios en batch:
    const batch = writeBatch(db);

    // Liberar backorders removidos (quedarán disponibles nuevamente)
    removedBackOrders.forEach((boId) => {
      const backOrderRef = doc(
        db,
        'businesses',
        user.businessID,
        'backOrders',
        boId,
      );
      batch.update(backOrderRef, {
        status: 'pending',
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        reservedBy: null,
        reservedAt: null,
        orderId: null,
      });
    });

    // Reservar los nuevos backorders agregados
    addedBackOrders.forEach((boId) => {
      const backOrderRef = doc(
        db,
        'businesses',
        user.businessID,
        'backOrders',
        boId,
      );
      batch.update(backOrderRef, {
        status: 'reserved',
        reservedBy: user.uid,
        reservedAt: serverTimestamp(),
        orderId: order.id, // Relacionar con el ID de la orden
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
    });

    await batch.commit();
    await updateDoc(orderRef, data);
    return { success: true, data };
  } catch (error) {
    console.error('Error updating document: ', error);
  }
};
