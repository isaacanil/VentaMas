import { doc, getDoc } from 'firebase/firestore';

import { FISCAL_RECEIPTS_ALERT_CONFIG } from '@/config/fiscalReceiptsAlertConfig';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { FiscalAlertsConfig } from './types';

interface FiscalAlertsConfigDoc extends Partial<FiscalAlertsConfig> {
  globalThresholds?: Partial<FiscalAlertsConfig['globalThresholds']>;
}

/**
 * Obtiene la configuracion de alertas de comprobantes fiscales desde Firebase
 */
export const fbGetFiscalAlertsConfig = async (
  user: UserIdentity | null | undefined,
): Promise<FiscalAlertsConfig> => {
  try {
    if (!user?.id) {
      console.warn('Usuario no valido, usando configuracion por defecto');
      return getDefaultConfig();
    }

    const configRef = doc(
      db,
      'users',
      user.id,
      'settings',
      'fiscalAlertsConfig',
    );
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as FiscalAlertsConfigDoc;

      // Validar estructura de datos
      return {
        alertsEnabled: data.alertsEnabled ?? true,
        globalThresholds: {
          warning:
            data.globalThresholds?.warning ??
            FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
          critical:
            data.globalThresholds?.critical ??
            FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
        },
        customThresholds: data.customThresholds ?? {},
        lastUpdated: data.lastUpdated ?? null,
        version: data.version ?? '1.0',
      };
    }

    console.log(
      'No se encontro configuracion guardada, usando valores por defecto',
    );
    return getDefaultConfig();
  } catch (error) {
    console.error('Error al obtener la configuracion de alertas:', error);
    return getDefaultConfig();
  }
};

/**
 * Retorna la configuracion por defecto
 */
const getDefaultConfig = (): FiscalAlertsConfig => ({
  alertsEnabled: true,
  globalThresholds: {
    warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
    critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
  },
  customThresholds: {},
  lastUpdated: null,
  version: '1.0',
});
