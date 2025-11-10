import { collection, Timestamp, query, where, getDocs, updateDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { nanoid } from "nanoid";

import { db } from "../firebaseconfig";

/**
 * Registra el uso de un NCF en la colección ncfUsage
 * @param {Object} user - Usuario actual
 * @param {string} ncfCode - Código NCF generado
 * @param {string} ncfType - Tipo de comprobante (CREDITO FISCAL, CONSUMIDOR FINAL)
 * @param {Object} client - Datos del cliente (opcional)
 * @param {string} status - Estado inicial del uso (default: 'pending')
 * @param {string} invoiceId - ID de la factura asociada (opcional)
 * @returns {Promise<string>} ID del documento creado en ncfUsage
 */
export async function fbRegisterNcfUsage(user, ncfCode, ncfType, client = null, status = 'pending', invoiceId = null) {
    if (!user?.currentBusinessId) {
        throw new Error('Usuario o businessId no válido');
    }

    if (!ncfCode || !ncfType) {
        throw new Error('NCF code y tipo son requeridos');
    }

    try {
        const ncfUsageData = {
            id: nanoid(),
            ncfCode,
            ncfType,
            status,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            businessId: user.businessID,
            ...(client && {
                clientId: client.id || null,
                clientName: client.name || 'Cliente Genérico',
                clientRnc: client.personalID || null
            }),
            ...(invoiceId && { invoiceId })
        };

        const ncfUsageRef = doc(db, `businesses/${user.businessID}/ncfUsage/${ncfUsageData.id}`);
        await setDoc(ncfUsageRef, ncfUsageData);

        console.info(`NCF Usage registered successfully: ${ncfCode}`);
        return ncfUsageData.id;

    } catch (error) {
        console.error('Error registrando uso de NCF:', error);
        throw new Error(`Error al registrar uso de NCF: ${error.message}`);
    }
}

/**
 * Actualiza el estado de un NCF en la colección ncfUsage
 * @param {Object} user - Usuario actual
 * @param {string} ncfCode - Código NCF a actualizar
 * @param {string} newStatus - Nuevo estado ('completed', 'cancelled', etc.)
 * @param {string} invoiceId - ID de la factura asociada (opcional)
 * @returns {Promise<boolean>} true si se actualizó exitosamente
 */
export async function fbUpdateNcfUsageStatus(user, ncfCode, newStatus, invoiceId = null) {
    if (!user?.currentBusinessId) {
        throw new Error('Usuario o businessId no válido');
    }

    if (!ncfCode || !newStatus) {
        throw new Error('NCF code y nuevo estado son requeridos');
    }

    try {
        const ncfUsageRef = collection(db, `businesses/${user.currentBusinessId}/ncfUsage`);
        const q = query(ncfUsageRef, where('ncfCode', '==', ncfCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`No se encontró el NCF ${ncfCode} en ncfUsage`);
            return false;
        }

        // Actualizar el primer documento encontrado (debería ser único)
        const docRef = querySnapshot.docs[0].ref;
        const updateData = {
            status: newStatus,
            updatedAt: Timestamp.now(),
            ...(invoiceId && { invoiceId })
        };

        await updateDoc(docRef, updateData);
        console.info(`NCF Usage updated successfully: ${ncfCode}`);
        return true;

    } catch (error) {
        console.error('Error actualizando estado de NCF usage:', error);
        throw new Error(`Error al actualizar estado de NCF usage: ${error.message}`);
    }
}
