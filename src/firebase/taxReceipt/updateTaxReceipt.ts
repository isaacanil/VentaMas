import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

import type { TaxReceiptData, TaxReceiptUser } from '@/types/taxReceipt';
import { db } from '@/firebase/firebaseconfig'; // Assuming firebaseconfig.js is in the parent directory
import { normalizeTaxReceiptData } from '@/utils/taxReceipt';

/**
 * Extrae el número de secuencia de un código NCF
 * @param {string} ncfCode - Código NCF (ej: "B01000001234")
 * @returns {number} Número de secuencia extraído
 */
function extractSequenceFromNCF(ncfCode?: string | null): number {
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
async function getLastUsedSequence(
  businessId: string,
  ncfType: string,
): Promise<number> {
  try {
    const ncfUsageRef = collection(db, `businesses/${businessId}/ncfUsage`);
    const q = query(
      ncfUsageRef,
      where('ncfType', '==', ncfType),
      where('status', 'in', ['pending', 'completed']), // Excluir cancelados
      orderBy('createdAt', 'desc'),
      limit(1),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0; // No hay registros previos
    }

    const lastUsage = snapshot.docs[0].data();
    const lastSequence = extractSequenceFromNCF(lastUsage.ncfCode);

    console.log(
      `Last used sequence for ${ncfType}: ${lastSequence} (NCF: ${lastUsage.ncfCode})`,
    );
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
export const updateTaxReceipt = async (
  user: TaxReceiptUser,
  data: TaxReceiptData,
) => {
  // Input validation
  if (!user?.businessID || typeof user?.businessID !== 'string') {
    throw new Error('Invalid businessID provided.');
  }
  if (!data || typeof data?.id !== 'string') {
    throw new Error('Invalid or empty data provided for update.');
  }

  try {
    const receiptRef = doc(
      db,
      'businesses',
      user.businessID,
      'taxReceipts',
      data.id,
    );

    const normalizedData = normalizeTaxReceiptData(data);

    // Asegurar que el ID siempre esté presente en los datos guardados
    normalizedData.id = data.id;

    await updateDoc(receiptRef, { data: normalizedData });
    console.log(`Tax receipt ${data.id} updated successfully.`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error updating tax receipt ${data.id}:`, error);
    throw new Error(`Failed to update tax receipt ${data.id}: ${errorMessage}`);
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
export async function validateSequenceUpdate(
  businessId: string,
  ncfType: string,
  proposedSequence: number,
  currentSequence: number,
): Promise<{
  isValid: boolean;
  reason?: string;
  lastUsedSequence?: number;
}> {
  try {
    // Validar que no retroceda respecto al documento actual
    if (proposedSequence < currentSequence) {
      return {
        isValid: false,
        reason: `No se puede retroceder la secuencia de ${currentSequence} a ${proposedSequence}`,
      };
    }

    // Validar contra el último uso real
    const lastUsedSequence = await getLastUsedSequence(businessId, ncfType);

    if (lastUsedSequence > 0 && proposedSequence <= lastUsedSequence) {
      return {
        isValid: false,
        reason: `La secuencia ${proposedSequence} ya fue usada. Último NCF usado tiene secuencia ${lastUsedSequence}`,
        lastUsedSequence,
      };
    }

    return {
      isValid: true,
      lastUsedSequence,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error validating sequence:', error);
    // En caso de error, permitir pero loggearlo
    return {
      isValid: true,
      reason: `Validación falló, pero se permite la operación: ${errorMessage}`,
    };
  }
}

/**
 * Función de diagnóstico para verificar la sincronización entre taxReceipt y ncfUsage
 * @param {string} businessId - ID del negocio
 * @param {string} ncfType - Tipo de NCF a diagnosticar
 * @returns {Promise<Object>} Información de diagnóstico
 */
export async function diagnoseTaxReceiptSync(
  businessId: string,
  ncfType: string,
): Promise<{
  ncfType: string;
  taxReceiptExists?: boolean;
  currentSequence?: number;
  lastUsedSequence?: number;
  totalUsageRecords?: number;
  isInSync: boolean;
  recommendations?: string[];
  usageByStatus?: Record<string, number>;
  error?: string;
}> {
  try {
    // Buscar el taxReceipt correspondiente
    const taxReceiptRef = collection(
      db,
      `businesses/${businessId}/taxReceipts`,
    );
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

    const diagnosis: {
      ncfType: string;
      taxReceiptExists: boolean;
      currentSequence: number;
      lastUsedSequence: number;
      totalUsageRecords: number;
      isInSync: boolean;
      recommendations: string[];
      usageByStatus: Record<string, number>;
    } = {
      ncfType,
      taxReceiptExists: !!taxReceiptData,
      currentSequence: taxReceiptData
        ? parseInt(taxReceiptData.sequence || '0', 10)
        : 0,
      lastUsedSequence,
      totalUsageRecords: usageSnapshot.size,
      isInSync: true,
      recommendations: [],
      usageByStatus: {},
    };

    // Verificar sincronización
    if (taxReceiptData && lastUsedSequence > 0) {
      const currentSeq = parseInt(taxReceiptData.sequence || '0', 10);
      if (currentSeq <= lastUsedSequence) {
        diagnosis.isInSync = false;
        diagnosis.recommendations.push(
          `⚠️ La secuencia del taxReceipt (${currentSeq}) debe ser mayor que la última usada (${lastUsedSequence})`,
        );
      }
    }

    // Estadísticas de uso
    const statusCounts: Record<string, number> = {};
    usageSnapshot.docs.forEach((doc) => {
      const status = doc.data().status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    diagnosis.usageByStatus = statusCounts;

    return diagnosis;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in diagnosis:', error);
    return {
      ncfType,
      error: errorMessage,
      isInSync: false,
    };
  }
}
