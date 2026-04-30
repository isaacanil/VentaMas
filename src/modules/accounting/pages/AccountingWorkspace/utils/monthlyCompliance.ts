import {
  buildAccountingPeriodKey,
  toDateOrNull,
} from '@/utils/accounting/journalEntries';

import type { MonthlyComplianceReportCode } from '@/firebase/accounting/fbRunMonthlyComplianceReport';

const runDateFormatter = new Intl.DateTimeFormat('es-DO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export interface MonthlyComplianceRunSummary {
  ok: boolean;
  totalIssues: number;
  issueSummary: {
    total: number;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
    byCode: Record<string, number>;
  };
  sourceSummaries: Array<{
    sourceId: string;
    ownerModule: string;
    collectionPath: string;
    recordsScanned: number;
  }>;
  pendingGaps: string[];
}

export interface MonthlyComplianceRun {
  id: string;
  reportCode: MonthlyComplianceReportCode;
  periodKey: string;
  version: number;
  status: string;
  createdAt: Date | null;
  createdBy: string | null;
  validationSummary: MonthlyComplianceRunSummary;
  issues: Array<Record<string, unknown>>;
  sourceSnapshot: {
    sourceSnapshots: Record<string, unknown>;
    sourceRecords: Record<string, unknown>;
  };
}

export const MONTHLY_COMPLIANCE_REPORT_OPTIONS: Array<{
  label: string;
  value: MonthlyComplianceReportCode;
}> = [
  { value: 'DGII_606', label: 'DGII 606' },
  { value: 'DGII_607', label: 'DGII 607' },
  { value: 'DGII_608', label: 'DGII 608' },
];

export const MONTHLY_COMPLIANCE_STATUS_LABELS: Record<string, string> = {
  validated: 'Validado',
  needs_review: 'Revisar',
};

export const MONTHLY_COMPLIANCE_STATUS_TONES: Record<
  string,
  'success' | 'warning' | 'neutral'
> = {
  validated: 'success',
  needs_review: 'warning',
};

export const normalizeMonthlyComplianceRun = (
  id: string,
  value: unknown,
): MonthlyComplianceRun => {
  const record = asRecord(value);
  const validationSummary = asRecord(record.validationSummary);
  const rawIssueSummary = asRecord(validationSummary.issueSummary);

  return {
    id,
    reportCode:
      (toCleanString(record.reportCode) as MonthlyComplianceReportCode) ??
      'DGII_607',
    periodKey:
      toCleanString(record.periodKey) ?? buildAccountingPeriodKey(new Date()),
    version: Math.max(1, Number(record.version) || 1),
    status: toCleanString(record.status) ?? 'needs_review',
    createdAt: toDateOrNull(record.createdAt),
    createdBy: toCleanString(record.createdBy),
    validationSummary: {
      ok: validationSummary.ok === true,
      totalIssues: Math.max(
        0,
        Number(validationSummary.totalIssues) ||
          toFiniteNumber(rawIssueSummary.total),
      ),
      issueSummary: {
        total: Math.max(0, toFiniteNumber(rawIssueSummary.total)),
        bySeverity: asRecord(rawIssueSummary.bySeverity) as Record<
          string,
          number
        >,
        bySource: asRecord(rawIssueSummary.bySource) as Record<string, number>,
        byCode: asRecord(rawIssueSummary.byCode) as Record<string, number>,
      },
      sourceSummaries: Array.isArray(validationSummary.sourceSummaries)
        ? validationSummary.sourceSummaries.map((summary) => {
            const sourceSummary = asRecord(summary);
            return {
              sourceId: toCleanString(sourceSummary.sourceId) ?? 'unknown',
              ownerModule:
                toCleanString(sourceSummary.ownerModule) ?? 'unknown',
              collectionPath:
                toCleanString(sourceSummary.collectionPath) ?? 'unknown',
              recordsScanned: Math.max(
                0,
                toFiniteNumber(sourceSummary.recordsScanned),
              ),
            };
          })
        : [],
      pendingGaps: Array.isArray(validationSummary.pendingGaps)
        ? validationSummary.pendingGaps
            .map((entry) => toCleanString(entry))
            .filter((entry): entry is string => entry !== null)
        : [],
    },
    issues: Array.isArray(record.issues)
      ? record.issues.map((issue) => asRecord(issue))
      : [],
    sourceSnapshot: {
      sourceSnapshots: asRecord(
        asRecord(record.sourceSnapshot).sourceSnapshots,
      ),
      sourceRecords: asRecord(asRecord(record.sourceSnapshot).sourceRecords),
    },
  };
};

export const resolveMonthlyComplianceStatusLabel = (status: string) =>
  MONTHLY_COMPLIANCE_STATUS_LABELS[status] ?? status;

export const resolveMonthlyComplianceStatusTone = (status: string) =>
  MONTHLY_COMPLIANCE_STATUS_TONES[status] ?? 'neutral';

export const buildMonthlyComplianceDefaultPeriodKey = () =>
  buildAccountingPeriodKey(new Date());

export const formatMonthlyComplianceRunDate = (value: Date | null) =>
  value ? runDateFormatter.format(value) : 'Pendiente';

export const getMonthlyComplianceSourceCount = (
  sourceSnapshots: Record<string, unknown>,
  sourceId: string,
  key: 'recordsLoaded' | 'recordsExcluded',
) => {
  const sourceSnapshot = asRecord(sourceSnapshots[sourceId]);
  return Math.max(0, toFiniteNumber(sourceSnapshot[key]));
};
