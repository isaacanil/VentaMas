import { getNextID } from '../Tools/getNextID';
import { getBarcodeSettings } from './barcodeSettings';
import { generateGTIN13RD } from '../../utils/barcode/barcode';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';

/**
 * Genera automáticamente el siguiente Item Reference para un negocio
 * @param {Object} user - Usuario con businessID
 * @returns {Promise<string>} Item Reference generado
 */
export const generateNextItemReference = async (user) => {
    if (!user?.businessID) {
        throw new Error('BusinessID no encontrado');
    }
    
    try {
        // Obtener configuración de códigos de barras (opcional)
        const barcodeSettings = await getBarcodeSettings(user).catch(() => null);
        
        // Obtener el siguiente ID del contador
        const nextId = await getNextID(user, 'lastItemReference', 1);
        
        // Formatear el ID con ceros a la izquierda según la longitud configurada
        const length = barcodeSettings?.itemReferenceLength ?? 9;
        const paddedId = String(nextId).padStart(length, '0');
        
        return paddedId;
    } catch (error) {
        console.error('Error al generar Item Reference:', error);
        throw error;
    }
};

/**
 * Genera un código de barras completo automáticamente
 * @param {Object} user - Usuario con businessID
 * @param {string} companyPrefix - Prefijo de empresa (opcional, usa el guardado si no se proporciona)
 * @returns {Promise<Object>} Objeto con el código completo y sus partes
 */
export const generateAutoBarcode = async (user, companyPrefix = null) => {
    if (!user?.businessID) {
        throw new Error('BusinessID no encontrado');
    }
    
    try {
        // Obtener configuración guardada
        const barcodeSettings = await getBarcodeSettings(user);
        
        if (!barcodeSettings) {
            throw new Error('Configuración de códigos de barras no encontrada. Configure primero su empresa.');
        }
        
        // Usar el companyPrefix proporcionado o el guardado
        const finalCompanyPrefix = companyPrefix || barcodeSettings.companyPrefix;
        
        if (!finalCompanyPrefix) {
            throw new Error('Company Prefix no configurado. Configure primero su empresa.');
        }
        
        // Generar el siguiente Item Reference
        const itemReference = await generateNextItemReference(user);
        
        // Generar el código completo
        const fullCode = generateGTIN13RD(finalCompanyPrefix, itemReference);
        
        return {
            fullCode,
            companyPrefix: finalCompanyPrefix,
            itemReference,
            configuration: {
                companyPrefixLength: barcodeSettings.companyPrefixLength,
                itemReferenceLength: barcodeSettings.itemReferenceLength,
                name: barcodeSettings.name
            }
        };
    } catch (error) {
        console.error('Error al generar código de barras automático:', error);
        throw error;
    }
};

/**
 * Valida si un Item Reference es válido según la configuración actual
 * @param {Object} user - Usuario con businessID
 * @param {string} itemReference - Item Reference a validar
 * @returns {Promise<boolean>} True si es válido
 */
export const validateItemReference = async (user, itemReference) => {
    if (!user?.businessID) {
        throw new Error('BusinessID no encontrado');
    }
    
    try {
        const barcodeSettings = await getBarcodeSettings(user);
        
        if (!barcodeSettings) {
            return false;
        }
        
        // Validar longitud
        if (itemReference.length !== barcodeSettings.itemReferenceLength) {
            return false;
        }
        
        // Validar que solo contenga números
        return /^\d+$/.test(itemReference);
    } catch (error) {
        console.error('Error al validar Item Reference:', error);
        return false;
    }
};

/**
 * Obtiene el próximo Item Reference sin incrementar el contador
 * @param {Object} user - Usuario con businessID
 * @returns {Promise<string>} Próximo Item Reference
 */
export const previewNextItemReference = async (user) => {
    if (!user?.businessID) {
        throw new Error('BusinessID no encontrado');
    }
    
    try {
        // Configuración opcional; si no existe, usar longitud 9 por defecto
        const barcodeSettings = await getBarcodeSettings(user).catch(() => null);
        
        // Obtener el valor actual del contador directamente desde Firebase
        const counterRef = doc(db, "businesses", user.businessID, 'counters', 'lastItemReference');
        const counterSnap = await getDoc(counterRef);
        
        let currentValue = 0;
        if (counterSnap.exists()) {
            currentValue = counterSnap.data().value;
        }
        
        const previewId = currentValue + 1;
        
        const length = barcodeSettings?.itemReferenceLength ?? 9;
        return String(previewId).padStart(length, '0');
    } catch (error) {
        console.error('Error al obtener preview del Item Reference:', error);
        throw error;
    }
};

export const fbBarcodeGeneration = {
    generateNextItemReference,
    generateAutoBarcode,
    validateItemReference,
    previewNextItemReference
};
