import { logger } from 'firebase-functions';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import {
  getGisysFactConfigIssues,
  resolveGisysFactConfig,
} from '../config/gisysFact.config.js';
import { getGisysFactPlatformConfig } from '../config/gisysFactPlatform.config.js';
import { buildGisysIssuePayload } from '../mappers/gisysIssuePayload.mapper.js';
import {
  getGisysFactDocumentStatus,
  issueGisysFactDocument,
  refreshGisysFactDocumentStatus,
} from './gisysFactClient.service.js';

const toErrorMessage = (error) =>
  error instanceof Error ? error.message : String(error || 'Unknown error');

const resolveNested = (value, ...path) =>
  path.reduce((current, key) => {
    if (!current || typeof current !== 'object') return null;
    return current[key] ?? null;
  }, value);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeProviderMode = (mode) => {
  const normalized = toCleanString(mode)?.toLowerCase();
  return ['shadow', 'pilot', 'required'].includes(normalized)
    ? normalized
    : 'pilot';
};

const resolveEffectiveProviderConfig = ({ providerConfig, taskPayload }) => {
  const transportEnabled = taskPayload?.transportEnabled !== false;
  if (transportEnabled) {
    return {
      ...providerConfig,
      mode: normalizeProviderMode(taskPayload?.mode || providerConfig.mode),
    };
  }

  return {
    ...providerConfig,
    mode: 'shadow',
  };
};

export const buildGisysFactIdempotencyKey = ({
  businessId,
  invoiceId,
  documentType,
}) => {
  const normalizedDocumentType =
    toCleanString(documentType)?.toUpperCase() || 'ECF';
  return `ventamas:${businessId}:${invoiceId}:ecf:${normalizedDocumentType}:v1`;
};

