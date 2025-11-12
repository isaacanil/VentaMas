import { doc, updateDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

import { db } from "../firebaseconfig"; // Assuming firebaseconfig.js is in the parent directory

const NUMERIC_FIELDS = ['sequence', 'sequenceLength', 'increase', 'quantity'];

const normalizeTaxReceiptData = (raw = {}) => {
    if (typeof raw !== 'object' || raw === null) return raw;

    const sanitized = { ...raw };
    NUMERIC_FIELDS.forEach((field) => {
        if (sanitized[field] === undefined || sanitized[field] === null || sanitized[field] === '') return;
        const numericValue = Number(sanitized[field]);
        if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
            sanitized[field] = numericValue;
        }
    });

    return sanitized;
};

/**
 * Extrae el número de secuencia de un código NCF
 * @param {string} ncfCode - Código NCF (ej: "B01000001234")
 * @returns {number} Número de secuencia extraído
 */
function extractSequenceFromNCF(ncfCode) {
    if (!ncfCode || typeof ncfCode !== 'string') return 0;
    
    // El NCF tiene formato: TIPO(3) + SERIE(1) + SECUENCIA(8-10)
    // Ejemplo: B01000001234 -> secuencia = 1234
    const sequencePart = ncfCode.slice(4); // Remover tipo + serie (4 caracteres)
    return parseInt(sequencePart, 10) || 0;
}

/**
 * Busca el último NCF usado para un tipo específico en ncfUsage
 * @param {string} businessId - ID del negocio
 * @param {string} ncfType - Tipo de NCF a buscar
 * @returns {Promise<number>} Última secuencia usada o 0 si no hay registros
 */
async function getLastUsedSequence(businessId, ncfType) {
    try {
        const ncfUsageRef = collection(db, `businesses/${businessId}/ncfUsage`);
        const q = query(
            ncfUsageRef,
            where('ncfType', '==', ncfType),
            where('status', 'in', ['pending', 'completed']), // Excluir cancelados
            orderBy('createdAt', 'desc'),
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            return 0; // No hay registros previos
        }
        
        const lastUsage = snapshot.docs[0].data();
        const lastSequence = extractSequenceFromNCF(lastUsage.ncfCode);
        
        console.log(`Last used sequence for ${ncfType}: ${lastSequence} (NCF: ${lastUsage.ncfCode})`);
        return lastSequence;
        
    } catch (error) {
        console.error('Error getting last used sequence:', error);
        return 0; // En caso de error, permitir la operación
    }
}

/**
 * Actualiza un comprobante fiscal existente.
 * @param {string} businessID  id del negocio
 * @param {string} receiptID   id del comprobante (document.id)
 * @param {object} data        campos a actualizar
 */
/**
 * Updates specific fields of an existing tax receipt document in Firestore.
 *
 * @async
 * @function fbUpdateSingleTaxReceipt
 * @param {string} businessID - The ID of the business collection.
 * @param {string} receiptID - The document ID of the tax receipt to update.
 * @param {object} dataToUpdate - An object containing the fields and values to update.
 * @throws {Error} Throws an error if the update operation fails or inputs are invalid.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const updateTaxReceipt = async (user, data) => {
    // Input validation
    if (!user?.businessID || typeof user?.businessID !== 'string') {
        throw new Error("Invalid businessID provided.");
    }
    if (!data || typeof data?.id !== 'string') {
        throw new Error("Invalid or empty data provided for update.");
    }

    try {
        const receiptRef = doc(db, "businesses", user.businessID, "taxReceipts", data.id);
        
        const normalizedData = normalizeTaxReceiptData(data);

        await updateDoc(receiptRef, { data: normalizedData });
        console.log(`Tax receipt ${data.id} updated successfully.`);

    } catch (error) {
        console.error(`Error updating tax receipt ${data.id}:`, error);
        throw new Error(`Failed to update tax receipt ${data.id}: ${error.message}`);
    }
};

/**
 * Valida que una secuencia propuesta no cause duplicación de NCF
 * @param {string} businessId - ID del negocio
 * @param {string} ncfType - Tipo de NCF
 * @param {number} proposedSequence - Secuencia propuesta
 * @param {number} currentSequence - Secuencia actual en el documento
 * @returns {Promise<{isValid: boolean, reason?: string, lastUsedSequence?: number}>}
 */
