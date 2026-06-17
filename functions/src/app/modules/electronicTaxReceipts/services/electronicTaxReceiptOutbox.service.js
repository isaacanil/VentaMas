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
import {
  buildElectronicTaxReceiptAttemptRefreshRecord,
  resolveElectronicTaxReceiptAttemptId,
} from './electronicTaxReceiptAttempt.service.js';

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

const normalizeStatus = (value) => toCleanString(value)?.toLowerCase() || null;

const TERMINAL_DGII_STATUSES = new Set([
  'accepted',
  'accepted_conditional',
  'rejected',
]);

const NON_LIFECYCLE_STATUSES = new Set(['not_checked', 'pending', 'queued']);
const RFCE_ACCEPTED_STATUSES = new Set(['accepted', 'accepted_conditional']);
const RFCE_ERROR_STATUSES = new Set(['error', 'failed', 'rejected']);

const normalizeCode = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const pickCleanString = (...values) => {
  for (const value of values) {
    const normalized = normalizeCode(value);
    if (normalized) return normalized;
  }
  return null;
};

const normalizeDgiiMessageEntry = (entry) => {
  if (typeof entry === 'string') {
    const message = toCleanString(entry);
    return message ? { code: null, message } : null;
  }
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;

  const code = pickCleanString(
    entry.code,
    entry.errorCode,
    entry.statusCode,
    entry.codigo,
    entry.Codigo,
  );
  const message = pickCleanString(
    entry.message,
    entry.errorMessage,
    entry.description,
    entry.detail,
    entry.detalle,
    entry.Mensaje,
  );
  if (!code && !message) return null;
  return { code, message };
};

const normalizeDgiiMessages = (response) => {
  const candidates = [
    response?.dgiiMessages,
    response?.messages,
    response?.diagnostics,
    response?.validationErrors,
    response?.errors,
    resolveNested(response, 'dgiiResponse', 'dgiiMessages'),
    resolveNested(response, 'dgiiResponse', 'messages'),
    resolveNested(response, 'dgiiResponse', 'errors'),
  ];
  const normalized = candidates
    .flatMap((candidate) => (Array.isArray(candidate) ? candidate : []))
    .map(normalizeDgiiMessageEntry)
    .filter(Boolean);

  return normalized.length ? normalized : null;
};

const isDiagnosticResponse = (response, dgiiMessages) => {
  if (dgiiMessages?.length) return true;
  if (
    pickCleanString(
      response?.dgiiCode,
      response?.dgiiStatusCode,
      response?.errorCode,
      resolveNested(response, 'dgiiResponse', 'dgiiCode'),
      resolveNested(response, 'dgiiResponse', 'code'),
    )
  ) {
    return true;
  }

  const statuses = [
    response?.dgiiValidationStatus,
    response?.dgiiStatus,
    response?.requestStatus,
    response?.status,
  ].map(normalizeStatus);
  return statuses.some((status) =>
    ['rejected', 'error', 'failed', 'local_failed'].includes(status),
  );
};

const isAcceptedResponse = (response) => {
  const statuses = [
    response?.dgiiValidationStatus,
    response?.dgiiStatus,
    response?.requestStatus,
    response?.status,
  ].map(normalizeStatus);
  return statuses.some((status) =>
    ['accepted', 'accepted_conditional'].includes(status),
  );
};

const pickAcceptedMessage = (...values) => {
  for (const value of values) {
    const normalized = pickCleanString(value);
    if (normalized && normalized.toLowerCase().includes('acept')) {
      return normalized;
    }
  }
  return 'Aceptado';
};

const resolveRfceLifecycleStatus = (response) => {
  const rfceStatus = normalizeStatus(response?.rfceStatus);
  const rfceSubmissionStatus = normalizeStatus(response?.rfceSubmissionStatus);
  const status = rfceStatus || rfceSubmissionStatus;

  if (RFCE_ACCEPTED_STATUSES.has(status)) return status;
  if (RFCE_ERROR_STATUSES.has(status)) {
    return status === 'rejected' ? 'rejected' : 'error';
  }

  const rfceCode = normalizeCode(response?.rfceDgiiCode);
  const rfceEstado = normalizeStatus(response?.rfceDgiiEstado);
  if (
    (rfceCode === '1' || rfceCode === '01') &&
    rfceEstado?.includes('acept')
  ) {
    return 'accepted';
  }

  return null;
};

