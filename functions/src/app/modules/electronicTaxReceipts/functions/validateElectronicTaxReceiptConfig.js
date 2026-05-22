import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db } from '../../../core/config/firebase.js';
import { GISYS_FACT_SECRETS } from '../../../core/config/secrets.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { resolveGisysFactToken } from '../config/gisysFact.config.js';
import { getGisysFactPlatformConfig } from '../config/gisysFactPlatform.config.js';
import { checkGisysFactHealth } from '../services/gisysFactClient.service.js';
import { assertElectronicTaxReceiptDeveloperAccess } from '../utils/electronicTaxReceiptAccess.util.js';
import {
  buildBusinessSafeGisysFactProviderConfig,
  buildGisysFactConfigSummaryFromBusiness,
  buildGisysFactConfigSummaryFromInput,
  hasElectronicTaxReceiptConfigDraft,
  toCleanString,
} from '../utils/electronicTaxReceiptConfig.util.js';

const ISSUE_LABELS = {
  'provider-disabled': 'Proveedor desactivado',
  'missing-base-url': 'Conexión VentaMax-GISYS pendiente',
  'missing-integration-instance-code': 'Instancia GISYS requerida',
  'missing-taxpayer-code': 'Contribuyente GISYS requerido',
  'missing-gisys-token-secret': 'Credencial GISYS no disponible',
  'gisys-health-failed': 'GISYS no respondió correctamente',
};

const issueLabel = (issue) => ISSUE_LABELS[issue] || issue;

const buildCheck = ({ key, label, status, detail }) => ({
  key,
  label,
  status,
  detail: detail || null,
});

const hasIssue = (issues, key) => issues.includes(key);

const buildChecks = ({
  summary,
  issues,
  tokenConfigured,
  remoteHealth,
  checkRemote,
}) => {
  const { providerConfig } = summary;
  const modelEnabled = summary.electronicModelEnabled;
  const transportEnabled = summary.electronicTransportEnabled;

  return [
    buildCheck({
      key: 'electronic-model',
      label: 'Modelo e-CF',
      status: modelEnabled ? 'passed' : 'inactive',
      detail: modelEnabled
        ? 'El negocio puede preparar documentos electrónicos.'
        : 'El modelo e-CF está apagado para este negocio.',
    }),
    buildCheck({
      key: 'provider',
      label: 'Proveedor GISYS',
      status: !modelEnabled
        ? 'inactive'
        : hasIssue(issues, 'provider-disabled')
          ? 'blocked'
          : 'passed',
      detail: !modelEnabled
        ? 'No requerido mientras el modelo e-CF esté apagado.'
        : hasIssue(issues, 'provider-disabled')
          ? issueLabel('provider-disabled')
          : 'Adapter gisys_fact seleccionado.',
    }),
    buildCheck({
      key: 'integration-instance',
      label: 'Instancia GISYS',
      status: !modelEnabled
        ? 'inactive'
        : hasIssue(issues, 'missing-integration-instance-code')
          ? 'blocked'
          : 'passed',
      detail: !modelEnabled
        ? 'No requerido mientras el modelo e-CF esté apagado.'
        : providerConfig.integrationInstanceCode ||
          issueLabel('missing-integration-instance-code'),
    }),
    buildCheck({
      key: 'taxpayer',
      label: 'Contribuyente GISYS',
      status: !modelEnabled
        ? 'inactive'
        : hasIssue(issues, 'missing-taxpayer-code')
          ? 'blocked'
          : 'passed',
      detail: !modelEnabled
        ? 'No requerido mientras el modelo e-CF esté apagado.'
        : providerConfig.taxpayerCode || issueLabel('missing-taxpayer-code'),
    }),
    buildCheck({
      key: 'transport',
      label: 'Transporte',
      status: !modelEnabled
        ? 'inactive'
        : transportEnabled
          ? 'passed'
          : 'warning',
      detail: !modelEnabled
        ? 'No requerido mientras el modelo e-CF esté apagado.'
        : transportEnabled
          ? `Modo ${providerConfig.mode}.`
          : 'Shadow: no se enviará todavía a GISYS.',
    }),
    buildCheck({
      key: 'base-url',
      label: 'Conexión VentaMax',
      status: !modelEnabled
        ? 'inactive'
        : transportEnabled && hasIssue(issues, 'missing-base-url')
          ? 'blocked'
          : transportEnabled
            ? 'passed'
            : 'inactive',
      detail:
        !modelEnabled || !transportEnabled
          ? 'No requerido sin transporte activo.'
          : hasIssue(issues, 'missing-base-url')
            ? issueLabel('missing-base-url')
            : 'Conexión técnica configurada por VentaMax.',
    }),
    buildCheck({
      key: 'token',
      label: 'Credencial GISYS',
      status: transportEnabled
        ? tokenConfigured
          ? 'passed'
          : 'blocked'
        : 'inactive',
      detail: transportEnabled
        ? tokenConfigured
          ? 'Credencial disponible en Functions.'
          : 'Credencial pendiente en Functions.'
        : 'No requerido mientras el transporte esté apagado.',
    }),
    buildCheck({
      key: 'remote-health',
      label: 'Conexión GISYS',
      status: !transportEnabled
        ? 'inactive'
        : !checkRemote
          ? 'warning'
          : remoteHealth?.ok
            ? 'passed'
            : 'blocked',
      detail: !transportEnabled
        ? 'No se prueba conexión en modo shadow.'
        : !checkRemote
          ? 'Conexión remota no solicitada.'
          : remoteHealth?.ok
            ? `Health respondió ${remoteHealth.status}.`
            : remoteHealth?.message ||
              `Health respondió ${remoteHealth?.status || 'sin estado'}.`,
    }),
  ];
};

