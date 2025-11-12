import { doc, getDoc } from 'firebase/firestore';

import { FISCAL_RECEIPTS_ALERT_CONFIG } from '../../../config/fiscalReceiptsAlertConfig';
import { db } from '../../firebaseconfig';

/**
 * Obtiene la configuración de alertas de comprobantes fiscales desde Firebase
 * @param {Object} user - Usuario actual
 * @returns {Promise<Object>} Configuración de alertas o valores por defecto
 */
export const fbGetFiscalAlertsConfig = async (user) => {
  try {
    if (!user?.id) {
      console.warn('Usuario no válido, usando configuración por defecto');
      return getDefaultConfig();
    }

    const configRef = doc(db, 'users', user.id, 'settings', 'fiscalAlertsConfig');
    const docSnap = await getDoc(configRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Validar estructura de datos
      return {
        alertsEnabled: data.alertsEnabled ?? true,
        globalThresholds: {
          warning: data.globalThresholds?.warning ?? FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
          critical: data.globalThresholds?.critical ?? FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD
        },
        customThresholds: data.customThresholds ?? {},
        lastUpdated: data.lastUpdated,
        version: data.version ?? '1.0'
      };
    } else {
      console.log('No se encontró configuración guardada, usando valores por defecto');
      return getDefaultConfig();
    }
    
  } catch (error) {
    console.error('Error al obtener la configuración de alertas:', error);
    return getDefaultConfig();
  }
};

/**
 * Retorna la configuración por defecto
 * @returns {Object} Configuración por defecto
 */
const getDefaultConfig = () => ({
  alertsEnabled: true,
  globalThresholds: {
    warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
    critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD
  },
  customThresholds: {},
  lastUpdated: null,
  version: '1.0'
});