export const resolveElectronicTaxReceiptLifecycleStatus = ({
  currentStatus,
  response,
}) => {
  const dgiiValidationStatus = normalizeStatus(response?.dgiiValidationStatus);
  if (TERMINAL_DGII_STATUSES.has(dgiiValidationStatus)) {
    return dgiiValidationStatus;
  }

  const dgiiStatus = normalizeStatus(response?.dgiiStatus);
  if (TERMINAL_DGII_STATUSES.has(dgiiStatus)) {
    return dgiiStatus;
  }

  const rfceStatus = resolveRfceLifecycleStatus(response);
  if (rfceStatus) return rfceStatus;

  const requestStatus = normalizeStatus(
    response?.requestStatus || response?.dgiiSubmissionStatus,
  );
  if (requestStatus && !NON_LIFECYCLE_STATUSES.has(requestStatus)) {
    return requestStatus;
  }

  const explicitStatus = normalizeStatus(response?.status);
  if (explicitStatus && !NON_LIFECYCLE_STATUSES.has(explicitStatus)) {
    return explicitStatus;
  }

  const current = normalizeStatus(currentStatus);
  if (current && !NON_LIFECYCLE_STATUSES.has(current)) {
    return current;
  }

  if (
    response?.eNcf ||
    normalizeStatus(response?.localStatus) === 'signed_local' ||
    response?.links?.xml ||
    response?.links?.signedXml ||
    response?.links?.pdf
  ) {
    return 'issued';
  }

  return current || 'submitted';
};

