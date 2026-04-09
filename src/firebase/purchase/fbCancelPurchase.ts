import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { syncVendorBillFromPurchase } from '@/firebase/vendorBills/fbUpsertVendorBill';
import type { UserIdentity } from '@/types/users';
import { buildOrderStatusPatch } from '@/utils/order/status';
import type { PurchaseReplenishment } from '@/utils/purchase/types';
import { canCancelPurchase } from '@/utils/purchase/workflow';

interface CancelPurchaseResult {
  success: boolean;
  message: string;
}

/**
 * Cancela una compra en Firebase.
 */
export const fbCancelPurchase = async (
  user: UserIdentity,
  purchaseId: string,
): Promise<CancelPurchaseResult> => {
  if (!user?.businessID) {
    console.warn('Usuario no autenticado');
    return { success: false, message: 'Usuario no autenticado' };
  }

  const purchaseRef = doc(
    db,
    'businesses',
    user.businessID,
    'purchases',
    purchaseId,
  );

  try {
    const purchaseSnap = await getDoc(purchaseRef);
    if (!purchaseSnap.exists()) {
      console.warn('Compra no encontrada');
      return { success: false, message: 'Compra no encontrada' };
    }
    const purchaseData = purchaseSnap.data() as {
      orderId?: string;
      replenishments?: PurchaseReplenishment[];
      paymentState?: { paid?: number | string | null };
      status?: string;
      workflowStatus?: string;
    };
    if (!canCancelPurchase(purchaseData)) {
      return {
        success: false,
        message:
          'Solo se pueden cancelar compras pendientes de recepcion y sin pagos registrados.',
      };
    }

    const backOrdersToRelease: string[] = [];
    if (purchaseData.replenishments) {
      purchaseData.replenishments.forEach((item) => {
        if (item.selectedBackOrders && item.selectedBackOrders.length > 0) {
          item.selectedBackOrders.forEach((bo) =>
            backOrdersToRelease.push(bo.id),
          );
        }
      });
    }

    const batch = writeBatch(db);

    backOrdersToRelease.forEach((boId) => {
      const backOrderRef = doc(
        db,
        'businesses',
        user.businessID,
        'backOrders',
        boId,
      );
      batch.update(backOrderRef, {
        status: 'pending',
        reservedBy: null,
        reservedAt: null,
        purchaseId: null,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
    });

    batch.update(purchaseRef, {
      status: 'canceled',
      workflowStatus: 'canceled',
      canceledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });

    if (purchaseData.orderId) {
      const orderRef = doc(
        db,
        'businesses',
        user.businessID,
        'orders',
        purchaseData.orderId,
      );
      const orderSnap = await getDoc(orderRef);
      batch.update(orderRef, {
        ...buildOrderStatusPatch(orderSnap.data(), 'pending'),
        canceledAt: null,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
    }

    await batch.commit();
    await syncVendorBillFromPurchase({
      user,
      purchase: {
        id: purchaseId,
        ...purchaseData,
        status: 'canceled',
        workflowStatus: 'canceled',
      },
    });

    console.log(
      purchaseData.orderId
        ? `Compra ${purchaseId} cancelada exitosamente, back orders liberados y pedido reabierto.`
        : `Compra ${purchaseId} cancelada exitosamente y back orders liberados.`,
    );
    return {
      success: true,
      message: purchaseData.orderId
        ? 'Compra cancelada y pedido reabierto exitosamente'
        : 'Compra cancelada exitosamente',
    };
  } catch (error) {
    console.error('Error al cancelar la compra:', error);
    throw {
      success: false,
      message: 'Error al cancelar la compra',
      error,
    };
  }
};
