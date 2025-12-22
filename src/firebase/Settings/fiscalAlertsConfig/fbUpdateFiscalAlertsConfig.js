import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

import { db } from '../../firebaseconfig';

/**
 * Actualiza o crea la configuración de alertas de comprobantes fiscales
 * @param {Object} user - Usuario actual
 * @param {Object} alertConfig - Configuración de alertas
 * @returns {Promise} Promesa de la operación
 */
export const fbUpdateFiscalAlertsConfig = async (user, alertConfig) => {
  try {
    if (!user?.id) {
      throw new Error('Usuario no válido');
    }

    const configRef = doc(
      db,
      'users',
      user.id,
      'settings',
      'fiscalAlertsConfig',
    );

    // Estructura de datos para guardar
    const configData = {
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

    console.log('Configuración de alertas guardada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('Error al guardar la configuración de alertas:', error);
    throw error;
  }
};
