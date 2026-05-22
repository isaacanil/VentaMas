import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  resolveGisysFactConfig,
  resolveGisysFactToken,
} from '../config/gisysFact.config.js';
import { GISYS_FACT_PLATFORM_CONFIG_PATH } from '../config/gisysFactPlatform.config.js';
import { checkGisysFactHealth } from '../services/gisysFactClient.service.js';
import { assertElectronicTaxReceiptDeveloperAccess } from '../utils/electronicTaxReceiptAccess.util.js';
import { toCleanString } from '../utils/electronicTaxReceiptConfig.util.js';

const VALID_MODES = new Set(['shadow', 'pilot', 'required']);

const toBoolean = (value) => value === true;

const normalizeMode = (value) => {
  const normalized = toCleanString(value)?.toLowerCase();
  return VALID_MODES.has(normalized) ? normalized : 'shadow';
};

const normalizeTimeoutMs = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 5000 && numeric <= 120000
    ? Math.round(numeric)
    : 20000;
};

export const updateElectronicTaxReceiptPlatformConfig = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    await assertElectronicTaxReceiptDeveloperAccess(authUid);

    const data = request?.data || {};
    const electronicModelEnabled = toBoolean(data.electronicModelEnabled);
    const mode = electronicModelEnabled ? normalizeMode(data.mode) : 'shadow';
    const platformConfig = {
      provider: 'gisys',
      providerId: 'gisys_fact',
      enabled: true,
      baseUrl: toCleanString(data.baseUrl),
      integrationInstanceCode: toCleanString(data.integrationInstanceCode),
      electronicModelEnabled,
      electronicTransportEnabled: electronicModelEnabled && mode !== 'shadow',
      mode,
      timeoutMs: normalizeTimeoutMs(data.timeoutMs),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: authUid,
    };

    const config = resolveGisysFactConfig({}, platformConfig);
    const baseUrlConfigured = Boolean(config.baseUrl);
    const integrationInstanceConfigured = Boolean(
      config.integrationInstanceCode,
    );
    const tokenConfigured = Boolean(resolveGisysFactToken(config));
    if (electronicModelEnabled && !integrationInstanceConfigured) {
      throw new HttpsError(
        'failed-precondition',
        'Instancia GISYS requerida para preparar e-CF.',
        { issues: ['missing-integration-instance-code'] },
      );
    }

    let remoteHealth = null;
    if (data.checkRemote === true && baseUrlConfigured) {
      remoteHealth = await checkGisysFactHealth({ config });
      if (!remoteHealth.ok) {
        throw new HttpsError(
          'failed-precondition',
          remoteHealth.message || 'GISYS no respondió correctamente.',
          { issues: ['gisys-health-failed'] },
        );
      }
    }

    try {
      await db
        .doc(GISYS_FACT_PLATFORM_CONFIG_PATH)
        .set(platformConfig, { merge: true });
    } catch (error) {
      logger.error('[updateElectronicTaxReceiptPlatformConfig] failed', {
        authUid,
        error,
      });
      throw new HttpsError(
        'internal',
        error?.message || 'No se pudo guardar la configuración global e-CF.',
      );
    }

    return {
      ok: true,
      checkedAt: new Date().toISOString(),
      runtime: {
        providerId: config.providerId,
        baseUrl: config.baseUrl || null,
        baseUrlConfigured,
        integrationInstanceCode: config.integrationInstanceCode || null,
        integrationInstanceConfigured,
        electronicPreparationEnabled: config.electronicModelEnabled === true,
        mode: config.mode,
        configSource: 'firestore',
        tokenEnvName: config.tokenEnvName,
        tokenConfiguredAsSecret: tokenConfigured,
        timeoutMs: config.timeoutMs,
      },
      remote: remoteHealth
        ? {
            ok: remoteHealth.ok,
            status: remoteHealth.status,
            url: remoteHealth.url,
            reason: remoteHealth.reason || null,
          }
        : null,
    };
  },
);
