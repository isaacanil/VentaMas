import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import type { FiscalAlertsConfig } from '@/domain/fiscal/fiscalReceiptsAlertConfig';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

/**
 * Actualiza o crea la configuracion de alertas de comprobantes fiscales
 */
export const fbUpdateFiscalAlertsConfig = async (
  user: UserIdentity | null | undefined,
  alertConfig: FiscalAlertsConfig,
): Promise<{ success: true }> => {
  try {
    if (!user?.businessID) {
      throw new Error('Negocio no válido');
    }

    const configRef = doc(
      db,
      'businesses',
      user.businessID,
      'settings',
      'fiscalAlertsConfig',
    );

    // Estructura de datos para guardar
    const configData: FiscalAlertsConfig = {
      alertsEnabled: alertConfig.alertsEnabled,
      monitoring: {
        quantityEnabled: alertConfig.monitoring.quantityEnabled,
        expirationEnabled: alertConfig.monitoring.expirationEnabled,
      },
      globalThresholds: {
        warning: alertConfig.globalThresholds.warning,
        critical: alertConfig.globalThresholds.critical,
      },
      customThresholds: alertConfig.customThresholds || {},
      expirationThresholds: {
        warning: alertConfig.expirationThresholds.warning,
        critical: alertConfig.expirationThresholds.critical,
      },
      customExpirationThresholds: alertConfig.customExpirationThresholds || {},
      channels: {
        notificationCenter: alertConfig.channels.notificationCenter,
        popupOnCritical: alertConfig.channels.popupOnCritical,
        email: alertConfig.channels.email,
      },
      execution: {
        checkFrequencyMinutes: alertConfig.execution.checkFrequencyMinutes,
        suppressRepeatedNotifications:
          alertConfig.execution.suppressRepeatedNotifications,
      },
      lastUpdated: new Date(),
      version: '2.0',
    };

    // Verificar si el documento existe
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
      // Actualizar documento existente
      await updateDoc(configRef, configData as unknown as Record<string, unknown>);
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