const buildStatus = ({ summary, issues, remoteHealth, checkRemote }) => {
  if (!summary.electronicModelEnabled) return 'inactive';
  if (issues.length > 0) return 'blocked';
  if (!summary.electronicTransportEnabled) return 'shadow_ready';
  if (checkRemote && remoteHealth && !remoteHealth.ok) return 'blocked';
  return 'ready';
};

export const validateElectronicTaxReceiptConfig = onCall(
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

    const businessId =
      toCleanString(request?.data?.businessId) ||
      toCleanString(request?.data?.businessID);
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }

    const data = request?.data || {};
    const hasDraft = hasElectronicTaxReceiptConfigDraft(data);
    if (hasDraft) {
      await assertElectronicTaxReceiptDeveloperAccess(authUid);
    } else {
      await assertUserAccess({
        authUid,
        businessId,
        allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCE_CONFIG,
      });
    }

    const businessSnap = hasDraft
      ? null
      : await db.doc(`businesses/${businessId}`).get();
    if (!hasDraft && !businessSnap.exists) {
      throw new HttpsError('not-found', 'Negocio no encontrado');
    }

    const platformConfig = hasDraft ? {} : await getGisysFactPlatformConfig();
    const summary = hasDraft
      ? buildGisysFactConfigSummaryFromInput(data)
      : buildGisysFactConfigSummaryFromBusiness(
          businessSnap.data() || {},
          platformConfig,
        );
    const tokenConfigured = summary.electronicTransportEnabled
      ? Boolean(resolveGisysFactToken(summary.providerConfig))
      : false;
    const issues = [...summary.issues];

    if (summary.electronicTransportEnabled && !tokenConfigured) {
      issues.push('missing-gisys-token-secret');
    }

    const checkRemote = data.checkRemote !== false;
    let remoteHealth = null;
    if (
      checkRemote &&
      summary.electronicTransportEnabled &&
      issues.length === 0
    ) {
      remoteHealth = await checkGisysFactHealth({
        config: summary.providerConfig,
      });
      if (!remoteHealth.ok) {
        issues.push('gisys-health-failed');
      }
    }

    const status = buildStatus({
      summary,
      issues,
      remoteHealth,
      checkRemote,
    });

    logger.info('[validateElectronicTaxReceiptConfig] completed', {
      businessId,
      authUid,
      status,
      issues,
      checkedDraft: hasDraft,
    });

    return {
      ok: true,
      businessId,
      status,
      checkedDraft: hasDraft,
      checkedAt: new Date().toISOString(),
      electronicModelEnabled: summary.electronicModelEnabled,
      electronicTransportEnabled: summary.electronicTransportEnabled,
      issues,
      issueLabels: issues.map(issueLabel),
      checks: buildChecks({
        summary,
        issues,
        tokenConfigured,
        remoteHealth,
        checkRemote,
      }),
      providerConfig: {
        ...buildBusinessSafeGisysFactProviderConfig(summary.providerConfig, {
          tokenConfigured,
        }),
      },
      remote: remoteHealth
        ? {
            ok: remoteHealth.ok,
            status: remoteHealth.status,
            reason: remoteHealth.reason || null,
          }
        : null,
    };
  },
);
