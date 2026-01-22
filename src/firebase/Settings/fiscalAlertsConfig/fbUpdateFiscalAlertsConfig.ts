import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { FiscalAlertsConfig } from './types';

/**
 * Actualiza o crea la configuracion de alertas de comprobantes fiscales
 */
export const fbUpdateFiscalAlertsConfig = async (
  user: UserIdentity | null | undefined,
  alertConfig: FiscalAlertsConfig,
): Promise<{ success: true }> => {
  try {
    if (!user?.id) {
      throw new Error('Usuario no valido');
    }

    const configRef = doc(
      db,
      'users',
      user.id,
      'settings',
      'fiscalAlertsConfig',
    );

    // Estructura de datos para guardar
    const configData: FiscalAlertsConfig = {
      alertsEnabled: alertConfig.alertsEnabled,
      globalThresholds: {
        warning: alertConfig.globalThresholds.warning,
        critical: alertConfig.globalThresholds.critical,
      },
      customThresholds: alertConfig.customThresholds || {},
      lastUpdated: new Date(),
      version: '1.0',
    };

    // Verificar si el documento existe
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
      // Actualizar documento existente
      await updateDoc(configRef, configData);
    } else {
      // Crear nuevo documento
      await setDoc(configRef, configData);
    }

    console.log('Configuracion de alertas guardada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('Error al guardar la configuracion de alertas:', error);
    throw error;
  }
};
