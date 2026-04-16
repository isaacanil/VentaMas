import { getDgiiMonthlyReportDefinition } from '../config/dgiiMonthlyReports.config.js';

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const readPath = (record, path) => {
  if (!isRecord(record) || !toCleanString(path)) return undefined;

  return path.split('.').reduce((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, record);
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return true;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
};

const buildMissingFieldIssues = ({ sourceId, record, requiredFields, index }) =>
  requiredFields
    .filter((fieldPath) => !hasMeaningfulValue(readPath(record, fieldPath)))
    .map((fieldPath) => ({
      sourceId,
      index,
      fieldPath,
      code: 'missing-required-field',
      severity: 'error',
    }));

export const validateDgiiMonthlyReportDataset = ({
  reportCode,
  datasets,
}) => {
  const definition = getDgiiMonthlyReportDefinition(reportCode);
  if (!definition) {
    throw new Error(`Reporte DGII no soportado: ${reportCode}`);
  }

  const normalizedDatasets = isRecord(datasets) ? datasets : {};
  const sourceSummaries = definition.sourceOfTruth.map((source) => {
    const records = Array.isArray(normalizedDatasets[source.sourceId])
      ? normalizedDatasets[source.sourceId]
      : [];

    const issues = records.flatMap((record, index) =>
      buildMissingFieldIssues({
        sourceId: source.sourceId,
        record,
        requiredFields: source.requiredFields,
        index,
      }),
    );

    return {
      sourceId: source.sourceId,
      ownerModule: source.ownerModule,
      collectionPath: source.collectionPath,
      recordsScanned: records.length,
      issues,
    };
  });

  const issues = sourceSummaries.flatMap((summary) => summary.issues);

  return {
    reportCode: definition.reportCode,
    jurisdictionId: definition.jurisdictionId,
    ok: issues.length === 0,
    issues,
    sourceSummaries,
    pendingGaps: definition.pendingGaps,
  };
};