export async function validateSequenceUpdate(businessId, ncfType, proposedSequence, currentSequence) {
    try {
        // Validar que no retroceda respecto al documento actual
        if (proposedSequence < currentSequence) {
            return {
                isValid: false,
                reason: `No se puede retroceder la secuencia de ${currentSequence} a ${proposedSequence}`
            };
        }
        
        // Validar contra el último uso real
        const lastUsedSequence = await getLastUsedSequence(businessId, ncfType);
        
        if (lastUsedSequence > 0 && proposedSequence <= lastUsedSequence) {
            return {
                isValid: false,
                reason: `La secuencia ${proposedSequence} ya fue usada. Último NCF usado tiene secuencia ${lastUsedSequence}`,
                lastUsedSequence
            };
        }
        
        return {
            isValid: true,
            lastUsedSequence
        };
        
    } catch (error) {
        console.error('Error validating sequence:', error);
        // En caso de error, permitir pero loggearlo
        return {
            isValid: true,
            reason: `Validación falló, pero se permite la operación: ${error.message}`
        };
    }
}

/**
 * Función de diagnóstico para verificar la sincronización entre taxReceipt y ncfUsage
 * @param {string} businessId - ID del negocio
 * @param {string} ncfType - Tipo de NCF a diagnosticar
 * @returns {Promise<Object>} Información de diagnóstico
 */
export async function diagnoseTaxReceiptSync(businessId, ncfType) {
    try {
        // Buscar el taxReceipt correspondiente
        const taxReceiptRef = collection(db, `businesses/${businessId}/taxReceipts`);
        const q = query(taxReceiptRef, where('data.name', '==', ncfType));
        const snapshot = await getDocs(q);
        
        let taxReceiptData = null;
        if (!snapshot.empty) {
            taxReceiptData = snapshot.docs[0].data().data;
        }
        
        // Buscar el último uso en ncfUsage
        const lastUsedSequence = await getLastUsedSequence(businessId, ncfType);
        
        // Buscar todos los usos para estadísticas
        const ncfUsageRef = collection(db, `businesses/${businessId}/ncfUsage`);
        const usageQuery = query(ncfUsageRef, where('ncfType', '==', ncfType));
        const usageSnapshot = await getDocs(usageQuery);
        
        const diagnosis = {
            ncfType,
            taxReceiptExists: !!taxReceiptData,
            currentSequence: taxReceiptData ? parseInt(taxReceiptData.sequence || '0', 10) : 0,
            lastUsedSequence,
            totalUsageRecords: usageSnapshot.size,
            isInSync: true,
            recommendations: []
        };
        
        // Verificar sincronización
        if (taxReceiptData && lastUsedSequence > 0) {
            const currentSeq = parseInt(taxReceiptData.sequence || '0', 10);
            if (currentSeq <= lastUsedSequence) {
                diagnosis.isInSync = false;
                diagnosis.recommendations.push(
                    `⚠️ La secuencia del taxReceipt (${currentSeq}) debe ser mayor que la última usada (${lastUsedSequence})`
                );
            }
        }
        
        // Estadísticas de uso
        const statusCounts = {};
        usageSnapshot.docs.forEach(doc => {
            const status = doc.data().status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        diagnosis.usageByStatus = statusCounts;
        
        return diagnosis;
        
    } catch (error) {
        console.error('Error in diagnosis:', error);
        return {
            ncfType,
            error: error.message,
            isInSync: false
        };
    }
}
