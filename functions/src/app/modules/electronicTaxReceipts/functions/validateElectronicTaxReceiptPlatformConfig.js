import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { GISYS_FACT_SECRETS } from '../../../core/config/secrets.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  resolveGisysFactConfig,
  resolveGisysFactToken,
} from '../config/gisysFact.config.js';
import { getGisysFactPlatformConfig } from '../config/gisysFactPlatform.config.js';
import { checkGisysFactHealth } from '../services/gisysFactClient.service.js';
import { assertElectronicTaxReceiptDeveloperAccess } from '../utils/electronicTaxReceiptAccess.util.js';

const buildCheck = ({ key, label, status, detail }) => ({
  key,
  label,
  status,
  detail: detail || null,
});

const buildStatus = ({
  baseUrlConfigured,
  integrationInstanceConfigured,
  tokenConfigured,
  remoteHealth,
}) => {
  if (
    !baseUrlConfigured ||
    !integrationInstanceConfigured ||
    !tokenConfigured
  ) {
    return 'blocked';
  }
  if (remoteHealth && !remoteHealth.ok) return 'blocked';
  return 'ready';
};

export const validateElectronicTaxReceiptPlatformConfig = onCall(
  {
    cors: true,
    invoker: 'public',
    secrets: GISYS_FACT_SECRETS,
  },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    await assertElectronicTaxReceiptDeveloperAccess(authUid, {
      permissionDeniedMessage:
        'Solo desarrolladores pueden validar la configuración global e-CF.',
    });

    const platformConfig = await getGisysFactPlatformConfig();
    const config = resolveGisysFactConfig({}, platformConfig);
    const baseUrlConfigured = Boolean(config.baseUrl);
    const integrationInstanceConfigured = Boolean(
      config.integrationInstanceCode,
    );
    const tokenConfigured = Boolean(resolveGisysFactToken(config));
    const checkRemote = request?.data?.checkRemote !== false;
    const remoteHealth =
      checkRemote && baseUrlConfigured
        ? await checkGisysFactHealth({ config })
        : null;
    const status = buildStatus({
      baseUrlConfigured,
      integrationInstanceConfigured,
      tokenConfigured,
      remoteHealth,
    });

    logger.info('[validateElectronicTaxReceiptPlatformConfig] completed', {
      authUid,
      status,
      checkRemote,
      baseUrlConfigured,
      integrationInstanceConfigured,
      tokenConfigured,
    });

    return {
      ok: true,
      status,
      checkedAt: new Date().toISOString(),
      runtime: {
        providerId: config.providerId,
        baseUrl: config.baseUrl || null,
        baseUrlConfigured,
        integrationInstanceCode: config.integrationInstanceCode || null,
        integrationInstanceConfigured,
        electronicPreparationEnabled: config.electronicModelEnabled === true,
        mode: config.mode,
        configSource:
          Object.keys(platformConfig).length > 0 ? 'firestore' : 'env',
        tokenEnvName: config.tokenEnvName,
        tokenConfiguredAsSecret: tokenConfigured,
        timeoutMs: config.timeoutMs,
      },
      checks: [
        buildCheck({
          key: 'base-url',
          label: 'Base URL',
          status: baseUrlConfigured ? 'passed' : 'blocked',
          detail: baseUrlConfigured
            ? config.baseUrl
            : 'Falta GISYS_FACT_BASE_URL en Functions.',
        }),
        buildCheck({
          key: 'integration-instance',
          label: 'Instancia GISYS',
          status: integrationInstanceConfigured ? 'passed' : 'blocked',
          detail: integrationInstanceConfigured
            ? config.integrationInstanceCode
            : 'Falta GISYS_FACT_INTEGRATION_INSTANCE_CODE en Functions.',
        }),
        buildCheck({
          key: 'preparation',
          label: 'Preparar e-CF',
          status: integrationInstanceConfigured ? 'passed' : 'blocked',
          detail: integrationInstanceConfigured
            ? 'Preparacion e-CF disponible para el runtime global.'
            : 'Configura la instancia GISYS antes de preparar e-CF.',
        }),
        buildCheck({
          key: 'mode',
          label: 'Etapa de envio',
          status: 'passed',
          detail: config.mode,
        }),
        buildCheck({
          key: 'token',
          label: 'Secret de Functions',
          status: tokenConfigured ? 'passed' : 'blocked',
          detail: tokenConfigured
            ? `${config.tokenEnvName} disponible.`
            : `${config.tokenEnvName} no está disponible.`,
        }),
        buildCheck({
          key: 'timeout',
          label: 'Timeout',
          status: 'passed',
          detail: `${config.timeoutMs} ms`,
        }),
        buildCheck({
          key: 'remote-health',
          label: 'Health GISYS',
          status: !baseUrlConfigured
            ? 'blocked'
            : !checkRemote
              ? 'warning'
              : remoteHealth?.ok
                ? 'passed'
                : 'blocked',
          detail: !baseUrlConfigured
            ? 'No se puede probar sin Base URL.'
            : !checkRemote
              ? 'Validación remota omitida.'
              : remoteHealth?.ok
                ? `Health respondió ${remoteHealth.status}.`
                : remoteHealth?.message ||
                  `Health respondió ${remoteHealth?.status || 'sin estado'}.`,
        }),
      ],
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
