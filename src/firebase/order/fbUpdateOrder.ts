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
import {
  resolveLegacyOrderState,
  resolveOrderStatus,
} from '@/utils/order/status';
import { updateLocalAttachmentsWithRemoteURLs } from '@/utils/purchase/attachments';

type UserWithBusinessAndUid = {
  businessID: string;
  uid: string;
};

type Attachment = Record<string, unknown>;

type Replenishment = Record<string, unknown> & {
  selectedBackOrders?: Array<{ id: string }>;
};

type OrderInput = Record<string, unknown> & {
  id: string;
  attachmentUrls?: Attachment[];
  replenishments?: Replenishment[];
  createdAt?: unknown;
  deliveryAt?: unknown;
  paymentAt?: unknown;
  completedAt?: unknown;
};

type LocalFileItem = {
  file: File | Blob;
} & Record<string, unknown>;

export const fbUpdateOrder = async ({
  user,
  order,
  localFiles = [],
}: {
  user: UserWithBusinessAndUid | null | undefined;
  order: OrderInput;
  localFiles?: LocalFileItem[];
}): Promise<{ success: true; data: OrderInput } | undefined> => {
  if (!user || !user?.businessID) return;

  const { id: orderId, createdAt, deliveryAt, paymentAt, completedAt } = order;

  try {
    let uploadedFiles: Attachment[] = [];
    if (localFiles && localFiles.length > 0) {
      const files = localFiles.map(({ file }) => file);
      uploadedFiles = (await fbUploadFiles(
        user,
        'purchaseAndOrderFiles',
        files,
        {
          customMetadata: {
            type: 'purchase_attachment',
          },
        },
      )) as Attachment[];
    }

    const existingAttachments = order.attachmentUrls || [];

    const attachmentUrls = updateLocalAttachmentsWithRemoteURLs(
      existingAttachments,
      uploadedFiles,
    );

    const normalizedStatus = resolveOrderStatus(order);
    const data: OrderInput = {
      ...order,
      attachmentUrls,
      status: normalizedStatus,
      state: resolveLegacyOrderState(normalizedStatus),
      createdAt: safeTimestamp(createdAt, 'now'),
      deliveryAt: safeTimestamp(deliveryAt, 'now'),
      paymentAt: safeTimestamp(paymentAt, 'now'),
      completedAt: safeTimestamp(completedAt, 'now'),
    };
    const orderRef = doc(db, 'businesses', user.businessID, 'orders', orderId);

    const orderSnap = await getDoc(orderRef);
    const previousData = orderSnap.exists()
      ? (orderSnap.data() as OrderInput)
      : null;

    const previousBackOrders: string[] = [];
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
    const newBackOrders: string[] = [];
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
