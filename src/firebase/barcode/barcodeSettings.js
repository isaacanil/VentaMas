import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../firebaseconfig';

/**
 * Guarda la configuración de códigos de barras para un negocio
 * @param {Object} user - Usuario con businessID
 * @param {Object} settings - Configuración de códigos de barras
 * @returns {Promise<void>}
 */
export const setBarcodeSettings = async (user, settings) => {
    if (!user?.businessID) {
        throw new Error('BusinessID no encontrado');
    }
    
    try {
        const settingsRef = doc(db, 'businesses', user.businessID, 'settings', 'barcode');
        
        const docSnapshot = await getDoc(settingsRef);
        
        const dataToSave = {
            ...settings,
            updatedAt: new Date().toISOString()
        };
        
        if (docSnapshot.exists()) {
            await updateDoc(settingsRef, dataToSave);
        } else {
            await setDoc(settingsRef, {
                ...dataToSave,
                createdAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('[barcodeSettings] Error al guardar configuración:', error);
        throw error;
    }
};

/**
 * Obtiene la configuración de códigos de barras para un negocio
 * @param {Object} user - Usuario con businessID
 * @returns {Promise<Object|null>}
 */
export const getBarcodeSettings = async (user) => {
    if (!user?.businessID) {
        throw new Error('BusinessID no encontrado');
    }
    
    try {
        const settingsRef = doc(db, 'businesses', user.businessID, 'settings', 'barcode');
        const docSnapshot = await getDoc(settingsRef);
        
        if (docSnapshot.exists()) {
            return docSnapshot.data();
        }
        
        return null;
    } catch (error) {
        console.error('[barcodeSettings] Error al obtener configuración:', error);
        throw error;
    }
};

/**
 * Actualiza solo el company prefix en la configuración
 * @param {Object} user - Usuario con businessID
 * @param {string} companyPrefix - Nuevo company prefix
 * @returns {Promise<void>}
 */
export const updateCompanyPrefix = async (user, companyPrefix) => {
    if (!user?.businessID) {
        throw new Error('BusinessID no encontrado');
    }
    
    try {
        const settingsRef = doc(db, 'businesses', user.businessID, 'settings', 'barcode');
        await updateDoc(settingsRef, {
            companyPrefix,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('[barcodeSettings] Error al actualizar company prefix:', error);
        throw error;
    }
};

/**
 * Inicializa la configuración de códigos de barras con valores por defecto
 * @param {Object} user - Usuario con businessID
 * @param {Object} config - Configuración inicial
 * @returns {Promise<void>}
 */
export const initializeBarcodeSettings = async (user, config) => {
    if (!user?.businessID) {
        throw new Error('BusinessID no encontrado');
    }
    
    try {
        const settingsRef = doc(db, 'businesses', user.businessID, 'settings', 'barcode');
        const docSnapshot = await getDoc(settingsRef);
        
        if (!docSnapshot.exists()) {
            await setDoc(settingsRef, {
                ...config,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('[barcodeSettings] Error al inicializar configuración:', error);
        throw error;
    }
};

export const fbBarcodeSettings = {
    setBarcodeSettings,
    getBarcodeSettings,
    updateCompanyPrefix,
    initializeBarcodeSettings
};
