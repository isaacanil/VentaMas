import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { BarcodeSettings } from './types';

/**
 * Guarda la configuracion de codigos de barras para un negocio
 */
export const setBarcodeSettings = async (
  user: UserIdentity | null | undefined,
  settings: BarcodeSettings,
): Promise<void> => {
  if (!user?.businessID) {
    throw new Error('BusinessID no encontrado');
  }

  try {
    const settingsRef = doc(
      db,
      'businesses',
      user.businessID,
      'settings',
      'barcode',
    );

    const docSnapshot = await getDoc(settingsRef);

    const dataToSave: BarcodeSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    if (docSnapshot.exists()) {
      await updateDoc(settingsRef, dataToSave);
    } else {
      await setDoc(settingsRef, {
        ...dataToSave,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[barcodeSettings] Error al guardar configuracion:', error);
    throw error;
  }
};

/**
 * Obtiene la configuracion de codigos de barras para un negocio
 */
export const getBarcodeSettings = async (
  user: UserIdentity | null | undefined,
): Promise<BarcodeSettings | null> => {
  if (!user?.businessID) {
    throw new Error('BusinessID no encontrado');
  }

  try {
    const settingsRef = doc(
      db,
      'businesses',
      user.businessID,
      'settings',
      'barcode',
    );
    const docSnapshot = await getDoc(settingsRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data() as BarcodeSettings;
    }

    return null;
  } catch (error) {
    console.error('[barcodeSettings] Error al obtener configuracion:', error);
    throw error;
  }
};

/**
 * Actualiza solo el company prefix en la configuracion
 */
export const updateCompanyPrefix = async (
  user: UserIdentity | null | undefined,
  companyPrefix: string,
): Promise<void> => {
  if (!user?.businessID) {
    throw new Error('BusinessID no encontrado');
  }

  try {
    const settingsRef = doc(
      db,
      'businesses',
      user.businessID,
      'settings',
      'barcode',
    );
    await updateDoc(settingsRef, {
      companyPrefix,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      '[barcodeSettings] Error al actualizar company prefix:',
      error,
    );
    throw error;
  }
};

/**
 * Inicializa la configuracion de codigos de barras con valores por defecto
 */
export const initializeBarcodeSettings = async (
  user: UserIdentity | null | undefined,
  config: BarcodeSettings,
): Promise<void> => {
  if (!user?.businessID) {
    throw new Error('BusinessID no encontrado');
  }

  try {
    const settingsRef = doc(
      db,
      'businesses',
      user.businessID,
      'settings',
      'barcode',
    );
    const docSnapshot = await getDoc(settingsRef);

    if (!docSnapshot.exists()) {
      await setDoc(settingsRef, {
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error(
      '[barcodeSettings] Error al inicializar configuracion:',
      error,
    );
    throw error;
  }
};

export const fbBarcodeSettings = {
  setBarcodeSettings,
  getBarcodeSettings,
  updateCompanyPrefix,
  initializeBarcodeSettings,
};
