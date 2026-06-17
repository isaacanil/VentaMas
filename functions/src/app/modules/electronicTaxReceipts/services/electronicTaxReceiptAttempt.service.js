import { FieldValue, Timestamp } from '../../../core/config/firebase.js';

const DEFAULT_PROVIDER = 'gisys_fact';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const isPlainRecord = (value) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.prototype.toString.call(value) === '[object Object]';

const pruneUndefined = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => pruneUndefined(entry))
      .filter((entry) => entry !== undefined);
  }
  if (!isPlainRecord(value)) return value;

  const entries = Object.entries(value)
    .map(([key, entry]) => [key, pruneUndefined(entry)])
    .filter(([, entry]) => entry !== undefined);
  return Object.fromEntries(entries);
};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toErrorMessage = (error) =>
  error instanceof Error ? error.message : String(error || 'Unknown error');

const pickString = (...values) => {
  for (const value of values) {
    const normalized = toCleanString(value);
    if (normalized) return normalized;
  }
  return null;
};

export const resolveElectronicTaxReceiptAttemptId = ({
  taskId,
  currentSnapshot,
  response,
  documentId,
}) =>
  pickString(
    taskId,
    currentSnapshot?.attemptId,
    currentSnapshot?.outboxTaskId,
    response?.submissionId,
    currentSnapshot?.submissionId,
    documentId,
  );

const buildStatusEvent = (status, source) =>
  pruneUndefined({
    status,
    source,
    at: Timestamp.now(),
  });

export const buildElectronicTaxReceiptAttemptRecord = ({
  attemptId,
  businessId,
  documentKind,
  documentId,
  documentType,
  ncfType,
  note,
  taskId,
  task,
  issuePayload,
  result,
  error,
}) => {
  const response = asRecord(result?.response);
  const electronicSnapshot = asRecord(result?.electronicSnapshot);
  const status =
    toCleanString(electronicSnapshot.status) || (error ? 'local_failed' : null);
  const lastError = error
    ? toErrorMessage(error)
    : pickString(electronicSnapshot.lastError, response.lastError);

  return pruneUndefined({
    id: attemptId,
    businessId,
    documentKind,
    documentId,
    noteId: documentId,
    provider: DEFAULT_PROVIDER,
    documentType: pickString(result?.documentType, documentType),
    ncfType,
    revisionNo: safeNumber(note?.fiscalRevisionNo, 1),
    source: 'outbox',
    outboxTaskId: taskId,
    outboxAttempts: safeNumber(task?.attempts, 0) + 1,
    reissueOfAttemptId: pickString(
      task?.payload?.reissueOfAttemptId,
      note?.reissueOfAttemptId,
    ),
    correctionReason: pickString(
      task?.payload?.correctionReason,
      note?.correctionReason,
    ),
    status,
    fiscalStatus: status,
    eNcf: pickString(response.eNcf, electronicSnapshot.eNcf, note?.eNcf, note?.ncf),
    submissionId: pickString(response.submissionId, electronicSnapshot.submissionId),
    requestHash: pickString(result?.requestHash, electronicSnapshot.requestHash),
    payloadHash: pickString(result?.requestHash, electronicSnapshot.requestHash),
    trackId: pickString(electronicSnapshot.trackId, response.trackId, response.dgiiTrackId),
    dgiiCode: pickString(electronicSnapshot.dgiiCode, response.dgiiCode),
    dgiiMessage: pickString(electronicSnapshot.dgiiMessage, response.dgiiMessage),
    dgiiMessages: electronicSnapshot.dgiiMessages || response.dgiiMessages || null,
    requiresNewENcf:
      typeof electronicSnapshot.requiresNewENcf === 'boolean'
        ? electronicSnapshot.requiresNewENcf
        : typeof response.requiresNewENcf === 'boolean'
          ? response.requiresNewENcf
          : null,
    requiresDataCorrection:
      typeof electronicSnapshot.requiresDataCorrection === 'boolean'
        ? electronicSnapshot.requiresDataCorrection
        : typeof response.requiresDataCorrection === 'boolean'
          ? response.requiresDataCorrection
          : null,
    payloadSnapshot: issuePayload || task?.payload || null,
    reference: issuePayload?.reference || task?.payload?.reference || null,
    electronicSnapshot,
    providerResponse: Object.keys(response).length ? response : null,
    lastError,
    errorName: error?.name || null,
    statusEvents: status ? [buildStatusEvent(status, error ? 'local_error' : 'issue')] : [],
    createdAt: task?.createdAt || FieldValue.serverTimestamp(),
    attemptedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
};

export const buildElectronicTaxReceiptAttemptRefreshRecord = ({
  attemptId,
  documentKind,
  documentId,
  electronicSnapshot,
  response,
}) => {
  const snapshot = asRecord(electronicSnapshot);
  const currentResponse = asRecord(response);
  const status = toCleanString(snapshot.status);

  return pruneUndefined({
    id: attemptId,
    documentKind,
    documentId,
    noteId: documentId,
    provider: DEFAULT_PROVIDER,
    documentType: snapshot.documentType || currentResponse.documentType || null,
    status,
    fiscalStatus: status,
    eNcf: pickString(snapshot.eNcf, currentResponse.eNcf),
    submissionId: pickString(snapshot.submissionId, currentResponse.submissionId),
    requestHash: snapshot.requestHash || null,
    payloadHash: snapshot.requestHash || null,
    trackId: pickString(snapshot.trackId, currentResponse.trackId, currentResponse.dgiiTrackId),
    dgiiCode: pickString(snapshot.dgiiCode, currentResponse.dgiiCode),
    dgiiMessage: pickString(snapshot.dgiiMessage, currentResponse.dgiiMessage),
    dgiiMessages: snapshot.dgiiMessages || currentResponse.dgiiMessages || null,
    requiresNewENcf:
      typeof snapshot.requiresNewENcf === 'boolean'
        ? snapshot.requiresNewENcf
        : typeof currentResponse.requiresNewENcf === 'boolean'
          ? currentResponse.requiresNewENcf
          : null,
    requiresDataCorrection:
      typeof snapshot.requiresDataCorrection === 'boolean'
        ? snapshot.requiresDataCorrection
        : typeof currentResponse.requiresDataCorrection === 'boolean'
          ? currentResponse.requiresDataCorrection
          : null,
    electronicSnapshot: snapshot,
    providerResponse: Object.keys(currentResponse).length ? currentResponse : null,
    lastError: snapshot.lastError || null,
    statusEvents: status
      ? FieldValue.arrayUnion(buildStatusEvent(status, 'refresh'))
      : undefined,
    refreshedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
};