const isPendingGisysDgiiResponseError = (error) => {
  const details = error?.details || {};
  const body = details?.body || {};
  const message = String(body?.message || error?.message || '');
  return (
    Number(details?.status) === 404 &&
    body?.code === 'NOT_FOUND' &&
    message.includes('dgii-response.json')
  );
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

export const buildElectronicSnapshot = ({
  status,
  mode,
  documentType,
  requestHash,
  response,
  error,
}) => {
  const dgiiMessages = normalizeDgiiMessages(response);
  const diagnosticResponse = isDiagnosticResponse(response, dgiiMessages);
  const acceptedResponse = isAcceptedResponse(response);
  const dgiiCode = pickCleanString(
    response?.dgiiCode,
    response?.dgiiStatusCode,
    response?.code,
    response?.errorCode,
    resolveNested(response, 'dgiiResponse', 'dgiiCode'),
    resolveNested(response, 'dgiiResponse', 'code'),
    dgiiMessages?.[0]?.code,
  ) || (acceptedResponse ? '01' : null);
  const dgiiMessage = acceptedResponse
    ? pickAcceptedMessage(
        response?.dgiiMessage,
        response?.message,
        resolveNested(response, 'dgiiResponse', 'dgiiMessage'),
        resolveNested(response, 'dgiiResponse', 'message'),
        dgiiMessages?.[0]?.message,
      )
    : pickCleanString(
        response?.dgiiMessage,
        resolveNested(response, 'dgiiResponse', 'dgiiMessage'),
        resolveNested(response, 'dgiiResponse', 'message'),
        dgiiMessages?.[0]?.message,
        diagnosticResponse ? response?.message : null,
        diagnosticResponse ? response?.errorMessage : null,
      );

  return {
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
  dgiiEnvironment: response?.dgiiEnvironment || null,
  dgiiCode,
  dgiiStatusCode: response?.dgiiStatusCode || null,
  dgiiMessage,
  dgiiMessages,
  dgiiSeverity: response?.dgiiSeverity || null,
  dgiiCategory: response?.dgiiCategory || null,
  resolutionAction: response?.resolutionAction || null,
  resolutionStatus: response?.resolutionStatus || null,
  manualReviewRequired:
    typeof response?.manualReviewRequired === 'boolean'
      ? response.manualReviewRequired
      : null,
  sameSubmissionRetryAllowed:
    typeof response?.sameSubmissionRetryAllowed === 'boolean'
      ? response.sameSubmissionRetryAllowed
      : null,
  requiresNewENcf:
    typeof response?.requiresNewENcf === 'boolean'
      ? response.requiresNewENcf
      : null,
  requiresDataCorrection:
    typeof response?.requiresDataCorrection === 'boolean'
      ? response.requiresDataCorrection
      : null,
  trackId: response?.trackId || response?.dgiiTrackId || null,
  dgiiTrackId: response?.dgiiTrackId || response?.trackId || null,
  securityCode:
    response?.securityCode ||
    resolveNested(response, 'security', 'codigoSeguridad') ||
    null,
  qr: response?.qr || null,
  officialVerifyUrl: response?.officialVerifyUrl || null,
  printData: response?.printData || null,
  printStatus: response?.printStatus || null,
  routing: response?.routing || null,
  rfceStatus: response?.rfceStatus || null,
  rfceSubmissionStatus: response?.rfceSubmissionStatus || null,
  rfceTrackId: response?.rfceTrackId || null,
  rfceDgiiCode: response?.rfceDgiiCode || null,
  rfceDgiiEstado: response?.rfceDgiiEstado || null,
  rfceError: response?.rfceError || null,
  rfceLastErrorCode: response?.rfceLastErrorCode || null,
  rfceLastErrorMessage: response?.rfceLastErrorMessage || null,
  rfceLastErrorHttpStatus: response?.rfceLastErrorHttpStatus || null,
  artifacts: response?.artifacts || null,
  links: response?.links || null,
  xmlUrl: response?.links?.xml || null,
  signedXmlUrl: response?.links?.signedXml || null,
  pdfUrl: response?.links?.pdf || null,
  correlationId: response?.correlationId || null,
  lastError: error
    ? toErrorMessage(error)
    : response?.lastError ||
      response?.rfceLastErrorMessage ||
      response?.rfceError ||
      (diagnosticResponse ? dgiiMessage : null) ||
      null,
  lastSyncAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  };
};

export const issueElectronicTaxReceiptForDocument = async ({
  businessId,
  documentId,
  document,
  taskPayload,
  business: providedBusiness,
}) => {
  const business =
    providedBusiness ||
    (await db.doc(`businesses/${businessId}`).get()).data() ||
    {};
  const platformConfig = await getGisysFactPlatformConfig();
  const rawProviderConfig = resolveGisysFactConfig(business, platformConfig);
  const providerConfig = resolveEffectiveProviderConfig({
    providerConfig: rawProviderConfig,
    taskPayload: taskPayload || {},
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
    invoiceId: documentId,
    invoice: document,
    taskPayload: taskPayload || {},
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
    return {
      status: 'shadow_ready',
      documentType,
      requestHash,
      electronicSnapshot,
      issuePayload,
      idempotencyKey: null,
    };
  }

  const idempotencyKey = buildGisysFactIdempotencyKey({
    businessId,
    invoiceId: documentId,
    documentType,
  });
  const response = await issueGisysFactDocument({
    config: providerConfig,
    payload: issuePayload,
    idempotencyKey,
  });
  const status = resolveElectronicTaxReceiptLifecycleStatus({
    currentStatus: null,
    response,
  });
  const electronicSnapshot = buildElectronicSnapshot({
    status,
    mode,
    documentType,
    requestHash,
    response,
  });

  return {
    status,
    documentType,
    requestHash,
    response,
    electronicSnapshot,
    issuePayload,
    idempotencyKey,
  };
};

const mergeGisysResponses = (baseResponse, nextResponse) => ({
  ...baseResponse,
  ...nextResponse,
  submissionId:
    nextResponse?.submissionId || baseResponse?.submissionId || null,
  eNcf: nextResponse?.eNcf || baseResponse?.eNcf || null,
  securityCode:
    nextResponse?.securityCode ||
    baseResponse?.securityCode ||
    resolveNested(nextResponse, 'security', 'codigoSeguridad') ||
    resolveNested(baseResponse, 'security', 'codigoSeguridad') ||
    null,
  qr: nextResponse?.qr || baseResponse?.qr || null,
  links: nextResponse?.links || baseResponse?.links || null,
  printData: nextResponse?.printData || baseResponse?.printData || null,
  correlationId:
    nextResponse?.correlationId || baseResponse?.correlationId || null,
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
    ...invoice?.snapshot?.ncf,
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
      ...invoice?.snapshot?.ncf,
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
    const nextStatus = resolveElectronicTaxReceiptLifecycleStatus({
      currentStatus: null,
      response,
    });
    const electronicSnapshot = buildElectronicSnapshot({
      status: nextStatus,
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

const resolveAdjustmentDocumentStatus = ({ electronicSnapshot, currentStatus }) => {
  const lifecycleStatus = normalizeStatus(electronicSnapshot?.status);
  if (
    lifecycleStatus === 'accepted' ||
    lifecycleStatus === 'accepted_conditional' ||
    lifecycleStatus === 'shadow_ready'
  ) {
    return 'issued';
  }
  if (
    lifecycleStatus === 'rejected' ||
    lifecycleStatus === 'error' ||
    lifecycleStatus === 'failed' ||
    lifecycleStatus === 'local_failed'
  ) {
    return 'electronic_failed';
  }

  const normalizedCurrentStatus = normalizeStatus(currentStatus);
  return normalizedCurrentStatus === 'issued' ? 'issued' : 'electronic_pending';
};

export const refreshElectronicTaxReceiptStatus = async ({
  businessId,
  invoiceId,
  creditNoteId,
  debitNoteId,
  documentId,
  documentKind,
  refreshRemote = true,
}) => {
  const requestedDocumentKind = normalizeStatus(documentKind);
  const normalizedCreditNoteId =
    toCleanString(creditNoteId) ||
    (requestedDocumentKind === 'credit_note' ||
    requestedDocumentKind === 'creditnote' ||
    requestedDocumentKind === 'credit-note'
      ? toCleanString(documentId)
      : null);
  const normalizedDebitNoteId =
    toCleanString(debitNoteId) ||
    (requestedDocumentKind === 'debit_note' ||
    requestedDocumentKind === 'debitnote' ||
    requestedDocumentKind === 'debit-note'
      ? toCleanString(documentId)
      : null);
  const normalizedInvoiceId =
    toCleanString(invoiceId) ||
    (!normalizedCreditNoteId && !normalizedDebitNoteId
      ? toCleanString(documentId)
      : null);

  const isCreditNoteRefresh = Boolean(normalizedCreditNoteId);
  const isDebitNoteRefresh = Boolean(normalizedDebitNoteId);
  const isAdjustmentNoteRefresh = isCreditNoteRefresh || isDebitNoteRefresh;
  const targetId =
    normalizedCreditNoteId || normalizedDebitNoteId || normalizedInvoiceId;
  if (!targetId) {
    throw new Error('Electronic tax receipt document id not found');
  }

  const documentRef = isCreditNoteRefresh
    ? db.doc(`businesses/${businessId}/creditNotes/${targetId}`)
    : isDebitNoteRefresh
      ? db.doc(`businesses/${businessId}/debitNotes/${targetId}`)
    : db.doc(`businesses/${businessId}/invoicesV2/${targetId}`);
  const documentSnap = await documentRef.get();
  if (!documentSnap.exists) {
    throw new Error(
      isCreditNoteRefresh
        ? 'Credit note document not found'
        : isDebitNoteRefresh
          ? 'Debit note document not found'
        : 'Invoice document not found',
    );
  }

  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  const business = businessSnap.exists ? businessSnap.data() || {} : {};
  const document = documentSnap.data() || {};
  const currentSnapshot = isAdjustmentNoteRefresh
    ? document?.electronicTaxReceipt || {}
    : document?.snapshot?.electronicTaxReceipt || {};
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

  let response;
  if (refreshRemote) {
    try {
      response = await refreshGisysFactDocumentStatus({
        config: providerConfig,
        submissionId,
      });
    } catch (error) {
      if (!isPendingGisysDgiiResponseError(error)) {
        throw error;
      }
      response = await getGisysFactDocumentStatus({
        config: providerConfig,
        submissionId,
      });
    }
  } else {
    response = await getGisysFactDocumentStatus({
      config: providerConfig,
      submissionId,
    });
  }
  const currentSnapshotFallback = { ...currentSnapshot };
  delete currentSnapshotFallback.status;
  delete currentSnapshotFallback.lastError;
  const mergedResponse = mergeGisysResponses(currentSnapshotFallback, {
    ...response,
    submissionId,
    eNcf: response?.eNcf || currentSnapshot.eNcf || null,
  });

  const nextStatus = resolveElectronicTaxReceiptLifecycleStatus({
    currentStatus: currentSnapshot.status,
    response: mergedResponse,
  });
  const electronicSnapshot = buildElectronicSnapshot({
    status: nextStatus,
    mode: currentSnapshot.mode || providerConfig.mode,
    documentType:
      response?.documentType || currentSnapshot.documentType || null,
    requestHash: currentSnapshot.requestHash || null,
    response: mergedResponse,
  });
  const attemptId = isAdjustmentNoteRefresh
    ? resolveElectronicTaxReceiptAttemptId({
        currentSnapshot,
        response: mergedResponse,
        documentId: targetId,
      })
    : null;
  const resolvedElectronicSnapshot =
    attemptId && isAdjustmentNoteRefresh
      ? {
          ...electronicSnapshot,
          attemptId,
          outboxTaskId: currentSnapshot.outboxTaskId || attemptId,
        }
      : electronicSnapshot;
  const fiscalAttemptRef =
    attemptId && isAdjustmentNoteRefresh
      ? db.doc(`${documentRef.path}/fiscalAttempts/${attemptId}`)
      : null;

  await db.runTransaction(async (tx) => {
    const currentDocument = (await tx.get(documentRef)).data() || document;
    if (isAdjustmentNoteRefresh) {
      const eNcf =
        resolvedElectronicSnapshot.eNcf ||
        currentDocument?.eNcf ||
        currentDocument?.ncf ||
        null;
      tx.update(documentRef, {
        electronicTaxReceipt: resolvedElectronicSnapshot,
        ncf: eNcf,
        eNcf,
        status: resolveAdjustmentDocumentStatus({
          electronicSnapshot: resolvedElectronicSnapshot,
          currentStatus: currentDocument?.status,
        }),
        fiscalMode: 'electronic_ecf',
        documentFormat: 'electronic',
        currentFiscalAttemptId: attemptId || null,
        statusTimeline: FieldValue.arrayUnion({
          status: `electronic_tax_receipt_${resolvedElectronicSnapshot.status}`,
          at: Timestamp.now(),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (fiscalAttemptRef) {
        tx.set(
          fiscalAttemptRef,
          buildElectronicTaxReceiptAttemptRefreshRecord({
            attemptId,
            documentKind: isCreditNoteRefresh ? 'creditNote' : 'debitNote',
            documentId: targetId,
            electronicSnapshot: resolvedElectronicSnapshot,
            response: mergedResponse,
          }),
          { merge: true },
        );
      }
      return;
    }

    const eNcf =
      resolvedElectronicSnapshot.eNcf ||
      currentDocument?.snapshot?.ncf?.code ||
      null;
    const ncfSnapshot = {
      ...currentDocument?.snapshot?.ncf,
      code: eNcf,
      status: eNcf ? 'issued' : resolvedElectronicSnapshot.status,
      documentFormat: 'electronic',
      provider: 'gisys_fact',
      submissionId,
      documentType: resolvedElectronicSnapshot.documentType,
    };

    tx.update(documentRef, {
      'snapshot.electronicTaxReceipt': resolvedElectronicSnapshot,
      'snapshot.ncf': ncfSnapshot,
      'snapshot.fiscalMode': 'electronic_ecf',
      'snapshot.documentFormat': 'electronic',
      statusTimeline: FieldValue.arrayUnion({
        status: `electronic_tax_receipt_${resolvedElectronicSnapshot.status}`,
        at: Timestamp.now(),
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const canonicalUpdate = {
      data: {
        electronicTaxReceipt: resolvedElectronicSnapshot,
        fiscal: {
          electronic: resolvedElectronicSnapshot,
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
      db.doc(`businesses/${businessId}/invoices/${targetId}`),
      canonicalUpdate,
      { merge: true },
    );
  });

  return {
    ok: true,
    businessId,
    invoiceId: normalizedInvoiceId || null,
    creditNoteId: normalizedCreditNoteId || null,
    debitNoteId: normalizedDebitNoteId || null,
    documentId: targetId,
    documentKind: isCreditNoteRefresh
      ? 'creditNote'
      : isDebitNoteRefresh
        ? 'debitNote'
        : 'invoice',
    submissionId,
    electronicTaxReceipt: resolvedElectronicSnapshot,
  };
};
