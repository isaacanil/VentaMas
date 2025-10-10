import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore"

import { db } from "../firebaseconfig"

export const fbDeleteOrder = async (user, orderId) => {
    if (!user || !user.businessID) return;

    const OrderRef = doc(db, "businesses", user.businessID, "orders", orderId)

    try {
        //Obtener la orden antes de cancelarla
        const orderSnap = await getDoc(OrderRef)

        if (!orderSnap.exists()) {
            console.warn("Order not found");
            return;
        }

        const orderData = orderSnap.data();

        const backOrdersToRelease = [];
        if (orderData.replenishments) {
            orderData.replenishments.forEach(item => {
                if (item.selectedBackOrders && item.selectedBackOrders.length > 0) {
                    item.selectedBackOrders.forEach(bo => backOrdersToRelease.push(bo.id));
                }
            });
        }

        const batch = writeBatch(db);

        backOrdersToRelease.forEach(boId => {
            const backOrderRef = doc(db, "businesses", user.businessID, "backOrders", boId);
            batch.update(backOrderRef, {
                status: 'pending',
                reservedBy: null,
                reservedAt: null,
                orderId: null,
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
            });
        });

        batch.update(OrderRef, {
            status: 'canceled',
            updatedAt: serverTimestamp(),
            updatedBy: user.uid
        });

        await batch.commit();

        console.log(`Order ${orderId} cancelled successfully, back orders released.`);

    } catch (error) {
        console.error("Error cancelling order: ", error)
    }
}