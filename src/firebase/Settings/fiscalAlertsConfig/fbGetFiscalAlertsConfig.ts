import { doc, getDoc } from 'firebase/firestore';

import {
  FISCAL_RECEIPTS_ALERT_CONFIG,
  createDefaultFiscalAlertsConfig,
} from '@/config/fiscalReceiptsAlertConfig';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { FiscalAlertsConfig } from './types';

interface FiscalAlertsConfigDoc extends Partial<FiscalAlertsConfig> {
  globalThresholds?: Partial<FiscalAlertsConfig['globalThresholds']>;
  expirationThresholds?: Partial<FiscalAlertsConfig['expirationThresholds']>;
}

/**
 * Obtiene la configuracion de alertas de comprobantes fiscales desde Firebase
 */
export const fbGetFiscalAlertsConfig = async (
  user: UserIdentity | null | undefined,
): Promise<FiscalAlertsConfig> => {
  try {
    const businessId =
      typeof user?.businessID === 'string' ? user.businessID.trim() : '';
    const userId = typeof user?.id === 'string' ? user.id.trim() : '';

    if (!businessId && !userId) {
      console.warn('Contexto fiscal no válido, usando configuración por defecto');
      return getDefaultConfig();
    }

    const businessConfigRef = businessId
      ? doc(db, 'businesses', businessId, 'settings', 'fiscalAlertsConfig')
      : null;
    const legacyUserConfigRef = userId
      ? doc(db, 'users', userId, 'settings', 'fiscalAlertsConfig')
      : null;

    const docSnap = businessConfigRef
      ? await getDoc(businessConfigRef)
      : legacyUserConfigRef
        ? await getDoc(legacyUserConfigRef)
        : null;

    const fallbackSnap =
      !docSnap?.exists() && legacyUserConfigRef && businessConfigRef
        ? await getDoc(legacyUserConfigRef)
        : null;
    const resolvedSnap =
      docSnap?.exists() ? docSnap : fallbackSnap?.exists() ? fallbackSnap : null;

    if (resolvedSnap?.exists()) {
      const data = resolvedSnap.data() as FiscalAlertsConfigDoc;
      const defaults = createDefaultFiscalAlertsConfig();

      return {
        alertsEnabled: data.alertsEnabled ?? defaults.alertsEnabled,
        monitoring: {
          quantityEnabled:
            data.monitoring?.quantityEnabled ??
            defaults.monitoring.quantityEnabled,
          expirationEnabled:
            data.monitoring?.expirationEnabled ??
            defaults.monitoring.expirationEnabled,
        },
        globalThresholds: {
          warning:
            data.globalThresholds?.warning ??
            defaults.globalThresholds.warning,
          critical:
            data.globalThresholds?.critical ??
            defaults.globalThresholds.critical,
        },
        customThresholds: data.customThresholds ?? {},
        expirationThresholds: {
          warning:
            data.expirationThresholds?.warning ??
            defaults.expirationThresholds.warning,
          critical:
            data.expirationThresholds?.critical ??
            defaults.expirationThresholds.critical,
        },
        customExpirationThresholds: data.customExpirationThresholds ?? {},
        channels: {
          notificationCenter:
            data.channels?.notificationCenter ??
            defaults.channels.notificationCenter,
          popupOnCritical:
            data.channels?.popupOnCritical ?? defaults.channels.popupOnCritical,
          email: data.channels?.email ?? defaults.channels.email,
        },
        execution: {
          checkFrequencyMinutes: Math.max(
            5,
            data.execution?.checkFrequencyMinutes ??
              defaults.execution.checkFrequencyMinutes,
          ),
          suppressRepeatedNotifications:
            data.execution?.suppressRepeatedNotifications ??
            defaults.execution.suppressRepeatedNotifications,
        },
        lastUpdated: data.lastUpdated ?? null,
        version: data.version ?? defaults.version,
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
  ...createDefaultFiscalAlertsConfig(),
  globalThresholds: {
    warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
    critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
  },
});
