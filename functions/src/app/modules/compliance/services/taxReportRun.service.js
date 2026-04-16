import { db, FieldValue } from '../../../core/config/firebase.js';
import { buildMonthlyCompliancePreview } from './monthlyCompliancePreviewRegistry.service.js';

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const buildRunStatus = (preview) => (preview?.ok ? 'validated' : 'needs_review');

const buildValidationSummary = (preview) => ({
  ok: Boolean(preview?.ok),
  totalIssues: Array.isArray(preview?.issues) ? preview.issues.length : 0,
  issueSummary: isRecord(preview?.issueSummary) ? preview.issueSummary : {},
  sourceSummaries: Array.isArray(preview?.sourceSummaries)
    ? preview.sourceSummaries
    : [],
  pendingGaps: Array.isArray(preview?.pendingGaps) ? preview.pendingGaps : [],
});

const buildSourceSnapshot = (preview) => ({
  sourceSnapshots: isRecord(preview?.sourceSnapshots) ? preview.sourceSnapshots : {},
  sourceRecords: isRecord(preview?.sourceRecords) ? preview.sourceRecords : {},
});

export const createTaxReportRun = async ({
  businessId,
  periodKey,
  reportCode,
  authUid,
  firestore = db,
  fieldValue = FieldValue,
  previewBuilder = buildMonthlyCompliancePreview,
}) => {
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedPeriodKey = toCleanString(periodKey);
  const normalizedReportCode = toCleanString(reportCode);
  const normalizedAuthUid = toCleanString(authUid);

  if (!normalizedBusinessId) {
    throw new Error('businessId es requerido para crear TaxReportRun');
  }
  if (!normalizedPeriodKey) {
    throw new Error('periodKey es requerido para crear TaxReportRun');
  }
  if (!normalizedReportCode) {
    throw new Error('reportCode es requerido para crear TaxReportRun');
  }
  if (!normalizedAuthUid) {
    throw new Error('authUid es requerido para crear TaxReportRun');
  }

  const preview = await previewBuilder({
    businessId: normalizedBusinessId,
    periodKey: normalizedPeriodKey,
    reportCode: normalizedReportCode,
    firestore,
  });

  const versionRef = firestore.doc(
    `businesses/${normalizedBusinessId}/taxReportRunVersions/${normalizedReportCode}_${normalizedPeriodKey}`,
  );
  const runRef = firestore.collection(
    `businesses/${normalizedBusinessId}/taxReportRuns`,
  ).doc();

  let nextVersion = 1;
  await firestore.runTransaction(async (tx) => {
    const versionSnap = await tx.get(versionRef);
    const versionData = versionSnap?.exists ? versionSnap.data() || {} : {};
    const currentVersion = Number(versionData.lastVersion);
    nextVersion = Number.isFinite(currentVersion) ? currentVersion + 1 : 1;

    tx.set(versionRef, {
      id: versionRef.id,
      reportCode: normalizedReportCode,
      periodKey: normalizedPeriodKey,
      lastVersion: nextVersion,
      updatedAt: fieldValue.serverTimestamp(),
      updatedBy: normalizedAuthUid,
    });

    tx.set(runRef, {
      id: runRef.id,
      reportCode: normalizedReportCode,
      reportDefinitionId: normalizedReportCode,
      businessId: normalizedBusinessId,
      jurisdictionId: preview?.jurisdictionId ?? null,
      periodKey: normalizedPeriodKey,
      version: nextVersion,
      status: buildRunStatus(preview),
      createdAt: fieldValue.serverTimestamp(),
      createdBy: normalizedAuthUid,
      sourceSnapshot: buildSourceSnapshot(preview),
      validationSummary: buildValidationSummary(preview),
      issues: Array.isArray(preview?.issues) ? preview.issues : [],
      generatedArtifacts: [],
      submittedAt: null,
      acceptedAt: null,
      rejectionSummary: null,
      amendsReportRunId: null,
    });
  });

  return {
    id: runRef.id,
    reportCode: normalizedReportCode,
    businessId: normalizedBusinessId,
    periodKey: normalizedPeriodKey,
    version: nextVersion,
    status: buildRunStatus(preview),
    preview,
  };
};
