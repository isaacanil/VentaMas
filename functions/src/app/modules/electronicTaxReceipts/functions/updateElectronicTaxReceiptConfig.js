import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { getGisysFactPlatformConfig } from '../config/gisysFactPlatform.config.js';
import { getGisysFactConfigIssues } from '../config/gisysFact.config.js';
import { assertElectronicTaxReceiptDeveloperAccess } from '../utils/electronicTaxReceiptAccess.util.js';
import {
  buildBusinessSafeGisysFactProviderConfig,
  buildGisysFactConfigSummaryFromBusiness,
  buildGisysFactConfigSummaryFromInput,
  toCleanString,
} from '../utils/electronicTaxReceiptConfig.util.js';

const CONFIG_SCOPE = Object.freeze({
  BUSINESS_TAXPAYER: 'business-taxpayer',
  DEVELOPER_PROVISIONING: 'developer-provisioning',
});

const hasOwn = (value, key) =>
  Object.prototype.hasOwnProperty.call(value || {}, key);

const normalizeBusinessElectronicToggle = (data) => {
  if (!hasOwn(data, 'electronicModelEnabled')) return null;
  return data.electronicModelEnabled === true;
};

export const updateElectronicTaxReceiptConfig = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const businessId =
      toCleanString(request?.data?.businessId) ||
      toCleanString(request?.data?.businessID);
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }

    const data = request?.data || {};
    const scope =
      toCleanString(data.scope) || CONFIG_SCOPE.DEVELOPER_PROVISIONING;

    if (scope === CONFIG_SCOPE.BUSINESS_TAXPAYER) {
      await assertUserAccess({
        authUid,
        businessId,
        allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCE_CONFIG,
      });

      const taxpayerCode = toCleanString(data.taxpayerCode);
      if (!taxpayerCode) {
        throw new HttpsError(
          'invalid-argument',
          'Contribuyente GISYS es requerido',
          { issues: ['missing-taxpayer-code'] },
        );
      }

      const businessRef = db.doc(`businesses/${businessId}`);
      const businessSnap = await businessRef.get();
      if (!businessSnap.exists) {
        throw new HttpsError('not-found', 'Negocio no encontrado');
      }

      const platformConfig = await getGisysFactPlatformConfig();
      const currentSummary = buildGisysFactConfigSummaryFromBusiness(
        businessSnap.data() || {},
        platformConfig,
      );
      const requestedElectronicModelEnabled =
        normalizeBusinessElectronicToggle(data);
      const providerConfig = {
        ...currentSummary.providerConfig,
        taxpayerCode,
      };
      const nextElectronicModelEnabled =
        requestedElectronicModelEnabled ??
        currentSummary.electronicModelEnabled;
      const nextElectronicTransportEnabled =
        nextElectronicModelEnabled &&
        currentSummary.electronicTransportEnabled === true;
      const nextMode = nextElectronicTransportEnabled
        ? providerConfig.mode
        : 'shadow';

      if (requestedElectronicModelEnabled === true) {
        const configIssues = getGisysFactConfigIssues(
          {
            ...providerConfig,
            mode: nextMode,
          },
          {
            requireTransport: nextElectronicTransportEnabled,
          },
        );
        if (configIssues.length > 0) {
          throw new HttpsError(
            'failed-precondition',
            'GISYS FACT no esta configurado para activar e-CF en este negocio.',
            { issues: configIssues },
          );
        }
      }

      const updatePayload = {
        'features.fiscal.gisysFact.provider': 'gisys',
        'features.fiscal.gisysFact.enabled': providerConfig.enabled,
        'features.fiscal.gisysFact.taxpayerCode': taxpayerCode,
        'features.fiscal.gisysFact.updatedAt': FieldValue.serverTimestamp(),
        'features.fiscal.gisysFact.updatedBy': authUid,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (requestedElectronicModelEnabled !== null) {
        updatePayload['features.fiscal.electronicModelEnabled'] =
          nextElectronicModelEnabled;
        updatePayload['features.fiscal.electronicTransportEnabled'] =
          nextElectronicTransportEnabled;
        updatePayload['features.fiscal.gisysFact.mode'] = nextMode;
      }

      try {
        await businessRef.update(updatePayload);

        return {
          ok: true,
          businessId,
          electronicModelEnabled: nextElectronicModelEnabled,
          electronicTransportEnabled: nextElectronicTransportEnabled,
          providerConfig:
            buildBusinessSafeGisysFactProviderConfig({
              ...providerConfig,
              mode: nextMode,
            }),
        };
      } catch (error) {
        logger.error('[updateElectronicTaxReceiptConfig] taxpayer failed', {
          businessId,
          authUid,
          error,
        });
        throw new HttpsError(
          'internal',
          error?.message || 'No se pudo guardar el contribuyente GISYS.',
        );
      }
    }

    if (scope !== CONFIG_SCOPE.DEVELOPER_PROVISIONING) {
      throw new HttpsError(
        'invalid-argument',
        'scope de configuracion e-CF no soportado',
      );
    }

    await assertElectronicTaxReceiptDeveloperAccess(authUid);

    const summary = buildGisysFactConfigSummaryFromInput(data);
    if (summary.issues.length > 0) {
      throw new HttpsError(
        'failed-precondition',
        'La configuración de GISYS FACT está incompleta.',
        { issues: summary.issues },
      );
    }

    const businessRef = db.doc(`businesses/${businessId}`);
    const updatePayload = {
      'features.fiscal.electronicModelEnabled': summary.electronicModelEnabled,
      'features.fiscal.electronicTransportEnabled':
        summary.electronicTransportEnabled,
      'features.fiscal.gisysFact': {
        provider: 'gisys',
        enabled: summary.providerConfig.enabled,
        mode: summary.providerConfig.mode,
        integrationInstanceCode: summary.providerConfig.integrationInstanceCode,
        taxpayerCode: summary.providerConfig.taxpayerCode,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: authUid,
      },
      updatedAt: FieldValue.serverTimestamp(),
    };

    try {
      await businessRef.update(updatePayload);
      return {
        ok: true,
        businessId,
        electronicModelEnabled: summary.electronicModelEnabled,
        electronicTransportEnabled: summary.electronicTransportEnabled,
        providerConfig: buildBusinessSafeGisysFactProviderConfig(
          summary.providerConfig,
        ),
      };
    } catch (error) {
      logger.error('[updateElectronicTaxReceiptConfig] failed', {
        businessId,
        authUid,
        error,
      });
      throw new HttpsError(
        'internal',
        error?.message || 'No se pudo guardar la configuración e-CF.',
      );
    }
  },
);