const buildElectronicSnapshot = ({
  status,
  mode,
  documentType,
  requestHash,
  response,
  error,
}) => ({
  provider: 'gisys_fact',
  mode,
  status,
  documentType,
  requestHash: requestHash || null,
  submissionId: response?.submissionId || null,
  eNcf: response?.eNcf || null,
  issuedAt: response?.issuedAt || null,
  localStatus: response?.localStatus || null,
  requestStatus: response?.requestStatus || response?.status || null,
  dgiiSubmissionStatus: response?.dgiiSubmissionStatus || null,
  dgiiValidationStatus: response?.dgiiValidationStatus || null,
  dgiiStatus: response?.dgiiStatus || null,
  trackId: response?.trackId || response?.dgiiTrackId || null,
  dgiiTrackId: response?.dgiiTrackId || response?.trackId || null,
  securityCode:
    response?.securityCode ||
    resolveNested(response, 'security', 'codigoSeguridad') ||
    null,
  qr: response?.qr || null,
  printData: response?.printData || null,
  links: response?.links || null,
  xmlUrl: response?.links?.xml || null,
  signedXmlUrl: response?.links?.signedXml || null,
  pdfUrl: response?.links?.pdf || null,
  correlationId: response?.correlationId || null,
  lastError: error ? toErrorMessage(error) : null,
  lastSyncAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

const updateTaskDoneTx = ({
  tx,
  taskRef,
  task,
  invoiceRef,
  canonRef,
  invoice,
  electronicSnapshot,
  response,
}) => {
  const eNcf = response?.eNcf || null;
  const ncfSnapshot = {
    ...(invoice?.snapshot?.ncf || {}),
    code: eNcf || invoice?.snapshot?.ncf?.code || null,
    status: eNcf ? 'issued' : electronicSnapshot.status,
    documentFormat: 'electronic',
    provider: 'gisys_fact',
    submissionId: response?.submissionId || null,
    documentType: electronicSnapshot.documentType,
  };

  const invoiceUpdate = {
    'snapshot.electronicTaxReceipt': electronicSnapshot,
    'snapshot.ncf': ncfSnapshot,
    'snapshot.fiscalMode': 'electronic_ecf',
    'snapshot.documentFormat': 'electronic',
    statusTimeline: FieldValue.arrayUnion({
      status: `electronic_tax_receipt_${electronicSnapshot.status}`,
      at: Timestamp.now(),
    }),
    updatedAt: FieldValue.serverTimestamp(),
  };

  tx.set(
    taskRef,
    {
      status: 'done',
      processedAt: FieldValue.serverTimestamp(),
      attempts: (task.attempts || 0) + 1,
      lastError: null,
      result: {
        provider: 'gisys_fact',
        status: electronicSnapshot.status,
        documentType: electronicSnapshot.documentType,
        submissionId: response?.submissionId || null,
        eNcf,
        requestHash: electronicSnapshot.requestHash || null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  tx.update(invoiceRef, invoiceUpdate);

  const canonicalUpdate = {
    data: {
      electronicTaxReceipt: electronicSnapshot,
      fiscal: {
        electronic: electronicSnapshot,
      },
      fiscalMode: 'electronic_ecf',
      documentFormat: 'electronic',
    },
  };
  if (eNcf) {
    canonicalUpdate.data.NCF = eNcf;
    canonicalUpdate.data.eNcf = eNcf;
  }
  tx.set(canonRef, canonicalUpdate, { merge: true });
};

const updateTaskFailedTx = ({
  tx,
  taskRef,
  task,
  invoiceRef,
  invoice,
  electronicSnapshot,
  error,
}) => {
  tx.set(
    taskRef,
    {
      status: 'failed',
      attempts: (task.attempts || 0) + 1,
      lastError: toErrorMessage(error),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  tx.update(invoiceRef, {
    'snapshot.electronicTaxReceipt': electronicSnapshot,
    'snapshot.ncf': {
      ...(invoice?.snapshot?.ncf || {}),
      status: 'failed',
      documentFormat: 'electronic',
      provider: 'gisys_fact',
      documentType: electronicSnapshot.documentType || null,
    },
    'snapshot.fiscalMode': 'electronic_ecf',
    'snapshot.documentFormat': 'electronic',
    updatedAt: FieldValue.serverTimestamp(),
  });
};

export const processElectronicTaxReceiptOutboxTask = async ({
  businessId,
  invoiceId,
  taskId,
  taskRef,
  invoiceRef,
  task,
}) => {
  const invoiceSnap = await invoiceRef.get();
  if (!invoiceSnap.exists) {
    throw new Error('Invoice document not found');
  }

  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  const business = businessSnap.exists ? businessSnap.data() || {} : {};
  const invoice = invoiceSnap.data() || {};
  const payload = task?.payload || {};
  const platformConfig = await getGisysFactPlatformConfig();
  const rawProviderConfig = resolveGisysFactConfig(business, platformConfig);
  const providerConfig = resolveEffectiveProviderConfig({
    providerConfig: rawProviderConfig,
    taskPayload: payload,
  });
  const configIssues = getGisysFactConfigIssues(providerConfig, {
    requireTransport: providerConfig.mode !== 'shadow',
  });
  if (configIssues.length > 0) {
    throw new Error(`gisys_config_invalid(${configIssues.join(',')})`);
  }

  const {
    payload: issuePayload,
    documentType,
    requestHash,
  } = buildGisysIssuePayload({
    businessId,
    invoiceId,
    invoice,
    taskPayload: payload,
    providerConfig,
    business,
  });

  const mode = providerConfig.mode;
  if (mode === 'shadow') {
    const electronicSnapshot = buildElectronicSnapshot({
      status: 'shadow_ready',
      mode,
      documentType,
      requestHash,
    });
    await db.runTransaction(async (tx) => {
      const currentTask = await tx.get(taskRef);
      const currentTaskData = currentTask.data() || {};
      if (currentTaskData.status !== 'pending') return;
      const currentInvoice = (await tx.get(invoiceRef)).data() || invoice;
      updateTaskDoneTx({
        tx,
        taskRef,
        task: currentTaskData,
        invoiceRef,
        canonRef: db.doc(`businesses/${businessId}/invoices/${invoiceId}`),
        invoice: currentInvoice,
        electronicSnapshot,
        response: null,
      });
    });
    return { status: 'shadow_ready', documentType, requestHash };
  }

  try {
    const response = await issueGisysFactDocument({
      config: providerConfig,
      payload: issuePayload,
      idempotencyKey: buildGisysFactIdempotencyKey({
        businessId,
        invoiceId,
        documentType,
      }),
    });
    const electronicSnapshot = buildElectronicSnapshot({
      status: response?.eNcf ? 'issued' : 'submitted',
      mode,
      documentType,
      requestHash,
      response,
    });

    await db.runTransaction(async (tx) => {
      const currentTask = await tx.get(taskRef);
      const currentTaskData = currentTask.data() || {};
      if (currentTaskData.status !== 'pending') return;
      const currentInvoice = (await tx.get(invoiceRef)).data() || invoice;
      updateTaskDoneTx({
        tx,
        taskRef,
        task: currentTaskData,
        invoiceRef,
        canonRef: db.doc(`businesses/${businessId}/invoices/${invoiceId}`),
        invoice: currentInvoice,
        electronicSnapshot,
        response,
      });
    });

    return {
      status: electronicSnapshot.status,
      documentType,
      requestHash,
      response,
    };
  } catch (error) {
    const electronicSnapshot = buildElectronicSnapshot({
      status: 'local_failed',
      mode,
      documentType,
      requestHash,
      error,
    });
    const shouldBlockInvoice = mode === 'required';

    await db.runTransaction(async (tx) => {
      const currentTask = await tx.get(taskRef);
      const currentTaskData = currentTask.data() || {};
      if (currentTaskData.status !== 'pending') return;
      const currentInvoice = (await tx.get(invoiceRef)).data() || invoice;
      if (shouldBlockInvoice) {
        updateTaskFailedTx({
          tx,
          taskRef,
          task: currentTaskData,
          invoiceRef,
          invoice: currentInvoice,
          electronicSnapshot,
          error,
        });
        return;
      }

      updateTaskDoneTx({
        tx,
        taskRef,
        task: currentTaskData,
        invoiceRef,
        canonRef: db.doc(`businesses/${businessId}/invoices/${invoiceId}`),
        invoice: currentInvoice,
        electronicSnapshot,
        response: null,
      });
    });

    logger.error('GISYS FACT issue failed', {
      businessId,
      invoiceId,
      taskId,
      mode,
      error: toErrorMessage(error),
    });

    if (shouldBlockInvoice) throw error;
    return { status: 'local_failed', documentType, requestHash, error };
  }
};

export const refreshElectronicTaxReceiptStatus = async ({
  businessId,
  invoiceId,
  refreshRemote = true,
}) => {
  const invoiceRef = db.doc(`businesses/${businessId}/invoicesV2/${invoiceId}`);
  const invoiceSnap = await invoiceRef.get();
  if (!invoiceSnap.exists) {
    throw new Error('Invoice document not found');
  }

  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  const business = businessSnap.exists ? businessSnap.data() || {} : {};
  const invoice = invoiceSnap.data() || {};
  const currentSnapshot = invoice?.snapshot?.electronicTaxReceipt || {};
  const submissionId = toCleanString(currentSnapshot.submissionId);
  if (!submissionId) {
    throw new Error('Electronic tax receipt submissionId not found');
  }

  const platformConfig = await getGisysFactPlatformConfig();
  const providerConfig = resolveGisysFactConfig(business, platformConfig);
  const configIssues = getGisysFactConfigIssues(providerConfig, {
    requireTransport: true,
  });
  if (configIssues.length > 0) {
    throw new Error(`gisys_config_invalid(${configIssues.join(',')})`);
  }

  const response = refreshRemote
    ? await refreshGisysFactDocumentStatus({
        config: providerConfig,
        submissionId,
      })
    : await getGisysFactDocumentStatus({
        config: providerConfig,
        submissionId,
      });

  const nextStatus =
    response?.dgiiValidationStatus ||
    response?.dgiiStatus ||
    response?.requestStatus ||
    response?.status ||
    currentSnapshot.status ||
    'submitted';
  const electronicSnapshot = buildElectronicSnapshot({
    status: nextStatus,
    mode: currentSnapshot.mode || providerConfig.mode,
    documentType:
      response?.documentType || currentSnapshot.documentType || null,
    requestHash: currentSnapshot.requestHash || null,
    response: {
      ...currentSnapshot,
      ...response,
      submissionId,
      eNcf: response?.eNcf || currentSnapshot.eNcf || null,
    },
  });

  await db.runTransaction(async (tx) => {
    const currentInvoice = (await tx.get(invoiceRef)).data() || invoice;
    const eNcf =
      electronicSnapshot.eNcf || currentInvoice?.snapshot?.ncf?.code || null;
    const ncfSnapshot = {
      ...(currentInvoice?.snapshot?.ncf || {}),
      code: eNcf,
      status: electronicSnapshot.status,
      documentFormat: 'electronic',
      provider: 'gisys_fact',
      submissionId,
      documentType: electronicSnapshot.documentType,
    };

    tx.update(invoiceRef, {
      'snapshot.electronicTaxReceipt': electronicSnapshot,
      'snapshot.ncf': ncfSnapshot,
      'snapshot.fiscalMode': 'electronic_ecf',
      'snapshot.documentFormat': 'electronic',
      statusTimeline: FieldValue.arrayUnion({
        status: `electronic_tax_receipt_${electronicSnapshot.status}`,
        at: Timestamp.now(),
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const canonicalUpdate = {
      data: {
        electronicTaxReceipt: electronicSnapshot,
        fiscal: {
          electronic: electronicSnapshot,
        },
        fiscalMode: 'electronic_ecf',
        documentFormat: 'electronic',
      },
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (eNcf) {
      canonicalUpdate.data.NCF = eNcf;
      canonicalUpdate.data.eNcf = eNcf;
    }
    tx.set(
      db.doc(`businesses/${businessId}/invoices/${invoiceId}`),
      canonicalUpdate,
      { merge: true },
    );
  });

  return {
    ok: true,
    businessId,
    invoiceId,
    submissionId,
    electronicTaxReceipt: electronicSnapshot,
  };
};
